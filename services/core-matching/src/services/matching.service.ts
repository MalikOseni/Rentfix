/**
 * Contractor Matching Service
 * The "Uber Algorithm" for matching contractors to maintenance tickets
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ContractorProfile,
  IssueTrade,
  MatchingRequest,
  MatchingResult,
  ScoredContractor,
  DEFAULT_SEARCH_RADIUS_MILES,
  DEFAULT_MAX_RESULTS,
  DEFAULT_SCORING_WEIGHTS,
} from '@rentfix/types';
import {
  calculateDistance,
  filterContractors,
  rankContractors,
} from '../utils/ranking.utils';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    // TODO: Inject PostgreSQL repository when ready
    // private readonly contractorRepository: ContractorRepository
  ) {}

  /**
   * Find and rank contractors for a maintenance ticket
   * Main entry point for the matching algorithm
   */
  async findMatchingContractors(
    request: MatchingRequest
  ): Promise<MatchingResult> {
    const startTime = Date.now();

    this.logger.log(
      `Finding contractors for ticket ${request.ticketId} (${request.trade})`
    );

    try {
      // Step 1: Get all contractors with matching specialty
      const candidates = await this.getCandidateContractors(
        request.trade,
        request.location,
        request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES
      );

      this.logger.debug(`Found ${candidates.length} candidate contractors`);

      // Step 2: Apply filters
      const filteredCandidates = filterContractors(candidates, {
        minRating: request.filters?.minRating,
        maxHourlyRate: request.filters?.maxHourlyRate,
        requireInsurance: request.filters?.requireInsurance,
        requireBackgroundCheck: request.filters?.requireBackgroundCheck,
        availableOnly: true, // Always filter for available contractors
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

      // Fallback: Return all contractors within radius
      return this.fallbackMatching(request, startTime);
    }
  }

  /**
   * Get candidate contractors from database
   * Filters by specialty and location
   */
  private async getCandidateContractors(
    trade: IssueTrade,
    location: { latitude: number; longitude: number },
    searchRadius: number
  ): Promise<ContractorProfile[]> {
    // TODO: Replace with real database query
    // For now, return mock data for testing
    this.logger.warn('Using mock contractor data - replace with DB query');

    const mockContractors = this.getMockContractors();

    // Filter by specialty
    const specialtyMatches = mockContractors.filter((contractor) =>
      contractor.specialties.includes(trade)
    );

    // Filter by location (within service area)
    const locationMatches = specialtyMatches.filter((contractor) => {
      const distance = calculateDistance(
        contractor.location.latitude,
        contractor.location.longitude,
        location.latitude,
        location.longitude
      );

      return (
        distance <= searchRadius &&
        distance <= contractor.location.serviceRadius
      );
    });

    return locationMatches;

    /*
    // PRODUCTION CODE (uncomment when DB is ready):

    return this.contractorRepository.find({
      where: {
        specialties: {
          contains: trade,
        },
        status: 'verified',
        availability: {
          status: 'available',
        },
      },
      // Use PostGIS for geospatial query
      andWhere: `
        ST_DWithin(
          location_point,
          ST_MakePoint(:longitude, :latitude)::geography,
          :radiusMeters
        )
      `,
      parameters: {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: searchRadius * 1609.34, // miles to meters
      },
    });
    */
  }

  /**
   * Fallback matching when primary algorithm fails
   * Returns all verified contractors within radius, sorted by rating
   */
  private async fallbackMatching(
    request: MatchingRequest,
    startTime: number
  ): Promise<MatchingResult> {
    this.logger.warn('Executing fallback matching strategy');

    try {
      // Get all verified contractors within radius (no specialty filter)
      const allContractors = await this.getAllContractorsInRadius(
        request.location,
        request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES
      );

      // Simple ranking by rating only
      const sortedByRating = allContractors
        .filter((c) => c.status === 'verified')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, request.maxResults || DEFAULT_MAX_RESULTS);

      // Convert to ScoredContractor format
      const matches: ScoredContractor[] = sortedByRating.map((contractor) => {
        const distance = calculateDistance(
          contractor.location.latitude,
          contractor.location.longitude,
          request.location.latitude,
          request.location.longitude
        );

        return {
          contractor,
          score: (contractor.rating / 5) * 100, // Simple rating-only score
          scoreBreakdown: {
            ratingScore: contractor.rating * 20,
            distanceScore: 0,
            responseTimeScore: 0,
          },
          distance,
          estimatedResponseTime: contractor.averageResponseTime,
        };
      });

      const executionTime = Date.now() - startTime;

      return {
        matches,
        totalCandidates: allContractors.length,
        searchRadius: request.searchRadius || DEFAULT_SEARCH_RADIUS_MILES,
        executionTimeMs: executionTime,
        usedFallback: true,
        fallbackReason: 'Primary matching algorithm failed',
      };
    } catch (fallbackError) {
      this.logger.error('Fallback matching also failed', fallbackError);

      // Ultimate fallback: return empty result
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
   * Get all contractors within radius (no filters)
   */
  private async getAllContractorsInRadius(
    location: { latitude: number; longitude: number },
    radiusMiles: number
  ): Promise<ContractorProfile[]> {
    // TODO: Replace with real database query
    const mockContractors = this.getMockContractors();

    return mockContractors.filter((contractor) => {
      const distance = calculateDistance(
        contractor.location.latitude,
        contractor.location.longitude,
        location.latitude,
        location.longitude
      );
      return distance <= radiusMiles;
    });
  }

  /**
   * Mock contractor data for testing
   * TODO: Remove once database integration is complete
   */
  private getMockContractors(): ContractorProfile[] {
    return [
      {
        id: '1',
        userId: 'user-1',
        businessName: 'Quick Plumbing Pro',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 85,
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          address: '123 Main St, New York, NY',
          serviceRadius: 10,
        },
        rating: 4.8,
        reliabilityScore: 0.95,
        averageResponseTime: 15,
        totalJobsCompleted: 127,
        availability: {
          status: 'available',
          currentJobs: 1,
          maxConcurrentJobs: 3,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        certifications: ['Master Plumber License', 'EPA 608'],
        insuranceVerified: true,
      },
      {
        id: '2',
        userId: 'user-2',
        businessName: 'Elite Electrical Services',
        specialties: [IssueTrade.ELECTRICAL, IssueTrade.APPLIANCE],
        hourlyRate: 95,
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: '456 Broadway, New York, NY',
          serviceRadius: 15,
        },
        rating: 4.9,
        reliabilityScore: 0.98,
        averageResponseTime: 12,
        totalJobsCompleted: 203,
        availability: {
          status: 'available',
          currentJobs: 0,
          maxConcurrentJobs: 4,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        certifications: ['Licensed Electrician', 'OSHA Certified'],
        insuranceVerified: true,
      },
      {
        id: '3',
        userId: 'user-3',
        businessName: 'HVAC Heroes',
        specialties: [IssueTrade.HVAC],
        hourlyRate: 110,
        location: {
          latitude: 40.7305,
          longitude: -73.9893,
          address: '789 Park Ave, New York, NY',
          serviceRadius: 8,
        },
        rating: 4.7,
        reliabilityScore: 0.92,
        averageResponseTime: 20,
        totalJobsCompleted: 85,
        availability: {
          status: 'available',
          currentJobs: 2,
          maxConcurrentJobs: 3,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        certifications: ['NATE Certified', 'EPA Universal'],
        insuranceVerified: true,
      },
    ];
  }
}
