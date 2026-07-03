import { Test, TestingModule } from '@nestjs/testing';
import { TimelineService } from './timeline.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('TimelineService', () => {
  let service: TimelineService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
  });

  describe('append', () => {
    it('should create a timeline entry', async () => {
      const data = {
        procurementId: 'p-1',
        eventType: 'DRAFT_CREATED',
        actorRole: 'REQUESTER',
        actorId: 'u-1',
      };
      const expected = { id: 'tl-1', ...data };
      prisma.procurementTimeline.create.mockResolvedValue(expected as any);

      const result = await service.append(data);
      expect(prisma.procurementTimeline.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(expected);
    });

    it('should create timeline entry without optional metadata', async () => {
      const data = {
        procurementId: 'p-1',
        eventType: 'SYSTEM_EVENT',
        actorRole: 'SYSTEM',
      };
      prisma.procurementTimeline.create.mockResolvedValue({
        id: 'tl-2',
        ...data,
      } as any);

      const result = await service.append(data);
      expect(result).toHaveProperty('id', 'tl-2');
    });
  });

  describe('findByProcurement', () => {
    it('should return timeline entries sorted by timestamp desc', async () => {
      const entries = [
        {
          id: 'tl-2',
          eventType: 'SUBMITTED',
          timestamp: new Date('2026-07-02'),
        },
        {
          id: 'tl-1',
          eventType: 'DRAFT_CREATED',
          timestamp: new Date('2026-07-01'),
        },
      ];
      prisma.procurementTimeline.findMany.mockResolvedValue(entries as any);

      const result = await service.findByProcurement('p-1');
      expect(result).toHaveLength(2);
      expect(prisma.procurementTimeline.findMany).toHaveBeenCalledWith({
        where: { procurementId: 'p-1' },
        orderBy: { timestamp: 'desc' },
      });
    });
  });
});
