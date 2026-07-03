import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('closeExpiredRounds', () => {
    it('closes expired open rounds', async () => {
      prisma.ebiddingRound.findMany.mockResolvedValue([
        { id: 'r1', endsAt: new Date(Date.now() - 3600000) },
        { id: 'r2', endsAt: new Date(Date.now() - 7200000) },
      ] as any);
      prisma.ebiddingRound.update.mockResolvedValue({} as any);

      await service.closeExpiredRounds();

      expect(prisma.ebiddingRound.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'OPEN', endsAt: { lte: expect.any(Date) } },
        }),
      );
      expect(prisma.ebiddingRound.update).toHaveBeenCalledTimes(2);
      expect(prisma.ebiddingRound.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'CLOSED' },
      });
      expect(prisma.ebiddingRound.update).toHaveBeenCalledWith({
        where: { id: 'r2' },
        data: { status: 'CLOSED' },
      });
    });

    it('does nothing when no expired rounds', async () => {
      prisma.ebiddingRound.findMany.mockResolvedValue([]);
      await service.closeExpiredRounds();
      expect(prisma.ebiddingRound.update).not.toHaveBeenCalled();
    });
  });
});
