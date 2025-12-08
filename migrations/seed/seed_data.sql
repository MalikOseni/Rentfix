-- Seed data for local testing
BEGIN;

-- Sample users
INSERT INTO users (id, tenant_id, name, email, phone, role, verification_status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tara Tenant', 'tenant@example.com', '+15550000001', 'tenant', 'verified'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Andy Agent', 'agent@example.com', '+15550000002', 'agent', 'verified'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cora Contractor', 'contractor@example.com', '+15550000003', 'contractor', 'verified');

INSERT INTO tenants (user_id, property_id, lease_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'LEASE-2024-01');

INSERT INTO agents (user_id, company_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'ccccccc1-cccc-cccc-cccc-cccccccccccc');

INSERT INTO contractors (user_id, trade, certifications, coverage_area, rating, reliability_score) VALUES
  ('33333333-3333-3333-3333-333333333333', 'plumbing', 'CIPHE', '{"cities": ["London", "Cambridge"]}', 4.7, 4.8);

-- Properties and units
INSERT INTO properties (id, tenant_id, address, landlord_id, agent_id, notes)
VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12 High Street, London', 'ddddddd1-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Flagship building');

INSERT INTO units (id, property_id, unit_number, occupancy_status, notes) VALUES
  ('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Unit 1A', 'occupied', 'Top floor flat');

-- Tickets
INSERT INTO tickets (id, unit_id, tenant_id, issue_type, description, urgency, responsibility_suggestion, status, assigned_contractor_id, sla_response_at, sla_resolution_at, ai_confidence)
VALUES
  ('fffffff1-ffff-ffff-ffff-ffffffffffff', 'eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'leak', 'Ceiling leak near bathroom', 'urgent', 'tenant', 'assigned', '33333333-3333-3333-3333-333333333333', now() + interval '1 hour', now() + interval '24 hours', 0.82);

INSERT INTO ticket_state_history (ticket_id, state, changed_by, notes)
VALUES
  ('fffffff1-ffff-ffff-ffff-ffffffffffff', 'new', '11111111-1111-1111-1111-111111111111', 'Ticket created'),
  ('fffffff1-ffff-ffff-ffff-ffffffffffff', 'assigned', '22222222-2222-2222-2222-222222222222', 'Assigned to contractor');

-- Assignments and availability
INSERT INTO assignments (id, ticket_id, contractor_id, scheduled_at, accepted_at, final_status)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'fffffff1-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', now() + interval '2 hours', now() + interval '3 hours', 'scheduled');

INSERT INTO contractor_availability (contractor_id, date, timeslot, status)
VALUES
  ('33333333-3333-3333-3333-333333333333', current_date, tstzrange(now(), now() + interval '8 hours'), 'busy');

-- Evidence
INSERT INTO evidence (id, ticket_id, file_url, type, captured_by, metadata)
VALUES
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fffffff1-ffff-ffff-ffff-ffffffffffff', 'https://cdn.rentalfix.com/evidence/leak-1.jpg', 'photo', '11111111-1111-1111-1111-111111111111', '{"hash": "abc123", "exif": {"time": "2024-01-01T10:00:00Z", "location": "51.5074,-0.1278"}}');

-- Payments
INSERT INTO payments (id, assignment_id, amount, status, method, metadata)
VALUES
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 125.50, 'pending', 'card', '{"invoice": "INV-1001"}');

-- Notification logs
INSERT INTO notification_logs (id, user_id, channel, message_template_id, payload, delivered_at, status)
VALUES
  ('ccccccc2-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'email', 'ticket_assigned', '{"ticketId": "fffffff1-ffff-ffff-ffff-ffffffffffff"}', now(), 'sent');

COMMIT;
