import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ApprovalController', () => {
  let controller: ApprovalController;
  let service: jest.Mocked<ApprovalService>;

  const mockReq = { user: { id: 'user-1', role: 'APPROVER' } };

  beforeEach(async () => {
    service = {
      submitForApproval: jest.fn(),
      getInbox: jest.fn(),
      approve: jest.fn(),
      return: jest.fn(),
      reject: jest.fn(),
      getOverdueApprovals: jest.fn(),
      escalateApproval: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [{ provide: ApprovalService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ApprovalController>(ApprovalController);
  });

  it('should submit for approval', async () => {
    service.submitForApproval.mockResolvedValue({
      status: 'PENDING_APPROVAL',
    } as any);
    await controller.submit('p-1', mockReq);
    expect(service.submitForApproval).toHaveBeenCalledWith('p-1', 'user-1');
  });

  it('should get inbox', async () => {
    const expected = [{ id: 'a-1' }];
    service.getInbox.mockResolvedValue(expected as any);
    const result = await controller.getInbox(mockReq);
    expect(service.getInbox).toHaveBeenCalledWith('user-1');
    expect(result).toBe(expected);
  });

  it('should approve', async () => {
    service.approve.mockResolvedValue({ status: 'APPROVED' } as any);
    const body = { comment: 'Looks good' };
    await controller.approve('p-1', body, mockReq);
    expect(service.approve).toHaveBeenCalledWith('p-1', 'user-1', 'Looks good');
  });

  it('should return', async () => {
    service.return.mockResolvedValue({ status: 'RETURNED' } as any);
    const body = { reason: 'Needs changes' };
    await controller.returnProc('p-1', body, mockReq);
    expect(service.return).toHaveBeenCalledWith(
      'p-1',
      'user-1',
      'Needs changes',
    );
  });

  it('should reject', async () => {
    service.reject.mockResolvedValue({ status: 'REJECTED' } as any);
    const body = { reason: 'Not suitable' };
    await controller.reject('p-1', body, mockReq);
    expect(service.reject).toHaveBeenCalledWith(
      'p-1',
      'user-1',
      'Not suitable',
    );
  });

  it('should get overdue', async () => {
    const expected = [{ id: 'a-2' }];
    service.getOverdueApprovals.mockResolvedValue(expected as any);
    const result = await controller.getOverdue();
    expect(result).toBe(expected);
  });

  it('should escalate', async () => {
    service.escalateApproval.mockResolvedValue({ escalated: true } as any);
    await controller.escalate('p-1');
    expect(service.escalateApproval).toHaveBeenCalledWith('p-1');
  });
});
