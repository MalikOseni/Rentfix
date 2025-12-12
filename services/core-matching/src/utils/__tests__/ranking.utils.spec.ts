/**
 * Unit Tests for Ranking Utilities
 * Testing the "Secret Sauce" scoring algorithms
 */

import {
  calculateDistance,
  calculateRatingScore,
  calculateDistanceScore,
  calculateResponseTimeScore,
  calculateReliabilityBonus,
  calculateMatchScore,
  filterContractors,
  rankContractors,
} from '../ranking.utils';
import { ContractorProfile, IssueTrade, DEFAULT_SCORING_WEIGHTS } from '@rentfix/types';

describe('Ranking Utilities', () => {
  // ========================================================================
  // GEOSPATIAL CALCULATIONS
  // ========================================================================

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // New York to Los Angeles (approx 2451 miles)
      const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Two points ~1 mile apart in NYC
      const distance = calculateDistance(40.7128, -74.006, 40.7228, -74.006);
      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(1.5);
    });
  });

  // ========================================================================
  // SCORING ALGORITHMS
  // ========================================================================

  describe('calculateRatingScore', () => {
    it('should give full score for 5-star rating', () => {
      expect(calculateRatingScore(5)).toBe(40);
    });

    it('should give zero score for 0-star rating', () => {
      expect(calculateRatingScore(0)).toBe(0);
    });

    it('should give half score for 2.5-star rating', () => {
      expect(calculateRatingScore(2.5)).toBe(20);
    });

    it('should throw error for invalid ratings', () => {
      expect(() => calculateRatingScore(-1)).toThrow();
      expect(() => calculateRatingScore(6)).toThrow();
    });
  });

  describe('calculateDistanceScore', () => {
    it('should give maximum score for 0 distance', () => {
      expect(calculateDistanceScore(0)).toBe(30);
    });

    it('should give lower score for longer distance', () => {
      const score1 = calculateDistanceScore(1);
      const score5 = calculateDistanceScore(5);
      expect(score1).toBeGreaterThan(score5);
    });

    it('should give zero score beyond max distance', () => {
      expect(calculateDistanceScore(10, 5)).toBe(0);
    });

    it('should throw error for negative distance', () => {
      expect(() => calculateDistanceScore(-1)).toThrow();
    });

    it('should use exponential decay', () => {
      // Verify exponential decay behavior
      const score0 = calculateDistanceScore(0);
      const score1 = calculateDistanceScore(1);
      const score2 = calculateDistanceScore(2);

      expect(score0 - score1).toBeGreaterThan(score1 - score2);
    });
  });

  describe('calculateResponseTimeScore', () => {
    it('should give high score for fast response (5 min)', () => {
      const score = calculateResponseTimeScore(5);
      expect(score).toBeGreaterThan(25);
    });

    it('should give low score for slow response (60 min)', () => {
      const score = calculateResponseTimeScore(60);
      expect(score).toBeLessThan(5);
    });

    it('should prefer faster contractors', () => {
      const fast = calculateResponseTimeScore(10);
      const slow = calculateResponseTimeScore(30);
      expect(fast).toBeGreaterThan(slow);
    });

    it('should throw error for negative time', () => {
      expect(() => calculateResponseTimeScore(-5)).toThrow();
    });
  });

  describe('calculateReliabilityBonus', () => {
    it('should give no bonus for new contractors (<10 jobs)', () => {
      expect(calculateReliabilityBonus(1.0, 5)).toBe(0);
      expect(calculateReliabilityBonus(1.0, 9)).toBe(0);
    });

    it('should give full bonus for perfect reliability with 50+ jobs', () => {
      expect(calculateReliabilityBonus(1.0, 50)).toBe(10);
      expect(calculateReliabilityBonus(1.0, 100)).toBe(10);
    });

    it('should scale bonus with experience', () => {
      const bonus10 = calculateReliabilityBonus(1.0, 10);
      const bonus25 = calculateReliabilityBonus(1.0, 25);
      const bonus50 = calculateReliabilityBonus(1.0, 50);

      expect(bonus25).toBeGreaterThan(bonus10);
      expect(bonus50).toBeGreaterThan(bonus25);
    });

    it('should scale bonus with reliability score', () => {
      const perfect = calculateReliabilityBonus(1.0, 50);
      const good = calculateReliabilityBonus(0.9, 50);
      const average = calculateReliabilityBonus(0.7, 50);

      expect(perfect).toBeGreaterThan(good);
      expect(good).toBeGreaterThan(average);
    });

    it('should throw error for invalid reliability score', () => {
      expect(() => calculateReliabilityBonus(-0.1, 50)).toThrow();
      expect(() => calculateReliabilityBonus(1.1, 50)).toThrow();
    });
  });

  // ========================================================================
  // MASTER SCORING FUNCTION
  // ========================================================================

  describe('calculateMatchScore', () => {
    const mockContractor: ContractorProfile = {
      id: '1',
      userId: 'user-1',
      businessName: 'Test Contractor',
      specialties: [IssueTrade.PLUMBING],
      hourlyRate: 85,
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        serviceRadius: 10,
      },
      rating: 4.5,
      reliabilityScore: 0.9,
      averageResponseTime: 15,
      totalJobsCompleted: 50,
      availability: {
        status: 'available',
        currentJobs: 1,
        maxConcurrentJobs: 3,
      },
      status: 'verified',
      backgroundCheckStatus: 'passed',
    };

    const ticketLocation = {
      latitude: 40.7228,
      longitude: -74.006,
    };

    it('should calculate overall match score', () => {
      const result = calculateMatchScore(mockContractor, ticketLocation);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown.ratingScore).toBeDefined();
      expect(result.breakdown.distanceScore).toBeDefined();
      expect(result.breakdown.responseTimeScore).toBeDefined();
    });

    it('should include reliability bonus for experienced contractors', () => {
      const result = calculateMatchScore(mockContractor, ticketLocation);

      expect(result.breakdown.reliabilityBonus).toBeDefined();
      expect(result.breakdown.reliabilityBonus).toBeGreaterThan(0);
    });

    it('should respect custom weights', () => {
      const customWeights = {
        rating: 0.5,
        distance: 0.3,
        responseTime: 0.2,
      };

      const result = calculateMatchScore(
        mockContractor,
        ticketLocation,
        customWeights
      );

      expect(result.score).toBeGreaterThan(0);
    });

    it('should throw error for invalid weights', () => {
      const invalidWeights = {
        rating: 0.5,
        distance: 0.3,
        responseTime: 0.1, // Sum = 0.9, should be 1.0
      };

      expect(() =>
        calculateMatchScore(mockContractor, ticketLocation, invalidWeights)
      ).toThrow();
    });

    it('should cap score at 100', () => {
      // Create a perfect contractor
      const perfectContractor: ContractorProfile = {
        ...mockContractor,
        rating: 5,
        reliabilityScore: 1.0,
        averageResponseTime: 1,
        totalJobsCompleted: 100,
        location: {
          ...mockContractor.location,
          latitude: ticketLocation.latitude,
          longitude: ticketLocation.longitude,
        },
      };

      const result = calculateMatchScore(perfectContractor, ticketLocation);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ========================================================================
  // FILTERING
  // ========================================================================

  describe('filterContractors', () => {
    const mockContractors: ContractorProfile[] = [
      {
        id: '1',
        userId: 'user-1',
        businessName: 'High Rating',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 85,
        location: { latitude: 40.7128, longitude: -74.006, serviceRadius: 10 },
        rating: 4.8,
        reliabilityScore: 0.9,
        averageResponseTime: 15,
        totalJobsCompleted: 50,
        availability: {
          status: 'available',
          currentJobs: 1,
          maxConcurrentJobs: 3,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        insuranceVerified: true,
      },
      {
        id: '2',
        userId: 'user-2',
        businessName: 'Low Rating',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 65,
        location: { latitude: 40.7128, longitude: -74.006, serviceRadius: 10 },
        rating: 3.5,
        reliabilityScore: 0.8,
        averageResponseTime: 20,
        totalJobsCompleted: 30,
        availability: {
          status: 'available',
          currentJobs: 0,
          maxConcurrentJobs: 2,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        insuranceVerified: false,
      },
      {
        id: '3',
        userId: 'user-3',
        businessName: 'Expensive',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 150,
        location: { latitude: 40.7128, longitude: -74.006, serviceRadius: 10 },
        rating: 5.0,
        reliabilityScore: 1.0,
        averageResponseTime: 10,
        totalJobsCompleted: 100,
        availability: {
          status: 'busy',
          currentJobs: 3,
          maxConcurrentJobs: 3,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
        insuranceVerified: true,
      },
    ];

    it('should filter by minimum rating', () => {
      const filtered = filterContractors(mockContractors, { minRating: 4.5 });
      expect(filtered.length).toBe(2);
      expect(filtered.every((c) => c.rating >= 4.5)).toBe(true);
    });

    it('should filter by max hourly rate', () => {
      const filtered = filterContractors(mockContractors, {
        maxHourlyRate: 100,
      });
      expect(filtered.length).toBe(2);
      expect(filtered.every((c) => c.hourlyRate <= 100)).toBe(true);
    });

    it('should filter by insurance requirement', () => {
      const filtered = filterContractors(mockContractors, {
        requireInsurance: true,
      });
      expect(filtered.length).toBe(2);
      expect(filtered.every((c) => c.insuranceVerified === true)).toBe(true);
    });

    it('should filter by availability', () => {
      const filtered = filterContractors(mockContractors, {
        availableOnly: true,
      });
      expect(filtered.length).toBe(2);
      expect(
        filtered.every((c) => c.availability.status === 'available')
      ).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filtered = filterContractors(mockContractors, {
        minRating: 4.5,
        requireInsurance: true,
        availableOnly: true,
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  // ========================================================================
  // RANKING
  // ========================================================================

  describe('rankContractors', () => {
    const mockContractors: ContractorProfile[] = [
      {
        id: '1',
        userId: 'user-1',
        businessName: 'Far but Great',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 85,
        location: { latitude: 40.7128, longitude: -74.006, serviceRadius: 10 },
        rating: 5.0,
        reliabilityScore: 1.0,
        averageResponseTime: 10,
        totalJobsCompleted: 100,
        availability: {
          status: 'available',
          currentJobs: 0,
          maxConcurrentJobs: 3,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
      },
      {
        id: '2',
        userId: 'user-2',
        businessName: 'Close but Average',
        specialties: [IssueTrade.PLUMBING],
        hourlyRate: 65,
        location: { latitude: 40.7138, longitude: -74.006, serviceRadius: 10 },
        rating: 3.5,
        reliabilityScore: 0.8,
        averageResponseTime: 20,
        totalJobsCompleted: 30,
        availability: {
          status: 'available',
          currentJobs: 0,
          maxConcurrentJobs: 2,
        },
        status: 'verified',
        backgroundCheckStatus: 'passed',
      },
    ];

    const ticketLocation = { latitude: 40.7128, longitude: -74.006 };

    it('should rank contractors by score', () => {
      const ranked = rankContractors(mockContractors, ticketLocation);

      expect(ranked.length).toBe(2);
      expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    });

    it('should include distance and estimated times', () => {
      const ranked = rankContractors(mockContractors, ticketLocation);

      expect(ranked[0].distance).toBeDefined();
      expect(ranked[0].estimatedResponseTime).toBeDefined();
      expect(ranked[0].estimatedArrivalTime).toBeInstanceOf(Date);
    });

    it('should respect maxResults parameter', () => {
      const ranked = rankContractors(mockContractors, ticketLocation, undefined, 1);
      expect(ranked.length).toBe(1);
    });

    it('should include score breakdown', () => {
      const ranked = rankContractors(mockContractors, ticketLocation);

      expect(ranked[0].scoreBreakdown.ratingScore).toBeDefined();
      expect(ranked[0].scoreBreakdown.distanceScore).toBeDefined();
      expect(ranked[0].scoreBreakdown.responseTimeScore).toBeDefined();
    });
  });
});
