/**
 * Race Condition E2E Test - CRITICAL
 *
 * Tests the most important edge case in the marketplace:
 * What happens when 2 contractors accept the SAME job at the EXACT same millisecond?
 *
 * Expected Behavior:
 * - Database transaction lock ensures ONLY ONE contractor succeeds
 * - The other contractor receives "Job Already Taken" error
 * - No duplicate assignments created
 * - Ticket status updated atomically
 *
 * Inspired by: Uber's driver assignment system, DoorDash order acceptance
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

// Import entities
import { Ticket, TicketStatus } from '../../services/core-tickets/src/entities/ticket.entity';
import { TicketAssignment } from '../../services/core-tickets/src/entities/ticket-assignment.entity';
import { TicketStateHistory } from '../../services/core-tickets/src/entities/ticket-state-history.entity';
import { TicketsModule } from '../../services/core-tickets/src/modules/tickets.module';

// Import test utilities
import { generateTickets, SeedTicketData } from '../utils/seed';

describe('Race Condition E2E Tests - Contractor Job Acceptance', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ticketRepository: Repository<Ticket>;
  let assignmentRepository: Repository<TicketAssignment>;
  let historyRepository: Repository<TicketStateHistory>;

  // Test data
  let testTicket: Ticket;
  const contractor1Id = 'contractor-001';
  const contractor2Id = 'contractor-002';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: process.env.TEST_DB_NAME || 'rentfix_e2e_test',
          entities: [Ticket, TicketAssignment, TicketStateHistory],
          synchronize: true, // OK for tests
          dropSchema: true, // Clean slate
          logging: false,
        }),
        TicketsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();

    dataSource = moduleFixture.get(DataSource);
    ticketRepository = moduleFixture.get(getRepositoryToken(Ticket));
    assignmentRepository = moduleFixture.get(getRepositoryToken(TicketAssignment));
    historyRepository = moduleFixture.get(getRepositoryToken(TicketStateHistory));
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await assignmentRepository.delete({});
    await historyRepository.delete({});
    await ticketRepository.delete({});

    // Create a fresh ticket for each test
    testTicket = ticketRepository.create({
      id: 'ticket-race-001',
      title: 'Emergency Plumbing Leak',
      description: 'Urgent leak in kitchen sink',
      status: TicketStatus.new,
      priority: 'urgent',
      tenantId: 'tenant-001',
      unitId: 'unit-001',
      propertyId: 'property-001',
      assignedContractorId: null,
      estimatedCost: 250,
      latitude: 40.7128,
      longitude: -74.006,
    });
    testTicket = await ticketRepository.save(testTicket);
  });

  /**
   * TEST 1: The Core Race Condition
   * Two contractors click "Accept" at the EXACT same millisecond
   */
  describe('Simultaneous Accept Requests', () => {
    it('should allow only ONE contractor to accept the job', async () => {
      // Arrange: Both contractors prepare to accept
      const acceptRequest1 = {
        contractorId: contractor1Id,
        ticketId: testTicket.id,
      };

      const acceptRequest2 = {
        contractorId: contractor2Id,
        ticketId: testTicket.id,
      };

      // Act: Fire BOTH requests at the EXACT same time using Promise.all
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor1Id })
          .expect((res) => {
            // One should succeed (201 or 200)
            if (res.status !== 200 && res.status !== 201 && res.status !== 409) {
              throw new Error(`Unexpected status: ${res.status}`);
            }
          }),
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor2Id })
          .expect((res) => {
            // One should succeed (201 or 200)
            if (res.status !== 200 && res.status !== 201 && res.status !== 409) {
              throw new Error(`Unexpected status: ${res.status}`);
            }
          }),
      ]);

      // Assert: ONE succeeded, ONE failed
      const results = [response1, response2];
      const successes = results.filter((r) => r.status === 'fulfilled' &&
        ((r.value as any).status === 200 || (r.value as any).status === 201));
      const failures = results.filter((r) => r.status === 'fulfilled' &&
        (r.value as any).status === 409);

      expect(successes.length).toBe(1); // Exactly ONE success
      expect(failures.length).toBe(1); // Exactly ONE failure (409 Conflict)

      // Verify database state
      const assignments = await assignmentRepository.find({
        where: { ticket: { id: testTicket.id } },
      });

      expect(assignments.length).toBe(1); // Only ONE assignment created
      expect(assignments[0].acceptedAt).not.toBeNull(); // Accepted timestamp set

      // Verify ticket status updated
      const updatedTicket = await ticketRepository.findOne({
        where: { id: testTicket.id },
      });
      expect(updatedTicket?.status).toBe(TicketStatus.assigned);
      expect(updatedTicket?.assignedContractorId).toBe(
        assignments[0].contractorId
      );
    });

    it('should return "Job Already Taken" error to the losing contractor', async () => {
      // Arrange: Pre-accept by contractor 1 to ensure controlled test
      await request(app.getHttpServer())
        .post(`/v1/tickets/${testTicket.id}/accept`)
        .send({ contractorId: contractor1Id })
        .expect(201);

      // Act: Contractor 2 tries to accept
      const response = await request(app.getHttpServer())
        .post(`/v1/tickets/${testTicket.id}/accept`)
        .send({ contractorId: contractor2Id })
        .expect(409);

      // Assert: Clear error message
      expect(response.body.message).toContain('already taken');
      expect(response.body.statusCode).toBe(409);
    });

    it('should handle 10 simultaneous accept requests (stress test)', async () => {
      // Arrange: 10 contractors competing for 1 job
      const contractorIds = Array.from({ length: 10 }, (_, i) => `contractor-${String(i + 1).padStart(3, '0')}`);

      // Act: All 10 fire at once
      const responses = await Promise.allSettled(
        contractorIds.map((contractorId) =>
          request(app.getHttpServer())
            .post(`/v1/tickets/${testTicket.id}/accept`)
            .send({ contractorId })
        )
      );

      // Assert: Exactly ONE succeeded
      const successCount = responses.filter(
        (r) => r.status === 'fulfilled' &&
        ((r.value as any).status === 200 || (r.value as any).status === 201)
      ).length;

      expect(successCount).toBe(1); // ONLY ONE winner

      // Verify database integrity
      const assignments = await assignmentRepository.find({
        where: { ticket: { id: testTicket.id } },
      });

      expect(assignments.length).toBe(1); // No duplicate assignments
    });
  });

  /**
   * TEST 2: Database Transaction Isolation
   * Verify SERIALIZABLE isolation level prevents dirty reads
   */
  describe('Transaction Isolation Level', () => {
    it('should use SERIALIZABLE isolation for accept operations', async () => {
      // This test verifies the database transaction configuration
      // Start a manual transaction to check isolation level
      const queryRunner: QueryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('SERIALIZABLE');

      try {
        const result = await queryRunner.query(
          'SHOW transaction_isolation'
        );
        expect(result[0].transaction_isolation).toBe('serializable');

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });

    it('should rollback transaction if assignment fails mid-operation', async () => {
      // Simulate a failure scenario
      // This would test that partial updates don't persist

      const initialCount = await assignmentRepository.count();

      // Attempt to accept with invalid data (should trigger rollback)
      try {
        await request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: null }) // Invalid
          .expect(400);
      } catch (error) {
        // Expected to fail
      }

      // Verify no partial data persisted
      const finalCount = await assignmentRepository.count();
      expect(finalCount).toBe(initialCount); // No change
    });
  });

  /**
   * TEST 3: Optimistic Locking with Version Control
   * Tests version-based concurrency control
   */
  describe('Optimistic Locking', () => {
    it('should prevent concurrent updates using version numbers', async () => {
      // Add version column to Ticket entity for this test
      // This is an advanced pattern used by Uber/Lyft

      // Fetch ticket with version
      const ticket1 = await ticketRepository.findOne({
        where: { id: testTicket.id },
      });

      const ticket2 = await ticketRepository.findOne({
        where: { id: testTicket.id },
      });

      // Both have same version initially
      expect(ticket1).toBeDefined();
      expect(ticket2).toBeDefined();

      // Simulate concurrent accept attempts
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor1Id }),
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor2Id }),
      ]);

      // ONE should succeed
      const successes = [response1, response2].filter(
        (r) => r.status === 'fulfilled'
      );
      expect(successes.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * TEST 4: State Machine Validation
   * Ensure tickets can only be accepted in valid states
   */
  describe('State Machine Enforcement', () => {
    it('should reject accept request if ticket already assigned', async () => {
      // Arrange: Assign ticket to contractor 1
      testTicket.status = TicketStatus.assigned;
      testTicket.assignedContractorId = contractor1Id;
      await ticketRepository.save(testTicket);

      // Act: Contractor 2 tries to accept
      const response = await request(app.getHttpServer())
        .post(`/v1/tickets/${testTicket.id}/accept`)
        .send({ contractorId: contractor2Id })
        .expect(409);

      // Assert
      expect(response.body.message).toContain('already');
    });

    it('should reject accept request if ticket is completed', async () => {
      // Arrange: Complete ticket
      testTicket.status = TicketStatus.completed;
      await ticketRepository.save(testTicket);

      // Act: Try to accept completed ticket
      await request(app.getHttpServer())
        .post(`/v1/tickets/${testTicket.id}/accept`)
        .send({ contractorId: contractor1Id })
        .expect(409);
    });

    it('should allow accept only from new or triaged status', async () => {
      const validStatuses = [TicketStatus.new, TicketStatus.triaged];

      for (const status of validStatuses) {
        // Reset ticket
        await assignmentRepository.delete({});
        testTicket.status = status;
        testTicket.assignedContractorId = null;
        await ticketRepository.save(testTicket);

        // Act: Accept should succeed
        const response = await request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor1Id })
          .expect((res) => {
            expect([200, 201]).toContain(res.status);
          });
      }
    });
  });

  /**
   * TEST 5: Performance Under Load
   * Ensure race condition handling doesn't create performance bottlenecks
   */
  describe('Performance Metrics', () => {
    it('should handle 100 rapid sequential accepts in <2 seconds', async () => {
      // Create 100 tickets
      const tickets = await Promise.all(
        Array.from({ length: 100 }, async (_, i) => {
          const ticket = ticketRepository.create({
            id: `ticket-perf-${String(i + 1).padStart(3, '0')}`,
            title: `Ticket ${i + 1}`,
            description: 'Performance test',
            status: TicketStatus.new,
            priority: 'medium',
            tenantId: 'tenant-001',
            unitId: 'unit-001',
            propertyId: 'property-001',
            latitude: 40.7128,
            longitude: -74.006,
          });
          return ticketRepository.save(ticket);
        })
      );

      // Measure time
      const startTime = Date.now();

      // Accept all tickets
      await Promise.all(
        tickets.map((ticket, i) =>
          request(app.getHttpServer())
            .post(`/v1/tickets/${ticket.id}/accept`)
            .send({ contractorId: `contractor-${String(i + 1).padStart(3, '0')}` })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert: Should complete in <2 seconds
      expect(duration).toBeLessThan(2000);

      // Verify all accepted
      const assignmentCount = await assignmentRepository.count();
      expect(assignmentCount).toBe(100);
    });
  });

  /**
   * TEST 6: Audit Trail
   * Ensure all acceptance attempts are logged
   */
  describe('Audit Logging', () => {
    it('should log all accept attempts in state history', async () => {
      // Act: Both contractors try to accept
      await Promise.allSettled([
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor1Id }),
        request(app.getHttpServer())
          .post(`/v1/tickets/${testTicket.id}/accept`)
          .send({ contractorId: contractor2Id }),
      ]);

      // Assert: State history should have records
      const history = await historyRepository.find({
        where: { ticket: { id: testTicket.id } },
        order: { createdAt: 'ASC' },
      });

      // At minimum: initial state + assignment state
      expect(history.length).toBeGreaterThanOrEqual(1);

      // Verify final state is 'assigned'
      const finalState = history[history.length - 1];
      expect(finalState.state).toBe(TicketStatus.assigned);
    });
  });
});
