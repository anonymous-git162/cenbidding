import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: jest.Mocked<HealthService>;

  beforeEach(async () => {
    service = {
      check: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: service }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should check health', async () => {
    const expected = { status: 'ok', timestamp: new Date().toISOString() };
    service.check.mockResolvedValue(expected as any);
    const result = await controller.check();
    expect(service.check).toHaveBeenCalled();
    expect(result).toBe(expected);
  });
});
