import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  const mockConfig = (overrides: Record<string, string> = {}) => ({
    get: jest.fn((key: string) => overrides[key] || null),
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  async function buildService(config: Record<string, string>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfig(config) },
      ],
    }).compile();
    return module.get<AiService>(AiService);
  }

  describe('writeTor', () => {
    it('should return AI-generated TOR when API succeeds', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '# Terms of Reference\n\nGenerated TOR content',
              },
            },
          ],
        }),
      });

      service = await buildService({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'test-key',
      });
      const input = {
        requestType: 'RFP' as const,
        category: 'IT',
        title: 'Server Upgrade',
        description: 'Upgrade servers',
      };

      const result = await service.writeTor(input);
      expect(result.tor).toContain('Terms of Reference');
    });

    it('should fall back to template TOR when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      service = await buildService({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'test-key',
      });
      const input = {
        requestType: 'RFI' as const,
        category: 'Consulting',
        title: 'Market Research',
        description: '',
      };

      const result = await service.writeTor(input);
      expect(result.tor).toContain('Terms of Reference');
      expect(result.tor).toContain('RFI');
    });

    it('should return template when no API key is configured', async () => {
      service = await buildService({});
      const input = {
        requestType: 'RFP' as const,
        category: 'IT',
        title: 'Project',
        description: '',
      };

      const result = await service.writeTor(input);
      expect(result.tor).toContain('Terms of Reference');
    });
  });

  describe('scoreVendor', () => {
    it('should return AI-scored result when API succeeds', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 85,
                  reasoning: 'Good vendor',
                  priceCompetitiveness: 35,
                  marketPosition: 15,
                  completeness: 18,
                  baseQuality: 17,
                }),
              },
            },
          ],
        }),
      });

      service = await buildService({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'test-key',
      });
      const input = {
        vendorName: 'Acme',
        price: 100000,
        proposalText: 'Good proposal',
        allVendorPrices: [80000, 100000, 120000],
        procurementTitle: 'IT Project',
      };

      const result = await service.scoreVendor(input);
      expect(result.score).toBe(85);
      expect(result.breakdown.priceCompetitiveness).toBe(35);
    });

    it('should return fallback scoring when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

      service = await buildService({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'test-key',
      });
      const input = {
        vendorName: 'Acme',
        price: 100000,
        proposalText: 'Proposal',
        allVendorPrices: [90000, 100000, 110000],
        procurementTitle: 'Test',
      };

      const result = await service.scoreVendor(input);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.reasoning).toContain('Fallback');
    });

    it('should use fallback when JSON parse fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Not valid JSON' } }],
        }),
      });

      service = await buildService({
        AI_PROVIDER: 'groq',
        GROQ_API_KEY: 'test-key',
      });
      const input = {
        vendorName: 'Acme',
        price: 100000,
        proposalText: 'Proposal',
        allVendorPrices: [90000, 100000, 110000],
        procurementTitle: 'Test',
      };

      const result = await service.scoreVendor(input);
      expect(result.reasoning).toContain('Fallback');
    });
  });
});
