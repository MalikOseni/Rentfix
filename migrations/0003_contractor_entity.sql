-- Migration: 0003_contractor_entity.sql
-- Description: Add contractors table for self-service contractor registration
-- Author: Claude Code
-- Date: 2025-12-11

-- Create contractor status enum
DO $$ BEGIN
    CREATE TYPE contractor_status AS ENUM (
        'pending',
        'background_check_requested',
        'background_check_passed',
        'background_check_failed',
        'verified',
        'suspended',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create background check status enum
DO $$ BEGIN
    CREATE TYPE background_check_status AS ENUM (
        'not_started',
        'requested',
        'in_progress',
        'passed',
        'failed',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    insurance_cert_url VARCHAR(512),
    insurance_expiry DATE,
    bank_account_hash VARCHAR(255) NOT NULL,
    bank_account_last_four VARCHAR(4) NOT NULL,
    status contractor_status NOT NULL DEFAULT 'pending',
    background_check_status background_check_status NOT NULL DEFAULT 'not_started',
    background_check_id VARCHAR(128),
    background_check_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    service_area JSONB,
    average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
    total_jobs_completed INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_specialties ON contractors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_contractors_service_area ON contractors USING GIN(service_area);
CREATE INDEX IF NOT EXISTS idx_contractors_background_check_status
    ON contractors(background_check_status) WHERE deleted_at IS NULL;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contractors_updated_at ON contractors;
CREATE TRIGGER trigger_contractors_updated_at
    BEFORE UPDATE ON contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_contractors_updated_at();

-- Add comments for documentation
COMMENT ON TABLE contractors IS 'Contractor profiles for self-service registration (no invite required)';
COMMENT ON COLUMN contractors.specialties IS 'Array of specialties (plumbing, hvac, electrical, etc.)';
COMMENT ON COLUMN contractors.service_area IS 'Service area definition: postcodes array, radius_km, center coordinates';
COMMENT ON COLUMN contractors.bank_account_hash IS 'Argon2id hash of bank account details';
COMMENT ON COLUMN contractors.bank_account_last_four IS 'Last 4 digits of bank account for display';
COMMENT ON COLUMN contractors.background_check_id IS 'External background check reference ID';
