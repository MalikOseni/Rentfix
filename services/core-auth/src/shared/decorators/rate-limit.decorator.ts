import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY, RateLimitKey } from '../guards/rate-limit.guard';

export const RateLimit = (key: RateLimitKey) => SetMetadata(RATE_LIMIT_KEY, key);
