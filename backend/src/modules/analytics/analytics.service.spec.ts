import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getVendorAnalytics', () => {
    it('should return aggregated vendor analytics', async () => {
      prisma.vendor.findUnique.mockResolvedValue({
        id: 'v-1',
        companyName: 'Acme',
      } as any);
      prisma.vendorInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          invitationStatus: 'ACCEPTED',
          invitedAt: new Date(),
          procurement: { id: 'p-1', title: 'Test' },
        },
      ] as any);
      prisma.rfqSubmission.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          price: 1000,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          procurement: { id: 'p-1' },
        },
      ] as any);
      prisma.ebiddingResponse.count.mockResolvedValue(3);
      prisma.evaluatorReview.findMany.mockResolvedValue([
        {
          id: 'rev-1',
          score: 85,
          comment: 'Good',
          submittedAt: new Date(),
          evaluator: { fullName: 'Bob' },
          procurement: { id: 'p-1' },
        },
      ] as any);

      const result = (await service.getVendorAnalytics('u-1')) as any;

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recentInvitations');
      expect(result).toHaveProperty('recentSubmissions');
      expect(result).toHaveProperty('scoreHistory');
      expect(result.summary.invitedCount).toBe(1);
      expect(result.summary.acceptedCount).toBe(1);
      expect(result.summary.totalBids).toBe(3);
      expect(result.scoreHistory).toHaveLength(1);
      expect(result.scoreHistory[0].evaluator).toBe('Bob');
    });

    it('should return null for missing vendor', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      const result = await service.getVendorAnalytics('u-1');
      expect(result).toBeNull();
    });
  });

  describe('getVendorPerformance', () => {
    it('should return score analysis', async () => {
      prisma.vendor.findUnique.mockResolvedValue({ id: 'v-1' } as any);
      prisma.evaluatorReview.findMany.mockResolvedValue([
        { id: 'r-1', score: 90, submittedAt: new Date('2026-06-01') },
        { id: 'r-2', score: 70, submittedAt: new Date('2026-06-15') },
      ] as any);

      const result = (await service.getVendorPerformance('u-1')) as any;
      expect(result).toHaveProperty('scoreTimeline');
      expect(result).toHaveProperty('scoreDistribution');
      expect(result.totalReviews).toBe(2);
    });

    it('should return null for missing vendor', async () => {
      prisma.vendor.findUnique.mockResolvedValue(null);

      const result = await service.getVendorPerformance('u-1');
      expect(result).toBeNull();
    });
  });
});
