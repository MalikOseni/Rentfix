import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingModule } from '../src/modules/matching.module';
import { ContractorEntity } from '../src/entities/contractor.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IssueTrade } from '@rentfix/types';

/**
 * E2E Integration Tests for Contractor Matching Engine
 * Comprehensive test suite following Google Test standards
 */

describe('Contractor Matching E2E', () => {
  let app: INestApplication;
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
          synchronize: true, // OK for tests
          dropSchema: true, // Clean slate for each test run
        }),
        MatchingModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();

    contractorRepository = moduleFixture.get(
      getRepositoryToken(ContractorEntity)
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await contractorRepository.clear();
  });

  describe('POST /match', () => {
    it('should return matching contractors within radius', async () => {
      // Arrange: Seed test data
      await seedContractors(contractorRepository, [
        {
          id: 'contractor-1',
          userId: 'user-1',
          businessName: 'Quick Plumbing',
          specialties: ['plumbing'],
          hourlyRate: 85,
          latitude: 40.7128,
          longitude: -74.006,
          serviceRadius: 10,
          averageRating: 4.8,
          reliabilityScore: 0.95,
          averageResponseTime: 15,
          totalJobsCompleted: 100,
          availabilityStatus: 'available',
          status: 'verified',
          backgroundCheckStatus: 'passed',
          insuranceVerified: true,
        },
        {
          id: 'contractor-2',
          userId: 'user-2',
          businessName: 'Far Plumbing',
          specialties: ['plumbing'],
          hourlyRate: 65,
          latitude: 40.8128, // ~7 miles away
          longitude: -74.106,
          serviceRadius: 15,
          averageRating: 3.5,
          reliabilityScore: 0.8,
          averageResponseTime: 30,
          totalJobsCompleted: 50,
          availabilityStatus: 'available',
          status: 'verified',
          backgroundCheckStatus: 'passed',
          insuranceVerified: false,
        },
      ]);

      // Act: Search for contractors
      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leaky faucet',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'New York, NY',
          },
          searchRadius: 10,
          maxResults: 10,
        })
        .expect(200);

      // Assert
      expect(response.body.matches).toHaveLength(2);
      expect(response.body.totalCandidates).toBe(2);
      expect(response.body.usedFallback).toBe(false);

      // First contractor should have higher score (better rating + closer)
      const first = response.body.matches[0];
      expect(first.contractor.businessName).toBe('Quick Plumbing');
      expect(first.score).toBeGreaterThan(response.body.matches[1].score);
    });

    it('should filter by minimum rating', async () => {
      await seedContractors(contractorRepository, [
        {
          id: 'contractor-1',
          businessName: 'High Rating Plumber',
          specialties: ['plumbing'],
          averageRating: 4.9,
          latitude: 40.7128,
          longitude: -74.006,
        },
        {
          id: 'contractor-2',
          businessName: 'Low Rating Plumber',
          specialties: ['plumbing'],
          averageRating: 3.2,
          latitude: 40.7128,
          longitude: -74.006,
        },
      ]);

      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
          filters: {
            minRating: 4.5,
          },
        })
        .expect(200);

      expect(response.body.matches).toHaveLength(1);
      expect(response.body.matches[0].contractor.averageRating).toBeGreaterThanOrEqual(
        4.5
      );
    });

    it('should filter by insurance requirement', async () => {
      await seedContractors(contractorRepository, [
        {
          id: 'contractor-1',
          businessName: 'Insured Plumber',
          specialties: ['plumbing'],
          insuranceVerified: true,
          latitude: 40.7128,
          longitude: -74.006,
        },
        {
          id: 'contractor-2',
          businessName: 'Uninsured Plumber',
          specialties: ['plumbing'],
          insuranceVerified: false,
          latitude: 40.7128,
          longitude: -74.006,
        },
      ]);

      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
          filters: {
            requireInsurance: true,
          },
        })
        .expect(200);

      expect(response.body.matches).toHaveLength(1);
      expect(response.body.matches[0].contractor.insuranceVerified).toBe(true);
    });

    it('should respect search radius limit', async () => {
      await seedContractors(contractorRepository, [
        {
          id: 'contractor-1',
          businessName: 'Nearby',
          specialties: ['plumbing'],
          latitude: 40.7128,
          longitude: -74.006,
        },
        {
          id: 'contractor-2',
          businessName: 'Far Away',
          specialties: ['plumbing'],
          latitude: 41.0, // ~20 miles away
          longitude: -74.5,
        },
      ]);

      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
          searchRadius: 5, // Only 5 miles
        })
        .expect(200);

      expect(response.body.matches).toHaveLength(1);
      expect(response.body.matches[0].distance).toBeLessThanOrEqual(5);
    });

    it('should validate input and reject invalid requests', async () => {
      // Invalid latitude
      await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 200, // Invalid
            longitude: -74.006,
            address: 'NYC',
          },
        })
        .expect(400);

      // Invalid trade
      await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'invalid_trade',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
        })
        .expect(400);

      // Missing required field
      await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          trade: 'plumbing',
          severity: 'medium',
          // Missing location
        })
        .expect(400);
    });

    it('should handle no contractors found gracefully', async () => {
      // No contractors in database
      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
        })
        .expect(200);

      expect(response.body.matches).toEqual([]);
      expect(response.body.totalCandidates).toBe(0);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      // Seed 100 contractors
      const contractors = Array.from({ length: 100 }, (_, i) => ({
        id: `contractor-${i}`,
        businessName: `Contractor ${i}`,
        specialties: ['plumbing'],
        latitude: 40.7128 + Math.random() * 0.1,
        longitude: -74.006 + Math.random() * 0.1,
      }));

      await seedContractors(contractorRepository, contractors);

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/match')
        .send({
          ticketId: '123e4567-e89b-12d3-a456-426614174000',
          issueType: 'Leak',
          trade: 'plumbing',
          severity: 'medium',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'NYC',
          },
          searchRadius: 10,
        })
        .expect(200);

      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(1000); // Should complete in < 1 second
      expect(response.body.executionTimeMs).toBeLessThan(500); // Server-side < 500ms
    });
  });
});

/**
 * Helper function to seed contractors
 */
async function seedContractors(
  repository: Repository<ContractorEntity>,
  contractors: Partial<ContractorEntity>[]
): Promise<void> {
  const entities = contractors.map((data) =>
    repository.create({
      userId: data.userId || `user-${Math.random()}`,
      businessName: data.businessName || 'Test Contractor',
      specialties: data.specialties || ['plumbing'],
      hourlyRate: data.hourlyRate || 100,
      latitude: data.latitude || 40.7128,
      longitude: data.longitude || -74.006,
      address: data.address || 'Test Address',
      serviceRadius: data.serviceRadius || 10,
      averageRating: data.averageRating || 4.5,
      reliabilityScore: data.reliabilityScore || 0.9,
      averageResponseTime: data.averageResponseTime || 20,
      totalJobsCompleted: data.totalJobsCompleted || 50,
      availabilityStatus: (data.availabilityStatus as any) || 'available',
      currentJobs: 0,
      maxConcurrentJobs: 3,
      status: (data.status as any) || 'verified',
      backgroundCheckStatus: (data.backgroundCheckStatus as any) || 'passed',
      insuranceVerified: data.insuranceVerified ?? true,
      certifications: data.certifications || [],
      metadata: {},
      deletedAt: null,
      ...data,
    })
  );

  await repository.save(entities);
}
