import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RegisterContractorDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsArray()
  @IsString({ each: true })
  specialties!: string[];

  @IsNumber()
  @Min(1)
  hourlyRate!: number;

  @IsString()
  @IsOptional()
  insuranceCertUrl?: string;

  @IsString()
  @MinLength(6)
  bankAccount!: string;
}
