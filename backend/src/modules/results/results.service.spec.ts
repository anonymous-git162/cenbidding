import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResultsService } from './results.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('ResultsService', () => {
  let service: ResultsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
  });

  describe('getResult', () => {
    it('should return result for procurement', async () => {
      const mockResult = {
        id: 'r-1',
        procurementId: 'p-1',
        procurement: { id: 'p-1' },
        winningVendor: { companyName: 'Acme' },
      };
      prisma.procurementResult.findUnique.mockResolvedValue(mockResult as any);

      const result = await service.getResult('p-1', 'u-1', 'ADMIN');
      expect(result).toHaveProperty('id', 'r-1');
    });

    it('should throw NotFoundException when no result exists', async () => {
      prisma.procurementResult.findUnique.mockResolvedValue(null);

      await expect(service.getResult('p-1', 'u-1', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('closeCase', () => {
    it('should close the case when result exists', async () => {
      prisma.procurementResult.findUnique.mockResolvedValue({
        id: 'r-1',
        procurementId: 'p-1',
      } as any);
      prisma.procurementResult.update.mockResolvedValue({
        id: 'r-1',
        closedAt: new Date(),
      } as any);

      const result = await service.closeCase('p-1', 'u-1');
      expect(result).toHaveProperty('closedAt');
    });

    it('should throw NotFoundException when no result exists', async () => {
      prisma.procurementResult.findUnique.mockResolvedValue(null);

      await expect(service.closeCase('bad-id', 'u-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
