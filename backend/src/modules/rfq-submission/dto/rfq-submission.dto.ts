import { IsString, IsNumber, IsOptional, IsArray, Min, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  procurementId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  proposalText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  proposalText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}
