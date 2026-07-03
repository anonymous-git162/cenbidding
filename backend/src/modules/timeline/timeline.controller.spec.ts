import { Test, TestingModule } from '@nestjs/testing';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: jest.Mocked<TimelineService>;

  beforeEach(async () => {
    service = {
      findByProcurement: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimelineController],
      providers: [{ provide: TimelineService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TimelineController>(TimelineController);
  });

  it('should findByProcurement', async () => {
    const expected = [{ step: 'DRAFT', date: new Date() }];
    service.findByProcurement.mockResolvedValue(expected as any);
    const result = await controller.findByProcurement('p-1');
    expect(service.findByProcurement).toHaveBeenCalledWith('p-1');
    expect(result).toBe(expected);
  });
});
