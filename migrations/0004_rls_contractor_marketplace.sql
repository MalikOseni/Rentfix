-- Migration: 0004_rls_contractor_marketplace.sql
-- Description: Complete RLS policies for multi-tenancy + contractor marketplace tables
-- Author: Claude Code
-- Date: 2025-12-11
--
-- This migration implements:
-- 1. Row-Level Security (RLS) for multi-tenant data isolation
-- 2. Contractor marketplace tables (availability, ratings, portfolio, qualifications)
-- 3. Immutable event log for event sourcing
-- 4. Performance indexes for marketplace search
-- 5. Soft delete support (GDPR compliant)

-- ============================================================================
-- SECTION 1: PREREQUISITES & HELPER FUNCTIONS
-- ============================================================================

-- Create function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_admin', true), 'false')::BOOLEAN;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to check if current user is a contractor
CREATE OR REPLACE FUNCTION is_contractor_user() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_contractor', true), 'false')::BOOLEAN;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM (
        'available', 'unavailable', 'on_leave', 'busy', 'booked'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_pattern AS ENUM (
        'none', 'daily', 'weekly', 'biweekly', 'monthly'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rating_source AS ENUM (
        'tenant', 'agent', 'landlord'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE portfolio_media_type AS ENUM (
        'photo', 'video', 'document'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE portfolio_item_status AS ENUM (
        'pending_review', 'approved', 'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE qualification_type AS ENUM (
        'certification', 'license', 'badge', 'insurance', 'training', 'award'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending', 'verified', 'expired', 'rejected', 'revoked'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 3: CONTRACTOR MARKETPLACE TABLES
-- ============================================================================

-- 3.1 Contractor Availability (Calendar Slots)
CREATE TABLE IF NOT EXISTS contractor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status availability_status NOT NULL DEFAULT 'available',
    recurrence_pattern recurrence_pattern NOT NULL DEFAULT 'none',
    recurrence_end_date DATE,
    max_jobs INTEGER NOT NULL DEFAULT 1,
    booked_jobs INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    service_area_override JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT check_time_order CHECK (end_time > start_time),
    CONSTRAINT check_max_jobs_positive CHECK (max_jobs > 0),
    CONSTRAINT check_booked_jobs_valid CHECK (booked_jobs >= 0 AND booked_jobs <= max_jobs)
);

CREATE INDEX IF NOT EXISTS idx_contractor_availability_contractor_date
    ON contractor_availability(contractor_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_availability_date_status
    ON contractor_availability(date, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_availability_status_date
    ON contractor_availability(status, date) WHERE deleted_at IS NULL AND status = 'available';

DROP TRIGGER IF EXISTS trigger_contractor_availability_updated_at ON contractor_availability;
CREATE TRIGGER trigger_contractor_availability_updated_at
    BEFORE UPDATE ON contractor_availability
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE contractor_availability IS 'Contractor calendar slots for job scheduling';
COMMENT ON COLUMN contractor_availability.service_area_override IS 'Override default service area for specific time slots';

-- 3.2 Contractor Ratings (Aggregate Scores)
CREATE TABLE IF NOT EXISTS contractor_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL,
    assignment_id UUID,
    organization_id UUID NOT NULL,
    rated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    source rating_source NOT NULL,
    overall_score DECIMAL(2,1) NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
    quality_score DECIMAL(2,1) CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 5)),
    punctuality_score DECIMAL(2,1) CHECK (punctuality_score IS NULL OR (punctuality_score >= 1 AND punctuality_score <= 5)),
    communication_score DECIMAL(2,1) CHECK (communication_score IS NULL OR (communication_score >= 1 AND communication_score <= 5)),
    value_score DECIMAL(2,1) CHECK (value_score IS NULL OR (value_score >= 1 AND value_score <= 5)),
    professionalism_score DECIMAL(2,1) CHECK (professionalism_score IS NULL OR (professionalism_score >= 1 AND professionalism_score <= 5)),
    review TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    contractor_response TEXT,
    contractor_response_at TIMESTAMPTZ,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_rating_per_ticket UNIQUE (contractor_id, ticket_id, rated_by_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contractor_ratings_contractor
    ON contractor_ratings(contractor_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_ratings_organization
    ON contractor_ratings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_ratings_overall_score
    ON contractor_ratings(contractor_id, overall_score DESC) WHERE deleted_at IS NULL AND is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_contractor_ratings_public
    ON contractor_ratings(contractor_id) WHERE deleted_at IS NULL AND is_public = TRUE;

COMMENT ON TABLE contractor_ratings IS 'Individual ratings for contractors from tenants/agents';
COMMENT ON COLUMN contractor_ratings.is_verified IS 'Whether this rating is from a verified completed job';

-- 3.3 Contractor Portfolio (Photos from Completed Jobs)
CREATE TABLE IF NOT EXISTS contractor_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    ticket_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type portfolio_media_type NOT NULL DEFAULT 'photo',
    media_url VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    specialty VARCHAR(100) NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    before_photo_url VARCHAR(1024),
    after_photo_url VARCHAR(1024),
    job_date DATE,
    job_duration_hours DECIMAL(5,2),
    status portfolio_item_status NOT NULL DEFAULT 'pending_review',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_contractor
    ON contractor_portfolio(contractor_id, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_specialty
    ON contractor_portfolio(specialty, status) WHERE deleted_at IS NULL AND status = 'approved';
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_featured
    ON contractor_portfolio(contractor_id) WHERE deleted_at IS NULL AND is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_tags
    ON contractor_portfolio USING GIN(tags) WHERE deleted_at IS NULL AND status = 'approved';

DROP TRIGGER IF EXISTS trigger_contractor_portfolio_updated_at ON contractor_portfolio;
CREATE TRIGGER trigger_contractor_portfolio_updated_at
    BEFORE UPDATE ON contractor_portfolio
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE contractor_portfolio IS 'Contractor work portfolio with before/after photos';
COMMENT ON COLUMN contractor_portfolio.is_featured IS 'Featured items appear prominently on contractor profile';

-- 3.4 Contractor Qualifications (Certs, Badges)
CREATE TABLE IF NOT EXISTS contractor_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    type qualification_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    issuing_body VARCHAR(255) NOT NULL,
    credential_id VARCHAR(255),
    issued_at DATE NOT NULL,
    expires_at DATE,
    document_url VARCHAR(1024),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    external_verification_url VARCHAR(1024),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contractor_qualifications_contractor
    ON contractor_qualifications(contractor_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_qualifications_type_status
    ON contractor_qualifications(type, verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_qualifications_expires
    ON contractor_qualifications(expires_at) WHERE deleted_at IS NULL AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_qualifications_verified
    ON contractor_qualifications(contractor_id) WHERE deleted_at IS NULL AND verification_status = 'verified';
CREATE INDEX IF NOT EXISTS idx_contractor_qualifications_specialties
    ON contractor_qualifications USING GIN(specialties) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trigger_contractor_qualifications_updated_at ON contractor_qualifications;
CREATE TRIGGER trigger_contractor_qualifications_updated_at
    BEFORE UPDATE ON contractor_qualifications
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE contractor_qualifications IS 'Contractor certifications, licenses, and badges';
COMMENT ON COLUMN contractor_qualifications.external_verification_url IS 'URL to verify credential with issuing body';

-- ============================================================================
-- SECTION 4: IMMUTABLE EVENT LOG (EVENT SOURCING FOUNDATION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number BIGSERIAL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    organization_id UUID,
    actor_id UUID,
    actor_type VARCHAR(50),
    payload JSONB NOT NULL,
    previous_state JSONB,
    correlation_id UUID,
    causation_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event log is append-only, no updates or deletes allowed
CREATE INDEX IF NOT EXISTS idx_event_log_type_created
    ON event_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_aggregate
    ON event_log(aggregate_type, aggregate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_organization
    ON event_log(organization_id, created_at DESC) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_log_actor
    ON event_log(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_log_correlation
    ON event_log(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_log_sequence
    ON event_log(sequence_number);

-- Prevent updates and deletes on event_log
CREATE OR REPLACE FUNCTION prevent_event_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Event log is immutable. Updates and deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_event_log_update ON event_log;
CREATE TRIGGER trigger_prevent_event_log_update
    BEFORE UPDATE OR DELETE ON event_log
    FOR EACH ROW EXECUTE FUNCTION prevent_event_log_modification();

COMMENT ON TABLE event_log IS 'Immutable event log for audit trail and event sourcing';
COMMENT ON COLUMN event_log.sequence_number IS 'Global ordering of events';
COMMENT ON COLUMN event_log.correlation_id IS 'Groups related events (e.g., from same user action)';
COMMENT ON COLUMN event_log.causation_id IS 'ID of the event that caused this event';

-- ============================================================================
-- SECTION 5: ADD ORGANIZATION_ID TO EXISTING TABLES (for RLS)
-- ============================================================================

-- Add organization_id to contractors if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractors' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE contractors ADD COLUMN organization_id UUID;
        CREATE INDEX IF NOT EXISTS idx_contractors_organization ON contractors(organization_id) WHERE deleted_at IS NULL;
    END IF;
END $$;

-- Add organization_id to properties if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'properties' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE properties ADD COLUMN organization_id UUID;
        CREATE INDEX IF NOT EXISTS idx_properties_organization ON properties(organization_id) WHERE deleted_at IS NULL;
    END IF;
END $$;

-- ============================================================================
-- SECTION 6: ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- 6.1 Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- 6.2 Users table policies
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (
        is_admin_user()
        OR id = current_user_id()
        OR tenant_id::text = current_tenant_id()::text
    );

-- 6.3 Organizations table policies
DROP POLICY IF EXISTS organizations_tenant_isolation ON organizations;
CREATE POLICY organizations_tenant_isolation ON organizations
    FOR ALL
    USING (
        is_admin_user()
        OR id = current_tenant_id()
        OR owner_user_id = current_user_id()
    );

-- 6.4 Roles table policies
DROP POLICY IF EXISTS roles_tenant_isolation ON roles;
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL
    USING (
        is_admin_user()
        OR organization_id = current_tenant_id()
    );

-- 6.5 Properties table policies
DROP POLICY IF EXISTS properties_tenant_isolation ON properties;
CREATE POLICY properties_tenant_isolation ON properties
    FOR ALL
    USING (
        is_admin_user()
        OR tenant_id::text = current_tenant_id()::text
        OR organization_id = current_tenant_id()
    );

-- 6.6 Units table policies (inherit from properties)
DROP POLICY IF EXISTS units_tenant_isolation ON units;
CREATE POLICY units_tenant_isolation ON units
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = units.property_id
            AND (p.tenant_id::text = current_tenant_id()::text OR p.organization_id = current_tenant_id())
        )
    );

-- 6.7 Tickets table policies
DROP POLICY IF EXISTS tickets_tenant_isolation ON tickets;
CREATE POLICY tickets_tenant_isolation ON tickets
    FOR ALL
    USING (
        is_admin_user()
        OR tenant_id::text = current_tenant_id()::text
        OR EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = tickets.unit_id
            AND (p.tenant_id::text = current_tenant_id()::text OR p.organization_id = current_tenant_id())
        )
        -- Contractors can see tickets assigned to them
        OR (is_contractor_user() AND assigned_contractor_id = current_user_id())
    );

-- 6.8 Ticket state history policies
DROP POLICY IF EXISTS ticket_state_history_tenant_isolation ON ticket_state_history;
CREATE POLICY ticket_state_history_tenant_isolation ON ticket_state_history
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (
            SELECT 1 FROM tickets t WHERE t.id = ticket_state_history.ticket_id
            AND (t.tenant_id::text = current_tenant_id()::text OR t.assigned_contractor_id = current_user_id())
        )
    );

-- 6.9 Evidence policies
DROP POLICY IF EXISTS evidence_tenant_isolation ON evidence;
CREATE POLICY evidence_tenant_isolation ON evidence
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (
            SELECT 1 FROM tickets t WHERE t.id = evidence.ticket_id
            AND (t.tenant_id::text = current_tenant_id()::text OR t.assigned_contractor_id = current_user_id())
        )
    );

-- 6.10 Assignments policies
DROP POLICY IF EXISTS assignments_tenant_isolation ON assignments;
CREATE POLICY assignments_tenant_isolation ON assignments
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (
            SELECT 1 FROM tickets t WHERE t.id = assignments.ticket_id
            AND (t.tenant_id::text = current_tenant_id()::text)
        )
        -- Contractors can see their own assignments
        OR (is_contractor_user() AND contractor_id = current_user_id())
    );

-- 6.11 Payments policies
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (
            SELECT 1 FROM assignments a
            JOIN tickets t ON t.id = a.ticket_id
            WHERE a.id = payments.assignment_id
            AND (t.tenant_id::text = current_tenant_id()::text OR a.contractor_id = current_user_id())
        )
    );

-- 6.12 Notification logs policies
DROP POLICY IF EXISTS notification_logs_tenant_isolation ON notification_logs;
CREATE POLICY notification_logs_tenant_isolation ON notification_logs
    FOR ALL
    USING (
        is_admin_user()
        OR user_id = current_user_id()
    );

-- 6.13 Contractors policies (public for search, private for sensitive data)
DROP POLICY IF EXISTS contractors_read_public ON contractors;
CREATE POLICY contractors_read_public ON contractors
    FOR SELECT
    USING (
        -- Everyone can see verified contractors (for marketplace search)
        (status = 'verified' AND deleted_at IS NULL)
        -- Admins see all
        OR is_admin_user()
        -- Contractors see their own profile
        OR user_id = current_user_id()
        -- Organizations see contractors they've worked with
        OR organization_id = current_tenant_id()
    );

DROP POLICY IF EXISTS contractors_write ON contractors;
CREATE POLICY contractors_write ON contractors
    FOR ALL
    USING (
        is_admin_user()
        OR user_id = current_user_id()
    )
    WITH CHECK (
        is_admin_user()
        OR user_id = current_user_id()
    );

-- 6.14 Contractor availability policies (public for scheduling)
DROP POLICY IF EXISTS contractor_availability_read ON contractor_availability;
CREATE POLICY contractor_availability_read ON contractor_availability
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            is_admin_user()
            -- Contractors see their own availability
            OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_availability.contractor_id AND c.user_id = current_user_id())
            -- Verified contractors' availability is public for booking
            OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_availability.contractor_id AND c.status = 'verified')
        )
    );

DROP POLICY IF EXISTS contractor_availability_write ON contractor_availability;
CREATE POLICY contractor_availability_write ON contractor_availability
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_availability.contractor_id AND c.user_id = current_user_id())
    )
    WITH CHECK (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_availability.contractor_id AND c.user_id = current_user_id())
    );

-- 6.15 Contractor ratings policies
DROP POLICY IF EXISTS contractor_ratings_read ON contractor_ratings;
CREATE POLICY contractor_ratings_read ON contractor_ratings
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            is_admin_user()
            -- Public ratings are visible to all
            OR is_public = TRUE
            -- Contractors see all ratings about them
            OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_ratings.contractor_id AND c.user_id = current_user_id())
            -- Organizations see ratings from their tenants
            OR organization_id = current_tenant_id()
            -- Users see their own ratings
            OR rated_by_user_id = current_user_id()
        )
    );

DROP POLICY IF EXISTS contractor_ratings_insert ON contractor_ratings;
CREATE POLICY contractor_ratings_insert ON contractor_ratings
    FOR INSERT
    WITH CHECK (
        is_admin_user()
        -- Users can only create ratings as themselves within their organization
        OR (rated_by_user_id = current_user_id() AND organization_id = current_tenant_id())
    );

DROP POLICY IF EXISTS contractor_ratings_update ON contractor_ratings;
CREATE POLICY contractor_ratings_update ON contractor_ratings
    FOR UPDATE
    USING (
        is_admin_user()
        -- Contractors can add responses to their ratings
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_ratings.contractor_id AND c.user_id = current_user_id())
    );

-- 6.16 Contractor portfolio policies (public for verified, approved items)
DROP POLICY IF EXISTS contractor_portfolio_read ON contractor_portfolio;
CREATE POLICY contractor_portfolio_read ON contractor_portfolio
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            is_admin_user()
            -- Approved portfolio items are public
            OR status = 'approved'
            -- Contractors see their own portfolio
            OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_portfolio.contractor_id AND c.user_id = current_user_id())
        )
    );

DROP POLICY IF EXISTS contractor_portfolio_write ON contractor_portfolio;
CREATE POLICY contractor_portfolio_write ON contractor_portfolio
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_portfolio.contractor_id AND c.user_id = current_user_id())
    )
    WITH CHECK (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_portfolio.contractor_id AND c.user_id = current_user_id())
    );

-- 6.17 Contractor qualifications policies
DROP POLICY IF EXISTS contractor_qualifications_read ON contractor_qualifications;
CREATE POLICY contractor_qualifications_read ON contractor_qualifications
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            is_admin_user()
            -- Public verified qualifications are visible to all
            OR (is_public = TRUE AND verification_status = 'verified')
            -- Contractors see their own qualifications
            OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_qualifications.contractor_id AND c.user_id = current_user_id())
        )
    );

DROP POLICY IF EXISTS contractor_qualifications_write ON contractor_qualifications;
CREATE POLICY contractor_qualifications_write ON contractor_qualifications
    FOR ALL
    USING (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_qualifications.contractor_id AND c.user_id = current_user_id())
    )
    WITH CHECK (
        is_admin_user()
        OR EXISTS (SELECT 1 FROM contractors c WHERE c.id = contractor_qualifications.contractor_id AND c.user_id = current_user_id())
    );

-- 6.18 Audit logs policies (admin only for reads, system can insert)
DROP POLICY IF EXISTS audit_logs_admin_read ON audit_logs;
CREATE POLICY audit_logs_admin_read ON audit_logs
    FOR SELECT
    USING (
        is_admin_user()
        OR user_id = current_user_id()
        OR organization_id = current_tenant_id()
    );

-- 6.19 Tenant invites policies
DROP POLICY IF EXISTS tenant_invites_tenant_isolation ON tenant_invites;
CREATE POLICY tenant_invites_tenant_isolation ON tenant_invites
    FOR ALL
    USING (
        is_admin_user()
        OR organization_id = current_tenant_id()
    );

-- 6.20 Event log policies (append-only, read by admins and aggregate owners)
DROP POLICY IF EXISTS event_log_read ON event_log;
CREATE POLICY event_log_read ON event_log
    FOR SELECT
    USING (
        is_admin_user()
        OR organization_id = current_tenant_id()
        OR actor_id = current_user_id()
    );

DROP POLICY IF EXISTS event_log_insert ON event_log;
CREATE POLICY event_log_insert ON event_log
    FOR INSERT
    WITH CHECK (TRUE); -- System can always insert events

-- ============================================================================
-- SECTION 7: AGGREGATE RATING FUNCTIONS
-- ============================================================================

-- Function to update contractor's average rating
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_avg DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    SELECT
        ROUND(AVG(overall_score)::numeric, 2),
        COUNT(*)
    INTO new_avg, total_count
    FROM contractor_ratings
    WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
    AND deleted_at IS NULL;

    UPDATE contractors
    SET
        average_rating = COALESCE(new_avg, 0),
        total_jobs_completed = total_count,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.contractor_id, OLD.contractor_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contractor_rating ON contractor_ratings;
CREATE TRIGGER trigger_update_contractor_rating
    AFTER INSERT OR UPDATE OR DELETE ON contractor_ratings
    FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- ============================================================================
-- SECTION 8: MARKETPLACE SEARCH INDEXES
-- ============================================================================

-- Full-text search on contractor profiles
CREATE INDEX IF NOT EXISTS idx_contractors_search
    ON contractors USING GIN(
        to_tsvector('english', COALESCE(business_name, '') || ' ' || COALESCE(specialties::text, ''))
    ) WHERE deleted_at IS NULL AND status = 'verified';

-- Location-based search (requires PostGIS for production)
CREATE INDEX IF NOT EXISTS idx_contractors_rating_location
    ON contractors(average_rating DESC, status)
    WHERE deleted_at IS NULL AND status = 'verified';

-- Specialty + rating composite index for marketplace
CREATE INDEX IF NOT EXISTS idx_contractors_marketplace_search
    ON contractors USING GIN(specialties)
    WHERE deleted_at IS NULL AND status = 'verified';

-- Portfolio search by specialty and tags
CREATE INDEX IF NOT EXISTS idx_portfolio_marketplace
    ON contractor_portfolio(specialty, display_order)
    WHERE deleted_at IS NULL AND status = 'approved';

-- ============================================================================
-- SECTION 9: GDPR COMPLIANCE HELPERS
-- ============================================================================

-- Function to soft delete all user data (GDPR right to erasure)
CREATE OR REPLACE FUNCTION gdpr_soft_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Soft delete user
    UPDATE users SET deleted_at = NOW() WHERE id = target_user_id AND deleted_at IS NULL;

    -- Soft delete contractor profile
    UPDATE contractors SET deleted_at = NOW() WHERE user_id = target_user_id AND deleted_at IS NULL;

    -- Soft delete contractor availability
    UPDATE contractor_availability SET deleted_at = NOW()
    WHERE contractor_id IN (SELECT id FROM contractors WHERE user_id = target_user_id)
    AND deleted_at IS NULL;

    -- Soft delete contractor portfolio
    UPDATE contractor_portfolio SET deleted_at = NOW()
    WHERE contractor_id IN (SELECT id FROM contractors WHERE user_id = target_user_id)
    AND deleted_at IS NULL;

    -- Soft delete contractor qualifications
    UPDATE contractor_qualifications SET deleted_at = NOW()
    WHERE contractor_id IN (SELECT id FROM contractors WHERE user_id = target_user_id)
    AND deleted_at IS NULL;

    -- Anonymize ratings (keep for data integrity but remove PII)
    UPDATE contractor_ratings
    SET
        review = '[REDACTED]',
        contractor_response = CASE WHEN contractor_response IS NOT NULL THEN '[REDACTED]' ELSE NULL END,
        deleted_at = NOW()
    WHERE rated_by_user_id = target_user_id AND deleted_at IS NULL;

    -- Log the GDPR action (immutable)
    INSERT INTO event_log (
        event_type, aggregate_type, aggregate_id, actor_id, payload
    ) VALUES (
        'user.gdpr_deleted', 'user', target_user_id, current_user_id(),
        jsonb_build_object('deleted_at', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION gdpr_soft_delete_user IS 'GDPR-compliant soft deletion of all user data';

-- ============================================================================
-- SECTION 10: DATA RETENTION POLICY
-- ============================================================================

-- Function to anonymize old soft-deleted records (run periodically)
CREATE OR REPLACE FUNCTION anonymize_deleted_records(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    anonymized_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

    -- Anonymize old deleted users (beyond retention period)
    UPDATE users
    SET
        email = 'deleted_' || id || '@anonymized.local',
        email_normalized = 'deleted_' || id || '@anonymized.local',
        password_hash = 'ANONYMIZED',
        phone_e164 = NULL,
        first_name = 'Deleted',
        last_name = 'User',
        last_login_ip = NULL,
        last_login_user_agent = NULL,
        metadata = NULL
    WHERE deleted_at IS NOT NULL
    AND deleted_at < cutoff_date
    AND email NOT LIKE 'deleted_%@anonymized.local';

    GET DIAGNOSTICS anonymized_count = ROW_COUNT;

    RETURN anonymized_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION anonymize_deleted_records IS 'Anonymize soft-deleted records beyond retention period';

-- ============================================================================
-- SECTION 11: GRANT PERMISSIONS TO APPLICATION ROLE
-- ============================================================================

-- Create application role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rentfix_app') THEN
        CREATE ROLE rentfix_app WITH LOGIN;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rentfix_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rentfix_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rentfix_app;

-- Force RLS for application role
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE units FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_state_history FORCE ROW LEVEL SECURITY;
ALTER TABLE evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE contractors FORCE ROW LEVEL SECURITY;
ALTER TABLE contractor_availability FORCE ROW LEVEL SECURITY;
ALTER TABLE contractor_ratings FORCE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio FORCE ROW LEVEL SECURITY;
ALTER TABLE contractor_qualifications FORCE ROW LEVEL SECURITY;
ALTER TABLE event_log FORCE ROW LEVEL SECURITY;

COMMENT ON SCHEMA public IS 'Rentfix multi-tenant schema with RLS enabled';
