import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_COMPLEXITY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{14,}$/;

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(14)
  @Matches(PASSWORD_COMPLEXITY, {
    message: 'Password must be at least 14 characters long and include upper, lower, number, and special character'
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}
