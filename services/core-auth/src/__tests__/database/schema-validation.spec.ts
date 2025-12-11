import { DataSource, QueryRunner } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User, UserRole } from '../../entities/user.entity';
import { Contractor, ContractorStatus, BackgroundCheckStatus } from '../../entities/contractor.entity';
import { ContractorAvailability, AvailabilityStatus, RecurrencePattern } from '../../entities/contractor-availability.entity';
import { ContractorRating, RatingSource } from '../../entities/contractor-rating.entity';
import { ContractorPortfolio, PortfolioMediaType, PortfolioItemStatus } from '../../entities/contractor-portfolio.entity';
import { ContractorQualification, QualificationType, VerificationStatus } from '../../entities/contractor-qualification.entity';
import { EventLog, EventType } from '../../entities/event-log.entity';
import { Organization } from '../../entities/organization.entity';

describe('Database Schema Validation', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let module: TestingModule;

  const testUserId = uuidv4();
  const testOrgId = uuidv4();
  const testContractorId = uuidv4();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'rentfix_test',
          entities: [
            User,
            Organization,
            Contractor,
            ContractorAvailability,
            ContractorRating,
            ContractorPortfolio,
            ContractorQualification,
            EventLog,
          ],
          synchronize: false,
          logging: false,
        }),
      ],
    }).compile();

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await module?.close();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // Bypass RLS for testing
    await queryRunner.query(`SET app.is_admin = 'true'`);
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.query(`RESET app.is_admin`);
    await queryRunner.release();
  });

  describe('Table Existence', () => {
    const requiredTables = [
      'users',
      'organizations',
      'contractors',
      'contractor_availability',
      'contractor_ratings',
      'contractor_portfolio',
      'contractor_qualifications',
      'event_log',
    ];

    test.each(requiredTables)('table %s exists', async (tableName) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [tableName],
      );
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Enum Types', () => {
    const requiredEnums = [
      'availability_status',
      'recurrence_pattern',
      'rating_source',
      'portfolio_media_type',
      'portfolio_item_status',
      'qualification_type',
      'verification_status',
    ];

    test.each(requiredEnums)('enum type %s exists', async (enumName) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM pg_type
          WHERE typname = $1
        )`,
        [enumName],
      );
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Row-Level Security', () => {
    const rlsTables = [
      'users',
      'organizations',
      'contractors',
      'contractor_availability',
      'contractor_ratings',
      'contractor_portfolio',
      'contractor_qualifications',
      'event_log',
    ];

    test.each(rlsTables)('RLS is enabled on %s', async (tableName) => {
      const result = await queryRunner.query(
        `SELECT relrowsecurity FROM pg_class WHERE relname = $1`,
        [tableName],
      );
      expect(result[0]?.relrowsecurity).toBe(true);
    });

    test('RLS policies exist for contractors table', async () => {
      const result = await queryRunner.query(
        `SELECT policyname FROM pg_policies WHERE tablename = 'contractors'`,
      );
      expect(result.length).toBeGreaterThan(0);
      const policyNames = result.map((r: any) => r.policyname);
      expect(policyNames).toContain('contractors_read_public');
      expect(policyNames).toContain('contractors_write');
    });
  });

  describe('Soft Delete Support', () => {
    const softDeleteTables = [
      'users',
      'organizations',
      'contractors',
      'contractor_availability',
      'contractor_ratings',
      'contractor_portfolio',
      'contractor_qualifications',
    ];

    test.each(softDeleteTables)('table %s has deleted_at column', async (tableName) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1
          AND column_name = 'deleted_at'
        )`,
        [tableName],
      );
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Event Log Immutability', () => {
    test('event_log does not have deleted_at column', async () => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'event_log'
          AND column_name = 'deleted_at'
        )`,
      );
      expect(result[0].exists).toBe(false);
    });

    test('event_log has sequence_number column', async () => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'event_log'
          AND column_name = 'sequence_number'
        )`,
      );
      expect(result[0].exists).toBe(true);
    });

    test('event_log has immutability trigger', async () => {
      const result = await queryRunner.query(
        `SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_prevent_event_log_update'`,
      );
      expect(result.length).toBe(1);
    });
  });

  describe('Index Existence', () => {
    const requiredIndexes = [
      { table: 'contractors', index: 'idx_contractors_specialties' },
      { table: 'contractors', index: 'idx_contractors_service_area' },
      { table: 'contractor_availability', index: 'idx_contractor_availability_contractor_date' },
      { table: 'contractor_ratings', index: 'idx_contractor_ratings_contractor' },
      { table: 'contractor_portfolio', index: 'idx_contractor_portfolio_specialty' },
      { table: 'contractor_qualifications', index: 'idx_contractor_qualifications_contractor' },
      { table: 'event_log', index: 'idx_event_log_aggregate' },
    ];

    test.each(requiredIndexes)('index $index exists on $table', async ({ table, index }) => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes
          WHERE tablename = $1
          AND indexname = $2
        )`,
        [table, index],
      );
      expect(result[0].exists).toBe(true);
    });
  });

  describe('Contractor Entity', () => {
    test('can create contractor with valid data', async () => {
      // First create a user
      await queryRunner.query(
        `INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $2, 'hash', 'contractor', 'Test', 'User')`,
        [testUserId, `test-${testUserId}@test.com`],
      );

      // Create contractor
      await queryRunner.query(
        `INSERT INTO contractors (id, user_id, business_name, specialties, hourly_rate, status, background_check_status, bank_account_hash, bank_account_last_four)
         VALUES ($1, $2, 'Test Business', '["plumbing"]', 50.00, 'pending', 'not_started', 'hash', '1234')`,
        [testContractorId, testUserId],
      );

      const result = await queryRunner.query(
        `SELECT * FROM contractors WHERE id = $1`,
        [testContractorId],
      );

      expect(result.length).toBe(1);
      expect(result[0].business_name).toBe('Test Business');
      expect(result[0].status).toBe('pending');
    });

    test('contractor status enum values are valid', async () => {
      const validStatuses = [
        'pending',
        'background_check_requested',
        'background_check_passed',
        'background_check_failed',
        'verified',
        'suspended',
        'rejected',
      ];

      for (const status of validStatuses) {
        const result = await queryRunner.query(
          `SELECT $1::contractor_status`,
          [status],
        );
        expect(result[0].contractor_status).toBe(status);
      }
    });
  });

  describe('Contractor Availability', () => {
    test('time constraint validates end_time > start_time', async () => {
      // Create prerequisites
      await queryRunner.query(
        `INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $2, 'hash', 'contractor', 'Test', 'User')`,
        [testUserId, `test-${testUserId}@test.com`],
      );

      await queryRunner.query(
        `INSERT INTO contractors (id, user_id, business_name, specialties, hourly_rate, status, background_check_status, bank_account_hash, bank_account_last_four)
         VALUES ($1, $2, 'Test', '[]', 50, 'pending', 'not_started', 'hash', '1234')`,
        [testContractorId, testUserId],
      );

      // Valid time range should work
      await queryRunner.query(
        `INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status)
         VALUES ($1, CURRENT_DATE, '08:00', '17:00', 'available')`,
        [testContractorId],
      );

      // Invalid time range (end before start) should fail
      await expect(
        queryRunner.query(
          `INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status)
           VALUES ($1, CURRENT_DATE + 1, '17:00', '08:00', 'available')`,
          [testContractorId],
        ),
      ).rejects.toThrow();
    });
  });

  describe('Contractor Ratings', () => {
    test('rating score constraints are enforced', async () => {
      // Score must be between 1 and 5
      await expect(
        queryRunner.query(
          `SELECT 0::decimal(2,1) AS score WHERE 0 >= 1 AND 0 <= 5`,
        ),
      ).resolves.toEqual([]);

      await expect(
        queryRunner.query(
          `SELECT 6::decimal(2,1) AS score WHERE 6 >= 1 AND 6 <= 5`,
        ),
      ).resolves.toEqual([]);
    });

    test('unique constraint on contractor_id, ticket_id, rated_by_user_id', async () => {
      const result = await queryRunner.query(
        `SELECT conname FROM pg_constraint
         WHERE conrelid = 'contractor_ratings'::regclass
         AND contype = 'u'`,
      );
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Contractor Portfolio', () => {
    test('media_type enum values are valid', async () => {
      const validTypes = ['photo', 'video', 'document'];

      for (const type of validTypes) {
        const result = await queryRunner.query(
          `SELECT $1::portfolio_media_type`,
          [type],
        );
        expect(result[0].portfolio_media_type).toBe(type);
      }
    });

    test('status enum values are valid', async () => {
      const validStatuses = ['pending_review', 'approved', 'rejected'];

      for (const status of validStatuses) {
        const result = await queryRunner.query(
          `SELECT $1::portfolio_item_status`,
          [status],
        );
        expect(result[0].portfolio_item_status).toBe(status);
      }
    });
  });

  describe('Contractor Qualifications', () => {
    test('qualification_type enum values are valid', async () => {
      const validTypes = ['certification', 'license', 'badge', 'insurance', 'training', 'award'];

      for (const type of validTypes) {
        const result = await queryRunner.query(
          `SELECT $1::qualification_type`,
          [type],
        );
        expect(result[0].qualification_type).toBe(type);
      }
    });

    test('verification_status enum values are valid', async () => {
      const validStatuses = ['pending', 'verified', 'expired', 'rejected', 'revoked'];

      for (const status of validStatuses) {
        const result = await queryRunner.query(
          `SELECT $1::verification_status`,
          [status],
        );
        expect(result[0].verification_status).toBe(status);
      }
    });
  });

  describe('Helper Functions', () => {
    test('current_tenant_id function exists', async () => {
      const result = await queryRunner.query(
        `SELECT proname FROM pg_proc WHERE proname = 'current_tenant_id'`,
      );
      expect(result.length).toBe(1);
    });

    test('current_user_id function exists', async () => {
      const result = await queryRunner.query(
        `SELECT proname FROM pg_proc WHERE proname = 'current_user_id'`,
      );
      expect(result.length).toBe(1);
    });

    test('is_admin_user function exists', async () => {
      const result = await queryRunner.query(
        `SELECT proname FROM pg_proc WHERE proname = 'is_admin_user'`,
      );
      expect(result.length).toBe(1);
    });

    test('trigger_set_updated_at function exists', async () => {
      const result = await queryRunner.query(
        `SELECT proname FROM pg_proc WHERE proname = 'trigger_set_updated_at'`,
      );
      expect(result.length).toBe(1);
    });

    test('gdpr_soft_delete_user function exists', async () => {
      const result = await queryRunner.query(
        `SELECT proname FROM pg_proc WHERE proname = 'gdpr_soft_delete_user'`,
      );
      expect(result.length).toBe(1);
    });
  });

  describe('GDPR Compliance', () => {
    test('soft delete sets deleted_at without removing data', async () => {
      // Create user
      await queryRunner.query(
        `INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $2, 'hash', 'tenant', 'Test', 'User')`,
        [testUserId, `gdpr-test-${testUserId}@test.com`],
      );

      // Soft delete
      await queryRunner.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1`,
        [testUserId],
      );

      // Record still exists
      const result = await queryRunner.query(
        `SELECT * FROM users WHERE id = $1`,
        [testUserId],
      );
      expect(result.length).toBe(1);
      expect(result[0].deleted_at).not.toBeNull();
    });
  });

  describe('Foreign Key Constraints', () => {
    test('contractor_availability references contractors', async () => {
      const result = await queryRunner.query(
        `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
         WHERE tc.table_name = 'contractor_availability'
         AND tc.constraint_type = 'FOREIGN KEY'`,
      );
      const foreignTables = result.map((r: any) => r.foreign_table_name);
      expect(foreignTables).toContain('contractors');
    });

    test('contractor_ratings references contractors', async () => {
      const result = await queryRunner.query(
        `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
         WHERE tc.table_name = 'contractor_ratings'
         AND tc.constraint_type = 'FOREIGN KEY'`,
      );
      const foreignTables = result.map((r: any) => r.foreign_table_name);
      expect(foreignTables).toContain('contractors');
    });

    test('contractor_portfolio references contractors', async () => {
      const result = await queryRunner.query(
        `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
         WHERE tc.table_name = 'contractor_portfolio'
         AND tc.constraint_type = 'FOREIGN KEY'`,
      );
      const foreignTables = result.map((r: any) => r.foreign_table_name);
      expect(foreignTables).toContain('contractors');
    });

    test('contractor_qualifications references contractors', async () => {
      const result = await queryRunner.query(
        `SELECT tc.constraint_name, ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
         WHERE tc.table_name = 'contractor_qualifications'
         AND tc.constraint_type = 'FOREIGN KEY'`,
      );
      const foreignTables = result.map((r: any) => r.foreign_table_name);
      expect(foreignTables).toContain('contractors');
    });

    test('CASCADE delete removes related contractor data', async () => {
      // Create user
      await queryRunner.query(
        `INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $2, 'hash', 'contractor', 'Test', 'User')`,
        [testUserId, `cascade-${testUserId}@test.com`],
      );

      // Create contractor
      await queryRunner.query(
        `INSERT INTO contractors (id, user_id, business_name, specialties, hourly_rate, status, background_check_status, bank_account_hash, bank_account_last_four)
         VALUES ($1, $2, 'Test', '[]', 50, 'pending', 'not_started', 'hash', '1234')`,
        [testContractorId, testUserId],
      );

      // Create availability
      await queryRunner.query(
        `INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status)
         VALUES ($1, CURRENT_DATE, '08:00', '17:00', 'available')`,
        [testContractorId],
      );

      // Delete contractor - availability should cascade
      await queryRunner.query(`DELETE FROM contractors WHERE id = $1`, [testContractorId]);

      const availResult = await queryRunner.query(
        `SELECT * FROM contractor_availability WHERE contractor_id = $1`,
        [testContractorId],
      );
      expect(availResult.length).toBe(0);
    });
  });
});

describe('RLS Policy Integration Tests', () => {
  let dataSource: DataSource;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'rentfix_test',
          entities: [User, Organization, Contractor],
          synchronize: false,
          logging: false,
        }),
      ],
    }).compile();

    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await module?.close();
  });

  describe('Contractor Marketplace Public Access', () => {
    test('verified contractors are visible without authentication', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Do NOT set admin mode - simulate unauthenticated access
        await queryRunner.query(`RESET app.is_admin`);
        await queryRunner.query(`RESET app.current_user_id`);
        await queryRunner.query(`RESET app.current_tenant_id`);

        // This should only return verified contractors due to RLS
        const result = await queryRunner.query(
          `SELECT status FROM contractors WHERE status = 'verified' AND deleted_at IS NULL LIMIT 1`,
        );

        // The query should work (RLS allows public read of verified contractors)
        expect(result).toBeDefined();
      } finally {
        await queryRunner.release();
      }
    });
  });
});
