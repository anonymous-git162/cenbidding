import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('EvaluationController', () => {
  let controller: EvaluationController;
  let service: jest.Mocked<EvaluationService>;

  const mockReq = { user: { id: 'user-1', role: 'EVALUATOR' } };
  const leadReq = { user: { id: 'lead-1', role: 'LEAD_EVALUATOR' } };

  beforeEach(async () => {
    service = {
      assignEvaluators: jest.fn(),
      getMyAssignments: jest.fn(),
      submitReview: jest.fn(),
      getReviews: jest.fn(),
      calculateScores: jest.fn(),
      consolidate: jest.fn(),
      getConsolidation: jest.fn(),
      setCriteria: jest.fn(),
      getCriteria: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationController],
      providers: [{ provide: EvaluationService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EvaluationController>(EvaluationController);
  });

  it('should getMyAssignments', async () => {
    const expected = [{ procurementId: 'p-1' }];
    service.getMyAssignments.mockResolvedValue(expected as any);

    const result = await controller.getMyAssignments(mockReq);
    expect(service.getMyAssignments).toHaveBeenCalledWith(mockReq.user.id);
    expect(result).toBe(expected);
  });

  it('should assign evaluators', async () => {
    const dto = {
      procurementId: 'p-1',
      evaluatorIds: ['e-1'],
      leadEvaluatorId: 'e-1',
    };
    service.assignEvaluators.mockResolvedValue({ procurementId: 'p-1' } as any);

    const result = await controller.assign(dto);
    expect(service.assignEvaluators).toHaveBeenCalledWith(
      dto.procurementId,
      dto.evaluatorIds,
      dto.leadEvaluatorId,
    );
    expect(result).toEqual({ procurementId: 'p-1' });
  });

  it('should submitReview', async () => {
    const dto = {
      procurementId: 'p-1',
      vendorId: 'v-1',
      score: 85,
      comment: 'Good',
    };
    service.submitReview.mockResolvedValue({ score: 85 } as any);

    const result = await controller.submitReview(dto, mockReq);
    expect(service.submitReview).toHaveBeenCalledWith(
      mockReq.user.id,
      dto.procurementId,
      dto.vendorId,
      dto.score,
      dto.comment,
      undefined,
    );
    expect(result).toEqual({ score: 85 });
  });

  it('should getReviews', async () => {
    const expected = [{ vendorId: 'v-1', score: 85 }];
    service.getReviews.mockResolvedValue(expected as any);

    const result = await controller.getReviews('p-1');
    expect(service.getReviews).toHaveBeenCalledWith('p-1');
    expect(result).toBe(expected);
  });

  it('should getCriteria', async () => {
    const expected = [{ name: 'Price', weight: 40 }];
    service.getCriteria.mockResolvedValue(expected);
    const result = await controller.getCriteria('p-1');
    expect(service.getCriteria).toHaveBeenCalledWith('p-1');
    expect(result).toBe(expected);
  });

  it('should setCriteria', async () => {
    const dto = { criteria: [{ name: 'Price', weight: 40, maxScore: 100 }] };
    service.setCriteria.mockResolvedValue({
      evaluationCriteria: dto.criteria,
    } as any);
    const result = await controller.setCriteria('p-1', dto);
    expect(service.setCriteria).toHaveBeenCalledWith('p-1', dto.criteria);
    expect(result).toEqual({ evaluationCriteria: dto.criteria });
  });

  it('should calculate scores', async () => {
    service.calculateScores.mockResolvedValue({ scores: { v1: 85 } } as any);

    const result = await controller.calculate('p-1');
    expect(service.calculateScores).toHaveBeenCalledWith('p-1');
    expect(result).toEqual({ scores: { v1: 85 } });
  });

  it('should consolidate', async () => {
    const dto = {
      recommendation: 'Vendor A',
      leadCommentary: 'Strong proposal',
    };
    service.consolidate.mockResolvedValue({
      recommendation: 'Vendor A',
    } as any);

    const result = await controller.consolidate('p-1', dto, leadReq);
    expect(service.consolidate).toHaveBeenCalledWith(
      'p-1',
      leadReq.user.id,
      dto.recommendation,
      dto.leadCommentary,
    );
    expect(result).toEqual({ recommendation: 'Vendor A' });
  });

  it('should getConsolidation', async () => {
    const expected = { recommendation: 'Vendor A' };
    service.getConsolidation.mockResolvedValue(expected as any);

    const result = await controller.getConsolidation('p-1');
    expect(service.getConsolidation).toHaveBeenCalledWith('p-1');
    expect(result).toBe(expected);
  });
});
