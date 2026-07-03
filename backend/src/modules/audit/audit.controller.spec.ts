import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  beforeEach(async () => {
    service = {
      findByProcurement: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should findByProcurement with default page', async () => {
    const expected = [{ id: 'log-1' }];
    service.findByProcurement.mockResolvedValue(expected as any);
    const result = await controller.findByProcurement('p-1', undefined);
    expect(service.findByProcurement).toHaveBeenCalledWith('p-1', 1);
    expect(result).toBe(expected);
  });

  it('should findByProcurement with custom page', async () => {
    service.findByProcurement.mockResolvedValue([] as any);
    await controller.findByProcurement('p-1', 3);
    expect(service.findByProcurement).toHaveBeenCalledWith('p-1', 3);
  });
});
