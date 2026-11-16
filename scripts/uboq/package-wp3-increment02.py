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
OUT = ROOT / 'artifacts/uboq/wp3/increment-02'

EXPECTED_MIG24_SHA256 = 'bfc43cdb1d4d638edf5d38d80451019b3eb925cf6f03c4ffe46143941018aac8'


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


baseline = read_json(OUT / 'baseline.json')
runtime = read_json(OUT / 'runtime-tests.json')
ir_runtime = read_json(OUT / 'review-corrections-runtime.json')
checks = read_json(OUT / 'validation-exits.json')
mig24_receipt = read_json(OUT / 'migration24-apply.json')
mig25_receipt = read_json(OUT / 'migration25-apply.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')

assert runtime['status'] == 'PASS', f"Preserved runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 13, f"Expected 13 preserved runtime checks, got {len(runtime['checks'])}"
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

assert ir_runtime['status'] == 'PASS', f"Review-corrections runtime tests did not PASS: {ir_runtime['status']}"
assert len(ir_runtime['checks']) == 6, f"Expected 6 review-corrections checks, got {len(ir_runtime['checks'])}"
assert ir_runtime['all_public_table_rows_preserved'] is True
assert ir_runtime['database_before_sha256'] == ir_runtime['database_after_sha256']

ir02_detail = next(c['detail'] for c in ir_runtime['checks'] if c['name'].startswith('WP3-02-IR-02'))
assert sha256_bytes((OUT / 't0-formal-contract-ir.json').read_bytes()) == ir02_detail['t0JsonDeliveredSha256']
assert sha256_bytes((OUT / 't1-formal-boq-linked-ir.json').read_bytes()) == ir02_detail['t1JsonDeliveredSha256']
assert ir02_detail['recursiveHashInJsonBody'] is False

assert checks == {
    'typescript_exit': 0,
    'eslint_exit': 0,
    'prisma_root_validate_exit': 0,
    'prisma_aws_validate_exit': 0,
}, f"Validation exits failed: {checks}"

assert mig24_receipt['migration_number'] == 24
assert mig24_receipt['migration_name'] == '20261113130000_wp3_increment02_saved_layouts_and_formal_exports'
assert mig24_receipt['migrations_1_to_23_verified'] == 23
assert mig24_receipt['rollback_preflight'] == 'PASS'
assert mig24_receipt['result'] == 'PASS_ACTUAL_SQL_EXECUTION'

assert mig25_receipt['migration_number'] == 25
assert mig25_receipt['migration_name'] == '20261113140000_wp3_increment02_audit_auth_and_contract_link'
assert mig25_receipt['migrations_1_to_24_verified'] == 24
assert mig25_receipt['rollback_preflight'] in ('PASS', 'ALREADY_VERIFIED')
assert mig25_receipt['result'] in ('PASS_ACTUAL_SQL_EXECUTION', 'ALREADY_APPLIED_AND_VERIFIED')

pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

allowed_modified = {
    'prisma/schema.prisma',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'src/app/projects/[id]/uboq/templates/page.tsx',
}

for rel_path, expected_hash in baseline['source'].items():
    cur_hash = sha256_bytes((ROOT / rel_path).read_bytes())
    if rel_path in allowed_modified:
        before_file = OUT / 'before' / rel_path
        assert before_file.is_file(), f"Missing pre-edit backup for {rel_path}"
        assert sha256_bytes(before_file.read_bytes()) == expected_hash, (
            f"Pre-edit backup hash mismatch for {rel_path}"
        )
    else:
        assert cur_hash == expected_hash, f"Existing source changed outside Increment 02 scope: {rel_path}"

for rel_path, expected_hash in baseline['migrations_1_to_23'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Historical migration modified: {rel_path}"
    )

mig24_path = 'prisma/migrations/20261113130000_wp3_increment02_saved_layouts_and_formal_exports/migration.sql'
mig25_path = 'prisma/migrations/20261113140000_wp3_increment02_audit_auth_and_contract_link/migration.sql'

assert sha256_bytes((ROOT / mig24_path).read_bytes()) == EXPECTED_MIG24_SHA256, (
    'Applied migration #24 was modified on disk'
)
assert sha256_bytes((ROOT / mig25_path).read_bytes()) == mig25_receipt['sha256'], (
    'Migration #25 hash does not match applied receipt'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 25, f"Expected 25 migrations on disk, found {len(all_migrations)}"

for rel_path, expected_hash in baseline['increment01_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Increment 01 evidence modified: {rel_path}"
    )

for rel_path, expected_hash in baseline['G02_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Accepted G02-R3 evidence modified: {rel_path}"
    )

assert sha256_bytes((ROOT / 'artifacts/uboq/wp3/wp3-increment01-review.zip').read_bytes()) == baseline['increment01_archive_sha256']
assert sha256_bytes((ROOT / 'artifacts/uboq/g02-r3/independent-review-candidate.zip').read_bytes()) == baseline['accepted_g02_archive_sha256']

sources = [
    'prisma/schema.prisma',
    mig24_path,
    mig25_path,
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/app/api/uboq/templates/layouts/route.ts',
    'src/app/api/uboq/templates/formal-export/route.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'src/app/projects/[id]/uboq/templates/page.tsx',
    'scripts/uboq/apply-wp3-increment02-migration24.cjs',
    'scripts/uboq/apply-wp3-increment02-migration25.cjs',
    'scripts/uboq/verify-wp3-increment02.ts',
    'scripts/uboq/verify-wp3-increment02-corrections.ts',
    'scripts/uboq/package-wp3-increment02.py',
    'docs/uboq/wp3-increment-02.md',
]

payload = {}
manifest = []
patch = ''

for rel_path in sources:
    raw = (ROOT / rel_path).read_bytes()
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    payload['source/' + rel_path] = raw
    manifest.append({'path': rel_path, 'sha256': sha256_bytes(raw), 'bytes': len(raw)})
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
payload['wp3-increment02.patch'] = patch_bytes
(OUT / 'wp3-increment02.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-inc02-patch-') as td:
    temp = Path(td)
    for mod_path in allowed_modified:
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'increment02.patch'
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
    'wp3-increment02.patch',
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
    **baseline['migrations_1_to_23'],
    mig24_path: sha256_bytes((ROOT / mig24_path).read_bytes()),
    mig25_path: sha256_bytes((ROOT / mig25_path).read_bytes()),
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-INCREMENT-02',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'SECOND_LOCAL_INCREMENT_REMEDIATED_PENDING_INDEPENDENT_REVIEW_NOT_FULL_WP3_ACCEPTANCE',
    'governance_gate': 'STOPPED_AT_INDEPENDENT_REVIEW_GATE',
    'independent_acceptance_claimed': False,
    'reused_increment01_evidence': {
        'increment01_archive': inc01_delivery['archive'],
        'increment01_archive_sha256': baseline['increment01_archive_sha256'],
        'increment01_runtime_pass': inc01_delivery['runtime_pass'],
        'increment01_payloads_verified': inc01_delivery['payloads_verified'],
        'increment01_unchanged': True,
    },
    'accepted_g02_evidence': {
        'archive_sha256': baseline['accepted_g02_archive_sha256'],
        'evidence_files_verified': len(baseline['G02_evidence']),
        'unchanged': True,
    },
    'independent_review_remediation': {
        'WP3-02-IR-01': {
            'severity': 'HIGH',
            'status': 'REMEDIATED_AND_LOCALLY_VERIFIED',
            'summary': 'Revoked direct INSERT on UboqTemplateAuditEvent from oserp_compat_app in forward-only migration #25; append-only audit creation now executes exclusively via uboq_append_template_audit_event + RLS/trigger guards verifying bound actor identity, authoritative User.role, uboq_can_formal_export_template / uboq_can_write_template_layout entitlement, VAL-19 zero-open-BLOCKING gate, and APPROVED source/layout linkage.',
        },
        'WP3-02-IR-02': {
            'severity': 'HIGH',
            'status': 'REMEDIATED_AND_LOCALLY_VERIFIED',
            'summary': 'Embedded non-recursive provenance { auditEventId, digestAlgorithm: SHA-256, digestHeader: X-OSERP-Output-Sha256 } into JSON payload prior to UTF-8 serialization, hashed exact delivered bytes, and returned raw NextResponse(deliveredBytes) so HTTP response SHA-256 equals X-OSERP-Output-Sha256 and UboqTemplateAuditEvent.outputSha256.',
        },
        'WP3-02-IR-03': {
            'severity': 'MEDIUM',
            'status': 'REMEDIATED_AND_LOCALLY_VERIFIED',
            'summary': 'Added nullable UboqOperationalSnapshot.contractAuthorityId with same-project & approved-authority trigger guards; removed newest-contract createdAt guessing in T1_PHASE_BOQ; unlinked snapshots classify contractual pricing/VAT context as UNLINKED_* without guessing across multiple approved project contracts, and unverified/mismatched/unapproved associations fail closed (409).',
        },
    },
    'implemented': {
        'saved_layouts': [
            'Persistent project-scoped T0/T1 layout definitions in UboqTemplateDefinition with lineage (layoutGroupId, supersedesId, duplicatedFromId) and sharingScope (PRIVATE | PROJECT_SHARED).',
            'Create and save, edit and version (v1 -> v2 -> ... with optimistic expectedVersionNumber lock), duplicate into independent v1 lineage, load any historical or head revision, and preview against approved canonical sources.',
            'Controlled sharing gated by DB-backed global role + active ProjectUserAssignment accessLevel; viewer-loaded shared layouts automatically redact unauthorized financial columns.',
            'Immutable historical revisions and least-privilege append-only audit provenance in UboqTemplateAuditEvent (via uboq_append_template_audit_event) + AuditLog.',
        ],
        'formal_t0_t1_contracts': [
            'Validated generic ERP formal export contracts ERP_CANONICAL_T0_FORMAL_V1 and ERP_CANONICAL_T1_FORMAL_V1 in JSON, XLSX, and CSV with exact-byte SHA-256 provenance across all three formats.',
            'Preserves Awarded BOQ source integrity, distinct multi-phase lines, originalQty + approvedQty, evidence-backed contractPricingMethod + contractVatBasis (or explicit UNLINKED classification when snapshot has no contractAuthorityId), source document SHA-256 and awarded BOQ item traceability, exact Prisma.Decimal totals + phase subtotals, and live Excel SUM(...) formulas.',
            'Enforces VAL-19 (blocks formal export when open BLOCKING UboqValidationException exists) and mandatory contractual column completeness.',
            'Explicitly records AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED and missing external contracts [EXTERNAL_AGENCY_FORM_LAYOUT, EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK] without inventing agency layouts, signatures, or approval blocks.',
        ],
    },
    'entry_points': {
        'page': '/projects/[id]/uboq/templates',
        'working_copy_api_preserved': 'GET/POST /api/uboq/templates',
        'saved_layouts_api': 'GET/POST /api/uboq/templates/layouts',
        'formal_export_api': 'GET/POST /api/uboq/templates/formal-export',
    },
    'tests': {
        'preserved_increment02_runtime_pass': 13,
        'preserved_increment02_runtime_report': 'evidence/runtime-tests.json',
        'targeted_review_corrections_pass': 6,
        'targeted_review_corrections_fail': 0,
        'targeted_review_corrections_report': 'evidence/review-corrections-runtime.json',
        'reused_increment01_runtime_pass': 14,
        'validation': checks,
        'browser_e2e_preserved': 'Preserved 13/13 Chromium E2E evidence (evidence/runtime-tests.json) + re-verified updated TemplateBuilder.tsx client bundle server-module exclusion in WP3-02-IR-04.',
    },
    'preservation': {
        'migration_count': 25,
        'migrations_1_to_23_byte_unchanged': True,
        'migration_24_byte_unchanged': True,
        'forward_only_migration_24': mig24_path,
        'migration_24_sha256': migration_hashes[mig24_path],
        'forward_only_migration_25': mig25_path,
        'migration_25_sha256': migration_hashes[mig25_path],
        'migration_hashes': migration_hashes,
        'accepted_G02_evidence_files_byte_unchanged': len(baseline['G02_evidence']),
        'increment01_evidence_files_byte_unchanged': len(baseline['increment01_evidence']),
        'preexisting_source_files_preserved_except_allowed_3': True,
        'allowed_modified_files': sorted(allowed_modified),
        'database_public_tables_identical_after_cleanup': ir_runtime['public_table_count'],
        'database_before_sha256': ir_runtime['database_before_sha256'],
        'database_after_sha256': ir_runtime['database_after_sha256'],
        'canonical_boq_or_contract_mutations': 0,
        'protected_databases_or_task015_worktree_modified': False,
    },
    'roadmap_reconciliation': {
        'source_of_truth': 'src/lib/uboq/template-builder.ts (SYSTEM_TEMPLATE_PRESETS)',
        'accepted_contracts_unchanged': True,
        'reconciled_t2_to_t4': {
            'T2_CONSOLIDATED_BOQ': 'Consolidated Work Scope View (CONSOLIDATED_WORK_ITEM)',
            'T3_AGENCY_ESTIMATE': 'Agency POW / DUPA Estimate Baseline (PHASE_BOQ_LINE)',
            'T4_RESOURCE_TAKEOFF': 'Procurement Resource Requirement & Stock Balance (CANONICAL_RESOURCE)',
        },
        't5_to_t10_preserved': [
            'T5_ACCOMPLISHMENT_CERT',
            'T6_PROGRESS_BILLING',
            'T7_SCHEDULE_EVM',
            'T8_CASHFLOW_HALF_MONTH',
            'T9_CASHFLOW_QUARTERLY',
            'T10_EXECUTIVE_MARGIN',
        ],
        't11_to_t12_status': 'Unallocated roadmap slots in SYSTEM_TEMPLATE_PRESETS — require explicit owner contract specification before implementation; no silent renaming permitted.',
    },
    'remaining_blockers_and_holds': {
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains unresolved; #1-#24 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency form layouts, offline CSV provenance sidecars, and signatory/approval blocks are not yet specified; validated generic ERP formal contracts retained.',
        'future_wp3_scope': 'Signed round-trip workbook re-imports and operational templates T2-T12 (starting with accepted T2_CONSOLIDATED_BOQ, T3_AGENCY_ESTIMATE, T4_RESOURCE_TAKEOFF) remain deferred to subsequent WP-3 increments.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'next_wp3_increment': {
        'increment': 'WP-3 Increment 03',
        'recommended_scope': 'Implement accepted T2-T4 operational template projections per SYSTEM_TEMPLATE_PRESETS (T2_CONSOLIDATED_BOQ Consolidated Work Scope View, T3_AGENCY_ESTIMATE Agency POW/DUPA Estimate Baseline, and T4_RESOURCE_TAKEOFF Procurement Resource Requirement & Stock Balance) without renaming historical template contracts, alongside forward-only migration #23 XID rollover hardening prior to PREVIEW.',
    },
    'head': baseline['head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-Increment-02 files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-increment02-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-increment02-review.zip'
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
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'preserved_runtime_pass': 13,
    'review_corrections_runtime_pass': 6,
    'runtime_fail': 0,
    'reused_increment01_runtime_pass': 14,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'accepted_G02_archive_unchanged': True,
    'increment01_archive_unchanged': True,
    'migrations_1_to_23_unchanged': True,
    'migration_24_unchanged': True,
    'migration_24_sha256': migration_hashes[mig24_path],
    'migration_25_sha256': migration_hashes[mig25_path],
    'release_holds': [
        'migration14_historical_production_lineage',
        'migration23_rollover_before_PREVIEW',
        'external_agency_formal_specs_absent_generic_retained',
    ],
    'production_changes': False,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
