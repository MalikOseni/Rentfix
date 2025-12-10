import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

const PASSWORD_COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{14,}$/;

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(14)
  @MaxLength(128)
  @Matches(PASSWORD_COMPLEXITY, {
    message:
      'Password must be at least 14 characters long and include upper, lower, number, and special character'
  })
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
