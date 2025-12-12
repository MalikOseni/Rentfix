import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { Request } from 'express';

/**
 * Rate Limiting Guard
 * Token bucket algorithm for API rate limiting
 * Implements Adobe's security best practices
 */

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly redis: Redis;

  // Rate limit configuration (per IP address)
  private readonly WINDOW_SIZE_SECONDS = 60; // 1 minute
  private readonly MAX_REQUESTS = 100; // 100 requests per minute
  private readonly BURST_SIZE = 20; // Allow bursts of 20 requests

  // Stricter limits for matching endpoint (expensive operation)
  private readonly MATCHING_MAX_REQUESTS = 20; // 20 matches per minute
  private readonly MATCHING_BURST = 5; // Burst of 5

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use separate DB for rate limiting
      maxRetriesPerRequest: 1, // Fail fast
      commandTimeout: 1000, // 1 second timeout
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const identifier = this.getIdentifier(request);
    const endpoint = request.path;

    try {
      // Different limits for different endpoints
      const isMatchingEndpoint = endpoint.includes('/match');
      const limit = isMatchingEndpoint
        ? this.MATCHING_MAX_REQUESTS
        : this.MAX_REQUESTS;
      const burst = isMatchingEndpoint ? this.MATCHING_BURST : this.BURST_SIZE;

      const allowed = await this.checkRateLimit(identifier, endpoint, limit, burst);

      if (!allowed) {
        this.logger.warn(`Rate limit exceeded for ${identifier} on ${endpoint}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: this.WINDOW_SIZE_SECONDS,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // If Redis fails, allow request (fail open for availability)
      this.logger.error(`Rate limit check failed: ${error.message}`);
      return true;
    }
  }

  /**
   * Check rate limit using token bucket algorithm
   */
  private async checkRateLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    burstSize: number
  ): Promise<boolean> {
    const key = `ratelimit:${endpoint}:${identifier}`;
    const now = Date.now();

    // Use Redis Lua script for atomic operations
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local burst = tonumber(ARGV[4])

      -- Get current bucket state
      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or max_requests
      local last_refill = tonumber(bucket[2]) or now

      -- Calculate token refill
      local time_passed = now - last_refill
      local refill_rate = max_requests / (window * 1000) -- tokens per millisecond
      local tokens_to_add = math.floor(time_passed * refill_rate)

      tokens = math.min(tokens + tokens_to_add, max_requests)
      last_refill = now

      -- Check if request is allowed
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
        redis.call('EXPIRE', key, window)
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(
      script,
      1,
      key,
      now.toString(),
      this.WINDOW_SIZE_SECONDS.toString(),
      maxRequests.toString(),
      burstSize.toString()
    );

    return result === 1;
  }

  /**
   * Get identifier for rate limiting (IP address + user ID if authenticated)
   */
  private getIdentifier(request: Request): string {
    // Prefer authenticated user ID
    const userId = (request as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP address
    const ip =
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }

  /**
   * Get remaining quota for a user (for API response headers)
   */
  async getRemainingQuota(identifier: string, endpoint: string): Promise<number> {
    const key = `ratelimit:${endpoint}:${identifier}`;
    const bucket = await this.redis.hmget(key, 'tokens');
    return bucket[0] ? parseInt(bucket[0], 10) : this.MAX_REQUESTS;
  }
}
