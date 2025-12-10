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

## Verdict Check – Database Schema & Migrations
- **Status:** ⚠️ Does not meet all checklist items.
- **Findings:**
  - Schema migration `1700000000000-CreateAuthTables.ts` defines required auth tables with UUID primary keys, unique/partial indexes, foreign keys, and immutability triggers for `audit_logs` (items 1–9 ✅).【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L8-L150】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L152-L214】
  - Soft-delete coverage is incomplete: `tenant_invites`, `refresh_tokens`, `login_attempts`, and `audit_logs` lack `deleted_at` columns and related partial indexes, so section 10 fails (soft-delete everywhere / partial indexes).【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L45-L138】【F:services/core-auth/src/database/migrations/1700000000000-CreateAuthTables.ts†L152-L172】
  - Active TypeORM entities under `src/entities` do not match the migration: missing OTP/login fields on `User`, no `deleted_at` on `RefreshToken` mapping, `AuditLog` includes soft-delete despite being immutable, and there is no `LoginAttempt` entity wired into the module (section 11 ❌).【F:services/core-auth/src/entities/user.entity.ts†L22-L71】【F:services/core-auth/src/entities/refresh-token.entity.ts†L1-L27】【F:services/core-auth/src/entities/audit-log.entity.ts†L1-L27】
- **Remediation Hints:** Extend soft-delete columns/indexes to all tables or relax the universal requirement; align NestJS TypeORM entities (and module wiring) with the migration definitions or consolidate on `src/database/entities/*` equivalents.
