import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class CreateRoundDto {
  @IsString()
  procurementId: string;
}

export class PlaceBidDto {
  @IsString()
  roundId: string;

  @IsNumber()
  @Min(1)
  bidAmount: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}
