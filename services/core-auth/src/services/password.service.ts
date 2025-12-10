import argon2 from 'argon2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordService {
  async hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });
  }

  async verifyHash(raw: string, hashed: string): Promise<boolean> {
    return argon2.verify(hashed, raw, { type: argon2.argon2id });
  }
}
