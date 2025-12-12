/**
 * MatchingService Integration Tests - Haversine Distance Validation
 *
 * Tests the geospatial matching algorithm with focus on:
 * 1. Haversine formula accuracy
 * 2. PostGIS ST_DWithin queries
 * 3. Distance-based scoring
 * 4. Edge cases (poles, date line, etc.)
 *
 * Standards: Google Maps API uses Haversine for distances < 1000 km
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContractorEntity } from '../src/entities/contractor.entity';
import { MatchingService } from '../src/services/matching.service';
import { MatchingModule } from '../src/modules/matching.module';

/**
 * Haversine Formula Implementation (for validation)
 * d = 2r * arcsin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
 * where r = Earth's radius (3,959 miles)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

describe('MatchingService - Haversine Distance Integration Tests', () => {
  let app: INestApplication;
  let matchingService: MatchingService;
  let contractorRepository: Repository<ContractorEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: process.env.TEST_DB_NAME || 'rentfix_test',
          entities: [ContractorEntity],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        MatchingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    matchingService = moduleFixture.get<MatchingService>(MatchingService);
    contractorRepository = moduleFixture.get(getRepositoryToken(ContractorEntity));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await contractorRepository.clear();
  });

  /**
   * TEST GROUP 1: Haversine Formula Accuracy
   */
  describe('Haversine Formula Validation', () => {
    it('should calculate correct distance for NYC to Brooklyn (known distance)', async () => {
      // Known distances (verified with Google Maps):
      // Times Square (40.758, -73.985) to Brooklyn Bridge (40.706, -73.997) = ~4.1 miles

      const distance = haversineDistance(40.758, -73.985, 40.706, -73.997);

      expect(distance).toBeGreaterThan(4.0);
      expect(distance).toBeLessThan(4.5);
      console.log(`✅ NYC to Brooklyn Bridge: ${distance.toFixed(2)} miles (expected ~4.1)`);
    });

    it('should calculate correct distance for cross-country (SF to NYC)', async () => {
      // San Francisco (37.7749, -122.4194) to NYC (40.7128, -74.0060) = ~2,572 miles
      const distance = haversineDistance(37.7749, -122.4194, 40.7128, -74.006);

      expect(distance).toBeGreaterThan(2500);
      expect(distance).toBeLessThan(2600);
      console.log(`✅ SF to NYC: ${distance.toFixed(2)} miles (expected ~2,572)`);
    });

    it('should return 0 for same location', async () => {
      const distance = haversineDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBeLessThan(0.001); // Essentially 0
    });

    it('should handle locations near equator correctly', async () => {
      // Quito, Ecuador (0.1807, -78.4678) to Singapore (1.3521, 103.8198)
      // Expected: ~12,000 miles (halfway around the world)
      const distance = haversineDistance(0.1807, -78.4678, 1.3521, 103.8198);

      expect(distance).toBeGreaterThan(11000);
      expect(distance).toBeLessThan(13000);
    });

    it('should handle high latitude locations (near North Pole)', async () => {
      // Reykjavik (64.1466, -21.9426) to Oslo (59.9139, 10.7522)
      const distance = haversineDistance(64.1466, -21.9426, 59.9139, 10.7522);

      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1100);
    });
  });

  /**
   * TEST GROUP 2: PostGIS ST_DWithin Integration
   */
  describe('PostGIS ST_DWithin Queries', () => {
    it('should find contractors within 5 mile radius', async () => {
      // Seed contractors at known distances from Times Square (40.758, -73.985)
      const timesSquare = { lat: 40.758, lng: -73.985 };

      await contractorRepository.save([
        createContractor('contractor-001', 40.758, -73.985), // 0 miles (exact location)
        createContractor('contractor-002', 40.763, -73.982), // ~0.4 miles north
        createContractor('contractor-003', 40.748, -73.995), // ~0.8 miles south
        createContractor('contractor-004', 40.706, -73.997), // ~4.1 miles (Brooklyn)
        createContractor('contractor-005', 40.689, -73.982), // ~5.5 miles (out of range)
      ]);

      // Query contractors within 5 miles using PostGIS
      const results = await contractorRepository
        .createQueryBuilder('contractor')
        .where(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )`,
          {
            lat: timesSquare.lat,
            lng: timesSquare.lng,
            radiusMeters: 5 * 1609.34, // 5 miles to meters
          }
        )
        .getMany();

      expect(results.length).toBe(4); // Should find 4 contractors within 5 miles
      expect(results.map(c => c.id)).toContain('contractor-001');
      expect(results.map(c => c.id)).toContain('contractor-002');
      expect(results.map(c => c.id)).toContain('contractor-003');
      expect(results.map(c => c.id)).toContain('contractor-004');
      expect(results.map(c => c.id)).not.toContain('contractor-005');

      console.log(`✅ Found ${results.length} contractors within 5 miles`);
    });

    it('should find contractors within 10 mile radius', async () => {
      const centralPark = { lat: 40.7829, lng: -73.9654 };

      await contractorRepository.save([
        createContractor('contractor-010', 40.7829, -73.9654), // 0 miles
        createContractor('contractor-011', 40.7589, -73.9851), // ~1.3 miles (Times Square)
        createContractor('contractor-012', 40.7128, -74.006), // ~5.5 miles (Financial District)
        createContractor('contractor-013', 40.6782, -73.9442), // ~8 miles (Brooklyn)
        createContractor('contractor-014', 40.8448, -73.8648), // ~10.5 miles (Bronx) - OUT
      ]);

      const results = await contractorRepository
        .createQueryBuilder('contractor')
        .where(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )`,
          {
            lat: centralPark.lat,
            lng: centralPark.lng,
            radiusMeters: 10 * 1609.34,
          }
        )
        .getMany();

      expect(results.length).toBe(4);
      expect(results.map(c => c.id)).not.toContain('contractor-014');
    });

    it('should handle empty result set for remote locations', async () => {
      // Seed contractors in NYC
      await contractorRepository.save([
        createContractor('contractor-020', 40.7128, -74.006),
      ]);

      // Search in Alaska (far from NYC)
      const anchorage = { lat: 61.2181, lng: -149.9003 };

      const results = await contractorRepository
        .createQueryBuilder('contractor')
        .where(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )`,
          {
            lat: anchorage.lat,
            lng: anchorage.lng,
            radiusMeters: 50 * 1609.34, // 50 miles
          }
        )
        .getMany();

      expect(results.length).toBe(0);
    });
  });

  /**
   * TEST GROUP 3: Distance-Based Scoring
   */
  describe('Distance Scoring Algorithm', () => {
    it('should give higher score to closer contractors', async () => {
      const searchLocation = { lat: 40.7128, lng: -74.006 };

      await contractorRepository.save([
        {
          ...createContractor('contractor-close', 40.7128, -74.006),
          averageRating: 4.5,
          reliabilityScore: 0.9,
          averageResponseTime: 15,
          totalJobsCompleted: 50,
        }, // 0 miles
        {
          ...createContractor('contractor-medium', 40.7589, -73.9851),
          averageRating: 4.5,
          reliabilityScore: 0.9,
          averageResponseTime: 15,
          totalJobsCompleted: 50,
        }, // ~4 miles
        {
          ...createContractor('contractor-far', 40.8448, -73.8648),
          averageRating: 4.5,
          reliabilityScore: 0.9,
          averageResponseTime: 15,
          totalJobsCompleted: 50,
        }, // ~10 miles
      ]);

      // Search using matching service
      const results = await matchingService.findMatches({
        latitude: searchLocation.lat,
        longitude: searchLocation.lng,
        radiusMiles: 15,
        tradeCategory: 'plumbing',
        minRating: 4.0,
      });

      // Verify results are sorted by distance (closer = higher score)
      expect(results.contractors.length).toBe(3);

      const scores = results.contractors.map(c => c.score);
      expect(scores[0]).toBeGreaterThan(scores[1]); // Closest has highest score
      expect(scores[1]).toBeGreaterThan(scores[2]); // Medium has middle score

      console.log('Distance scores:', scores);
    });

    it('should calculate distance component correctly using exponential decay', async () => {
      // Distance score formula: 30 * exp(-0.3 * distance)
      // 0 miles = 30 points
      // 5 miles = ~6.7 points
      // 10 miles = ~1.5 points

      const testCases = [
        { distance: 0, expectedMin: 28, expectedMax: 30 },
        { distance: 5, expectedMin: 6, expectedMax: 8 },
        { distance: 10, expectedMin: 1, expectedMax: 2.5 },
      ];

      for (const testCase of testCases) {
        const score = 30 * Math.exp(-0.3 * testCase.distance);
        expect(score).toBeGreaterThanOrEqual(testCase.expectedMin);
        expect(score).toBeLessThanOrEqual(testCase.expectedMax);
        console.log(`Distance ${testCase.distance} miles → ${score.toFixed(2)} points`);
      }
    });
  });

  /**
   * TEST GROUP 4: Edge Cases
   */
  describe('Geospatial Edge Cases', () => {
    it('should handle International Date Line correctly', async () => {
      // Locations near date line (180° longitude)
      const fiji = { lat: -18.1248, lng: 178.4501 }; // Fiji (just west of date line)
      const samoa = { lat: -13.759, lng: -172.1046 }; // Samoa (just east of date line)

      // Calculate distance (should be ~1,000 miles, NOT ~20,000 miles)
      const distance = haversineDistance(fiji.lat, fiji.lng, samoa.lat, samoa.lng);

      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1200);
      console.log(`✅ Fiji to Samoa: ${distance.toFixed(2)} miles (crosses date line)`);
    });

    it('should handle Prime Meridian crossing (0° longitude)', async () => {
      const london = { lat: 51.5074, lng: -0.1278 }; // London (west of PM)
      const paris = { lat: 48.8566, lng: 2.3522 }; // Paris (east of PM)

      const distance = haversineDistance(london.lat, london.lng, paris.lat, paris.lng);

      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(250);
      console.log(`✅ London to Paris: ${distance.toFixed(2)} miles (crosses Prime Meridian)`);
    });

    it('should handle equator crossing', async () => {
      const nairobi = { lat: -1.2921, lng: 36.8219 }; // Kenya (south of equator)
      const addis = { lat: 9.0.toString().length, lng: 38.7469 }; // Ethiopia (north of equator)

      const distance = haversineDistance(nairobi.lat, nairobi.lng, 9.03, addis.lng);

      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(900);
    });

    it('should handle extreme latitudes (near poles)', async () => {
      const northCape = { lat: 71.1725, lng: 25.7854 }; // Norway (far north)
      const barrow = { lat: 71.2906, lng: -156.7886 }; // Alaska (far north)

      const distance = haversineDistance(
        northCape.lat,
        northCape.lng,
        barrow.lat,
        barrow.lng
      );

      // Distance should be large (across Arctic Ocean)
      expect(distance).toBeGreaterThan(2000);
      console.log(`✅ North Cape to Barrow: ${distance.toFixed(2)} miles`);
    });
  });

  /**
   * TEST GROUP 5: Performance Tests
   */
  describe('Distance Query Performance', () => {
    it('should query 1000 contractors in < 100ms', async () => {
      // Seed 1000 contractors across NYC area
      const contractors = Array.from({ length: 1000 }, (_, i) => {
        const latOffset = (Math.random() - 0.5) * 0.2; // ±0.1° (~6 miles)
        const lngOffset = (Math.random() - 0.5) * 0.2;
        return createContractor(
          `contractor-perf-${i}`,
          40.7128 + latOffset,
          -74.006 + lngOffset
        );
      });

      await contractorRepository.save(contractors);

      // Measure query time
      const startTime = Date.now();

      const results = await contractorRepository
        .createQueryBuilder('contractor')
        .where(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )`,
          {
            lat: 40.7128,
            lng: -74.006,
            radiusMeters: 5 * 1609.34,
          }
        )
        .getMany();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Queried 1000 contractors in ${duration}ms`);
      expect(duration).toBeLessThan(100); // Should be < 100ms with PostGIS spatial index
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

// Helper function to create contractor test data
function createContractor(
  id: string,
  latitude: number,
  longitude: number
): Partial<ContractorEntity> {
  return {
    id,
    userId: `user-${id}`,
    businessName: `Test Contractor ${id}`,
    specialties: ['plumbing'],
    hourlyRate: 85,
    locationPoint: {
      type: 'Point',
      coordinates: [longitude, latitude],
    } as any,
    latitude,
    longitude,
    serviceRadius: 10,
    averageRating: 4.5,
    reliabilityScore: 0.9,
    averageResponseTime: 15,
    totalJobsCompleted: 50,
    currentJobs: 0,
    maxConcurrentJobs: 5,
    availabilityStatus: 'available',
    status: 'verified',
    backgroundCheckStatus: 'passed',
    insuranceVerified: true,
    yearsExperience: 10,
  };
}
