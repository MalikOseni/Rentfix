-- Migration: strengthened auth and tenancy primitives
BEGIN;

-- Users: normalized email, phone, soft deletion, login telemetry
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_normalized CITEXT;
UPDATE users SET email_normalized = LOWER(email) WHERE email_normalized IS NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_email_normalized UNIQUE (email_normalized);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    company_registration_number VARCHAR(50),
    stripe_customer_id VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'free',
    status VARCHAR(50) DEFAULT 'active',
    properties_quota INT DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_owner ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(status);

-- Roles with tenant linkage and permissions
ALTER TABLE roles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permission_grants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Refresh token hardening
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);

-- OTP table for email verification
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    temporary_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    use_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otps_user ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(64) NOT NULL,
    ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

COMMIT;
