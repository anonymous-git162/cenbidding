import { Test, TestingModule } from '@nestjs/testing';
import { RfqSubmissionController } from './rfq-submission.controller';
import { RfqSubmissionService } from './rfq-submission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';

describe('RfqSubmissionController', () => {
  let controller: RfqSubmissionController;
  let service: jest.Mocked<RfqSubmissionService>;
  let prisma: any;

  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      update: jest.fn(),
      submit: jest.fn(),
      findByProcurement: jest.fn(),
      findMySubmission: jest.fn(),
    } as any;

    prisma = {
      vendor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'vendor-1', userId: 'user-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfqSubmissionController],
      providers: [
        { provide: RfqSubmissionService, useValue: service },
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RfqSubmissionController>(RfqSubmissionController);
  });

  it('should create submission', async () => {
    const body = {
      procurementId: 'p-1',
      price: 1000,
      proposalText: 'Proposal',
    };
    service.create.mockResolvedValue({ id: 's-1' } as any);
    await controller.create(body, mockReq);
    expect(service.create).toHaveBeenCalledWith('p-1', 'vendor-1', 1000, 'Proposal', undefined);
  });

  it('should update submission', async () => {
    const body = { price: 1200, proposalText: 'Updated' };
    service.update.mockResolvedValue({ id: 's-1' } as any);
    await controller.update('s-1', body, mockReq);
    expect(service.update).toHaveBeenCalledWith(
      's-1',
      'user-1',
      1200,
      'Updated',
      undefined,
    );
  });

  it('should submit', async () => {
    service.submit.mockResolvedValue({ id: 's-1', status: 'SUBMITTED' } as any);
    await controller.submit('s-1', mockReq);
    expect(service.submit).toHaveBeenCalledWith('s-1', 'user-1');
  });

  it('should findByProcurement', async () => {
    service.findByProcurement.mockResolvedValue([]);
    await controller.findByProcurement('p-1');
    expect(service.findByProcurement).toHaveBeenCalledWith('p-1');
  });

  it('should findMySubmission', async () => {
    service.findMySubmission.mockResolvedValue({ id: 's-1' } as any);
    const result = await controller.findMy('p-1', mockReq);
    expect(service.findMySubmission).toHaveBeenCalledWith('p-1', 'user-1');
    expect(result).toEqual({ id: 's-1' });
  });
});
