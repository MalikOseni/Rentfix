/**
 * Marketplace Golden Path E2E Test
 *
 * Tests the complete end-to-end flow of the Rentfix marketplace:
 * 1. Tenant uploads photo of maintenance issue
 * 2. AI classifies the issue (trade category)
 * 3. Agent confirms/triages the ticket
 * 4. Matching engine searches for contractors
 * 5. Contractor accepts the job
 * 6. Job is booked and scheduled
 * 7. Contractor completes the work
 * 8. Ticket is closed
 *
 * This represents the "happy path" that should work flawlessly 95%+ of the time
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

// Import entities from core services
import { Ticket, TicketStatus, TicketPriority } from '../../services/core-tickets/src/entities/ticket.entity';
import { TicketAssignment } from '../../services/core-tickets/src/entities/ticket-assignment.entity';
import { TicketStateHistory } from '../../services/core-tickets/src/entities/ticket-state-history.entity';
import { ContractorEntity } from '../../services/core-matching/src/entities/contractor.entity';

// Import modules
import { TicketsModule } from '../../services/core-tickets/src/modules/tickets.module';
import { MatchingModule } from '../../services/core-matching/src/modules/matching.module';

// Import test utilities
import { seedContractorsToDb, generateTickets } from '../utils/seed';

describe('Marketplace Golden Path E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ticketRepository: Repository<Ticket>;
  let assignmentRepository: Repository<TicketAssignment>;
  let historyRepository: Repository<TicketStateHistory>;
  let contractorRepository: Repository<ContractorEntity>;

  // Test actors
  const tenantId = 'tenant-golden-001';
  const agentId = 'agent-golden-001';
  let contractorId: string;

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
          entities: [Ticket, TicketAssignment, TicketStateHistory, ContractorEntity],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TicketsModule,
        MatchingModule,
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
    contractorRepository = moduleFixture.get(getRepositoryToken(ContractorEntity));

    // Seed contractors for matching
    const contractors = await seedContractorsToDb(contractorRepository);
    contractorId = contractors[0].id; // Use first seeded contractor
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean ticket data before each test (keep contractors)
    await assignmentRepository.delete({});
    await historyRepository.delete({});
    await ticketRepository.delete({});
  });

  /**
   * THE GOLDEN PATH - Complete Marketplace Flow
   */
  describe('Complete Marketplace Flow (Happy Path)', () => {
    it('should successfully complete entire flow from tenant upload to job completion', async () => {
      let ticketId: string;

      // =====================================================================
      // STEP 1: Tenant creates a ticket (simulating photo upload + description)
      // =====================================================================
      const createTicketResponse = await request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          title: 'Kitchen Sink Leaking',
          description: 'Water is dripping from under the kitchen sink. Getting worse.',
          priority: 'high',
          status: 'new',
          tenantId: tenantId,
          unitId: 'unit-123',
          propertyId: 'property-456',
          // In real flow, photoUrls would be included here
          photoUrls: ['https://storage.rentfix.com/issues/leak-001.jpg'],
        })
        .expect(201);

      expect(createTicketResponse.body).toHaveProperty('id');
      expect(createTicketResponse.body.status).toBe('new');
      expect(createTicketResponse.body.title).toBe('Kitchen Sink Leaking');

      ticketId = createTicketResponse.body.id;
      console.log(`✅ Step 1: Ticket created - ID: ${ticketId}`);

      // =====================================================================
      // STEP 2: AI Classification (simulated - would normally be async job)
      // =====================================================================
      // In production, this would be handled by worker-ai service
      // For E2E, we simulate the AI classification result
      const classificationResult = {
        tradeCategory: 'plumbing',
        confidence: 0.95,
        urgency: 'high',
        estimatedCost: 250,
      };

      // Update ticket with AI classification
      const classifyResponse = await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'triaged',
          note: `AI Classification: ${classificationResult.tradeCategory} (confidence: ${classificationResult.confidence})`,
          changedBy: 'system-ai',
        })
        .expect(200);

      expect(classifyResponse.body.status).toBe('triaged');
      console.log(`✅ Step 2: AI classified as "${classificationResult.tradeCategory}"`);

      // =====================================================================
      // STEP 3: Agent confirms the classification and refines details
      // =====================================================================
      const agentReviewResponse = await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'triaged',
          note: 'Agent confirmed: Plumbing leak - needs immediate attention',
          changedBy: agentId,
        })
        .expect(200);

      console.log(`✅ Step 3: Agent ${agentId} confirmed classification`);

      // =====================================================================
      // STEP 4: Matching engine finds suitable contractors
      // =====================================================================
      const matchRequest = {
        ticketId: ticketId,
        tradeCategory: classificationResult.tradeCategory,
        latitude: 40.7128, // NYC coordinates
        longitude: -74.006,
        radiusMiles: 10,
        minRating: 4.0,
        insuranceRequired: true,
      };

      const matchResponse = await request(app.getHttpServer())
        .post('/v1/matching/search')
        .send(matchRequest)
        .expect(200);

      expect(matchResponse.body).toHaveProperty('contractors');
      expect(matchResponse.body.contractors.length).toBeGreaterThan(0);

      const topContractor = matchResponse.body.contractors[0];
      expect(topContractor).toHaveProperty('score');
      expect(topContractor.score).toBeGreaterThan(0);

      console.log(`✅ Step 4: Found ${matchResponse.body.contractors.length} matching contractors`);
      console.log(`   Top match: ${topContractor.businessName} (score: ${topContractor.score})`);

      // =====================================================================
      // STEP 5: Contractor accepts the job
      // =====================================================================
      const acceptResponse = await request(app.getHttpServer())
        .post(`/v1/tickets/${ticketId}/accept`)
        .send({
          contractorId: topContractor.id,
        })
        .expect(201);

      expect(acceptResponse.body.status).toBe('assigned');
      expect(acceptResponse.body.assignedContractorId).toBe(topContractor.id);

      console.log(`✅ Step 5: Contractor ${topContractor.id} accepted the job`);

      // =====================================================================
      // STEP 6: Contractor starts work
      // =====================================================================
      const startWorkResponse = await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'in_progress',
          note: 'Started work on kitchen sink leak',
          changedBy: topContractor.id,
        })
        .expect(200);

      expect(startWorkResponse.body.status).toBe('in_progress');
      console.log(`✅ Step 6: Work started`);

      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 100));

      // =====================================================================
      // STEP 7: Contractor completes the job
      // =====================================================================
      const completeResponse = await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'completed',
          note: 'Fixed the leak. Replaced P-trap and re-sealed connections.',
          changedBy: topContractor.id,
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('completed');
      console.log(`✅ Step 7: Job completed`);

      // =====================================================================
      // STEP 8: Verify complete audit trail
      // =====================================================================
      const finalTicket = await request(app.getHttpServer())
        .get(`/v1/tickets/${ticketId}`)
        .expect(200);

      expect(finalTicket.body.status).toBe('completed');
      expect(finalTicket.body.stateHistory).toBeDefined();
      expect(finalTicket.body.stateHistory.length).toBeGreaterThanOrEqual(4);

      // Verify state transitions
      const states = finalTicket.body.stateHistory.map((h: any) => h.state);
      expect(states).toContain('new');
      expect(states).toContain('triaged');
      expect(states).toContain('assigned');
      expect(states).toContain('in_progress');
      expect(states).toContain('completed');

      console.log(`✅ Step 8: Audit trail verified - ${states.length} state changes`);

      // =====================================================================
      // FINAL VALIDATION: Check all database records are consistent
      // =====================================================================
      const assignment = await assignmentRepository.findOne({
        where: { ticket: { id: ticketId } },
      });

      expect(assignment).toBeDefined();
      expect(assignment?.contractorId).toBe(topContractor.id);
      expect(assignment?.acceptedAt).toBeDefined();
      expect(assignment?.completedAt).toBeDefined();
      expect(assignment?.finalStatus).toBe('completed');

      console.log('✅ GOLDEN PATH COMPLETE - All steps verified!');
    });
  });

  /**
   * Performance Validation - The Golden Path should be FAST
   */
  describe('Golden Path Performance', () => {
    it('should complete the entire flow in < 5 seconds', async () => {
      const startTime = Date.now();

      // Step 1: Create ticket
      const ticket = await request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          title: 'AC Not Cooling',
          description: 'Air conditioner running but not cooling',
          priority: 'urgent',
          status: 'new',
          tenantId: tenantId,
          unitId: 'unit-perf-001',
          propertyId: 'property-perf-001',
        })
        .expect(201);

      const ticketId = ticket.body.id;

      // Step 2: AI Classification
      await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'triaged',
          note: 'AI: HVAC issue',
          changedBy: 'system-ai',
        })
        .expect(200);

      // Step 3: Match contractors
      const match = await request(app.getHttpServer())
        .post('/v1/matching/search')
        .send({
          ticketId: ticketId,
          tradeCategory: 'hvac',
          latitude: 40.7128,
          longitude: -74.006,
          radiusMiles: 10,
          minRating: 4.0,
        })
        .expect(200);

      // Step 4: Accept job
      await request(app.getHttpServer())
        .post(`/v1/tickets/${ticketId}/accept`)
        .send({
          contractorId: match.body.contractors[0].id,
        })
        .expect(201);

      // Step 5: Start work
      await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'in_progress',
          changedBy: match.body.contractors[0].id,
        })
        .expect(200);

      // Step 6: Complete
      await request(app.getHttpServer())
        .patch(`/v1/tickets/${ticketId}/status`)
        .send({
          status: 'completed',
          changedBy: match.body.contractors[0].id,
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Golden Path completed in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });

  /**
   * Edge Cases - Things that might go wrong
   */
  describe('Golden Path Edge Cases', () => {
    it('should handle ticket with no matching contractors gracefully', async () => {
      // Create ticket in remote location
      const ticket = await request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          title: 'Remote Location Issue',
          description: 'Issue in remote area',
          priority: 'medium',
          status: 'triaged',
          tenantId: tenantId,
          unitId: 'unit-remote-001',
          propertyId: 'property-remote-001',
        })
        .expect(201);

      // Search for contractors in remote location (Alaska)
      const match = await request(app.getHttpServer())
        .post('/v1/matching/search')
        .send({
          ticketId: ticket.body.id,
          tradeCategory: 'plumbing',
          latitude: 61.2181, // Anchorage, AK
          longitude: -149.9003,
          radiusMiles: 10,
          minRating: 4.0,
        })
        .expect(200);

      // Should return empty array, not error
      expect(match.body.contractors).toEqual([]);
      expect(match.body.message).toContain('No contractors found');
    });

    it('should prevent accepting already assigned ticket', async () => {
      // Create and assign ticket
      const ticket = await request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          title: 'Already Assigned Test',
          description: 'Test ticket',
          priority: 'medium',
          status: 'triaged',
          tenantId: tenantId,
          unitId: 'unit-assigned-001',
          propertyId: 'property-assigned-001',
        })
        .expect(201);

      const ticketId = ticket.body.id;

      // First contractor accepts
      await request(app.getHttpServer())
        .post(`/v1/tickets/${ticketId}/accept`)
        .send({ contractorId: 'contractor-001' })
        .expect(201);

      // Second contractor tries to accept (should fail)
      await request(app.getHttpServer())
        .post(`/v1/tickets/${ticketId}/accept`)
        .send({ contractorId: 'contractor-002' })
        .expect(409); // Conflict
    });

    it('should require all mandatory fields for ticket creation', async () => {
      // Missing required fields
      await request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          title: 'Incomplete Ticket',
          // Missing description, priority, status, etc.
        })
        .expect(400); // Bad Request
    });
  });

  /**
   * Parallel Flow - Multiple tickets flowing through system simultaneously
   */
  describe('Concurrent Golden Paths', () => {
    it('should handle 10 tickets flowing through simultaneously', async () => {
      const ticketPromises = Array.from({ length: 10 }, async (_, i) => {
        // Create ticket
        const ticket = await request(app.getHttpServer())
          .post('/v1/tickets')
          .send({
            title: `Concurrent Issue ${i + 1}`,
            description: `Test issue ${i + 1}`,
            priority: 'medium',
            status: 'new',
            tenantId: `tenant-concurrent-${String(i + 1).padStart(3, '0')}`,
            unitId: `unit-concurrent-${String(i + 1).padStart(3, '0')}`,
            propertyId: 'property-concurrent-001',
          })
          .expect(201);

        return ticket.body.id;
      });

      const ticketIds = await Promise.all(ticketPromises);

      // All 10 tickets should be created successfully
      expect(ticketIds.length).toBe(10);
      expect(new Set(ticketIds).size).toBe(10); // All unique IDs

      console.log(`✅ Created ${ticketIds.length} concurrent tickets`);
    });
  });
});
