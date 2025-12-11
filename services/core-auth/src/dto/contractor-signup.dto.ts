import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
  IsObject,
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';

class ServiceAreaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postcodes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  radius_km?: number;

  @IsOptional()
  @IsObject()
  center?: { lat: number; lng: number };
}

export class ContractorSignupDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(14, { message: 'Password must be at least 14 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character'
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Business name must be at least 2 characters' })
  businessName!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s()-]{10,}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  specialties!: string[];

  @IsNumber()
  @Min(1, { message: 'Hourly rate must be at least 1' })
  hourlyRate!: number;

  @IsOptional()
  @IsString()
  insuranceCertUrl?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsString()
  @MinLength(6, { message: 'Bank account must be at least 6 characters' })
  bankAccount!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceAreaDto)
  serviceArea?: ServiceAreaDto;
}

export class ContractorVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  temporaryToken!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp!: string;
}

export class ContractorLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(14)
  password!: string;
}

export class ContractorResendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ContractorUpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  insuranceCertUrl?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceAreaDto)
  serviceArea?: ServiceAreaDto;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s()-]{10,}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class ContractorDeleteAccountDto {
  @IsString()
  @MinLength(14)
  password!: string;
}
