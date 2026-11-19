# Phase 9 Delta 1 — Additive Input Mapping Profile Persistence Proposal

> [!NOTE]
> **No database schema changes, migrations, or DB privilege modifications were applied in Delta 1.**  
> Per Owner Directive (Rule #5), existing mapping-profile facilities are reused where applicable (`UboqTemplateDefinition` remains strictly reserved for frozen `T0`–`T12` output layouts governed by `src/lib/uboq/templates/saved-layouts.ts`), and Delta 1 provides validated portable JSON profile import/export (`UBOQ_INPUT_MAPPING_PROFILE_V1`) plus client-side project-scoped scratch presets.

## Minimal Additive UBOQ-Only Persistence Proposal (Requires Reviewed Migration Approval)

If multi-user server-side persistence of reusable **input** column-mapping profiles is approved in a subsequent reviewed migration, the smallest additive UBOQ-only schema addition is:

1. **Table**: `public."UboqInputMappingProfile"`
   - `id TEXT PRIMARY KEY`
   - `projectId TEXT NULL REFERENCES public."Project"(id) ON DELETE CASCADE` (null = organization-wide reusable profile; non-null = project-scoped profile)
   - `profileName TEXT NOT NULL`
   - `sectorType "UboqSectorType" NULL`
   - `columnMapJson JSONB NOT NULL` (validated against `CANONICAL_FIELD_MAP`, zero conflicts)
   - `createdById TEXT NOT NULL REFERENCES public."User"(id) ON DELETE RESTRICT`
   - `createdAt TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updatedAt TIMESTAMPTZ NOT NULL`
   - Unique index on `(COALESCE(projectId, '__GLOBAL__'), lower(profileName))`
2. **Security & RLS**:
   - `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`
   - Project-scoped `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies bound to `app.current_project_id` and verified `UBOQ_HUMAN_REVIEW_RESOLVE` / `UBOQ_VIEW` stage authorization.
   - Strict least-privilege grant to `oserp_compat_app` on this new table ONLY (never blanket grants).
3. **Zero Impact on Frozen Modules**:
   - Does not modify `UboqTemplateDefinition`, `saved-layouts.ts`, `UboqExtractionCandidate`, `UboqSourceDocument`, `AwardedBOQItem`, or any frozen ERP tables.
