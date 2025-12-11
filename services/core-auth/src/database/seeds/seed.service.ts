import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

interface SeedUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'agent' | 'contractor' | 'tenant';
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
}

interface SeedContractor {
  id: string;
  userId: string;
  businessName: string;
  specialties: string[];
  hourlyRate: number;
  status: 'pending' | 'verified' | 'background_check_requested';
  backgroundCheckStatus: string;
  serviceArea: Record<string, unknown>;
  averageRating: number;
  totalJobsCompleted: number;
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development' && process.env.AUTO_SEED === 'true') {
      await this.seed();
    }
  }

  async seed(): Promise<void> {
    this.logger.log('Starting database seed...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set admin context to bypass RLS
      await queryRunner.query(`SET app.is_admin = 'true'`);

      // Seed users
      const users = await this.seedUsers(queryRunner);
      this.logger.log(`Seeded ${users.length} users`);

      // Seed organizations
      const orgs = await this.seedOrganizations(queryRunner, users);
      this.logger.log(`Seeded ${orgs.length} organizations`);

      // Seed contractors
      const contractors = await this.seedContractors(queryRunner, users);
      this.logger.log(`Seeded ${contractors.length} contractors`);

      // Seed contractor availability
      await this.seedContractorAvailability(queryRunner, contractors);
      this.logger.log('Seeded contractor availability');

      // Seed contractor ratings
      await this.seedContractorRatings(queryRunner, contractors, users, orgs);
      this.logger.log('Seeded contractor ratings');

      // Seed contractor portfolio
      await this.seedContractorPortfolio(queryRunner, contractors);
      this.logger.log('Seeded contractor portfolio');

      // Seed contractor qualifications
      await this.seedContractorQualifications(queryRunner, contractors);
      this.logger.log('Seeded contractor qualifications');

      await queryRunner.commitTransaction();
      this.logger.log('Database seed completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Database seed failed', error);
      throw error;
    } finally {
      await queryRunner.query(`RESET app.is_admin`);
      await queryRunner.release();
    }
  }

  private async seedUsers(queryRunner: any): Promise<SeedUser[]> {
    const users: SeedUser[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@seed.test',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        phone: '+447700900001',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'manager@seed.test',
        password: 'Manager123!',
        role: 'agent',
        firstName: 'Sarah',
        lastName: 'Manager',
        phone: '+447700900002',
        tenantId: 'org-001',
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'tenant@seed.test',
        password: 'Tenant123!',
        role: 'tenant',
        firstName: 'Alice',
        lastName: 'Tenant',
        phone: '+447700900004',
        tenantId: 'org-001',
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'plumber@seed.test',
        password: 'Plumber123!',
        role: 'contractor',
        firstName: 'Bob',
        lastName: 'Plumber',
        phone: '+447700900005',
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'electrician@seed.test',
        password: 'Electrician123!',
        role: 'contractor',
        firstName: 'Carol',
        lastName: 'Sparks',
        phone: '+447700900006',
      },
    ];

    for (const user of users) {
      const passwordHash = await argon2.hash(user.password);

      await queryRunner.query(
        `INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, phone_e164, tenant_id, email_verified)
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.id,
          user.email.toLowerCase(),
          passwordHash,
          user.role,
          user.firstName,
          user.lastName,
          user.phone,
          user.tenantId,
        ],
      );
    }

    return users;
  }

  private async seedOrganizations(queryRunner: any, users: SeedUser[]): Promise<any[]> {
    const orgs = [
      {
        id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        ownerUserId: users.find((u) => u.role === 'agent')?.id,
        name: 'Seed Property Management Ltd',
        plan: 'professional',
        status: 'active',
        propertiesQuota: 50,
      },
    ];

    for (const org of orgs) {
      await queryRunner.query(
        `INSERT INTO organizations (id, owner_user_id, name, plan, status, properties_quota)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [org.id, org.ownerUserId, org.name, org.plan, org.status, org.propertiesQuota],
      );
    }

    return orgs;
  }

  private async seedContractors(queryRunner: any, users: SeedUser[]): Promise<SeedContractor[]> {
    const contractors: SeedContractor[] = [
      {
        id: 'c1111111-1111-1111-1111-111111111111',
        userId: '55555555-5555-5555-5555-555555555555',
        businessName: "Bob's Premium Plumbing",
        specialties: ['plumbing', 'drainage', 'water_heater', 'emergency'],
        hourlyRate: 65.0,
        status: 'verified',
        backgroundCheckStatus: 'passed',
        serviceArea: { postcodes: ['SW1', 'SW2', 'SW3'], radius_km: 15 },
        averageRating: 4.8,
        totalJobsCompleted: 156,
      },
      {
        id: 'c2222222-2222-2222-2222-222222222222',
        userId: '66666666-6666-6666-6666-666666666666',
        businessName: 'Sparks Electrical Services',
        specialties: ['electrical', 'lighting', 'rewiring', 'ev_charging'],
        hourlyRate: 75.0,
        status: 'verified',
        backgroundCheckStatus: 'passed',
        serviceArea: { postcodes: ['E1', 'E2', 'EC1'], radius_km: 20 },
        averageRating: 4.9,
        totalJobsCompleted: 234,
      },
    ];

    for (const contractor of contractors) {
      const bankAccountHash = await argon2.hash('1234567890');

      await queryRunner.query(
        `INSERT INTO contractors (id, user_id, business_name, specialties, hourly_rate, status, background_check_status, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '4321', NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [
          contractor.id,
          contractor.userId,
          contractor.businessName,
          JSON.stringify(contractor.specialties),
          contractor.hourlyRate,
          contractor.status,
          contractor.backgroundCheckStatus,
          JSON.stringify(contractor.serviceArea),
          contractor.averageRating,
          contractor.totalJobsCompleted,
          bankAccountHash,
        ],
      );
    }

    return contractors;
  }

  private async seedContractorAvailability(queryRunner: any, contractors: SeedContractor[]): Promise<void> {
    const today = new Date();

    for (const contractor of contractors) {
      // Create availability for next 7 days (weekdays only)
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        await queryRunner.query(
          `INSERT INTO contractor_availability (id, contractor_id, date, start_time, end_time, status, max_jobs)
           VALUES ($1, $2, $3, '08:00', '18:00', 'available', 3)
           ON CONFLICT DO NOTHING`,
          [uuidv4(), contractor.id, date.toISOString().split('T')[0]],
        );
      }
    }
  }

  private async seedContractorRatings(
    queryRunner: any,
    contractors: SeedContractor[],
    users: SeedUser[],
    orgs: any[],
  ): Promise<void> {
    const tenant = users.find((u) => u.role === 'tenant');
    const org = orgs[0];

    for (const contractor of contractors) {
      await queryRunner.query(
        `INSERT INTO contractor_ratings (id, contractor_id, ticket_id, organization_id, rated_by_user_id, source, overall_score, quality_score, punctuality_score, review, is_public, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'tenant', 4.8, 5.0, 4.5, 'Great service!', true, true)
         ON CONFLICT DO NOTHING`,
        [uuidv4(), contractor.id, uuidv4(), org.id, tenant?.id],
      );
    }
  }

  private async seedContractorPortfolio(queryRunner: any, contractors: SeedContractor[]): Promise<void> {
    for (const contractor of contractors) {
      await queryRunner.query(
        `INSERT INTO contractor_portfolio (id, contractor_id, title, description, media_type, media_url, specialty, tags, status, is_featured, display_order)
         VALUES ($1, $2, $3, $4, 'photo', $5, $6, $7, 'approved', true, 1)
         ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          contractor.id,
          `Sample ${contractor.specialties[0]} work`,
          `High quality ${contractor.specialties[0]} services`,
          `https://storage.rentfix.test/portfolio/${contractor.id}.jpg`,
          contractor.specialties[0],
          JSON.stringify(contractor.specialties.slice(0, 2)),
        ],
      );
    }
  }

  private async seedContractorQualifications(queryRunner: any, contractors: SeedContractor[]): Promise<void> {
    const qualifications = [
      {
        type: 'certification',
        name: 'Trade Certification',
        issuingBody: 'City & Guilds',
      },
      {
        type: 'insurance',
        name: 'Public Liability Insurance',
        issuingBody: 'Zurich Insurance',
      },
    ];

    for (const contractor of contractors) {
      for (const qual of qualifications) {
        await queryRunner.query(
          `INSERT INTO contractor_qualifications (id, contractor_id, type, name, issuing_body, issued_at, verification_status, verified_at, is_public, specialties)
           VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '1 year', 'verified', NOW(), true, $6)
           ON CONFLICT DO NOTHING`,
          [uuidv4(), contractor.id, qual.type, qual.name, qual.issuingBody, JSON.stringify(contractor.specialties)],
        );
      }
    }
  }

  async clearSeedData(): Promise<void> {
    this.logger.log('Clearing seed data...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`SET app.is_admin = 'true'`);

      await queryRunner.query(`DELETE FROM contractor_qualifications WHERE contractor_id IN (SELECT c.id FROM contractors c JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test')`);
      await queryRunner.query(`DELETE FROM contractor_portfolio WHERE contractor_id IN (SELECT c.id FROM contractors c JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test')`);
      await queryRunner.query(`DELETE FROM contractor_ratings WHERE contractor_id IN (SELECT c.id FROM contractors c JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test')`);
      await queryRunner.query(`DELETE FROM contractor_availability WHERE contractor_id IN (SELECT c.id FROM contractors c JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test')`);
      await queryRunner.query(`DELETE FROM contractors WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@seed.test')`);
      await queryRunner.query(`DELETE FROM organizations WHERE name LIKE 'Seed %'`);
      await queryRunner.query(`DELETE FROM users WHERE email LIKE '%@seed.test'`);

      await queryRunner.commitTransaction();
      this.logger.log('Seed data cleared successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to clear seed data', error);
      throw error;
    } finally {
      await queryRunner.query(`RESET app.is_admin`);
      await queryRunner.release();
    }
  }
}
