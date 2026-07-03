import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';

export class InviteDto {
  @IsString()
  procurementId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  vendorIds: string[];

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
