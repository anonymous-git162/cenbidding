import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsEnum, Matches } from 'class-validator';
import { VendorStatus } from '@prisma/client';

export class VendorSelfRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain uppercase, lowercase, and number' })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

export class VendorCreateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactName: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class VendorUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}
