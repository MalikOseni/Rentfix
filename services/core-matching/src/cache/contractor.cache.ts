import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ContractorProfile } from '@rentfix/types';
import { ContractorEntity } from '../entities/contractor.entity';

/**
 * Contractor Cache Service
 * Redis-based caching layer for high-performance contractor lookups
 * Implements cache-aside pattern with automatic invalidation
 *
 * Based on Uber's caching architecture and Google's SRE best practices
 */

@Injectable()
export class ContractorCache {
  private readonly logger = new Logger(ContractorCache.name);
  private readonly redis: Redis;

  // Cache TTL settings
  private readonly CONTRACTOR_TTL = 3600; // 1 hour
  private readonly SEARCH_RESULTS_TTL = 300; // 5 minutes
  private readonly AVAILABILITY_TTL = 60; // 1 minute (frequently changing)

  // Key prefixes
  private readonly PREFIX_CONTRACTOR = 'contractor:';
  private readonly PREFIX_SEARCH = 'search:';
  private readonly PREFIX_AVAILABILITY = 'availability:';
  private readonly PREFIX_STATS = 'stats:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),

      // Connection pool settings
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Exponential backoff
      },

      // Timeouts
      connectTimeout: 10000,
      commandTimeout: 5000,

      // Keep-alive
      keepAlive: 30000,

      // Enable offline queue
      enableOfflineQueue: true,

      // Reconnect on error
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors (Redis failover)
          return true;
        }
        return false;
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.log('✓ Redis connected');
    });

    this.redis.on('ready', () => {
      this.logger.log('✓ Redis ready');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...');
    });
  }

  /**
   * Get contractor by ID from cache
   */
  async getContractor(contractorId: string): Promise<ContractorProfile | null> {
    try {
      const key = this.PREFIX_CONTRACTOR + contractorId;
      const cached = await this.redis.get(key);

      if (cached) {
        this.logger.debug(`Cache hit: contractor ${contractorId}`);
        return JSON.parse(cached);
      }

      this.logger.debug(`Cache miss: contractor ${contractorId}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null; // Degrade gracefully
    }
  }

  /**
   * Set contractor in cache
   */
  async setContractor(
    contractorId: string,
    contractor: ContractorProfile
  ): Promise<void> {
    try {
      const key = this.PREFIX_CONTRACTOR + contractorId;
      await this.redis.setex(
        key,
        this.CONTRACTOR_TTL,
        JSON.stringify(contractor)
      );
      this.logger.debug(`Cached contractor ${contractorId}`);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Batch get contractors (uses Redis MGET for efficiency)
   */
  async getContractors(
    contractorIds: string[]
  ): Promise<Map<string, ContractorProfile>> {
    if (contractorIds.length === 0) {
      return new Map();
    }

    try {
      const keys = contractorIds.map((id) => this.PREFIX_CONTRACTOR + id);
      const results = await this.redis.mget(...keys);

      const contractorMap = new Map<string, ContractorProfile>();
      results.forEach((result, index) => {
        if (result) {
          const contractor = JSON.parse(result);
          contractorMap.set(contractorIds[index], contractor);
        }
      });

      this.logger.debug(
        `Batch cache: ${contractorMap.size}/${contractorIds.length} hits`
      );
      return contractorMap;
    } catch (error) {
      this.logger.error(`Batch cache get error: ${error.message}`);
      return new Map();
    }
  }

  /**
   * Cache search results (keyed by search parameters)
   */
  async cacheSearchResults(
    searchKey: string,
    contractorIds: string[]
  ): Promise<void> {
    try {
      const key = this.PREFIX_SEARCH + searchKey;
      await this.redis.setex(
        key,
        this.SEARCH_RESULTS_TTL,
        JSON.stringify(contractorIds)
      );
      this.logger.debug(`Cached search results for key: ${searchKey}`);
    } catch (error) {
      this.logger.error(`Search cache error: ${error.message}`);
    }
  }

  /**
   * Get cached search results
   */
  async getSearchResults(searchKey: string): Promise<string[] | null> {
    try {
      const key = this.PREFIX_SEARCH + searchKey;
      const cached = await this.redis.get(key);

      if (cached) {
        this.logger.debug(`Search cache hit: ${searchKey}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      this.logger.error(`Search cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate search cache key from parameters
   */
  generateSearchKey(params: {
    latitude: number;
    longitude: number;
    radius: number;
    specialty?: string;
    minRating?: number;
  }): string {
    // Round coordinates to 4 decimal places (~11m precision)
    const lat = params.latitude.toFixed(4);
    const lon = params.longitude.toFixed(4);
    const radius = params.radius;
    const specialty = params.specialty || 'any';
    const minRating = params.minRating || 0;

    return `${lat}:${lon}:${radius}:${specialty}:${minRating}`;
  }

  /**
   * Invalidate contractor cache (when data changes)
   */
  async invalidateContractor(contractorId: string): Promise<void> {
    try {
      const key = this.PREFIX_CONTRACTOR + contractorId;
      await this.redis.del(key);
      this.logger.debug(`Invalidated cache for contractor ${contractorId}`);
    } catch (error) {
      this.logger.error(`Cache invalidation error: ${error.message}`);
    }
  }

  /**
   * Invalidate all search results (when contractor data changes significantly)
   */
  async invalidateAllSearches(): Promise<void> {
    try {
      const pattern = this.PREFIX_SEARCH + '*';
      const keys = await this.scanKeys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Invalidated ${keys.length} search caches`);
      }
    } catch (error) {
      this.logger.error(`Search cache invalidation error: ${error.message}`);
    }
  }

  /**
   * Update availability status (hot path - very short TTL)
   */
  async setAvailability(
    contractorId: string,
    isAvailable: boolean
  ): Promise<void> {
    try {
      const key = this.PREFIX_AVAILABILITY + contractorId;
      await this.redis.setex(
        key,
        this.AVAILABILITY_TTL,
        isAvailable ? '1' : '0'
      );
    } catch (error) {
      this.logger.error(`Availability cache error: ${error.message}`);
    }
  }

  /**
   * Get availability status
   */
  async getAvailability(contractorId: string): Promise<boolean | null> {
    try {
      const key = this.PREFIX_AVAILABILITY + contractorId;
      const result = await this.redis.get(key);
      return result === '1' ? true : result === '0' ? false : null;
    } catch (error) {
      this.logger.error(`Availability get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache statistics (for monitoring dashboard)
   */
  async cacheStatistics(stats: Record<string, any>): Promise<void> {
    try {
      const key = this.PREFIX_STATS + 'global';
      await this.redis.setex(key, 60, JSON.stringify(stats));
    } catch (error) {
      this.logger.error(`Stats cache error: ${error.message}`);
    }
  }

  /**
   * Scan for keys matching pattern (for bulk operations)
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Get cache statistics (for monitoring)
   */
  async getCacheStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');

      // Parse Redis INFO output
      const parseInfo = (text: string, field: string): string => {
        const match = text.match(new RegExp(`${field}:(.+)`));
        return match ? match[1].trim() : '0';
      };

      const hits = parseInt(parseInfo(info, 'keyspace_hits'), 10);
      const misses = parseInt(parseInfo(info, 'keyspace_misses'), 10);
      const usedMemory = parseInfo(memory, 'used_memory_human');

      const dbInfo = await this.redis.info('keyspace');
      const keysMatch = dbInfo.match(/keys=(\d+)/);
      const keys = keysMatch ? parseInt(keysMatch[1], 10) : 0;

      return {
        connected: this.redis.status === 'ready',
        memory: usedMemory,
        keys,
        hits,
        misses,
      };
    } catch (error) {
      this.logger.error(`Cache stats error: ${error.message}`);
      return {
        connected: false,
        memory: '0B',
        keys: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
