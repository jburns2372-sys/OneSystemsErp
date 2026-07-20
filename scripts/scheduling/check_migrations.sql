-- Check _prisma_migrations in the sanitized archive
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;
