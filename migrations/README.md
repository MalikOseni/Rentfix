# Migration strategy

- **Versioning**: Use incrementing, timestamp-prefixed files (e.g., `20240910T1200_add_index.sql`) stored in this folder. Each file should be immutable after merge.
- **Schema tracking**: Maintain a `schema_migrations` table managed by the migration runner (e.g., Atlas, Flyway, Sqitch, or Prisma Migrate) to record applied versions and checksum hashes.
- **Order of operations**: Each migration wraps statements in a transaction when supported by PostgreSQL. Non-transactional operations (index concurrently, type changes) should be isolated in their own file with guard comments.
- **Backward compatibility**: Prefer additive changes (new columns, tables, indexes). For breaking changes, deploy in two steps: add new structures, backfill, then remove old columns in a later migration.
- **RLS & permissions**: Enable row-level security and policies per service after verifying tenant scoping. Apply GRANTs in migrations adjacent to the services that require them.
- **Secrets/config**: Avoid seeding secrets here. Use environment management for credentials and provider keys.
- **Rollbacks**: Provide manual down scripts when using a tool that supports them, or create `*_down.sql` companions for high-risk migrations.

## Applying locally

1. Run the baseline migration: `psql "$DATABASE_URL" -f migrations/0001_initial_schema.sql`.
2. Apply subsequent migrations in lexical order, ensuring the `schema_migrations` table is updated by your migration tool.
3. Load test data via `psql "$DATABASE_URL" -f migrations/seed/seed_data.sql`.
