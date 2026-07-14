import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TorRequest {
  requestType: 'RFI' | 'RFP' | 'RFQ';
  category: string;
  title: string;
  description: string;
  language?: string;
}

interface VendorScoreRequest {
  vendorName: string;
  price: number;
  proposalText: string;
  allVendorPrices: number[];
  procurementTitle: string;
  language?: string;
}

export interface BreakdownCriterion {
  raw: number;
  weight: number;
  net: number;
}

export interface VendorScoreResponse {
  score: number;
  reasoning: string;
  breakdown: {
    price: BreakdownCriterion;
    technicalQuality: BreakdownCriterion;
    serviceDelivery: BreakdownCriterion;
    qualificationsExperience: BreakdownCriterion;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private provider: string;
  private groqApiKey: string;
  private groqModel: string;
  private copilotSecret: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('AI_PROVIDER') || 'groq';
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.groqModel =
      this.configService.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
    this.copilotSecret =
      this.configService.get<string>('COPILOT_STUDIO_SECRET') || '';
    this.logger.log(`AI provider: ${this.provider}, groqKeySet: ${!!this.groqApiKey}, model: ${this.groqModel}`);
  }

  private async callAI(prompt: string): Promise<string> {
    if (this.provider === 'copilot' && this.copilotSecret) {
      return this.callCopilotStudio(prompt);
    }
    return this.callGroq(prompt);
  }

  private async callGroq(prompt: string): Promise<string> {
    if (!this.groqApiKey) {
      this.logger.warn('Groq API key not configured');
      throw new Error('AI service not configured');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqApiKey}`,
      },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Groq API error: ${error}`);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callCopilotStudio(prompt: string): Promise<string> {
    if (!this.copilotSecret) {
      this.logger.warn('Copilot Studio secret not configured');
      throw new Error('Copilot Studio not configured');
    }

    try {
      const conversationResponse = await fetch(
        'https://directline.botframework.com/v3/directline/conversations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.copilotSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!conversationResponse.ok) {
        const errText = await conversationResponse.text();
        this.logger.error(
          `Copilot conversation error: ${conversationResponse.status} - ${errText}`,
        );
        throw new Error(
          `Conversation creation failed: ${conversationResponse.status}`,
        );
      }

      const convData = await conversationResponse.json();
      const conversationId = convData.conversationId;
      const token = convData.token;

      const sendUrl = `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`;
      const messageResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'message',
          from: { id: 'ebidding-system', name: 'E-Bidding System' },
          text: prompt,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error(`Message send failed: ${messageResponse.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const activitiesResponse = await fetch(`${sendUrl}?watermark=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!activitiesResponse.ok) {
        throw new Error(
          `Activities fetch failed: ${activitiesResponse.status}`,
        );
      }

      const activitiesData = await activitiesResponse.json();
      const botMessages = activitiesData.activities?.filter(
        (a: any) =>
          a.from?.id !== 'ebidding-system' && a.type === 'message' && a.text,
      );

      if (botMessages && botMessages.length > 0) {
        return botMessages[botMessages.length - 1].text;
      }

      throw new Error('No response from Copilot Studio');
    } catch (error) {
      this.logger.error(`Copilot Studio error: ${error}`);
      throw error;
    }
  }

  async writeTor(input: TorRequest): Promise<{ tor: string }> {
    try {
      const prompt = this.buildTorPrompt(input);
      const tor = await this.callAI(prompt);
      return { tor };
    } catch (error) {
      this.logger.error(`AI TOR generation failed: ${error}`);
      return { tor: this.generateTemplateTor(input) };
    }
  }

  private buildTorPrompt(input: TorRequest): string {
    const lang = input.language || 'English';
    return `You are a procurement expert for Centara Hotels & Resorts. Generate a professional Terms of Reference (TOR) document for the following procurement request.

Request Type: ${input.requestType}
Category: ${input.category}
Title: ${input.title}
Description: ${input.description || 'No description provided'}

Requirements:
1. Write in professional business ${lang}
2. Include all standard TOR sections (Background, Objectives, Scope, Deliverables, Evaluation Criteria, Timeline)
3. Tailor the content to the ${input.category} category
4. Be specific and actionable
5. Use markdown formatting with headers and bullet points
6. Include realistic timelines (7-30 days depending on complexity)
7. For RFP: Include detailed evaluation criteria with percentages
8. For RFQ: Include pricing requirements and specifications
9. For RFI: Focus on information gathering and market research

Generate the complete TOR document now:`;
  }

  async scoreVendor(input: VendorScoreRequest): Promise<VendorScoreResponse> {
    try {
      const prompt = this.buildScorePrompt(input);
      const response = await this.callAI(prompt);
      return this.parseScoreResponse(response, input);
    } catch (error) {
      this.logger.error(`AI scoring failed: ${error}`);
      return this.fallbackScoring(input);
    }
  }

  private buildScorePrompt(input: VendorScoreRequest): string {
    const prices = input.allVendorPrices?.length ? input.allVendorPrices : [input.price];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const lang = input.language || 'English';

    return `You are a procurement evaluator for Centara Hotels & Resorts. Analyze this vendor proposal and score each criterion 0-100.

Procurement: ${input.procurementTitle}
Vendor: ${input.vendorName}
Proposed Price: $${input.price.toLocaleString()}
Proposal Summary: ${input.proposalText || 'No proposal text provided'}

Market Context:
- Average bid: $${Math.round(avgPrice).toLocaleString()}
- Lowest bid: $${minPrice.toLocaleString()}
- Highest bid: $${maxPrice.toLocaleString()}

Score the vendor on a scale of 0-100 for EACH criterion:

1. Price Criteria (Weight: 40%): Evaluate price competitiveness. The vendor with the lowest bid receives the highest score. Consider how the proposed price compares to other bids.
2. Technical & Quality Criteria (Weight: 40%): Evaluate compliance with functional/technical requirements, premium features/specifications beyond minimums, and the implementation methodology/work plan.
3. Service & Delivery Criteria (Weight: 10%): Evaluate delivery lead time, warranty period, and after-sales service/SLA commitments.
4. Qualifications & Experience Criteria (Weight: 10%): Evaluate proven track record, team expertise/certifications, and company profile/financial stability.

Write your reasoning in ${lang}.
Respond ONLY with valid JSON in this exact format. No markdown, no code fences.
{
  "price": <number 0-100>,
  "technicalQuality": <number 0-100>,
  "serviceDelivery": <number 0-100>,
  "qualificationsExperience": <number 0-100>,
  "reasoning": "<detailed explanation of the scoring>"
}`;
  }

  private parseScoreResponse(
    response: string,
    input: VendorScoreRequest,
  ): VendorScoreResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const clamp = (v: number) => Math.min(100, Math.max(0, v));
        const criteria = {
          price: clamp(parsed.price ?? 50),
          technicalQuality: clamp(parsed.technicalQuality ?? 50),
          serviceDelivery: clamp(parsed.serviceDelivery ?? 50),
          qualificationsExperience: clamp(parsed.qualificationsExperience ?? 50),
        };
        const weights = { price: 0.4, technicalQuality: 0.4, serviceDelivery: 0.1, qualificationsExperience: 0.1 };
        const net = (raw: number, w: number) => Math.round(raw * w * 10) / 10;
        const total = Math.round(
          criteria.price * weights.price +
          criteria.technicalQuality * weights.technicalQuality +
          criteria.serviceDelivery * weights.serviceDelivery +
          criteria.qualificationsExperience * weights.qualificationsExperience,
        );
        return {
          score: total,
          reasoning: parsed.reasoning || 'AI scoring completed',
          breakdown: {
            price: { raw: criteria.price, weight: 40, net: net(criteria.price, 0.4) },
            technicalQuality: { raw: criteria.technicalQuality, weight: 40, net: net(criteria.technicalQuality, 0.4) },
            serviceDelivery: { raw: criteria.serviceDelivery, weight: 10, net: net(criteria.serviceDelivery, 0.1) },
            qualificationsExperience: { raw: criteria.qualificationsExperience, weight: 10, net: net(criteria.qualificationsExperience, 0.1) },
          },
        };
      }
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error}`);
    }
    return this.fallbackScoring(input);
  }

  private fallbackScoring(input: VendorScoreRequest): VendorScoreResponse {
    const prices = input.allVendorPrices?.length ? input.allVendorPrices : [input.price];
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const net = (raw: number, w: number) => Math.round(raw * w * 10) / 10;
    const price = Math.round(((maxPrice - input.price) / priceRange) * 100);
    const technicalQuality = 70;
    const serviceDelivery = 70;
    const qualificationsExperience = 70;
    const total = Math.round(price * 0.4 + technicalQuality * 0.4 + serviceDelivery * 0.1 + qualificationsExperience * 0.1);

    return {
      score: total,
      reasoning: `Fallback scoring based on price analysis:
Price: $${input.price.toLocaleString()}
Lowest: $${minPrice.toLocaleString()}
Highest: $${maxPrice.toLocaleString()}
Price Score: ${price}/100`,
      breakdown: {
        price: { raw: price, weight: 40, net: net(price, 0.4) },
        technicalQuality: { raw: technicalQuality, weight: 40, net: net(technicalQuality, 0.4) },
        serviceDelivery: { raw: serviceDelivery, weight: 10, net: net(serviceDelivery, 0.1) },
        qualificationsExperience: { raw: qualificationsExperience, weight: 10, net: net(qualificationsExperience, 0.1) },
      },
    };
  }

  private generateTemplateTor(input: TorRequest): string {
    return `## Terms of Reference — ${input.requestType}

### 1. Background & Context
${input.title} is a procurement initiative under the ${input.category} category.

${input.description ? `**Brief:** ${input.description}` : ''}

### 2. Objectives
- Define clear requirements for this procurement
- Ensure competitive and transparent selection process
- Achieve value for money

### 3. Scope
- Detailed requirements to be defined based on ${input.category} needs

### 4. Timeline
- To be determined based on complexity

### 5. Evaluation Criteria
- Compliance with requirements
- Cost-effectiveness
- Vendor capability`;
  }
}
