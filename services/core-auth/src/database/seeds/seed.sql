-- Rentfix Development Seed Data
-- Run this after migrations to populate the database with test data
-- Usage: psql -U postgres -d rentfix -f seed.sql

-- ============================================================================
-- SECTION 1: SET SESSION VARIABLES (bypass RLS for seeding)
-- ============================================================================
SET app.current_user_id = '00000000-0000-0000-0000-000000000001';
SET app.is_admin = 'true';

-- ============================================================================
-- SECTION 2: CLEAN EXISTING SEED DATA
-- ============================================================================
DELETE FROM event_log WHERE actor_id IN (
    SELECT id FROM users WHERE email LIKE '%@seed.test'
);
DELETE FROM contractor_qualifications WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test'
);
DELETE FROM contractor_portfolio WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test'
);
DELETE FROM contractor_ratings WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test'
);
DELETE FROM contractor_availability WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON c.user_id = u.id WHERE u.email LIKE '%@seed.test'
);
DELETE FROM contractors WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@seed.test'
);
DELETE FROM roles WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@seed.test'
);
DELETE FROM organizations WHERE name LIKE 'Seed %';
DELETE FROM users WHERE email LIKE '%@seed.test';

-- ============================================================================
-- SECTION 3: USERS
-- ============================================================================

-- Admin user (password: Admin123!)
INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, email_verified, phone_e164)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@seed.test',
    'admin@seed.test',
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', -- Replace with actual hash
    'admin',
    'System',
    'Admin',
    true,
    '+447700900001'
);

-- Property Manager (Agent Owner)
INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, email_verified, phone_e164, tenant_id)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'manager@seed.test',
    'manager@seed.test',
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
    'agent',
    'Sarah',
    'Manager',
    true,
    '+447700900002',
    'org-001'
);

-- Property Agent (Support)
INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, email_verified, phone_e164, tenant_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'agent@seed.test',
    'agent@seed.test',
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
    'agent',
    'James',
    'Support',
    true,
    '+447700900003',
    'org-001'
);

-- Tenant user
INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, email_verified, phone_e164, tenant_id)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'tenant@seed.test',
    'tenant@seed.test',
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword',
    'tenant',
    'Alice',
    'Tenant',
    true,
    '+447700900004',
    'org-001'
);

-- Contractor users
INSERT INTO users (id, email, email_normalized, password_hash, role, first_name, last_name, email_verified, phone_e164)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'plumber@seed.test', 'plumber@seed.test', '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', 'contractor', 'Bob', 'Plumber', true, '+447700900005'),
    ('66666666-6666-6666-6666-666666666666', 'electrician@seed.test', 'electrician@seed.test', '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', 'contractor', 'Carol', 'Sparks', true, '+447700900006'),
    ('77777777-7777-7777-7777-777777777777', 'hvac@seed.test', 'hvac@seed.test', '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', 'contractor', 'Dave', 'Cooling', true, '+447700900007'),
    ('88888888-8888-8888-8888-888888888888', 'handyman@seed.test', 'handyman@seed.test', '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', 'contractor', 'Eve', 'Fixit', true, '+447700900008'),
    ('99999999-9999-9999-9999-999999999999', 'painter@seed.test', 'painter@seed.test', '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$hashedpassword', 'contractor', 'Frank', 'Brush', true, '+447700900009');

-- ============================================================================
-- SECTION 4: ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (id, owner_user_id, name, plan, status, properties_quota)
VALUES (
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Seed Property Management Ltd',
    'professional',
    'active',
    50
);

INSERT INTO organizations (id, owner_user_id, name, plan, status, properties_quota)
VALUES (
    'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Seed Demo Agency',
    'starter',
    'active',
    10
);

-- ============================================================================
-- SECTION 5: CONTRACTOR PROFILES
-- ============================================================================

-- Verified Plumber
INSERT INTO contractors (id, user_id, organization_id, business_name, specialties, hourly_rate, status, background_check_status, verified_at, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four)
VALUES (
    'c1111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    NULL,
    'Bob''s Premium Plumbing',
    '["plumbing", "drainage", "water_heater", "emergency"]',
    65.00,
    'verified',
    'passed',
    NOW() - INTERVAL '30 days',
    '{"postcodes": ["SW1", "SW2", "SW3", "W1", "W2"], "radius_km": 15, "center": {"lat": 51.5074, "lng": -0.1278}}',
    4.8,
    156,
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$bankhash',
    '4321'
);

-- Verified Electrician
INSERT INTO contractors (id, user_id, organization_id, business_name, specialties, hourly_rate, status, background_check_status, verified_at, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four)
VALUES (
    'c2222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666666',
    NULL,
    'Sparks Electrical Services',
    '["electrical", "lighting", "rewiring", "ev_charging", "emergency"]',
    75.00,
    'verified',
    'passed',
    NOW() - INTERVAL '45 days',
    '{"postcodes": ["E1", "E2", "E3", "EC1", "EC2"], "radius_km": 20, "center": {"lat": 51.5155, "lng": -0.0922}}',
    4.9,
    234,
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$bankhash',
    '8765'
);

-- Verified HVAC
INSERT INTO contractors (id, user_id, organization_id, business_name, specialties, hourly_rate, status, background_check_status, verified_at, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four)
VALUES (
    'c3333333-3333-3333-3333-333333333333',
    '77777777-7777-7777-7777-777777777777',
    NULL,
    'Cool Breeze HVAC',
    '["hvac", "air_conditioning", "heating", "ventilation", "boiler"]',
    80.00,
    'verified',
    'passed',
    NOW() - INTERVAL '60 days',
    '{"postcodes": ["N1", "N2", "NW1", "NW3"], "radius_km": 25, "center": {"lat": 51.5362, "lng": -0.1033}}',
    4.7,
    89,
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$bankhash',
    '2345'
);

-- Verified Handyman
INSERT INTO contractors (id, user_id, organization_id, business_name, specialties, hourly_rate, status, background_check_status, verified_at, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four)
VALUES (
    'c4444444-4444-4444-4444-444444444444',
    '88888888-8888-8888-8888-888888888888',
    NULL,
    'Eve''s Handyman Services',
    '["general", "carpentry", "locks", "furniture_assembly", "shelving"]',
    45.00,
    'verified',
    'passed',
    NOW() - INTERVAL '15 days',
    '{"postcodes": ["SE1", "SE5", "SE11", "SE17"], "radius_km": 10, "center": {"lat": 51.4941, "lng": -0.0896}}',
    4.6,
    312,
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$bankhash',
    '6789'
);

-- Pending Painter (not yet verified)
INSERT INTO contractors (id, user_id, organization_id, business_name, specialties, hourly_rate, status, background_check_status, service_area, average_rating, total_jobs_completed, bank_account_hash, bank_account_last_four)
VALUES (
    'c5555555-5555-5555-5555-555555555555',
    '99999999-9999-9999-9999-999999999999',
    NULL,
    'Brush & Roll Decorating',
    '["painting", "decorating", "wallpaper", "exterior_painting"]',
    55.00,
    'background_check_requested',
    'in_progress',
    '{"postcodes": ["SW4", "SW8", "SW9"], "radius_km": 8}',
    0,
    0,
    '$argon2id$v=19$m=65536,t=3,p=4$randomsalt$bankhash',
    '1234'
);

-- ============================================================================
-- SECTION 6: CONTRACTOR AVAILABILITY
-- ============================================================================

-- Bob's Plumbing availability (next 2 weeks)
INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status, max_jobs, recurrence_pattern)
SELECT
    'c1111111-1111-1111-1111-111111111111',
    CURRENT_DATE + (n || ' days')::interval,
    '08:00',
    '18:00',
    'available',
    3,
    'weekly'
FROM generate_series(0, 13) AS n
WHERE EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::interval) NOT IN (0, 6); -- Exclude weekends

-- Carol's Electrical availability
INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status, max_jobs, recurrence_pattern)
SELECT
    'c2222222-2222-2222-2222-222222222222',
    CURRENT_DATE + (n || ' days')::interval,
    '09:00',
    '17:00',
    'available',
    2,
    'weekly'
FROM generate_series(0, 13) AS n
WHERE EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::interval) NOT IN (0, 6);

-- Dave's HVAC availability (includes some busy slots)
INSERT INTO contractor_availability (contractor_id, date, start_time, end_time, status, max_jobs)
VALUES
    ('c3333333-3333-3333-3333-333333333333', CURRENT_DATE, '08:00', '12:00', 'available', 1),
    ('c3333333-3333-3333-3333-333333333333', CURRENT_DATE, '13:00', '17:00', 'busy', 0),
    ('c3333333-3333-3333-3333-333333333333', CURRENT_DATE + 1, '08:00', '17:00', 'available', 2),
    ('c3333333-3333-3333-3333-333333333333', CURRENT_DATE + 2, '08:00', '17:00', 'on_leave', 0);

-- ============================================================================
-- SECTION 7: CONTRACTOR RATINGS
-- ============================================================================

-- Ratings for Bob's Plumbing
INSERT INTO contractor_ratings (contractor_id, ticket_id, organization_id, rated_by_user_id, source, overall_score, quality_score, punctuality_score, communication_score, value_score, professionalism_score, review, is_public, is_verified)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'tenant', 5.0, 5.0, 5.0, 5.0, 4.5, 5.0, 'Bob was fantastic! Fixed our leaky tap in no time. Very professional and tidy.', true, true),
    ('c1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'agent', 4.5, 4.5, 5.0, 4.0, 4.5, 4.5, 'Reliable contractor, always on time.', true, true),
    ('c1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'tenant', 4.8, 5.0, 4.5, 5.0, 4.5, 5.0, 'Great emergency response for burst pipe!', true, true);

-- Ratings for Carol's Electrical
INSERT INTO contractor_ratings (contractor_id, ticket_id, organization_id, rated_by_user_id, source, overall_score, quality_score, punctuality_score, communication_score, value_score, professionalism_score, review, is_public, is_verified, contractor_response, contractor_response_at)
VALUES
    ('c2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'tenant', 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 'Carol rewired our flat brilliantly. Very knowledgeable and explained everything clearly.', true, true, 'Thank you for your kind review! It was a pleasure working with you.', NOW() - INTERVAL '5 days'),
    ('c2222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'agent', 4.8, 5.0, 4.5, 5.0, 4.5, 5.0, 'Excellent work on EV charger installation.', true, true, NULL, NULL);

-- ============================================================================
-- SECTION 8: CONTRACTOR PORTFOLIO
-- ============================================================================

-- Bob's Plumbing portfolio
INSERT INTO contractor_portfolio (contractor_id, title, description, media_type, media_url, thumbnail_url, specialty, tags, before_photo_url, after_photo_url, job_date, job_duration_hours, status, is_featured, display_order)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Victorian Bathroom Renovation', 'Complete bathroom refit including new pipework, fixtures, and underfloor heating', 'photo', 'https://storage.rentfix.test/portfolio/bob-bathroom-1.jpg', 'https://storage.rentfix.test/portfolio/bob-bathroom-1-thumb.jpg', 'plumbing', '["bathroom", "renovation", "underfloor_heating"]', 'https://storage.rentfix.test/portfolio/bob-bathroom-1-before.jpg', 'https://storage.rentfix.test/portfolio/bob-bathroom-1-after.jpg', CURRENT_DATE - 30, 16.0, 'approved', true, 1),
    ('c1111111-1111-1111-1111-111111111111', 'Emergency Burst Pipe Repair', 'Quick response to burst pipe in basement, minimal water damage', 'photo', 'https://storage.rentfix.test/portfolio/bob-burst-pipe.jpg', 'https://storage.rentfix.test/portfolio/bob-burst-pipe-thumb.jpg', 'emergency', '["emergency", "burst_pipe", "water_damage"]', NULL, 'https://storage.rentfix.test/portfolio/bob-burst-pipe-after.jpg', CURRENT_DATE - 15, 3.5, 'approved', false, 2),
    ('c1111111-1111-1111-1111-111111111111', 'Water Heater Installation', 'Installed new energy-efficient combi boiler', 'photo', 'https://storage.rentfix.test/portfolio/bob-boiler.jpg', 'https://storage.rentfix.test/portfolio/bob-boiler-thumb.jpg', 'water_heater', '["boiler", "installation", "energy_efficient"]', 'https://storage.rentfix.test/portfolio/bob-boiler-before.jpg', 'https://storage.rentfix.test/portfolio/bob-boiler-after.jpg', CURRENT_DATE - 45, 8.0, 'approved', false, 3);

-- Carol's Electrical portfolio
INSERT INTO contractor_portfolio (contractor_id, title, description, media_type, media_url, thumbnail_url, specialty, tags, job_date, job_duration_hours, status, is_featured, display_order)
VALUES
    ('c2222222-2222-2222-2222-222222222222', 'Smart Home Lighting Installation', 'Full smart lighting system with voice control integration', 'photo', 'https://storage.rentfix.test/portfolio/carol-smart-lights.jpg', 'https://storage.rentfix.test/portfolio/carol-smart-lights-thumb.jpg', 'lighting', '["smart_home", "lighting", "automation"]', CURRENT_DATE - 20, 6.0, 'approved', true, 1),
    ('c2222222-2222-2222-2222-222222222222', 'EV Charger Installation', 'Home EV charging point with dedicated circuit', 'photo', 'https://storage.rentfix.test/portfolio/carol-ev-charger.jpg', 'https://storage.rentfix.test/portfolio/carol-ev-charger-thumb.jpg', 'ev_charging', '["ev_charger", "installation", "green_energy"]', CURRENT_DATE - 10, 4.0, 'approved', true, 2),
    ('c2222222-2222-2222-2222-222222222222', 'Consumer Unit Upgrade', 'Upgraded to modern consumer unit with RCD protection', 'photo', 'https://storage.rentfix.test/portfolio/carol-fuse-box.jpg', 'https://storage.rentfix.test/portfolio/carol-fuse-box-thumb.jpg', 'electrical', '["fuse_box", "safety", "upgrade"]', CURRENT_DATE - 60, 5.0, 'approved', false, 3);

-- ============================================================================
-- SECTION 9: CONTRACTOR QUALIFICATIONS
-- ============================================================================

-- Bob's Plumbing qualifications
INSERT INTO contractor_qualifications (contractor_id, type, name, issuing_body, credential_id, issued_at, expires_at, document_url, verification_status, verified_at, is_public, specialties, display_order)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'certification', 'City & Guilds Level 3 Plumbing', 'City & Guilds', 'CG-PLM-123456', '2018-06-15', NULL, 'https://storage.rentfix.test/certs/bob-cg-plumbing.pdf', 'verified', NOW() - INTERVAL '30 days', true, '["plumbing"]', 1),
    ('c1111111-1111-1111-1111-111111111111', 'certification', 'Gas Safe Registered', 'Gas Safe Register', 'GS-789012', '2023-01-01', '2028-01-01', 'https://storage.rentfix.test/certs/bob-gas-safe.pdf', 'verified', NOW() - INTERVAL '30 days', true, '["plumbing", "gas"]', 2),
    ('c1111111-1111-1111-1111-111111111111', 'insurance', 'Public Liability Insurance', 'Zurich Insurance', 'ZUR-PLI-456789', '2024-01-01', '2025-01-01', 'https://storage.rentfix.test/certs/bob-insurance.pdf', 'verified', NOW() - INTERVAL '30 days', true, '[]', 3),
    ('c1111111-1111-1111-1111-111111111111', 'badge', 'Emergency Response Certified', 'Rentfix Platform', 'RF-EMG-001', '2024-06-01', NULL, NULL, 'verified', NOW() - INTERVAL '10 days', true, '["emergency"]', 4);

-- Carol's Electrical qualifications
INSERT INTO contractor_qualifications (contractor_id, type, name, issuing_body, credential_id, issued_at, expires_at, document_url, verification_status, verified_at, is_public, specialties, display_order)
VALUES
    ('c2222222-2222-2222-2222-222222222222', 'license', 'NICEIC Approved Contractor', 'NICEIC', 'NICEIC-AC-234567', '2019-03-20', '2025-03-20', 'https://storage.rentfix.test/certs/carol-niceic.pdf', 'verified', NOW() - INTERVAL '45 days', true, '["electrical"]', 1),
    ('c2222222-2222-2222-2222-222222222222', 'certification', '18th Edition Wiring Regulations', 'City & Guilds', 'CG-2382-345678', '2022-07-01', NULL, 'https://storage.rentfix.test/certs/carol-18th-edition.pdf', 'verified', NOW() - INTERVAL '45 days', true, '["electrical", "rewiring"]', 2),
    ('c2222222-2222-2222-2222-222222222222', 'certification', 'EV Charging Installation', 'IMI', 'IMI-EV-456789', '2023-02-15', NULL, 'https://storage.rentfix.test/certs/carol-ev-cert.pdf', 'verified', NOW() - INTERVAL '45 days', true, '["ev_charging"]', 3),
    ('c2222222-2222-2222-2222-222222222222', 'insurance', 'Professional Indemnity Insurance', 'Hiscox', 'HIS-PII-567890', '2024-01-01', '2025-01-01', 'https://storage.rentfix.test/certs/carol-insurance.pdf', 'verified', NOW() - INTERVAL '45 days', true, '[]', 4);

-- Dave's HVAC qualifications
INSERT INTO contractor_qualifications (contractor_id, type, name, issuing_body, credential_id, issued_at, expires_at, document_url, verification_status, verified_at, is_public, specialties, display_order)
VALUES
    ('c3333333-3333-3333-3333-333333333333', 'certification', 'F-Gas Handling Certificate', 'City & Guilds', 'CG-FGAS-567890', '2020-05-10', '2025-05-10', 'https://storage.rentfix.test/certs/dave-fgas.pdf', 'verified', NOW() - INTERVAL '60 days', true, '["hvac", "air_conditioning"]', 1),
    ('c3333333-3333-3333-3333-333333333333', 'certification', 'Gas Safe Registered', 'Gas Safe Register', 'GS-678901', '2022-06-01', '2027-06-01', 'https://storage.rentfix.test/certs/dave-gas-safe.pdf', 'verified', NOW() - INTERVAL '60 days', true, '["hvac", "boiler", "heating"]', 2);

-- ============================================================================
-- SECTION 10: EVENT LOG SEEDS
-- ============================================================================

INSERT INTO event_log (event_type, aggregate_type, aggregate_id, actor_id, actor_type, payload, created_at)
VALUES
    ('contractor.registered', 'contractor', 'c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'user', '{"business_name": "Bob''s Premium Plumbing"}', NOW() - INTERVAL '90 days'),
    ('contractor.verified', 'contractor', 'c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin', '{"status": "verified"}', NOW() - INTERVAL '30 days'),
    ('contractor.registered', 'contractor', 'c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'user', '{"business_name": "Sparks Electrical Services"}', NOW() - INTERVAL '100 days'),
    ('contractor.verified', 'contractor', 'c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin', '{"status": "verified"}', NOW() - INTERVAL '45 days'),
    ('contractor.rated', 'contractor', 'c1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'tenant', '{"overall_score": 5.0}', NOW() - INTERVAL '25 days');

-- ============================================================================
-- SECTION 11: RESET SESSION VARIABLES
-- ============================================================================
RESET app.current_user_id;
RESET app.is_admin;

-- Done!
SELECT 'Seed data loaded successfully!' AS status;
