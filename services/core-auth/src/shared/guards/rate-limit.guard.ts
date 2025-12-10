import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type RateLimitKey = 'login' | 'register' | 'verify-otp';

export const RATE_LIMIT_KEY = 'rateLimitKey';

const RATE_CONFIG: Record<RateLimitKey, { limit: number; windowMs: number }> = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  'verify-otp': { limit: 10, windowMs: 5 * 60 * 1000 }
};

interface Counter {
  count: number;
  first: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, Counter>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerKey = this.reflector.getAllAndOverride<RateLimitKey>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!handlerKey) {
      return true;
    }

    const config = RATE_CONFIG[handlerKey];
    const request = context.switchToHttp().getRequest();
    const identifier = `${handlerKey}:${request.ip ?? 'unknown'}`;
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry || now - entry.first > config.windowMs) {
      this.attempts.set(identifier, { count: 1, first: now });
      return true;
    }

    if (entry.count >= config.limit) {
      throw new HttpException('Too many attempts, try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
    this.attempts.set(identifier, entry);
    return true;
  }
}
