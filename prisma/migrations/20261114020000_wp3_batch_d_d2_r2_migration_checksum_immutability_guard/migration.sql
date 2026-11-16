-- ============================================================================
-- Forward-Only Migration #37: WP3 Batch D Phase D2 R2 (D2-R1-IR-01)
-- Enforce database-level immutability and checksum integrity on
-- public."_prisma_migrations" so applied migration checksums, names, and
-- completion provenance cannot be overwritten, deleted, or rolled back in place.
-- Historical Migrations #1-#36 remain 100% byte-identical.
-- ============================================================================

REVOKE ALL ON TABLE public."_prisma_migrations" FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_compat_app') THEN
    EXECUTE 'REVOKE ALL ON TABLE public."_prisma_migrations" FROM oserp_compat_app';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_maint_cleanup_role') THEN
    EXECUTE 'REVOKE ALL ON TABLE public."_prisma_migrations" FROM oserp_maint_cleanup_role';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uboq_prisma_migrations_finished_name_uniq
  ON public."_prisma_migrations" (migration_name)
  WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;

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
         OR NEW.finished_at IS NULL
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

DROP TRIGGER IF EXISTS trg_uboq_guard_prisma_migration_ledger ON public."_prisma_migrations";

CREATE TRIGGER trg_uboq_guard_prisma_migration_ledger
  BEFORE INSERT OR UPDATE OR DELETE ON public."_prisma_migrations"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_prisma_migration_ledger();

CREATE OR REPLACE FUNCTION public.uboq_verify_prisma_migration_ledger_state()
RETURNS TABLE (
  total_rows integer,
  finished_active_rows integer,
  unfinished_or_rolled_back_rows integer,
  invalid_checksum_rows integer,
  duplicate_name_groups integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    count(*)::integer AS total_rows,
    count(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::integer AS finished_active_rows,
    count(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL)::integer AS unfinished_or_rolled_back_rows,
    count(*) FILTER (WHERE checksum IS NULL OR checksum !~ '^[0-9a-f]{64}$')::integer AS invalid_checksum_rows,
    (
      SELECT count(*)::integer
      FROM (
        SELECT migration_name
        FROM public."_prisma_migrations"
        GROUP BY migration_name
        HAVING count(*) > 1
      ) d
    ) AS duplicate_name_groups
  FROM public."_prisma_migrations";
$$;
