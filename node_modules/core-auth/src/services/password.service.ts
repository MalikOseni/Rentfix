import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordService {
  async hash(value: string): Promise<string> {
    return argon2.hash(value);
  }

  async verifyHash(raw: string, hashed: string): Promise<boolean> {
    return argon2.verify(hashed, raw);
  }
}
