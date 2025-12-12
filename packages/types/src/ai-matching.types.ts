/**
 * AI & Matching Engine Type Definitions
 * Shared across worker-ai and core-matching services
 */

// ============================================================================
// AI VISION TYPES
// ============================================================================

export enum IssueTrade {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  STRUCTURAL = 'structural',
  PEST_CONTROL = 'pest_control',
  APPLIANCE = 'appliance',
  COSMETIC = 'cosmetic',
  GENERAL_MAINTENANCE = 'general_maintenance',
  UNKNOWN = 'unknown',
}

export enum IssueSeverity {
  CRITICAL = 'critical',   // Immediate danger (gas leak, flooding)
  HIGH = 'high',           // Urgent repair needed (no heat, major leak)
  MEDIUM = 'medium',       // Should fix soon (minor leak, cosmetic damage)
  LOW = 'low',             // Can wait (paint touch-up, squeaky door)
}

export interface AIClassificationResult {
  /** Primary issue category detected */
  issueType: string;

  /** Trade/specialty required */
  trade: IssueTrade;

  /** Severity assessment */
  severity: IssueSeverity;

  /** AI confidence score (0.0 - 1.0) */
  confidence: number;

  /** Alternative classifications with lower confidence */
  alternatives?: Array<{
    issueType: string;
    trade: IssueTrade;
    confidence: number;
  }>;

  /** Extracted metadata from image analysis */
  metadata: {
    /** Detected objects in image */
    detectedObjects: string[];

    /** Estimated urgency in hours */
    estimatedUrgencyHours?: number;

    /** Safety concerns identified */
    safetyConcerns?: string[];

    /** Suggested tools/materials */
    suggestedMaterials?: string[];
  };

  /** Raw response from AI provider */
  rawResponse?: unknown;

  /** Timestamp of classification */
  classifiedAt: Date;
}

export interface ImageAnalysisRequest {
  /** Base64 encoded image or URL */
  imageUrl: string;

  /** Optional context from tenant */
  tenantDescription?: string;

  /** Property location (helps with context) */
  propertyType?: 'residential' | 'commercial' | 'industrial';

  /** Ticket ID for tracking */
  ticketId: string;
}

// ============================================================================
// CONTRACTOR MATCHING TYPES
// ============================================================================

export interface ContractorProfile {
  id: string;
  userId: string;
  businessName: string;
  specialties: IssueTrade[];
  hourlyRate: number;

  /** Location data */
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    serviceRadius: number; // in miles
  };

  /** Performance metrics */
  rating: number;          // 0-5 stars
  reliabilityScore: number; // 0-1 (historical completion rate)
  averageResponseTime: number; // in minutes
  totalJobsCompleted: number;

  /** Availability */
  availability: {
    status: 'available' | 'unavailable' | 'on_leave' | 'busy';
    currentJobs: number;
    maxConcurrentJobs: number;
  };

  /** Verification status */
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  backgroundCheckStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';

  /** Optional metadata */
  certifications?: string[];
  insuranceVerified?: boolean;
}

export interface MatchingRequest {
  /** Ticket details */
  ticketId: string;
  issueType: string;
  trade: IssueTrade;
  severity: IssueSeverity;

  /** Location */
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  /** Search parameters */
  searchRadius?: number; // default 5 miles
  maxResults?: number;   // default 10

  /** Optional filters */
  filters?: {
    minRating?: number;
    maxHourlyRate?: number;
    requireInsurance?: boolean;
    requireBackgroundCheck?: boolean;
  };
}

export interface ScoredContractor {
  contractor: ContractorProfile;

  /** Overall match score (0-100) */
  score: number;

  /** Score breakdown for transparency */
  scoreBreakdown: {
    ratingScore: number;      // 0-40 points
    distanceScore: number;    // 0-30 points
    responseTimeScore: number; // 0-30 points
  };

  /** Additional context */
  distance: number; // in miles
  estimatedResponseTime: number; // in minutes
  estimatedArrivalTime?: Date;
}

export interface MatchingResult {
  /** Ranked list of contractors */
  matches: ScoredContractor[];

  /** Metadata */
  totalCandidates: number;
  searchRadius: number;
  executionTimeMs: number;

  /** Whether fallback was used */
  usedFallback: boolean;
  fallbackReason?: string;
}

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

export interface ScoringWeights {
  /** Weight for contractor rating (default 0.4) */
  rating: number;

  /** Weight for distance (default 0.3) */
  distance: number;

  /** Weight for response time (default 0.3) */
  responseTime: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  rating: 0.4,
  distance: 0.3,
  responseTime: 0.3,
};

export const DEFAULT_SEARCH_RADIUS_MILES = 5;
export const DEFAULT_MAX_RESULTS = 10;
export const AI_CONFIDENCE_THRESHOLD = 0.7; // Below this, flag for human review

// ============================================================================
// JOB QUEUE TYPES
// ============================================================================

export interface AIJobPayload {
  ticketId: string;
  imageUrl: string;
  tenantDescription?: string;
  propertyType?: 'residential' | 'commercial' | 'industrial';
}

export interface MatchingJobPayload {
  ticketId: string;
  trade: IssueTrade;
  severity: IssueSeverity;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
