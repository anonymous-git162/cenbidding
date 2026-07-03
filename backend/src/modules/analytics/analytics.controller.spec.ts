import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  const mockReq = { user: { id: 'user-1' } };

  beforeEach(async () => {
    service = {
      getVendorAnalytics: jest.fn(),
      getVendorPerformance: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should getVendorAnalytics', async () => {
    const expected = { totalBids: 5 };
    service.getVendorAnalytics.mockResolvedValue(expected as any);
    const result = await controller.getVendorAnalytics(mockReq);
    expect(service.getVendorAnalytics).toHaveBeenCalledWith('user-1');
    expect(result).toBe(expected);
  });

  it('should getVendorPerformance', async () => {
    const expected = { winRate: 0.4 };
    service.getVendorPerformance.mockResolvedValue(expected as any);
    const result = await controller.getVendorPerformance(mockReq);
    expect(service.getVendorPerformance).toHaveBeenCalledWith('user-1');
    expect(result).toBe(expected);
  });
});
