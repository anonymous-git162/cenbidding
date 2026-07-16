import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  AssignDto,
  SubmitReviewDto,
  ConsolidateDto,
  SetCriteriaDto,
} from './dto/evaluation.dto';

@ApiTags('Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluation')
export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  @Get('assignments')
  @Roles(UserRole.EVALUATOR, UserRole.LEAD_EVALUATOR)
  @ApiOperation({ summary: 'Get my evaluation assignments' })
  getMyAssignments(@Request() req: any) {
    return this.evaluationService.getMyAssignments(req.user.id);
  }

  @Put(':procurementId/criteria')
  @Roles(UserRole.PROCUREMENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set evaluation criteria for a procurement' })
  setCriteria(
    @Param('procurementId') procurementId: string,
    @Body() dto: SetCriteriaDto,
  ) {
    return this.evaluationService.setCriteria(procurementId, dto.criteria);
  }

  @Get(':procurementId/criteria')
  @Roles(UserRole.PROCUREMENT, UserRole.EVALUATOR, UserRole.LEAD_EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get evaluation criteria for a procurement' })
  getCriteria(@Param('procurementId') procurementId: string) {
    return this.evaluationService.getCriteria(procurementId);
  }

  @Post('assignments')
  @Roles(UserRole.PROCUREMENT, UserRole.LEAD_EVALUATOR)
  @ApiOperation({ summary: 'Assign evaluators to a procurement' })
  assign(@Body() dto: AssignDto) {
    return this.evaluationService.assignEvaluators(
      dto.procurementId,
      dto.evaluatorIds,
      dto.leadEvaluatorId,
    );
  }

  @Post('reviews')
  @Roles(UserRole.EVALUATOR, UserRole.LEAD_EVALUATOR)
  @ApiOperation({ summary: 'Submit evaluator review' })
  submitReview(@Body() dto: SubmitReviewDto, @Request() req: any) {
    return this.evaluationService.submitReview(
      req.user.id,
      dto.procurementId,
      dto.vendorId,
      dto.score,
      dto.comment,
      dto.criterionScores,
    );
  }

  @Get('reviews/:procurementId')
  @Roles(UserRole.PROCUREMENT, UserRole.EVALUATOR, UserRole.LEAD_EVALUATOR, UserRole.APPROVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all reviews for a procurement' })
  getReviews(@Param('procurementId') procurementId: string) {
    return this.evaluationService.getReviews(procurementId);
  }

  @Post('calculate/:procurementId')
  @Roles(UserRole.LEAD_EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate aggregated scores' })
  calculate(@Param('procurementId') procurementId: string) {
    return this.evaluationService.calculateScores(procurementId);
  }

  @Post('consolidate/:procurementId')
  @Roles(UserRole.LEAD_EVALUATOR)
  @ApiOperation({ summary: 'Lead evaluator submits consolidation' })
  consolidate(
    @Param('procurementId') procurementId: string,
    @Body() dto: ConsolidateDto,
    @Request() req: any,
  ) {
    return this.evaluationService.consolidate(
      procurementId,
      req.user.id,
      dto.recommendation,
      dto.leadCommentary,
    );
  }

  @Get('consolidation/:procurementId')
  @Roles(UserRole.PROCUREMENT, UserRole.LEAD_EVALUATOR, UserRole.APPROVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get evaluation consolidation' })
  getConsolidation(@Param('procurementId') procurementId: string) {
    return this.evaluationService.getConsolidation(procurementId);
  }
}
