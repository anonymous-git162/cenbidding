import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('AiController', () => {
  let controller: AiController;
  let service: jest.Mocked<AiService>;

  beforeEach(async () => {
    service = {
      writeTor: jest.fn(),
      scoreVendor: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AiController>(AiController);
  });

  it('should writeTor', async () => {
    const body = {
      requestType: 'RFP',
      category: 'IT',
      title: 'Test',
      description: 'Desc',
    };
    service.writeTor.mockResolvedValue({ tor: 'Generated TOR' });
    const result = await controller.writeTor(body);
    expect(service.writeTor).toHaveBeenCalledWith(body);
    expect(result).toEqual({ tor: 'Generated TOR' });
  });

  it('should scoreVendor', async () => {
    const body = {
      vendorName: 'Vendor A',
      price: 100,
      proposalText: 'Text',
      allVendorPrices: [100, 200],
      procurementTitle: 'Test',
    };
    service.scoreVendor.mockResolvedValue({ score: 85 } as any);
    const result = await controller.scoreVendor(body);
    expect(service.scoreVendor).toHaveBeenCalledWith(body);
    expect(result).toEqual({ score: 85 });
  });
});
