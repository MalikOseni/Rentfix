import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1700000000000 implements MigrationInterface {
  name = 'CreateAuthTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "email_normalized" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(50) NOT NULL DEFAULT 'tenant',
        "tenant_id" varchar(64),
        "phone_e164" varchar(20),
        "first_name" varchar(120),
        "last_name" varchar(120),
        "email_verified" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "otp_hash" varchar(255),
        "otp_created_at" timestamp,
        "otp_expires_at" timestamp,
        "otp_use_count" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "failed_login_at" timestamp,
        "last_login" timestamp,
        "last_login_ip" inet,
        "last_login_user_agent" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "UQ_users_email_normalized" UNIQUE ("email_normalized")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_user_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "company_registration_number" varchar(50),
        "stripe_customer_id" varchar(255),
        "plan" varchar(50) NOT NULL DEFAULT 'free',
        "plan_expires_at" timestamp,
        "status" varchar(50) NOT NULL DEFAULT 'active',
        "properties_quota" integer NOT NULL DEFAULT 5,
        "teams_quota" integer NOT NULL DEFAULT 1,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "CHK_organizations_plan" CHECK (plan IN ('free','pro','enterprise')),
        CONSTRAINT "CHK_organizations_name_length" CHECK (char_length(name) BETWEEN 2 AND 100),
        CONSTRAINT "FK_organizations_owner_user" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "role_name" varchar(50) NOT NULL,
        "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "UQ_roles_user_org_deleted_at" UNIQUE ("user_id", "organization_id", "deleted_at"),
        CONSTRAINT "FK_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_roles_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_invites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "property_id" uuid NOT NULL,
        "invited_email_normalized" varchar(255) NOT NULL,
        "invited_phone_e164" varchar(20),
        "invite_token_hash" varchar(255) NOT NULL,
        "token_expires_at" timestamp NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "created_by_agent_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "sent_at" timestamp,
        "accepted_at" timestamp,
        "deleted_at" timestamp,
        CONSTRAINT "UQ_tenant_invites_invite_token_hash" UNIQUE ("invite_token_hash"),
        CONSTRAINT "FK_tenant_invites_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_invites_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_invites_creator" FOREIGN KEY ("created_by_agent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "token_version" integer NOT NULL DEFAULT 1,
        "device_fingerprint" varchar(255),
        "ip_address" inet,
        "expires_at" timestamp NOT NULL,
        "revoked_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp,
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "login_attempts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email_normalized" varchar(255),
        "ip_address" inet NOT NULL,
        "status" varchar(50),
        "reason" varchar(255),
        "user_agent" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "action" varchar(50) NOT NULL,
        "user_id" uuid,
        "organization_id" uuid,
        "resource_type" varchar(50),
        "resource_id" uuid,
        "details" jsonb,
        "ip_address" inet,
        "user_agent" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_audit_logs_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query('CREATE INDEX "idx_users_deleted_at" ON "users" ("deleted_at")');
    await queryRunner.query('CREATE INDEX "idx_users_created_at" ON "users" ("created_at")');
    await queryRunner.query('CREATE INDEX "idx_users_deleted_at_null" ON "users" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_organizations_owner_user_id" ON "organizations" ("owner_user_id")');
    await queryRunner.query('CREATE INDEX "idx_organizations_status" ON "organizations" ("status")');
    await queryRunner.query('CREATE INDEX "idx_organizations_plan" ON "organizations" ("plan")');
    await queryRunner.query('CREATE INDEX "idx_organizations_deleted_at" ON "organizations" ("deleted_at")');
    await queryRunner.query('CREATE INDEX "idx_organizations_deleted_at_null" ON "organizations" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_roles_user_id" ON "roles" ("user_id")');
    await queryRunner.query('CREATE INDEX "idx_roles_organization_id" ON "roles" ("organization_id")');
    await queryRunner.query('CREATE INDEX "idx_roles_user_organization" ON "roles" ("user_id", "organization_id")');
    await queryRunner.query(
      'CREATE UNIQUE INDEX "uq_roles_user_org_active" ON "roles" ("user_id", "organization_id") WHERE "deleted_at" IS NULL'
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "uq_roles_user_org_deleted_at" ON "roles" ("user_id", "organization_id", "deleted_at")'
    );
    await queryRunner.query('CREATE INDEX "idx_roles_deleted_at_null" ON "roles" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_tenant_invites_property_status" ON "tenant_invites" ("property_id", "status")');
    await queryRunner.query('CREATE INDEX "idx_tenant_invites_token_expires_at" ON "tenant_invites" ("token_expires_at")');
    await queryRunner.query(
      'CREATE UNIQUE INDEX "idx_tenant_invites_invite_token_hash" ON "tenant_invites" ("invite_token_hash")'
    );
    await queryRunner.query('CREATE INDEX "idx_tenant_invites_deleted_at_null" ON "tenant_invites" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")');
    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_user_expires" ON "refresh_tokens" ("user_id", "expires_at")');
    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_revoked_at" ON "refresh_tokens" ("revoked_at")');
    await queryRunner.query('CREATE INDEX "idx_refresh_tokens_deleted_at_null" ON "refresh_tokens" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_login_attempts_email_created" ON "login_attempts" ("email_normalized", "created_at")');
    await queryRunner.query('CREATE INDEX "idx_login_attempts_ip_created" ON "login_attempts" ("ip_address", "created_at")');
    await queryRunner.query('CREATE INDEX "idx_login_attempts_deleted_at_null" ON "login_attempts" ("deleted_at") WHERE "deleted_at" IS NULL');

    await queryRunner.query('CREATE INDEX "idx_audit_logs_user_created" ON "audit_logs" ("user_id", "created_at")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_org_created" ON "audit_logs" ("organization_id", "created_at")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action")');

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs is immutable';
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(
      'CREATE TRIGGER "trg_audit_logs_no_update" BEFORE UPDATE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation()'
    );
    await queryRunner.query(
      'CREATE TRIGGER "trg_audit_logs_no_delete" BEFORE DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation()'
    );

    await queryRunner.query(
      'CREATE TRIGGER "trg_users_updated_at" BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()'
    );
    await queryRunner.query(
      'CREATE TRIGGER "trg_organizations_updated_at" BEFORE UPDATE ON "organizations" FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS "trg_audit_logs_no_delete" ON "audit_logs"');
    await queryRunner.query('DROP TRIGGER IF EXISTS "trg_audit_logs_no_update" ON "audit_logs"');
    await queryRunner.query('DROP TRIGGER IF EXISTS "trg_organizations_updated_at" ON "organizations"');
    await queryRunner.query('DROP TRIGGER IF EXISTS "trg_users_updated_at" ON "users"');

    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "login_attempts"');
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
    await queryRunner.query('DROP TABLE IF EXISTS "tenant_invites"');
    await queryRunner.query('DROP TABLE IF EXISTS "roles"');
    await queryRunner.query('DROP TABLE IF EXISTS "organizations"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');

    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_audit_log_mutation');
    await queryRunner.query('DROP FUNCTION IF EXISTS set_updated_at_timestamp');
  }
}
