import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

const E164_REGEX = /^\+?[1-9]\d{7,14}$/;
const PASSWORD_COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{14,}$/;
const COMPANY_REG_REGEX = /^(?:[A-Z]{2}\d{6}|\d{8})$/i;

export class AgentSignupDto {
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

  @IsString()
  @Length(2, 100)
  companyName!: string;

  @IsString()
  @Matches(E164_REGEX, { message: 'Phone number must be in E.164 format' })
  phone!: string;

  @IsOptional()
  @Matches(COMPANY_REG_REGEX, {
    message: 'Company registration number must match Companies House format (e.g. 12345678 or AB123456)'
  })
  companyRegistrationNumber?: string;
}
