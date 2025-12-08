
-- Extensions required
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enumerated types
CREATE TYPE user_role AS ENUM ('tenant', 'agent', 'contractor', 'admin');
CREATE TYPE ticket_status AS ENUM ('new', 'triaged', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE evidence_type AS ENUM ('photo', 'video');
CREATE TYPE contractor_availability_status AS ENUM ('available', 'unavailable', 'on_leave', 'busy');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'disputed');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'cash', 'other');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');
CREATE TYPE assignment_status AS ENUM ('scheduled', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Users and identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- tenant isolation scope; nullable for platform users
    name TEXT NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    password_hash TEXT,
    verification_status TEXT DEFAULT 'unverified',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

-- Tenancy and actor profiles
CREATE TABLE tenants (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID,
    lease_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agents (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contractors (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trade TEXT NOT NULL,
    certifications TEXT,
    coverage_area JSONB,
    rating NUMERIC(3,2),
    reliability_score NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties and units
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- multi-tenant partitioning key
    address TEXT NOT NULL,
    landlord_id UUID,
    agent_id UUID REFERENCES agents(user_id),
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    occupancy_status TEXT,
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets and assignment lifecycle
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(user_id),
    issue_type TEXT NOT NULL,
    description TEXT,
    urgency TEXT,
    responsibility_suggestion TEXT,
    status ticket_status NOT NULL DEFAULT 'new',
    assigned_contractor_id UUID REFERENCES contractors(user_id),
    sla_response_at TIMESTAMPTZ,
    sla_resolution_at TIMESTAMPTZ,
    ai_confidence NUMERIC(5,2),
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_state_history (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    state ticket_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    type evidence_type NOT NULL,
    captured_by UUID REFERENCES users(id),
    metadata JSONB,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(user_id),
    scheduled_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rating_by_agent NUMERIC(3,2),
    rating_by_tenant NUMERIC(3,2),
    final_status assignment_status DEFAULT 'scheduled',
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contractor_availability (
    id BIGSERIAL PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES contractors(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    timeslot TSRANGE NOT NULL,
    status contractor_availability_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    method payment_method NOT NULL DEFAULT 'card',
    metadata JSONB,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    message_template_id TEXT,
    payload JSONB,
    delivered_at TIMESTAMPTZ,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_tickets_unit ON tickets(unit_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_history_ticket ON ticket_state_history(ticket_id);
CREATE INDEX idx_evidence_ticket ON evidence(ticket_id);
CREATE INDEX idx_assignments_contractor ON assignments(contractor_id);
CREATE INDEX idx_payments_assignment ON payments(assignment_id);
CREATE INDEX idx_notification_user ON notification_logs(user_id);

-- Row-level security placeholders (enable per environment)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_users ON users USING (tenant_id = current_setting('app.current_tenant')::uuid);

