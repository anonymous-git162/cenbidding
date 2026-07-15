import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RequestType } from '@prisma/client';
import { stripHtml } from '../../../common/helpers/sanitize';

const Sanitize = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? stripHtml(value) : value,
  );

export class CreateProcurementDto {
  @IsEnum(RequestType)
  requestType: RequestType;

  @Sanitize()
  @IsString()
  @MinLength(3)
  title: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  description?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  businessNeed?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  justification?: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetEstimate?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  fileIds?: string[];
}

export class UpdateProcurementDto {
  @Sanitize()
  @IsString()
  @IsOptional()
  title?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  description?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  businessNeed?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  justification?: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  budgetEstimate?: number;
}

export class QueryProcurementDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(RequestType)
  requestType?: RequestType;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budgetMax?: number;
}

export class ReviewDto {
  @Sanitize()
  @IsString()
  @IsOptional()
  comment?: string;

  @Sanitize()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PublishDto {
  @IsDateString()
  @IsOptional()
  submissionDeadline?: string;
}

export class FinalDecisionDto {
  @Sanitize()
  @IsString()
  @IsOptional()
  finalDecisionReason?: string;
}

export class ReassignApproverDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  approverIds: string[];
}

export class AnnounceAwardDto {
  @IsString()
  winningVendorId: string;

  @Sanitize()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  announcementText: string;
}
