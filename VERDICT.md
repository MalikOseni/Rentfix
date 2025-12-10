# Verdict Check – Auth Service

## Test Execution
- Command: `npm test -- auth.service.spec.ts --runInBand --coverage`
- Result: **7/7 tests passed** (no failures/skips).

## Coverage Snapshot
- Overall: **73.2% statements / 73.51% lines**
- `auth.service.ts`: **68.47% statements, 56.75% branches, 76.19% functions, 68.68% lines**
- `auth.controller.ts`: Not executed in suite (0% effective coverage)
- Below the required >90% targets across files.

## Security & Compliance Summary
- Password hashing: **Argon2id**, memoryCost=19456, timeCost=2; timing-safe verify.
- Token config: Access **15m**, Refresh **7d**; rotation present but version/reuse detection minimal.
- Soft-delete: Applied to key lookups but **not universal** across related queries.
- Multi-tenant isolation: **Missing** in invite/property flows.
- Rate limiting: Guard in place for login/register/verify-otp (5/15m, 3/1h, 10/5m) with 429 on lockout.
- Audit logging: Actions logged with masking helpers, but PII can still enter via relations/details; needs hardening.
- Environment: Secrets expected from `.env`; `.env.example` present with placeholders; no hardcoded secrets observed.

## Critical Method Presence
- Implemented: signup/register, verifyOtp, login, createTenantInvite, acceptTenantInvite, registerContractor, refreshAccessToken, deleteUserAccount.

## Verdict
- **Status:** Conditional / Fails requirements (coverage and isolation gaps).
- **Next Steps:** Increase test coverage >90%, enforce org scoping & soft-deletes universally, harden token rotation/reuse checks, ensure audit logs avoid PII.

## Phase 6 Checklist – Final Verdict

### Authentication Flows
- ❌ **Agent Signup (user + org + role transaction):** User, organization, and owner role are created but not wrapped in a database transaction, so partial writes can occur on failure.【F:services/core-auth/src/services/auth.service.ts†L88-L134】
- ✅ **OTP Verification (10-min expiry, hash comparison):** OTPs are hashed, validated with timing-safe verify, gated to unused records, and expire after 10 minutes.【F:services/core-auth/src/services/auth.service.ts†L30-L31】【F:services/core-auth/src/services/auth.service.ts†L172-L200】【F:services/core-auth/src/services/auth.service.ts†L407-L420】
- ❌ **Agent Login (failed attempts, org status, plan checks):** Failed-attempt counters enforce the 5 per 15-minute lock, but organization status/plan are never validated during login.【F:services/core-auth/src/services/auth.service.ts†L136-L166】【F:services/core-auth/src/services/auth.service.ts†L433-L452】
- ❌ **Magic Link / Tenant Invitation (72h expiry, phone validation):** Tenant invites use a 7-day expiry and accept any phone without normalization/validation.【F:services/core-auth/src/services/auth.service.ts†L202-L288】
- ❌ **Contractor Registration (pending status, background check):** Only records an audit log and returns a PENDING status without persisting contractor data or running background checks.【F:services/core-auth/src/services/auth.service.ts†L300-L319】

### Authorization
- ✅ **RBAC enforced (Owner, Manager, Staff, Tenant, Contractor):** Role checks rely on the `RbacGuard` and role metadata, allowing handler-level enforcement for supported roles.【F:services/core-auth/src/shared/guards/rbac.guard.ts†L1-L20】
- ❌ **Multi-tenant isolation (all queries filter by org_id):** Key flows (invites, login, refresh) query by user alone and do not consistently filter by organization/tenant context.【F:services/core-auth/src/services/auth.service.ts†L202-L288】【F:services/core-auth/src/services/auth.service.ts†L136-L200】
- ❌ **Property ownership verified:** Tenant invite creation accepts a propertyId but never validates property ownership or existence.【F:services/core-auth/src/services/auth.service.ts†L202-L240】
- ❌ **Permission inheritance:** Only direct role checks exist; no inheritance or hierarchical permission resolution is implemented.【F:services/core-auth/src/shared/guards/rbac.guard.ts†L1-L20】

### Security
- ✅ **Argon2 password hashing (not bcryptjs):** Passwords and secrets use Argon2id with configured memory/time costs.【F:services/core-auth/src/services/password.service.ts†L1-L17】
- ✅ **Refresh token rotation (new version on each refresh):** Refresh tokens are hashed, revoked on use, and a new versioned token is issued per refresh.【F:services/core-auth/src/services/auth.service.ts†L333-L381】
- ✅ **Rate limiting (5 attempts / 15 min on login):** Failed logins are tracked with a 5-attempt, 15-minute lock window before reset.【F:services/core-auth/src/services/auth.service.ts†L136-L166】【F:services/core-auth/src/services/auth.service.ts†L433-L452】
- ❌ **No PII in logs:** Audit logging masks emails/phones in details but still records raw IP/user agent and can persist unmasked relation data, so PII exposure remains possible.【F:services/core-auth/src/services/auth.service.ts†L452-L506】
- ✅ **Timing-safe password comparison:** Argon2 verification provides constant-time comparison for password and token hashes.【F:services/core-auth/src/services/password.service.ts†L1-L17】
- ✅ **OTP reuse prevention:** OTP queries require `usedAt IS NULL` and set `usedAt` on success to block reuse.【F:services/core-auth/src/services/auth.service.ts†L172-L200】
- ❌ **Soft delete enforcement:** Queries on invites, refresh tokens, and login paths omit consistent `deletedAt` filters or entities lack `deletedAt` fields, leaving soft-deleted data accessible.【F:services/core-auth/src/services/auth.service.ts†L172-L288】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L85-L135】

### Compliance
- ✅ **GDPR right-to-deletion:** `deleteUserAccount` soft-deletes the user and revokes sessions to honor erasure while keeping audit history.【F:services/core-auth/src/services/auth.service.ts†L382-L418】
- ✅ **Audit logging (immutable):** Database migration applies triggers preventing updates/deletes on `audit_logs` for immutability.【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L195-L209】
- ❌ **SOC 2 controls:** Periodic access reviews and broader SOC 2 operational controls are not implemented in code.【F:compliance-report.md†L38-L53】
- ❌ **OWASP Top 10:** Security misconfiguration remains (no CORS/HTTPS/Helmet in `core-auth`), leaving this control unmet.【F:compliance-report.md†L5-L23】【F:compliance-report.md†L36-L47】

### Testing
- ❌ **Unit tests >90% coverage:** Latest run shows 73.2% overall, below the 90% target.【F:VERDICT.md†L6-L10】
- ❌ **Integration tests (end-to-end):** No integration/E2E suite is present in the repository for auth flows.【F:README.md†L1-L24】
- ❌ **Edge case tests:** OTP reuse, invite expiry, and multi-tenant isolation lack negative/edge coverage beyond basic unit cases.【F:VERDICT.md†L6-L10】【F:services/core-auth/__tests__/auth.service.spec.ts†L1-L120】
- ✅ **npm test passes:** Auth service unit suite passes (`7/7` tests) on latest recorded run.【F:VERDICT.md†L3-L7】

### Database
- ❌ **Schema matches spec:** TypeORM entities omit several migration columns (OTP/login fields, deleted_at on refresh tokens) causing drift from the declared schema.【F:services/core-auth/src/entities/user.entity.ts†L22-L71】【F:services/core-auth/src/entities/refresh-token.entity.ts†L1-L27】
- ✅ **Indexes on key columns:** Migration creates indexes on user, organization, invite, refresh token, login attempt, and audit log tables.【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L154-L189】
- ❌ **Soft-delete filters:** Soft-delete columns or filters are missing on several tables and query paths, so deleted records may surface.【F:services/core-auth/src/services/auth.service.ts†L172-L288】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L85-L135】
- ❌ **Multi-tenant isolation:** Database queries seldom include `org_id`/`tenantId` predicates, risking cross-tenant access in multi-tenant deployments.【F:services/core-auth/src/services/auth.service.ts†L202-L288】【F:services/core-auth/src/services/token.service.ts†L10-L36】

**Final Verdict:** One or more checklist items remain ❌; deployment documentation is blocked until authentication, authorization, multi-tenant isolation, and coverage gaps are remediated.

## Verdict Check – Database Schema & Migrations
- **Status:** ⚠️ Does not meet all checklist items.
- **Findings:**
  - Schema migration `1700000000000-CreateAuthTables.ts` defines required auth tables with UUID primary keys, unique/partial indexes, foreign keys, and immutability triggers for `audit_logs` (items 1–9 ✅).【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L8-L150】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L152-L214】
  - Soft-delete coverage is incomplete: `tenant_invites`, `refresh_tokens`, `login_attempts`, and `audit_logs` lack `deleted_at` columns and related partial indexes, so section 10 fails (soft-delete everywhere / partial indexes).【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L45-L138】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L152-L172】
  - Active TypeORM entities under `src/entities` do not match the migration: missing OTP/login fields on `User`, no `deleted_at` on `RefreshToken` mapping, `AuditLog` includes soft-delete despite being immutable, and there is no `LoginAttempt` entity wired into the module (section 11 ❌).【F:services/core-auth/src/entities/user.entity.ts†L22-L71】【F:services/core-auth/src/entities/refresh-token.entity.ts†L1-L27】【F:services/core-auth/src/entities/audit-log.entity.ts†L1-L27】
- **Remediation Hints:** Extend soft-delete columns/indexes to all tables or relax the universal requirement; align NestJS TypeORM entities (and module wiring) with the migration definitions or consolidate on `src/database/entities/*` equivalents.
