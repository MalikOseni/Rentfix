/**
 * Contractor Matching Service (Production Version)
 * PostgreSQL + PostGIS + Redis integration
 * Enterprise-grade "Uber Algorithm" for contractor matching
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ContractorProfile,
  IssueTrade,
  MatchingRequest,
  MatchingResult,
  DEFAULT_SEARCH_RADIUS_MILES,
  DEFAULT_MAX_RESULTS,
  DEFAULT_SCORING_WEIGHTS,
} from '@rentfix/types';
import {
  filterContractors,
  rankContractors,
} from '../utils/ranking.utils';
import { ContractorRepository } from '../repositories/contractor.repository';
import { ContractorCache } from '../cache/contractor.cache';
import { ContractorEntity } from '../entities/contractor.entity';

@Injectable()
export class MatchingServiceProduction {
  private readonly logger = new Logger(MatchingServiceProduction.name);

  constructor(
    private readonly contractorRepository: ContractorRepository,
    private readonly contractorCache: ContractorCache
  ) {}

  /**
   * Find and rank contractors for a maintenance ticket
   * Main entry point - uses cache-aside pattern
   */
  async findMatchingContractors(
    request: MatchingRequest
  ): Promise<MatchingResult> {
    const startTime = Date.now();

    this.logger.log(
      `Finding contractors for ticket ${request.ticketId} (${request.trade})`
    );

    try {
      // Step 1: Check cache for search results
      const searchKey = this.contractorCache.generateSearchKey({
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        radius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        specialty: request.trade,
        minRating: request.filters?.minRating,
      });

      const cachedIds = await this.contractorCache.getSearchResults(searchKey);

      let candidates: ContractorProfile[];

      if (cachedIds) {
        this.logger.debug('Using cached search results');
        candidates = await this.getCachedContractors(cachedIds);
      } else {
        this.logger.debug('Cache miss - querying database');
        candidates = await this.getCandidateContractors(
          request.trade,
          request.location,
          request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES
        );

        // Cache search results (IDs only)
        const candidateIds = candidates.map((c) => c.id);
        await this.contractorCache.cacheSearchResults(searchKey, candidateIds);
      }

      this.logger.debug(`Found ${candidates.length} candidate contractors`);

      // Step 2: Apply additional filters
      const filteredCandidates = filterContractors(candidates, {
        minRating: request.filters?.minRating,
        maxHourlyRate: request.filters?.maxHourlyRate,
        requireInsurance: request.filters?.requireInsurance,
        requireBackgroundCheck: request.filters?.requireBackgroundCheck,
        availableOnly: true,
      });

      this.logger.debug(
        `${filteredCandidates.length} contractors after filtering`
      );

      // Step 3: Rank by match score
      const rankedContractors = rankContractors(
        filteredCandidates,
        request.location,
        DEFAULT_SCORING_WEIGHTS,
        request.maxResults || DEFAULT_MAX_RESULTS
      );

      const executionTime = Date.now() - startTime;

      this.logger.log(
        `Matched ${rankedContractors.length} contractors in ${executionTime}ms`
      );

      return {
        matches: rankedContractors,
        totalCandidates: candidates.length,
        searchRadius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        executionTimeMs: executionTime,
        usedFallback: false,
      };
    } catch (error) {
      this.logger.error('Matching failed, using fallback', error);
      return this.fallbackMatching(request, startTime);
    }
  }

  /**
   * Get candidate contractors from database (PostGIS query)
   */
  private async getCandidateContractors(
    trade: IssueTrade,
    location: { latitude: number; longitude: number },
    searchRadius: number
  ): Promise<ContractorProfile[]> {
    const entities = await this.contractorRepository.findWithinRadius(
      location.latitude,
      location.longitude,
      searchRadius,
      {
        specialties: [trade],
        limit: 50, // Limit for performance
      }
    );

    const profiles = entities.map((entity) =>
      this.entityToProfile(entity)
    );

    // Cache individual contractors
    await Promise.all(
      profiles.map((profile) =>
        this.contractorCache.setContractor(profile.id, profile)
      )
    );

    return profiles;
  }

  /**
   * Get contractors from cache (batch operation)
   */
  private async getCachedContractors(
    contractorIds: string[]
  ): Promise<ContractorProfile[]> {
    // Try to get from cache first
    const cachedMap = await this.contractorCache.getContractors(contractorIds);
    const cached = Array.from(cachedMap.values());

    // Find missing IDs
    const cachedIds = Array.from(cachedMap.keys());
    const missingIds = contractorIds.filter((id) => !cachedIds.includes(id));

    if (missingIds.length > 0) {
      this.logger.debug(`Cache miss for ${missingIds.length} contractors`);

      // Fetch missing from database
      const missingEntities = await this.contractorRepository.findByIds(
        missingIds
      );
      const missingProfiles = missingEntities.map((e) =>
        this.entityToProfile(e)
      );

      // Cache the missing ones
      await Promise.all(
        missingProfiles.map((profile) =>
          this.contractorCache.setContractor(profile.id, profile)
        )
      );

      return [...cached, ...missingProfiles];
    }

    return cached;
  }

  /**
   * Convert database entity to ContractorProfile
   */
  private entityToProfile(entity: ContractorEntity): ContractorProfile {
    return {
      id: entity.id,
      userId: entity.userId,
      businessName: entity.businessName,
      specialties: entity.specialties as IssueTrade[],
      hourlyRate: Number(entity.hourlyRate),
      location: {
        latitude: Number(entity.latitude),
        longitude: Number(entity.longitude),
        address: entity.address,
        serviceRadius: Number(entity.serviceRadius),
      },
      rating: Number(entity.averageRating),
      reliabilityScore: Number(entity.reliabilityScore),
      averageResponseTime: entity.averageResponseTime,
      totalJobsCompleted: entity.totalJobsCompleted,
      availability: {
        status: entity.availabilityStatus,
        currentJobs: entity.currentJobs,
        maxConcurrentJobs: entity.maxConcurrentJobs,
      },
      status: entity.status,
      backgroundCheckStatus: entity.backgroundCheckStatus,
      certifications: entity.certifications,
      insuranceVerified: entity.insuranceVerified,
    };
  }

  /**
   * Fallback matching when primary algorithm fails
   */
  private async fallbackMatching(
    request: MatchingRequest,
    startTime: number
  ): Promise<MatchingResult> {
    this.logger.warn('Executing fallback matching strategy');

    try {
      // Simple query: all available contractors within radius
      const entities = await this.contractorRepository.findAvailable({
        location: {
          latitude: request.location.latitude,
          longitude: request.location.longitude,
          radius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        },
      });

      const profiles = entities
        .map((e) => this.entityToProfile(e))
        .sort((a, b) => b.rating - a.rating) // Simple rating sort
        .slice(0, request.maxResults || DEFAULT_MAX_RESULTS);

      const executionTime = Date.now() - startTime;

      return {
        matches: profiles.map((contractor) => ({
          contractor,
          score: (contractor.rating / 5) * 100,
          scoreBreakdown: {
            ratingScore: contractor.rating * 20,
            distanceScore: 0,
            responseTimeScore: 0,
          },
          distance: 0,
          estimatedResponseTime: contractor.averageResponseTime,
        })),
        totalCandidates: entities.length,
        searchRadius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        executionTimeMs: executionTime,
        usedFallback: true,
        fallbackReason: 'Primary matching algorithm failed',
      };
    } catch (fallbackError) {
      this.logger.error('Fallback matching also failed', fallbackError);

      return {
        matches: [],
        totalCandidates: 0,
        searchRadius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        executionTimeMs: Date.now() - startTime,
        usedFallback: true,
        fallbackReason: 'Both primary and fallback matching failed',
      };
    }
  }

  /**
   * Get matching statistics (for monitoring)
   */
  async getStatistics(): Promise<{
    contractors: {
      total: number;
      available: number;
      busy: number;
      bySpecialty: Record<string, number>;
    };
    cache: {
      connected: boolean;
      memory: string;
      keys: number;
      hitRate: number;
    };
  }> {
    const contractorStats = await this.contractorRepository.getStatistics();
    const cacheStats = await this.contractorCache.getCacheStats();

    const hitRate =
      cacheStats.hits + cacheStats.misses > 0
        ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
        : 0;

    return {
      contractors: contractorStats,
      cache: {
        connected: cacheStats.connected,
        memory: cacheStats.memory,
        keys: cacheStats.keys,
        hitRate: Math.round(hitRate * 100) / 100,
      },
    };
  }

  /**
   * Invalidate cache for a contractor (when data changes)
   */
  async invalidateContractorCache(contractorId: string): Promise<void> {
    await this.contractorCache.invalidateContractor(contractorId);
    await this.contractorCache.invalidateAllSearches(); // Clear search caches
  }
}
