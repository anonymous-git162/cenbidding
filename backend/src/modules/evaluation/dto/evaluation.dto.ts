import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { stripHtml } from '../../../common/helpers/sanitize';

const Sanitize = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? stripHtml(value) : value,
  );

export class AssignDto {
  @IsString()
  procurementId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  evaluatorIds: string[];

  @IsString()
  leadEvaluatorId: string;
}

export class SubmitReviewDto {
  @IsString()
  procurementId: string;

  @IsString()
  vendorId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @Sanitize()
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  criterionScores?: { criteriaIndex: number; score: number }[];
}

export class SetCriteriaDto {
  @IsArray()
  @ArrayMinSize(1)
  criteria: { name: string; weight: number; maxScore?: number }[];
}

export class ConsolidateDto {
  @Sanitize()
  @IsString()
  recommendation: string;

  @Sanitize()
  @IsString()
  leadCommentary: string;
}
