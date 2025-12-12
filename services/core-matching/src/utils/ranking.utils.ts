/**
 * Ranking Utilities for Contractor Matching Engine
 * The "Secret Sauce" - Weighted scoring algorithm
 */

import {
  ContractorProfile,
  ScoredContractor,
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
} from '@rentfix/types';

// ============================================================================
// GEOSPATIAL CALCULATIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if contractor is within service radius
 */
export function isWithinServiceArea(
  contractorLat: number,
  contractorLon: number,
  contractorRadius: number,
  targetLat: number,
  targetLon: number
): boolean {
  const distance = calculateDistance(
    contractorLat,
    contractorLon,
    targetLat,
    targetLon
  );
  return distance <= contractorRadius;
}

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate rating score (0-40 points)
 * Rating ranges from 0-5, normalized to 40 points
 */
export function calculateRatingScore(rating: number): number {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  return (rating / 5) * 40;
}

/**
 * Calculate distance score (0-30 points)
 * Closer contractors get higher scores
 * Uses exponential decay: closer = much better
 */
export function calculateDistanceScore(
  distance: number,
  maxDistance: number = 5
): number {
  if (distance < 0) {
    throw new Error('Distance cannot be negative');
  }

  // If beyond max distance, return 0
  if (distance > maxDistance) {
    return 0;
  }

  // Exponential decay formula: 30 * e^(-distance/2)
  // 0 miles = 30 points
  // 1 mile = ~27 points
  // 2 miles = ~22 points
  // 5 miles = ~7 points
  const score = 30 * Math.exp(-distance / 2);

  return Math.round(score * 100) / 100;
}

/**
 * Calculate response time score (0-30 points)
 * Faster contractors get higher scores
 */
export function calculateResponseTimeScore(
  avgResponseTimeMinutes: number
): number {
  if (avgResponseTimeMinutes < 0) {
    throw new Error('Response time cannot be negative');
  }

  // Exponential decay: faster = much better
  // 5 min = 30 points
  // 15 min = ~20 points
  // 30 min = ~10 points
  // 60 min = ~3 points
  const score = 30 * Math.exp(-avgResponseTimeMinutes / 20);

  return Math.round(score * 100) / 100;
}

/**
 * Calculate reliability bonus (0-10 points)
 * Boosts score for highly reliable contractors
 */
export function calculateReliabilityBonus(
  reliabilityScore: number,
  totalJobsCompleted: number
): number {
  if (reliabilityScore < 0 || reliabilityScore > 1) {
    throw new Error('Reliability score must be between 0 and 1');
  }

  // Bonus only applies if contractor has completed at least 10 jobs
  if (totalJobsCompleted < 10) {
    return 0;
  }

  // Perfect reliability (1.0) with 50+ jobs = 10 bonus points
  // 0.9 reliability with 50+ jobs = 9 bonus points
  const experienceMultiplier = Math.min(totalJobsCompleted / 50, 1);
  return reliabilityScore * 10 * experienceMultiplier;
}

// ============================================================================
// MASTER SCORING FUNCTION
// ============================================================================

/**
 * Calculate overall match score for a contractor
 * The "Uber Algorithm" - Returns 0-100 score
 */
export function calculateMatchScore(
  contractor: ContractorProfile,
  ticketLocation: { latitude: number; longitude: number },
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): {
  score: number;
  breakdown: {
    ratingScore: number;
    distanceScore: number;
    responseTimeScore: number;
    reliabilityBonus?: number;
  };
  distance: number;
} {
  // Validate weights sum to ~1.0
  const weightSum = weights.rating + weights.distance + weights.responseTime;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error('Scoring weights must sum to 1.0');
  }

  // Calculate distance
  const distance = calculateDistance(
    contractor.location.latitude,
    contractor.location.longitude,
    ticketLocation.latitude,
    ticketLocation.longitude
  );

  // Calculate individual scores
  const ratingScore = calculateRatingScore(contractor.rating);
  const distanceScore = calculateDistanceScore(distance);
  const responseTimeScore = calculateResponseTimeScore(
    contractor.averageResponseTime
  );

  // Apply weights
  const weightedScore =
    ratingScore * weights.rating +
    distanceScore * weights.distance +
    responseTimeScore * weights.responseTime;

  // Calculate reliability bonus
  const reliabilityBonus = calculateReliabilityBonus(
    contractor.reliabilityScore,
    contractor.totalJobsCompleted
  );

  // Final score (max 110 due to bonus, but capped at 100)
  const finalScore = Math.min(weightedScore + reliabilityBonus, 100);

  return {
    score: Math.round(finalScore * 100) / 100,
    breakdown: {
      ratingScore: Math.round(ratingScore * weights.rating * 100) / 100,
      distanceScore: Math.round(distanceScore * weights.distance * 100) / 100,
      responseTimeScore:
        Math.round(responseTimeScore * weights.responseTime * 100) / 100,
      reliabilityBonus:
        reliabilityBonus > 0
          ? Math.round(reliabilityBonus * 100) / 100
          : undefined,
    },
    distance,
  };
}

/**
 * Estimate contractor arrival time based on distance and historical data
 */
export function estimateArrivalTime(
  distance: number,
  avgResponseTimeMinutes: number
): Date {
  // Assume 30 mph average speed in urban areas
  const travelTimeMinutes = (distance / 30) * 60;
  const totalMinutes = avgResponseTimeMinutes + travelTimeMinutes;

  const arrivalTime = new Date();
  arrivalTime.setMinutes(arrivalTime.getMinutes() + totalMinutes);

  return arrivalTime;
}

// ============================================================================
// FILTERING & RANKING
// ============================================================================

/**
 * Filter contractors based on criteria
 */
export function filterContractors(
  contractors: ContractorProfile[],
  filters: {
    minRating?: number;
    maxHourlyRate?: number;
    requireInsurance?: boolean;
    requireBackgroundCheck?: boolean;
    availableOnly?: boolean;
  }
): ContractorProfile[] {
  return contractors.filter((contractor) => {
    // Rating filter
    if (filters.minRating && contractor.rating < filters.minRating) {
      return false;
    }

    // Hourly rate filter
    if (filters.maxHourlyRate && contractor.hourlyRate > filters.maxHourlyRate) {
      return false;
    }

    // Insurance filter
    if (filters.requireInsurance && !contractor.insuranceVerified) {
      return false;
    }

    // Background check filter
    if (
      filters.requireBackgroundCheck &&
      contractor.backgroundCheckStatus !== 'passed'
    ) {
      return false;
    }

    // Availability filter
    if (
      filters.availableOnly &&
      contractor.availability.status !== 'available'
    ) {
      return false;
    }

    // Verified status (always required)
    if (contractor.status !== 'verified') {
      return false;
    }

    return true;
  });
}

/**
 * Rank contractors by match score
 */
export function rankContractors(
  contractors: ContractorProfile[],
  ticketLocation: { latitude: number; longitude: number },
  weights?: ScoringWeights,
  maxResults: number = 10
): ScoredContractor[] {
  const scoredContractors: ScoredContractor[] = contractors.map(
    (contractor) => {
      const { score, breakdown, distance } = calculateMatchScore(
        contractor,
        ticketLocation,
        weights
      );

      return {
        contractor,
        score,
        scoreBreakdown: breakdown,
        distance,
        estimatedResponseTime: contractor.averageResponseTime,
        estimatedArrivalTime: estimateArrivalTime(
          distance,
          contractor.averageResponseTime
        ),
      };
    }
  );

  // Sort by score descending
  scoredContractors.sort((a, b) => b.score - a.score);

  // Return top N results
  return scoredContractors.slice(0, maxResults);
}
