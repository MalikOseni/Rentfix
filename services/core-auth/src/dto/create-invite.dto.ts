import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const E164_REGEX = /^\+?[1-9]\d{7,14}$/;

export class CreateInviteDto {
  @IsNotEmpty()
  @IsString()
  agentId!: string;

  @IsNotEmpty()
  @IsString()
  propertyId!: string;

  @IsEmail()
  tenantEmail!: string;

  @IsOptional()
  @Matches(E164_REGEX, { message: 'Phone number must be in E.164 format' })
  tenantPhone?: string;
}
