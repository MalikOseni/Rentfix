import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @MinLength(14)
  password!: string;
}
