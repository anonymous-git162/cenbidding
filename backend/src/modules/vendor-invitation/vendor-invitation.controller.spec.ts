import { Test, TestingModule } from '@nestjs/testing';
import { VendorInvitationController } from './vendor-invitation.controller';
import { VendorInvitationService } from './vendor-invitation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('VendorInvitationController', () => {
  let controller: VendorInvitationController;
  let service: jest.Mocked<VendorInvitationService>;

  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    service = {
      invite: jest.fn(),
      findAll: jest.fn(),
      findByProcurement: jest.fn(),
      findMyInvitations: jest.fn(),
      accept: jest.fn(),
      decline: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorInvitationController],
      providers: [{ provide: VendorInvitationService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VendorInvitationController>(
      VendorInvitationController,
    );
  });

  it('should invite vendors', async () => {
    const dto = {
      procurementId: 'p-1',
      vendorIds: ['v-1'],
      deadline: new Date(),
    };
    service.invite.mockResolvedValue({ count: 1 } as any);
    await controller.invite(dto as any, mockReq);
    expect(service.invite).toHaveBeenCalledWith(
      'p-1',
      ['v-1'],
      'user-1',
      dto.deadline,
    );
  });

  it('should findAll invitations', async () => {
    const expected = [{ id: 'i-1' }];
    service.findAll.mockResolvedValue(expected as any);
    const result = await controller.findAll();
    expect(result).toBe(expected);
  });

  it('should findByProcurement', async () => {
    service.findByProcurement.mockResolvedValue([]);
    await controller.findByProcurement('p-1');
    expect(service.findByProcurement).toHaveBeenCalledWith('p-1');
  });

  it('should findMyInvitations', async () => {
    service.findMyInvitations.mockResolvedValue([]);
    await controller.myInvitations(mockReq);
    expect(service.findMyInvitations).toHaveBeenCalledWith('user-1');
  });

  it('should accept invitation', async () => {
    service.accept.mockResolvedValue({ status: 'ACCEPTED' } as any);
    await controller.accept('i-1', mockReq);
    expect(service.accept).toHaveBeenCalledWith('i-1', 'user-1');
  });

  it('should decline invitation', async () => {
    service.decline.mockResolvedValue({ status: 'DECLINED' } as any);
    await controller.decline('i-1', mockReq);
    expect(service.decline).toHaveBeenCalledWith('i-1', 'user-1');
  });
});
