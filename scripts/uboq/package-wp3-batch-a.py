from pathlib import Path
import json
import hashlib
import subprocess
import difflib
import zipfile
import tempfile
import datetime
import os

ROOT = Path.cwd()
OUT = ROOT / 'artifacts/uboq/wp3/batch-a'
ACCEL = ROOT / 'artifacts/uboq/wp3/accelerated-plan'

EXPECTED_MIG26_SHA256 = 'b15ab3fbcbb770b2f2051b4e824b49ee6e58b2f3e83cd8bf194664bd74dce3ce'
MIG26_PATH = 'prisma/migrations/20261113150000_wp3_batch_a_t2_t4_templates_and_formal_t4_guard/migration.sql'

EXPECTED_MIG27_SHA256 = '5be3416bd1d8fbc8b63704f100681020717358692bacda99c61daa59a20c646f'
MIG27_PATH = 'prisma/migrations/20261113160000_wp3_batch_a_audit_select_financial_guard/migration.sql'

SUPERSEDED_INITIAL_BATCH_A_ARCHIVE_SHA256 = 'e206f9d1262265e750cff49f6c4d4feb7f266c9dd37da4df8d4a2555be1688bf'


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


baseline = read_json(OUT / 'baseline.json')
runtime = read_json(OUT / 'runtime-tests.json')
ir_runtime = read_json(OUT / 'review-corrections-runtime.json')
validation = read_json(OUT / 'validation-exits.json')
mig26_receipt = read_json(OUT / 'migration26-apply.json')
mig27_receipt = read_json(OUT / 'migration27-apply.json')
inc02_baseline = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/baseline.json')
inc02_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/archive-delivery.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')
phase0_handoff = read_json(ACCEL / 'phase0-increment02-handoff.json')
phase1_crosswalk = read_json(ACCEL / 'phase1-t0-t12-crosswalk.json')

assert baseline['gate0_status'] == 'INDEPENDENT_SOURCE_EVIDENCE_REVIEW_PASS'

# Verify preserved initial Batch A 8/8 runtime suite
assert runtime['status'] == 'PASS', f"Batch A runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 8, f"Expected 8 Batch A runtime check groups, got {len(runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in runtime['checks'])
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

# Verify targeted WP3-BA-IR-01 6/6 review-corrections runtime suite
assert ir_runtime['status'] == 'PASS', f"Batch A IR-01 corrections runtime did not PASS: {ir_runtime['status']}"
assert len(ir_runtime['checks']) == 6, f"Expected 6 IR-01 check groups, got {len(ir_runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in ir_runtime['checks'])
assert ir_runtime['all_public_table_rows_preserved'] is True
assert ir_runtime['database_before_sha256'] == ir_runtime['database_after_sha256']

ba05_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BA-05'))
assert sha256_bytes((OUT / 't4-formal-export.json').read_bytes()) == ba05_detail['digests']['json']
assert sha256_bytes((OUT / 't4-formal-export.xlsx').read_bytes()) == ba05_detail['digests']['xlsx']
assert sha256_bytes((OUT / 't4-formal-export.csv').read_bytes()) == ba05_detail['digests']['csv']
t4_formal_json = json.loads((OUT / 't4-formal-export.json').read_text(encoding='utf-8'))
assert 'outputSha256' not in json.dumps(t4_formal_json.get('provenance', {})), 'Recursive hash detected in T4 JSON provenance'

for chk in validation['checks']:
    assert chk['exitCode'] == 0, f"Validation check failed: {chk['name']} -> {chk['exitCode']}"

assert mig26_receipt['migration_number'] == 26
assert mig26_receipt['migration_name'] == '20261113150000_wp3_batch_a_t2_t4_templates_and_formal_t4_guard'
assert mig26_receipt['migrations_1_to_25_verified'] == 25
assert mig26_receipt['rollback_preflight'] in ('PASS', 'ALREADY_VERIFIED')
assert mig26_receipt['result'] in ('PASS_ACTUAL_SQL_EXECUTION', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig26_receipt['sha256'] == EXPECTED_MIG26_SHA256

assert mig27_receipt['migration_number'] == 27
assert mig27_receipt['migration_name'] == '20261113160000_wp3_batch_a_audit_select_financial_guard'
assert mig27_receipt['migrations_1_to_26_verified'] == 26
assert mig27_receipt['rollback_preflight'] in ('PASS', 'ALREADY_VERIFIED')
assert mig27_receipt['result'] in ('PASS_ACTUAL_SQL_EXECUTION', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig27_receipt['sha256'] == EXPECTED_MIG27_SHA256

pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

# Verify all 3 frozen prior gate archives are byte-identical
for rel_archive, expected_sha in baseline['frozen_archives'].items():
    actual_sha = sha256_bytes((ROOT / rel_archive).read_bytes())
    assert actual_sha == expected_sha, f"Frozen archive modified: {rel_archive}"

# Verify all Increment 01 and accepted G02-R3 evidence files remain byte-identical
for rel_path, expected_hash in inc02_baseline['increment01_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Increment 01 evidence modified: {rel_path}"
    )

for rel_path, expected_hash in inc02_baseline['G02_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Accepted G02-R3 evidence modified: {rel_path}"
    )

# Verify migrations #1-#25 byte-identical + migrations #26 and #27 exact match
for rel_path, expected_hash in baseline['migrations_1_to_25'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Historical migration modified: {rel_path}"
    )

assert sha256_bytes((ROOT / MIG26_PATH).read_bytes()) == EXPECTED_MIG26_SHA256, (
    'Applied migration #26 was modified on disk'
)
assert sha256_bytes((ROOT / MIG27_PATH).read_bytes()) == EXPECTED_MIG27_SHA256, (
    'Applied migration #27 was modified on disk'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 27, f"Expected 27 migrations on disk, found {len(all_migrations)}"

# Verify reused routes, schema, and engines were NOT modified in Batch A
reused_unchanged_files = {
    'prisma/schema.prisma': '9d719f7e7b39a90ead2b01f98a6ca3d5ad168d66c7fd0b73296a23f0980c7da3',
    'src/app/api/uboq/templates/route.ts': inc02_baseline['source']['src/app/api/uboq/templates/route.ts'],
    'src/app/api/uboq/templates/layouts/route.ts': '7633c909ae7d945085b65df0c088c67dc94a47d39eb0f8bfb0513f474e88d9c4',
    'src/app/api/uboq/templates/formal-export/route.ts': '2ebe50c1b32be5fe1b95a26063abecdcac260a6f0480f2bfe91318fc4fac9db4',
    'src/lib/uboq/template-builder.ts': inc02_baseline['source']['src/lib/uboq/template-builder.ts'],
    'src/lib/uboq/field-catalog.ts': inc02_baseline['source']['src/lib/uboq/field-catalog.ts'],
    'src/lib/uboq/security/redact-payload.ts': inc02_baseline['source']['src/lib/uboq/security/redact-payload.ts'],
    'src/lib/uboq/security/stage-rbac.ts': inc02_baseline['source']['src/lib/uboq/security/stage-rbac.ts'],
}
for rel_path, expected_hash in reused_unchanged_files.items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Reused file expected byte-identical was modified: {rel_path}"
    )

# Verify reviewed Batch A modules unaffected by WP3-BA-IR-01 remain byte-identical to initial Batch A review
preserved_batch_a_unchanged_modules = {
    'src/lib/uboq/templates/canonical-source-adapters.ts': 'f3194ab58df8642f121fb45b6f16b67b6df83d08934ef6c7b7ff7081c3e0fddd',
    'src/lib/uboq/templates/t0-t1.ts': '4511539f934829e17700a48a51089c05276c8c0ecc3c4c54a4961809b10d03e2',
    'src/lib/uboq/templates/formal-t0-t1.ts': '836812f38ea511cb62e9cf78911d447d1e8bf54022686cf493ac421f1a172d1b',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx': 'caa8b7b967b4b43e4b5b33d1ea4abb1013d23ff783ed383c649036deda1b087c',
    'src/app/projects/[id]/uboq/templates/page.tsx': 'aaa4e45a30e5c292a7019b79497bd6c2509703a4a7463b2feed0aea98643bf8f',
    'scripts/uboq/apply-wp3-batch-a-migration26.cjs': '671a2813362c24444b7e0ab2b1b90fe4d3e9773d167b32e2d587a75fa942a778',
    'scripts/uboq/verify-wp3-batch-a.ts': '665e4b258ef483464034b83266a4e25432fb4113e696bfd13bffec71a82e74cf',
}
for rel_path, expected_hash in preserved_batch_a_unchanged_modules.items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Reviewed Batch A module expected byte-identical was modified: {rel_path}"
    )

allowed_modified = set(baseline['pre_batch_a_file_hashes'].keys())
for rel_path, expected_before_hash in baseline['pre_batch_a_file_hashes'].items():
    before_file = OUT / 'before' / rel_path
    assert before_file.is_file(), f"Missing pre-Batch-A backup for {rel_path}"
    assert sha256_bytes(before_file.read_bytes()) == expected_before_hash, (
        f"Pre-Batch-A backup hash mismatch for {rel_path}"
    )

sources = [
    MIG26_PATH,
    MIG27_PATH,
    'src/lib/uboq/templates/canonical-source-adapters.ts',
    'src/lib/uboq/templates/t0-t1.ts',
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'src/app/projects/[id]/uboq/templates/page.tsx',
    'scripts/uboq/apply-wp3-batch-a-migration26.cjs',
    'scripts/uboq/apply-wp3-batch-a-migration27.cjs',
    'scripts/uboq/verify-wp3-batch-a.ts',
    'scripts/uboq/verify-wp3-batch-a-corrections.ts',
    'scripts/uboq/package-wp3-batch-a.py',
    'docs/uboq/wp3-batch-a.md',
    'artifacts/uboq/wp3/accelerated-plan/phase0-increment02-handoff.json',
    'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
    'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.md',
]

payload = {}
manifest = []
patch = ''

for rel_path in sources:
    raw = (ROOT / rel_path).read_bytes()
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    payload['source/' + rel_path] = raw
    manifest.append({
        'path': rel_path,
        'status': 'MODIFIED' if rel_path in allowed_modified else 'ADDED',
        'sha256': sha256_bytes(raw),
        'bytes': len(raw),
    })
    before_text = ''
    if rel_path in allowed_modified:
        before_text = (OUT / 'before' / rel_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
    patch += f'diff --git a/{rel_path} b/{rel_path}\n'
    if not before_text:
        patch += 'new file mode 100644\n'
    patch += ''.join(
        difflib.unified_diff(
            before_text.splitlines(keepends=True),
            text.splitlines(keepends=True),
            fromfile='a/' + rel_path if before_text else '/dev/null',
            tofile='b/' + rel_path,
        )
    )

patch_bytes = patch.encode('utf-8')
payload['wp3-batch-a.patch'] = patch_bytes
(OUT / 'wp3-batch-a.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-batch-a-patch-') as td:
    temp = Path(td)
    for mod_path in sorted(allowed_modified):
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'batch-a.patch'
    patch_file.write_bytes(patch_bytes)
    res = subprocess.run(
        ['git', 'apply', '--check', '--unsafe-paths', str(patch_file)],
        cwd=temp,
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"git apply --check failed: {res.stderr}"

excluded_evidence_names = {
    'review-package.json',
    'archive-delivery.json',
    'completion-report.json',
    'wp3-batch-a.patch',
}
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name not in excluded_evidence_names and not p.name.endswith('.tsbuildinfo'):
        payload['evidence/' + p.relative_to(OUT).as_posix()] = p.read_bytes()

db_receipt = read_json(ROOT / 'artifacts/uboq/g02-r3/h02-b-implementation/local-database.json')
conn_cfg = read_json(Path(db_receipt['runtime_directory']) / 'connection.json')
fix_cfg = read_json(Path(db_receipt['runtime_directory']) / 'fixture-config.json')
secrets = [
    str(x)
    for x in [
        conn_cfg.get('password'),
        fix_cfg.get('companyPw'),
        fix_cfg.get('projectPw'),
        fix_cfg.get('signing'),
    ]
    if x
]
for name, b in payload.items():
    for secret in secrets:
        assert secret.encode('utf-8') not in b, f"Secret leak detected in {name}"

migration_hashes = {
    **baseline['migrations_1_to_25'],
    MIG26_PATH: EXPECTED_MIG26_SHA256,
    MIG27_PATH: EXPECTED_MIG27_SHA256,
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-A-IR1-REMEDIATED',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'WP3_BATCH_A_IR1_REMEDIATED_LOCALLY_VERIFIED_PENDING_TARGETED_INDEPENDENT_REVIEW_NOT_FINAL_FREEZE',
    'governance_gate': 'STOPPED_AT_BATCH_A_TARGETED_INDEPENDENT_REVIEW',
    'independent_acceptance_claimed': False,
    'superseded_initial_batch_a_archive_sha256': SUPERSEDED_INITIAL_BATCH_A_ARCHIVE_SHA256,
    'gate0_handoff': {
        'verdict': 'INDEPENDENT_SOURCE_EVIDENCE_REVIEW_PASS',
        'accepted_increment02_archive': inc02_delivery['archive'],
        'accepted_increment02_archive_sha256': baseline['accepted_increment02_archive_sha256'],
        'handoff_artifact': 'source/artifacts/uboq/wp3/accelerated-plan/phase0-increment02-handoff.json',
    },
    'phase1_authoritative_crosswalk': {
        'json_artifact': 'source/artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
        'markdown_artifact': 'source/artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.md',
        'template_ids_preserved_without_renaming': phase1_crosswalk['source_of_truth']['template_ids_preserved_without_renaming'],
        'reconciled_batch_a_ids': phase1_crosswalk['reconciliation_notes']['t2_to_t4_preserved_ids'],
        'reserved_t11_t12_reconciliation': phase1_crosswalk['reconciliation_notes']['t11_to_t12_reserved_reconciliation'],
    },
    'reused_unchanged_components': {
        'files_verified_byte_identical': reused_unchanged_files,
        'batch_a_reviewed_modules_verified_byte_identical': preserved_batch_a_unchanged_modules,
        'increment01_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment01-review.zip'],
        'increment01_runtime_pass': inc01_delivery['runtime_pass'],
        'increment02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment02-review.zip'],
        'increment02_preserved_runtime_pass': inc02_delivery['preserved_runtime_pass'],
        'increment02_review_corrections_pass': inc02_delivery['review_corrections_runtime_pass'],
        'accepted_g02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/g02-r3/independent-review-candidate.zip'],
    },
    'targeted_independent_review_remediation': {
        'review_id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-A-IR1',
        'finding_id': 'WP3-BA-IR-01',
        'severity': 'HIGH',
        'root_cause': 'recordFormalExportProvenance stores approvedLineTotal, procurementBudgetTotal, currentApprovedContractValue, pricingMethod, and contractVatBasis in UboqTemplateAuditEvent.detailsJson. Under Migration #24 SELECT RLS (uboq_can_read_template_audit) and loadSavedLayout auditTrail serialization, non-financial project actors (SITE_ENGINEER, VIEWER, EXTERNAL_VIEWER) could retrieve PROJECT_SHARED and SYSTEM_FORMAL_PRESET formal export audit rows containing restricted financial totals.',
        'database_remediation': {
            'migration_number': 27,
            'migration_path': MIG27_PATH,
            'migration_sha256': EXPECTED_MIG27_SHA256,
            'changes': [
                'Defines public.uboq_can_read_template_audit_event(p_project_id, p_event_type, p_sharing_scope, p_actor_user_id, p_layout_owner_id) requiring public.uboq_can_formal_export_template(p_project_id, v_current_user_id) IS TRUE whenever p_event_type = FORMAL_EXPORT_GENERATED OR p_sharing_scope = SYSTEM_FORMAL_PRESET (covering PROJECT_SHARED, SYSTEM_FORMAL_PRESET, and PRIVATE formal export audit rows, including downgraded-actor rows).',
                'Hardens legacy 4-arg public.uboq_can_read_template_audit(...) to delegate SYSTEM_FORMAL_PRESET to FORMAL_EXPORT_GENERATED.',
                'Replaces rls_restrictive_uboq_tpl_audit_tenant on public."UboqTemplateAuditEvent" so USING (...) invokes uboq_can_read_template_audit_event(...) while preserving Migration #25 WITH CHECK (app.uboq_audit_fn_active = on) and SELECT-only privilege on oserp_compat_app.',
            ],
        },
        'application_defense_in_depth': {
            'modified_file': 'src/lib/uboq/templates/saved-layouts.ts',
            'changes': [
                'Adds canReadFormalFinancialAudit capability aligned 1-to-1 with COMMERCIAL_RESTRICTED_ROLES / FORMAL_EXPORT_ROLES / uboq_can_formal_export_template.',
                'Filters FORMAL_EXPORT_GENERATED and SYSTEM_FORMAL_PRESET out of loadSavedLayout Prisma query when !caps.canReadFormalFinancialAudit.',
                'Applies sanitizeLayoutAuditTrailForActor + redactLayoutAuditDetailsForActor across auditTrail responses, omitting formal export audit events, stripping restricted financial detail keys + redactUboqPayloadForRole, and filtering selectedFields / headingAliases inside LAYOUT_CREATED, LAYOUT_VERSIONED, and LAYOUT_DUPLICATED details via canRoleReadField.',
            ],
        },
        'targeted_tests': {
            'script': 'scripts/uboq/verify-wp3-batch-a-corrections.ts',
            'evidence': 'evidence/review-corrections-runtime.json',
            'passed': 6,
            'failed': 0,
        },
    },
    'implemented': {
        'shared_canonical_adapters': 'src/lib/uboq/templates/canonical-source-adapters.ts (read-only Prisma.Decimal source catalogs and canonical row loaders for T2_CONSOLIDATED_BOQ, T3_AGENCY_ESTIMATE, and T4_RESOURCE_TAKEOFF)',
        'T2_CONSOLIDATED_BOQ': 'Consolidated Work Scope View (CONSOLIDATED_WORK_ITEM, non-formal): snapshot-scoped UboqConsolidationLink aggregation (prevents drift across snapshots), compatible UOM conversion (ton -> kg), LUMP_SCOPE non-merge protection, weighted unit rate (4dp), and 0.00 variance reconciliation with T1_PHASE_BOQ.',
        'T3_AGENCY_ESTIMATE': 'Agency POW / DUPA Estimate Baseline (PHASE_BOQ_LINE, non-formal): enforces R1-M02 sourced agency_abc integrity (null when unprovided; SOURCE_NOT_PROVIDED emits null cost fields), TAX-01 5% DUPA estimate VAT separation from 12% statutory output VAT, and VAL-10 single-count contingency.',
        'T4_RESOURCE_TAKEOFF': 'Procurement Resource Requirement & Stock Balance (CANONICAL_RESOURCE, formal ERP_CANONICAL_T4_FORMAL_V1): exact 4dp stock/open-MR/PO/delivered/consumed/to-procure balances, overcommitment detection, MRF/Supplier PO lineage, and strict separation of internal Benchmark/PRR cost ceilings from Awarded BOQ contract revenue.',
        'formal_t4_contract': 'ERP_CANONICAL_T4_FORMAL_V1 across JSON, XLSX, and CSV with exact-byte SHA-256 provenance, live Excel SUM(...) formula on procurement_budget (NO_SUM on target_resource_cost), UOM-grouped subtotals, VAL-19 zero-open-BLOCKING gate, and RESTRICTED_PROCUREMENT_BUDGET SensitiveExportLog; non-formal T2/T3 fail closed (400 FORMAL_TEMPLATE_CODE_NOT_SUPPORTED).',
        'saved_layouts_and_rbac_parity': 'Persistent project-scoped saved layouts (create, version, duplicate, load, preview, PROJECT_SHARED) extended to T0–T4 with 1-to-1 SQL/TS role parity, PostgreSQL SELECT RLS financial-role gating on UboqTemplateAuditEvent (Migration #27), and defense-in-depth auditTrail redaction in saved-layouts.ts.',
    },
    'tests': {
        'preserved_batch_a_consolidated_runtime_pass': 8,
        'preserved_batch_a_consolidated_runtime_fail': 0,
        'preserved_batch_a_runtime_report': 'evidence/runtime-tests.json',
        'targeted_ir01_corrections_runtime_pass': 6,
        'targeted_ir01_corrections_runtime_fail': 0,
        'targeted_ir01_corrections_runtime_report': 'evidence/review-corrections-runtime.json',
        'browser_e2e': 'PASS — preserved real headless Chromium E2E across T2/T3/T4 at 1440px desktop & 390px mobile (TemplateBuilder.tsx & page.tsx byte-identical).',
        'validation': {c['name']: c['exitCode'] for c in validation['checks']},
    },
    'preservation': {
        'migration_count': 27,
        'migrations_1_to_25_byte_unchanged': True,
        'migration_26_byte_unchanged': True,
        'forward_only_migration_26': MIG26_PATH,
        'migration_26_sha256': EXPECTED_MIG26_SHA256,
        'forward_only_migration_27': MIG27_PATH,
        'migration_27_sha256': EXPECTED_MIG27_SHA256,
        'migration_hashes': migration_hashes,
        'frozen_archives_unchanged': baseline['frozen_archives'],
        'database_public_tables_identical_after_cleanup': ir_runtime['public_table_count'],
        'database_before_sha256': ir_runtime['database_before_sha256'],
        'database_after_sha256': ir_runtime['database_after_sha256'],
        'canonical_boq_or_contract_mutations': 0,
        'protected_databases_or_task015_worktree_modified': False,
    },
    'remaining_blockers_and_holds': {
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains preserved and unresolved; #1-#26 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency statutory print layouts and wet/digital signatory blocks remain unspecified; validated generic ERP formal contracts retained.',
        'future_wp3_batches': 'Batch B (T5_ACCOMPLISHMENT_CERT, T6_PROGRESS_BILLING, T7_SCHEDULE_EVM), Batch C (T8–T10), and Batch D (reserved T11–T12 + signed round-trip workbook re-import) remain deferred until Batch A targeted independent review acceptance.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'next_wp3_batch': {
        'batch': 'WP-3 Batch B',
        'recommended_scope': 'Implement existing T5_ACCOMPLISHMENT_CERT, T6_PROGRESS_BILLING, and T7_SCHEDULE_EVM projections and formal SWA/Progress Billing contracts over canonical Accomplishment, Inspection, Billing, UboqTaxPricingProfile, and ProjectSchedule/CPM authorities.',
    },
    'head': inc02_baseline['head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-Batch-A files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-batch-a-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-batch-a-review.zip'
temp_archive = archive.with_suffix('.zip.tmp')
with zipfile.ZipFile(temp_archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, b in sorted(payload.items()):
        z.writestr(name, b)

with zipfile.ZipFile(temp_archive, 'r') as z:
    assert z.testzip() is None
    for row in index['payload_manifest']:
        assert sha256_bytes(z.read(row['path'])) == row['sha256']

os.replace(temp_archive, archive)
(OUT / 'review-package.json').write_bytes(index_bytes)
(OUT / 'completion-report.json').write_bytes(completion_bytes)

delivery = {
    'status': summary['status'],
    'governance_gate': summary['governance_gate'],
    'superseded_initial_batch_a_archive_sha256': SUPERSEDED_INITIAL_BATCH_A_ARCHIVE_SHA256,
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'preserved_batch_a_runtime_pass': 8,
    'preserved_batch_a_runtime_fail': 0,
    'targeted_ir01_corrections_runtime_pass': 6,
    'targeted_ir01_corrections_runtime_fail': 0,
    'reused_increment01_runtime_pass': 14,
    'reused_increment02_runtime_pass': 13,
    'reused_increment02_ir_pass': 6,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'frozen_archives_unchanged': True,
    'migrations_1_to_25_unchanged': True,
    'migration_26_unchanged': True,
    'migration_26_sha256': EXPECTED_MIG26_SHA256,
    'migration_27_sha256': EXPECTED_MIG27_SHA256,
    'release_holds': [
        'migration14_historical_production_lineage',
        'migration23_rollover_before_PREVIEW',
        'external_agency_formal_specs_absent_generic_retained',
    ],
    'production_changes': False,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
