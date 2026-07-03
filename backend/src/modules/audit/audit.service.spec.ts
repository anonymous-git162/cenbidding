import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';
import { mockPrisma, MockPrisma } from '../../../test/prisma-mock';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = mockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const data = {
        module: 'Procurement',
        entityType: 'Procurement',
        entityId: 'p-1',
        action: 'CREATED',
        actorId: 'u-1',
        actorRole: 'REQUESTER',
      };
      const expected = { id: 'audit-1, ...data' };
      prisma.auditLog.create.mockResolvedValue(expected as any);

      const result = await service.log(data);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          module: data.module,
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          actorId: data.actorId,
          actorRole: data.actorRole,
          beforeData: undefined,
          afterData: undefined,
        },
      });
      expect(result).toBe(expected);
    });
  });

  describe('findByProcurement', () => {
    it('should return paginated audit logs', async () => {
      const logs = [
        { id: 'a-1', action: 'CREATED', createdAt: new Date() },
        { id: 'a-2', action: 'SUBMITTED', createdAt: new Date() },
      ];
      prisma.auditLog.findMany.mockResolvedValue(logs as any);
      prisma.auditLog.count.mockResolvedValue(2);

      const result = await service.findByProcurement('p-1', 1, 50);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should use defaults for page and limit', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await service.findByProcurement('p-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(50);
    });
  });
});
