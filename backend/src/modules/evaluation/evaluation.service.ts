import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EvaluationService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private computeWeightedScore(
    criteria: any[],
    criterionScores: { criteriaIndex: number; score: number }[],
  ): number {
    if (!criteria?.length || !criterionScores?.length) return -1;
    const totalWeight = criteria.reduce(
      (sum: number, c: any) => sum + (c.weight || 0),
      0,
    );
    if (totalWeight === 0) return -1;
    const weighted = criterionScores.reduce((sum: number, cs: any) => {
      const criterion = criteria[cs.criteriaIndex];
      if (!criterion) return sum;
      return (
        sum + (cs.score / (criterion.maxScore || 100)) * (criterion.weight || 0)
      );
    }, 0);
    return Math.round((weighted / totalWeight) * 100);
  }

  async setCriteria(
    procurementId: string,
    criteria: { name: string; weight: number; maxScore?: number }[],
  ) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id: procurementId },
    });
    if (!procurement) throw new NotFoundException('Procurement not found');
    return this.prisma.procurement.update({
      where: { id: procurementId },
      data: { evaluationCriteria: criteria },
    });
  }

  async getCriteria(procurementId: string) {
    const procurement = await this.prisma.procurement.findUnique({
      where: { id: procurementId },
      select: { evaluationCriteria: true },
    });
    return procurement?.evaluationCriteria || [];
  }

  async assignEvaluators(
    procurementId: string,
    evaluatorIds: string[],
    leadEvaluatorId: string,
  ) {
    await this.prisma.evaluatorAssignment.deleteMany({
      where: { procurementId },
    });

    const assignments = await Promise.all(
      evaluatorIds.map((evaluatorId) =>
        this.prisma.evaluatorAssignment.create({
          data: {
            procurementId,
            evaluatorId,
            isLead: evaluatorId === leadEvaluatorId,
          },
        }),
      ),
    );

    const procurement = await this.prisma.procurement.update({
      where: { id: procurementId },
      data: { currentOwnerRole: 'EVALUATOR', status: 'EVALUATION' },
      select: { title: true, requestNo: true },
    });

    await this.notificationsService.createForUsers(evaluatorIds, {
      title: 'Evaluation Assigned',
      message: `You have been assigned to evaluate ${procurement.requestNo} — ${procurement.title}`,
      type: 'info',
      entityType: 'Procurement',
      entityId: procurementId,
      link: `/procurements/${procurementId}`,
    });

    return assignments;
  }

  async getMyAssignments(evaluatorUserId: string) {
    return this.prisma.evaluatorAssignment.findMany({
      where: { evaluatorId: evaluatorUserId },
      include: {
        procurement: {
          select: {
            id: true,
            requestNo: true,
            title: true,
            status: true,
            category: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async submitReview(
    evaluatorId: string,
    procurementId: string,
    vendorId: string,
    score: number,
    comment?: string,
    criterionScores?: { criteriaIndex: number; score: number }[],
  ) {
    const assignment = await this.prisma.evaluatorAssignment.findFirst({
      where: { procurementId, evaluatorId },
    });
    if (!assignment)
      throw new BadRequestException(
        'Evaluator not assigned to this procurement',
      );

    let finalScore = score;
    if (criterionScores?.length) {
      const procurement = await this.prisma.procurement.findUnique({
        where: { id: procurementId },
        select: { evaluationCriteria: true },
      });
      const weighted = this.computeWeightedScore(
        procurement?.evaluationCriteria as any[],
        criterionScores,
      );
      if (weighted >= 0) finalScore = weighted;
    }

    const existing = await this.prisma.evaluatorReview.findFirst({
      where: { evaluatorId, procurementId, vendorId },
    });

    const data: any = { score: finalScore, comment, submittedAt: new Date() };
    if (criterionScores) data.criterionScores = criterionScores;

    if (existing) {
      return this.prisma.evaluatorReview.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.evaluatorReview.create({
      data: { evaluatorId, procurementId, vendorId, ...data },
    });
  }

  async getReviews(procurementId: string) {
    return this.prisma.evaluatorReview.findMany({
      where: { procurementId },
      include: {
        evaluator: { select: { id: true, fullName: true } },
        vendor: { select: { id: true, companyName: true } },
      },
    });
  }

  async calculateScores(procurementId: string) {
    const reviews = await this.prisma.evaluatorReview.findMany({
      where: { procurementId },
    });

    const vendorScores: Record<string, number[]> = {};
    for (const review of reviews) {
      if (!vendorScores[review.vendorId]) vendorScores[review.vendorId] = [];
      vendorScores[review.vendorId].push(review.score);
    }

    const result: Record<
      string,
      { avgScore: number; voteCount: number; variance: number }
    > = {};
    for (const [vendorId, scores] of Object.entries(vendorScores)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance =
        scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) /
        scores.length;
      result[vendorId] = { avgScore: avg, voteCount: scores.length, variance };
    }

    return result;
  }

  async consolidate(
    procurementId: string,
    leadEvaluatorId: string,
    recommendation: string,
    leadCommentary: string,
  ) {
    const scores = await this.calculateScores(procurementId);
    const avgScore =
      Object.values(scores).reduce((sum, s) => sum + s.avgScore, 0) /
        Object.values(scores).length || 0;

    return this.prisma.evaluationConsolidation.upsert({
      where: { procurementId },
      create: {
        procurementId,
        avgScore,
        voteSummary: scores,
        recommendation,
        leadCommentary,
        leadEvaluatorId,
      },
      update: {
        avgScore,
        voteSummary: scores,
        recommendation,
        leadCommentary,
        leadEvaluatorId,
      },
    });
  }

  async getConsolidation(procurementId: string) {
    return this.prisma.evaluationConsolidation.findUnique({
      where: { procurementId },
    });
  }
}
