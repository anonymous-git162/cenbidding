import { Test, TestingModule } from '@nestjs/testing';
import { EbiddingController } from './ebidding.controller';
import { EbiddingService } from './ebidding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('EbiddingController', () => {
  let controller: EbiddingController;
  let service: jest.Mocked<EbiddingService>;

  const mockReq = { user: { id: 'user-1', role: 'PROCUREMENT' } };
  const vendorReq = { user: { id: 'vendor-1', role: 'VENDOR' } };

  beforeEach(async () => {
    service = {
      createRound: jest.fn(),
      openRound: jest.fn(),
      closeRound: jest.fn(),
      placeBid: jest.fn(),
      getRounds: jest.fn(),
      getAcceptedVendorCount: jest.fn(),
      getAllMyBids: jest.fn(),
      getRoundBids: jest.fn(),
      getMyBids: jest.fn(),
      deleteBid: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EbiddingController],
      providers: [{ provide: EbiddingService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EbiddingController>(EbiddingController);
  });

  it('should createRound', async () => {
    const dto = { procurementId: 'p-1' };
    service.createRound.mockResolvedValue({ id: 'r-1' } as any);

    const result = await controller.createRound(dto, mockReq);
    expect(service.createRound).toHaveBeenCalledWith(
      dto.procurementId,
      mockReq.user.id,
    );
    expect(result).toEqual({ id: 'r-1' });
  });

  it('should openRound', async () => {
    service.openRound.mockResolvedValue({ status: 'OPEN' } as any);
    await controller.openRound('r-1', mockReq);
    expect(service.openRound).toHaveBeenCalledWith('r-1', mockReq.user.id);
  });

  it('should closeRound', async () => {
    service.closeRound.mockResolvedValue({ status: 'CLOSED' } as any);
    await controller.closeRound('r-1', mockReq);
    expect(service.closeRound).toHaveBeenCalledWith('r-1', mockReq.user.id);
  });

  it('should placeBid', async () => {
    const dto = { roundId: 'r-1', bidAmount: 500000 };
    service.placeBid.mockResolvedValue({
      id: 'bid-1',
      bidAmount: 500000,
    } as any);

    const result = await controller.placeBid(dto, vendorReq);
    expect(service.placeBid).toHaveBeenCalledWith(
      dto.roundId,
      vendorReq.user.id,
      dto.bidAmount,
    );
    expect(result).toEqual({ id: 'bid-1', bidAmount: 500000 });
  });

  it('should getRounds', async () => {
    const expected = [{ id: 'r-1' }];
    service.getRounds.mockResolvedValue(expected as any);

    const result = await controller.getRounds('p-1', mockReq);
    expect(service.getRounds).toHaveBeenCalledWith('p-1', mockReq.user);
    expect(result).toBe(expected);
  });

  it('should getVendorCount', async () => {
    service.getAcceptedVendorCount.mockResolvedValue({ count: 3 } as any);

    const result = await controller.getVendorCount('p-1');
    expect(service.getAcceptedVendorCount).toHaveBeenCalledWith('p-1');
    expect(result).toEqual({ count: 3 });
  });

  it('should getAllMyBids', async () => {
    const expected = [{ id: 'bid-1' }];
    service.getAllMyBids.mockResolvedValue(expected as any);

    const result = await controller.getAllMyBids(vendorReq);
    expect(service.getAllMyBids).toHaveBeenCalledWith(vendorReq.user.id);
    expect(result).toBe(expected);
  });

  it('should getBids', async () => {
    const expected = [{ id: 'bid-1', vendorId: 'v-1' }];
    service.getRoundBids.mockResolvedValue(expected as any);

    const result = await controller.getBids('r-1');
    expect(service.getRoundBids).toHaveBeenCalledWith('r-1');
    expect(result).toBe(expected);
  });

  it('should getMyBids', async () => {
    const expected = [{ id: 'bid-1' }];
    service.getMyBids.mockResolvedValue(expected as any);

    const result = await controller.getMyBids('r-1', vendorReq);
    expect(service.getMyBids).toHaveBeenCalledWith('r-1', vendorReq.user.id);
    expect(result).toBe(expected);
  });

  it('should deleteBid', async () => {
    service.deleteBid.mockResolvedValue({ message: 'Bid deleted' } as any);

    await controller.deleteBid('bid-1', vendorReq);
    expect(service.deleteBid).toHaveBeenCalledWith('bid-1', vendorReq.user.id);
  });
});
