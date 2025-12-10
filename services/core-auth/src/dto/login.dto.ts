import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(14)
  password!: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
