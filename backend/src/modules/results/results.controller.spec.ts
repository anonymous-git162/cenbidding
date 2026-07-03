import { Test, TestingModule } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ResultsController', () => {
  let controller: ResultsController;
  let service: jest.Mocked<ResultsService>;

  const mockReq = { user: { id: 'user-1', role: 'PROCUREMENT' } };

  beforeEach(async () => {
    service = {
      getResult: jest.fn(),
      closeCase: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [{ provide: ResultsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ResultsController>(ResultsController);
  });

  it('should getResult', async () => {
    const expected = { id: 'r-1' };
    service.getResult.mockResolvedValue(expected as any);
    const result = await controller.getResult('p-1', mockReq);
    expect(service.getResult).toHaveBeenCalledWith(
      'p-1',
      'user-1',
      'PROCUREMENT',
      'user-1',
    );
    expect(result).toBe(expected);
  });

  it('should closeCase', async () => {
    service.closeCase.mockResolvedValue({ status: 'CLOSED' } as any);
    await controller.closeCase('p-1', mockReq);
    expect(service.closeCase).toHaveBeenCalledWith('p-1', 'user-1');
  });
});
