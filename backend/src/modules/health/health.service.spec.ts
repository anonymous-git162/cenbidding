import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('check', () => {
    it('should return ok when database is reachable', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const result = await service.check();
      expect(result.status).toBe('ok');
      expect(result.services.database).toBe('healthy');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return error when database query fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await service.check();
      expect(result.status).toBe('error');
      expect(result.services.database).toBe('unhealthy');
    });
  });
});
