-- Forward-only Migration #38: D2 R3 completed timestamp immutability.
-- Preserve all Migration #37 protections and legitimate initial completion.

CREATE OR REPLACE FUNCTION public.uboq_guard_prisma_migration_ledger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.finished_at IS NOT NULL THEN
      RAISE EXCEPTION
        'UBOQ_APPLIED_MIGRATION_DELETE_FORBIDDEN: Applied Prisma migration ledger record % (%) is immutable and cannot be deleted.',
        OLD.migration_name,
        OLD.id
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.migration_name IS NULL OR btrim(NEW.migration_name) = '' THEN
    RAISE EXCEPTION
      'UBOQ_MIGRATION_NAME_REQUIRED: _prisma_migrations.migration_name cannot be null or blank.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.checksum IS NULL OR NEW.checksum !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION
      'UBOQ_MIGRATION_CHECKSUM_FORMAT_INVALID: _prisma_migrations.checksum for % must be a 64-character lowercase SHA-256 hex digest.',
      NEW.migration_name
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1
      FROM public."_prisma_migrations" pm
      WHERE pm.migration_name = NEW.migration_name
        AND pm.finished_at IS NOT NULL
        AND pm.rolled_back_at IS NULL
    ) THEN
      RAISE EXCEPTION
        'UBOQ_APPLIED_MIGRATION_DUPLICATE_FORBIDDEN: Migration % is already recorded as applied in _prisma_migrations.',
        NEW.migration_name
        USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.finished_at IS NOT NULL THEN
      IF NEW.checksum IS DISTINCT FROM OLD.checksum
         OR NEW.migration_name IS DISTINCT FROM OLD.migration_name
         OR NEW.id IS DISTINCT FROM OLD.id
         OR NEW.started_at IS DISTINCT FROM OLD.started_at
         OR NEW.finished_at IS DISTINCT FROM OLD.finished_at
         OR NEW.rolled_back_at IS NOT NULL
      THEN
        RAISE EXCEPTION
          'UBOQ_APPLIED_MIGRATION_CHECKSUM_IMMUTABLE: Applied migration % checksum and ledger provenance cannot be overwritten or rolled back in place.',
          OLD.migration_name
          USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.checksum IS DISTINCT FROM OLD.checksum
         OR NEW.migration_name IS DISTINCT FROM OLD.migration_name
         OR NEW.id IS DISTINCT FROM OLD.id
      THEN
        RAISE EXCEPTION
          'UBOQ_INFLIGHT_MIGRATION_CHECKSUM_MUTATION_FORBIDDEN: In-flight migration % checksum or identity cannot be mutated.',
          OLD.migration_name
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;
