from pathlib import Path
import json
import hashlib
import subprocess
import difflib
import zipfile
import tempfile
import datetime
import os
import xml.etree.ElementTree as ET

ROOT = Path.cwd()
OUT = ROOT / 'artifacts/uboq/wp3/batch-c'
ACCEL = ROOT / 'artifacts/uboq/wp3/accelerated-plan'

EXPECTED_MIG30_SHA256 = '4e99b7ab8a22793316fd1e23bf0a47c6c7b345e597d0f7e5d40cf64578724c9b'
MIG30_PATH = 'prisma/migrations/20261113190000_wp3_batch_c_t8_t10_templates_and_commitment_cashflow_rls/migration.sql'

EXPECTED_MIG31_SHA256 = '0689880947acc2dc7cb973decf5ea4e2e45e63e9bec7e4d4f1b5cb5e01114735'
MIG31_PATH = 'prisma/migrations/20261113200000_wp3_batch_c_ir_receipt_budget_and_export_audit_hardening/migration.sql'

EXPECTED_MIG32_SHA256 = '087f69d4edc1ca82126d4d4d059453eb3aac322a3fd84cd780b4fb49e58f57e3'
MIG32_PATH = 'prisma/migrations/20261113210000_wp3_batch_c_r2_audit_receipt_and_budget_authority/migration.sql'

EXPECTED_PRE_BATCH_C_SCHEMA_SHA256 = '9d719f7e7b39a90ead2b01f98a6ca3d5ad168d66c7fd0b73296a23f0980c7da3'
EXPECTED_PRE_BATCH_C_FORMAL_SHA256 = 'da07bf045bbc82324a83b07f1e37663ec167e1407ec91a36a522858630a09c7e'


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


baseline = read_json(OUT / 'baseline.json')
runtime = read_json(OUT / 'runtime-tests.json')
ir_targeted = read_json(OUT / 'ir-targeted-tests.json')
r2_targeted = read_json(OUT / 'r2-targeted-tests.json')
validation = read_json(OUT / 'validation-exits.json')
mig30_receipt = read_json(OUT / 'migration30-apply.json')
mig31_receipt = read_json(OUT / 'migration31-apply.json')
mig32_receipt = read_json(OUT / 'migration32-apply.json')
batch_b_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-b/archive-delivery.json')
batch_a_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-a/archive-delivery.json')
inc02_baseline = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/baseline.json')
inc02_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/archive-delivery.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')
phase1_crosswalk = read_json(ACCEL / 'phase1-t0-t12-crosswalk.json')

assert baseline['git_branch'] == 'release/oserp-proj-uboq-001'
assert baseline['git_head'] == '79a2c5bd3853711cf4960c5d45cff755aaf219d2'
assert baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-b-review.zip'] == (
    '6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f'
)

# 1A. Verify R2 final control hardening targeted suite (3/3 PASS across WP3-BC-IR-R2-01 .. R2-03)
assert r2_targeted['status'] == 'PASS', f"R2 targeted tests did not PASS: {r2_targeted['status']}"
assert len(r2_targeted['checks']) == 3, f"Expected 3 R2 check groups, got {len(r2_targeted['checks'])}"
assert [c['findingId'] for c in r2_targeted['checks']] == [
    'WP3-BC-IR-R2-01',
    'WP3-BC-IR-R2-02',
    'WP3-BC-IR-R2-03',
]
assert all(c['result'] == 'PASS' for c in r2_targeted['checks'])
assert r2_targeted['database_before_sha256'] == r2_targeted['database_after_sha256']
assert r2_targeted['public_tables_verified_clean'] == 249
assert r2_targeted['residue_tables'] == []

# 1B. Verify R1 targeted IR remediation suite (5/5 PASS across WP3-BC-IR-01 .. WP3-BC-IR-05)
assert ir_targeted['status'] == 'PASS', f"Targeted IR tests did not PASS: {ir_targeted['status']}"
assert len(ir_targeted['checks']) == 5, f"Expected 5 IR check groups, got {len(ir_targeted['checks'])}"
assert [c['findingId'] for c in ir_targeted['checks']] == [
    'WP3-BC-IR-01',
    'WP3-BC-IR-02',
    'WP3-BC-IR-03',
    'WP3-BC-IR-04',
    'WP3-BC-IR-05',
]
assert all(c['result'] == 'PASS' for c in ir_targeted['checks'])
assert ir_targeted['zero_residue_verified'] is True
assert ir_targeted['public_table_count'] == 249

# 1C. Verify consolidated Batch C 7/7 runtime, financial-integrity, security & browser E2E suite
assert runtime['status'] == 'PASS', f"Batch C runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 7, f"Expected 7 Batch C check groups, got {len(runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in runtime['checks'])
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['public_table_count'] == 249
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

for png_name in [
    'browser-t8-desktop.png',
    'browser-t9-desktop.png',
    'browser-t10-desktop.png',
    'browser-t10-mobile.png',
]:
    png_file = OUT / png_name
    assert png_file.is_file() and png_file.stat().st_size > 10_000, f"Missing/empty browser screenshot: {png_name}"

# 1D. Verify OpenXML cell types in browser-t10-working.xlsx (D2:L5 must be genuine numeric cells with 0 formula tags)
xlsx_file = OUT / 'browser-t10-working.xlsx'
assert xlsx_file.is_file() and xlsx_file.stat().st_size > 4_000, 'Missing browser-t10-working.xlsx'
with zipfile.ZipFile(xlsx_file, 'r') as xz:
    sheet1_xml = xz.read('xl/worksheets/sheet1.xml')
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    root = ET.fromstring(sheet1_xml)
    assert len(root.findall('.//m:f', ns)) == 0, 'Formula <f> tag detected in browser-t10-working.xlsx'
    numeric_cols = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    cells_by_ref = {c.attrib.get('r'): c for c in root.findall('.//m:c', ns)}
    verified_numeric_cells = 0
    for row_num in range(2, 6):
        for col_letter in numeric_cols:
            ref = f'{col_letter}{row_num}'
            c_el = cells_by_ref.get(ref)
            assert c_el is not None, f'Missing cell {ref} in browser-t10-working.xlsx'
            t_attr = c_el.attrib.get('t')
            assert t_attr not in ('s', 'str', 'inlineStr'), f'Cell {ref} serialized as string type t={t_attr}'
            v_el = c_el.find('m:v', ns)
            assert v_el is not None and v_el.text is not None, f'Cell {ref} missing numeric <v> value'
            float(v_el.text)
            verified_numeric_cells += 1
    assert verified_numeric_cells == 36

# 2. Verify TypeScript, ESLint, and Prisma static validation gate
assert len(validation['checks']) == 3
for chk in validation['checks']:
    assert chk['exitCode'] == 0, f"Validation check failed: {chk['name']} -> {chk['exitCode']}"

# 3. Verify Forward-Only Migrations #30, #31, and #32 receipts & rollback preflights
assert mig30_receipt['migration_number'] == 30
assert mig30_receipt['migration_name'] == '20261113190000_wp3_batch_c_t8_t10_templates_and_commitment_cashflow_rls'
assert mig30_receipt['migrations_1_to_29_verified'] == 29
assert mig30_receipt['rollback_preflight'] == 'PASS'
assert mig30_receipt['result'] in ('APPLIED_AND_VERIFIED', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig30_receipt['sha256'] == EXPECTED_MIG30_SHA256
assert mig30_receipt['final_ledger_count'] == 30

assert mig31_receipt['migration_number'] == 31
assert mig31_receipt['migration_name'] == '20261113200000_wp3_batch_c_ir_receipt_budget_and_export_audit_hardening'
assert mig31_receipt['migrations_1_to_30_verified'] == 30
assert mig31_receipt['rollback_preflight'] == 'PASS'
assert mig31_receipt['result'] in ('APPLIED_AND_VERIFIED', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig31_receipt['sha256'] == EXPECTED_MIG31_SHA256
assert mig31_receipt['final_ledger_count'] == 31

assert mig32_receipt['migration_number'] == 32
assert mig32_receipt['migration_name'] == '20261113210000_wp3_batch_c_r2_audit_receipt_and_budget_authority'
assert mig32_receipt['migrations_1_to_31_verified'] == 31
assert mig32_receipt['rollback_preflight'] == 'PASS'
assert mig32_receipt['result'] in ('APPLIED_AND_VERIFIED', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig32_receipt['sha256'] == EXPECTED_MIG32_SHA256
assert mig32_receipt['final_ledger_count'] == 32
assert mig32_receipt['sensitive_export_log_compat_direct_insert_granted'] is False

# 4. Verify safe build script invariant
pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

# 5. Verify all 5 frozen prior gate archives are 100% byte-identical
assert len(baseline['frozen_archives']) == 5
for rel_archive, expected_sha in baseline['frozen_archives'].items():
    actual_sha = sha256_bytes((ROOT / rel_archive).read_bytes())
    assert actual_sha == expected_sha, f"Frozen archive modified: {rel_archive}"

# 6. Verify Increment 01 and accepted G02-R3 evidence files remain byte-identical
for rel_path, expected_hash in inc02_baseline['increment01_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Increment 01 evidence modified: {rel_path}"
    )

for rel_path, expected_hash in inc02_baseline['G02_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Accepted G02-R3 evidence modified: {rel_path}"
    )

# 7. Verify historical migrations #1-#29 + #30 + #31 byte-identical + forward-only migration #32 exact match
assert len(baseline['migrations_1_to_29']) == 29
for rel_path, expected_hash in baseline['migrations_1_to_29'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Historical migration modified: {rel_path}"
    )

assert sha256_bytes((ROOT / MIG30_PATH).read_bytes()) == EXPECTED_MIG30_SHA256, (
    'Applied migration #30 was modified on disk'
)
assert sha256_bytes((ROOT / MIG31_PATH).read_bytes()) == EXPECTED_MIG31_SHA256, (
    'Applied migration #31 was modified on disk'
)
assert sha256_bytes((ROOT / MIG32_PATH).read_bytes()) == EXPECTED_MIG32_SHA256, (
    'Applied migration #32 hash mismatch on disk'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 32, f"Expected 32 migrations on disk, found {len(all_migrations)}"

# 8. Verify reused core engines, catalog, template presets, and formal export route were NOT modified
reused_unchanged_paths = [
    'src/lib/uboq/field-catalog.ts',
    'src/lib/uboq/template-builder.ts',
    'src/lib/uboq/cashflow-engine.ts',
    'src/lib/uboq/tax-engine.ts',
    'src/lib/cpm-engine.ts',
    'src/lib/uboq/validation-engine.ts',
    'src/lib/uboq/security/redact-payload.ts',
    'src/lib/uboq/security/stage-rbac.ts',
    'src/app/api/uboq/templates/formal-export/route.ts',
]
batch_b_pkg = read_json(ROOT / 'artifacts/uboq/wp3/batch-b/review-package.json')
batch_b_reused = batch_b_pkg['reused_unchanged_components']['files_verified_byte_identical']
batch_b_source_map = {row['path']: row['sha256'] for row in batch_b_pkg['source_manifest']}

assert batch_b_reused['prisma/schema.prisma'] == EXPECTED_PRE_BATCH_C_SCHEMA_SHA256
assert batch_b_source_map['src/lib/uboq/templates/formal-t0-t1.ts'] == EXPECTED_PRE_BATCH_C_FORMAL_SHA256

reused_unchanged_file_hashes = {}
for rel_path in reused_unchanged_paths:
    actual_sha = sha256_bytes((ROOT / rel_path).read_bytes())
    if rel_path in batch_b_reused:
        assert actual_sha == batch_b_reused[rel_path], f"Reused core file modified since Batch B: {rel_path}"
    elif rel_path in batch_b_source_map:
        assert actual_sha == batch_b_source_map[rel_path], f"Accepted Batch B file modified in Batch C: {rel_path}"
    reused_unchanged_file_hashes[rel_path] = actual_sha

# 9. Verify pre-Batch-C backups (including prisma/schema.prisma and formal-t0-t1.ts) & clean unified diff patch
expected_before_hashes = {
    **baseline['before_file_hashes'],
    'prisma/schema.prisma': EXPECTED_PRE_BATCH_C_SCHEMA_SHA256,
    'src/lib/uboq/templates/formal-t0-t1.ts': EXPECTED_PRE_BATCH_C_FORMAL_SHA256,
}
allowed_modified = set(expected_before_hashes.keys())
for rel_path, expected_before_hash in expected_before_hashes.items():
    before_file = OUT / 'before' / rel_path
    assert before_file.is_file(), f"Missing pre-Batch-C backup for {rel_path}"
    assert sha256_bytes(before_file.read_bytes()) == expected_before_hash, (
        f"Pre-Batch-C backup hash mismatch for {rel_path}"
    )

sources = [
    'prisma/schema.prisma',
    MIG30_PATH,
    MIG31_PATH,
    MIG32_PATH,
    'src/lib/uboq/templates/canonical-source-adapters.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/lib/uboq/templates/t0-t1.ts',
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/app/api/uboq/templates/route.ts',
    'src/app/api/uboq/templates/layouts/route.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'src/app/projects/[id]/uboq/templates/page.tsx',
    'scripts/uboq/apply-wp3-batch-c-migration30.cjs',
    'scripts/uboq/apply-wp3-batch-c-migration31.cjs',
    'scripts/uboq/apply-wp3-batch-c-migration32.cjs',
    'scripts/uboq/verify-wp3-batch-c.ts',
    'scripts/uboq/verify-wp3-batch-c-ir-corrections.ts',
    'scripts/uboq/verify-wp3-batch-c-r2-hardening.ts',
    'scripts/uboq/package-wp3-batch-c.py',
    'docs/uboq/wp3-batch-c.md',
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
payload['wp3-batch-c.patch'] = patch_bytes
(OUT / 'wp3-batch-c.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-batch-c-patch-') as td:
    temp = Path(td)
    for mod_path in sorted(allowed_modified):
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'batch-c.patch'
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
    'wp3-batch-c.patch',
}
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name not in excluded_evidence_names and not p.name.endswith('.tsbuildinfo'):
        payload['evidence/' + p.relative_to(OUT).as_posix()] = p.read_bytes()

# 10. Secret scan across all archive payloads
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
    **baseline['migrations_1_to_29'],
    MIG30_PATH: EXPECTED_MIG30_SHA256,
    MIG31_PATH: EXPECTED_MIG31_SHA256,
    MIG32_PATH: EXPECTED_MIG32_SHA256,
}

bc02_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BC-02'))
bc03_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BC-03'))
bc04_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BC-04'))
bc05_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BC-05'))

ir_details_by_id = {c['findingId']: c['detail'] for c in ir_targeted['checks']}
r2_details_by_id = {c['findingId']: c['detail'] for c in r2_targeted['checks']}

ir_finding_closures = {
    'WP3-BC-IR-01': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Cross-billing client collection deduplication enforced project-wide; multi-billing receipt splits require verified UboqClientReceipt + UboqClientReceiptAllocation summing strictly to totalReceiptAmount.',
        'targeted_evidence': ir_details_by_id['WP3-BC-IR-01'],
    },
    'WP3-BC-IR-02': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Explicit MATCHED | BEFORE_HORIZON | AFTER_HORIZON | PERIOD_GAP period classification, contiguous 1-based half-month validation, and period-by-period operational vs persisted historical actuals reconciliation.',
        'targeted_evidence': ir_details_by_id['WP3-BC-IR-02'],
    },
    'WP3-BC-IR-03': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Unique approved Billing claims aggregate per half-month period before max(PV, sum(claims)); schedule horizon extends by 1 half-month collection cycle and offsets lagged net due by already-collected cash.',
        'targeted_evidence': ir_details_by_id['WP3-BC-IR-03'],
    },
    'WP3-BC-IR-04': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'UboqContractorTargetBudget requires approvedById + approvedAt <= asOfCutoff, verified snapshotId/phaseLineId lineage, and single-head supersedesId + revisionNumber chain.',
        'targeted_evidence': ir_details_by_id['WP3-BC-IR-04'],
    },
    'WP3-BC-IR-05': {
        'severity': 'MEDIUM',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'T2-T10 working XLSX exports serialize numeric columns as genuine OpenXML numbers (36/36 cells D2:L5 verified, 0 <f> tags, formula neutralization) and SensitiveExportLog hardened with attested function-only append.',
        'targeted_evidence': ir_details_by_id['WP3-BC-IR-05'],
    },
}

r2_finding_closures = {
    'WP3-BC-IR-R2-01': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Revoked direct INSERT/UPDATE/DELETE on SensitiveExportLog from oserp_compat_app; removed ALL reliance on caller-writable custom GUCs (enforcing kernel current_user = oserp_migrations_owner); replaced 12-arg overload with 14-arg uboq_append_sensitive_export_log + uboq_append_formal_sensitive_export_log verifying cryptographic _uboq_rls_trust_anchor attestation over delivered payload SHA-256.',
        'targeted_evidence': r2_details_by_id['WP3-BC-IR-R2-01'],
    },
    'WP3-BC-IR-R2-02': {
        'severity': 'HIGH',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Changed UboqClientReceipt.status default to DRAFT; enforced finance/commercial verifier role + active non-narrowed assignment (uboq_actor_can_verify_client_receipt) in RLS WITH CHECK, SQL triggers, and canonical-source-adapters.ts; bound verifiedById to signed actor, required matching allocation sum before sealing VERIFIED, and made sealed VERIFIED/VOID receipts and allocations strictly immutable.',
        'targeted_evidence': r2_details_by_id['WP3-BC-IR-R2-02'],
    },
    'WP3-BC-IR-R2-03': {
        'severity': 'MEDIUM',
        'status': 'CLOSED_LOCALLY_VERIFIED',
        'summary': 'Unbound project-wide UboqContractorTargetBudget (snapshotId = NULL, phaseLineId = NULL) is accepted only when the project has a unique single governed snapshot; fails closed (409 TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS) whenever multiple approved/superseded snapshots exist unless explicitly bound via snapshotId.',
        'targeted_evidence': r2_details_by_id['WP3-BC-IR-R2-03'],
    },
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-C-R2-HARDENED',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'WP3_BATCH_C_R2_CONTROL_HARDENED_LOCALLY_VERIFIED_PENDING_TARGETED_INDEPENDENT_REVIEW_NOT_FINAL_FREEZE',
    'governance_gate': 'STOPPED_AT_BATCH_C_TARGETED_INDEPENDENT_REVIEW',
    'independent_acceptance_claimed': False,
    'prior_batch_b_handoff': {
        'verdict': 'PASS_FOR_CONTINUED_ISOLATED_LOCAL_DEVELOPMENT',
        'accepted_batch_b_archive': batch_b_delivery['archive'],
        'accepted_batch_b_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-b-review.zip'],
    },
    'prior_batch_c_independent_reviews': {
        'r1_review_id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-C-INDEPENDENT-2026-11-15',
        'r1_findings_remediated_count': 5,
        'r1_finding_closures': ir_finding_closures,
        'r2_review_id': 'OSERP-WP3-BATCH-C-INDEPENDENT-REVIEW-2026-11-15-R2',
        'r2_prior_archive_sha256': '9c15a8154d2a2e5e0d92560e8b958f74f0550ce6fc2a8a99c3b45e9b32d1cdf3',
        'r2_findings_remediated_count': 3,
        'r2_finding_closures': r2_finding_closures,
    },
    'authoritative_crosswalk_alignment': {
        'crosswalk_json': 'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
        'template_ids_preserved_without_renaming': phase1_crosswalk['source_of_truth']['template_ids_preserved_without_renaming'],
        'batch_c_templates': [
            'T8_CASHFLOW_HALF_MONTH (CASH_FLOW_PERIOD, working/saved-layout analytical view, isFormalComplianceOutput: false)',
            'T9_CASHFLOW_QUARTERLY (CASH_FLOW_QUARTER, working/saved-layout analytical view, isFormalComplianceOutput: false)',
            'T10_EXECUTIVE_MARGIN (PHASE_BOQ_LINE, cost commitment + executive five-baseline profitability/EAC analytical view, isFormalComplianceOutput: false)',
        ],
    },
    'reused_unchanged_components': {
        'files_verified_byte_identical': reused_unchanged_file_hashes,
        'accepted_g02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/g02-r3/independent-review-candidate.zip'],
        'increment01_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment01-review.zip'],
        'increment01_runtime_pass': inc01_delivery['runtime_pass'],
        'increment02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment02-review.zip'],
        'increment02_preserved_runtime_pass': inc02_delivery['preserved_runtime_pass'],
        'increment02_review_corrections_pass': inc02_delivery['review_corrections_runtime_pass'],
        'batch_a_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-a-review.zip'],
        'batch_a_preserved_runtime_pass': batch_a_delivery['preserved_batch_a_runtime_pass'],
        'batch_a_ir01_corrections_pass': batch_a_delivery['targeted_ir01_corrections_runtime_pass'],
        'batch_b_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-b-review.zip'],
        'batch_b_runtime_pass': batch_b_delivery['batch_b_runtime_pass'],
        'batch_b_ir_corrections_pass': batch_b_delivery['targeted_ir_corrections_runtime_pass'],
    },
    'implemented': {
        'T8_CASHFLOW_HALF_MONTH': 'Native Half-Month Cash Flow Schedule (CASH_FLOW_PERIOD, isFormalComplianceOutput: false): project-wide client receipt deduplication + finance-verified sealed UboqClientReceipt/UboqClientReceiptAllocation split support; strict half-month continuity + fail-closed out-of-horizon attribution; period-by-period operational vs persisted historical actuals reconciliation; period-aggregated approved Billing claims vs baseline PV + 1-period collection horizon extension + partial-collection forecast offset.',
        'T9_CASHFLOW_QUARTERLY': 'Quarterly Cash Flow & Liquidity Rollup (CASH_FLOW_QUARTER, isFormalComplianceOutput: false): projects quarterly rollups from buildMultiStreamCashFlowSchedule enforcing strict NO_SUM aggregation on quarterly_closing_cash and quarterly_liquidity_gap, with executive-only visibility and numeric XLSX serialization.',
        'T10_EXECUTIVE_MARGIN': 'Executive Profitability, Cost Commitment & EAC Forecast (PHASE_BOQ_LINE, isFormalComplianceOutput: false): strict commitment/incurred/paid/payable/open/outstanding lifecycle separation + mirror deduplication; verified approved UboqContractorTargetBudget supersession lineage, unique-snapshot proof or explicit snapshotId requirement for project-wide budgets, and numeric SUM-ready XLSX serialization.',
        'forward_only_migration_30': f'Migration #30 ({EXPECTED_MIG30_SHA256}): Batch C RLS, executive target-budget policy, PII-free subcontract/payroll reader, and T8-T10 template guards.',
        'forward_only_migration_31': f'Migration #31 ({EXPECTED_MIG31_SHA256}): UboqClientReceipt + UboqClientReceiptAllocation tables, UboqContractorTargetBudget snapshotId/revisionNumber/supersedesId columns, and initial SensitiveExportLog function.',
        'forward_only_migration_32': f'Migration #32 ({EXPECTED_MIG32_SHA256}): Revokes direct SensitiveExportLog INSERT from oserp_compat_app, eliminates custom GUC origin check, adds _uboq_rls_trust_anchor payload attestation in 14-arg uboq_append_sensitive_export_log + uboq_append_formal_sensitive_export_log, enforces finance verifier + sealed immutability on UboqClientReceipt/Allocation, and hardens target-budget snapshot approval guard.',
    },
    'financial_integrity_and_security_metrics': {
        'cashflow': bc02_detail,
        'commitment_and_eac': bc03_detail,
        'executive_rbac_and_audit': bc04_detail,
        'postgresql_rls_and_sql_guards': bc05_detail,
        'r1_ir_remediation_targeted': ir_details_by_id,
        'r2_final_control_hardening_targeted': r2_details_by_id,
    },
    'tests': {
        'batch_c_r2_targeted_pass': len(r2_targeted['checks']),
        'batch_c_r2_targeted_fail': 0,
        'batch_c_r2_targeted_report': 'evidence/r2-targeted-tests.json',
        'batch_c_ir_targeted_pass': len(ir_targeted['checks']),
        'batch_c_ir_targeted_fail': 0,
        'batch_c_ir_targeted_report': 'evidence/ir-targeted-tests.json',
        'batch_c_consolidated_runtime_pass': len(runtime['checks']),
        'batch_c_consolidated_runtime_fail': 0,
        'batch_c_runtime_report': 'evidence/runtime-tests.json',
        'browser_e2e': 'PASS — real headless Chromium E2E across T8 working preview, T9 NO_SUM quarterly preview, and T10 executive preview, numeric XLSX download (36/36 numeric D2:L5 OpenXML cells verified, 0 <f> tags), and saved layout at 1440x900 desktop & 390x844 mobile with zero console errors, zero horizontal overflow, and zero server modules in client bundle.',
        'validation': {c['name']: c['exitCode'] for c in validation['checks']},
    },
    'preservation': {
        'migration_count': 32,
        'migrations_1_to_31_byte_unchanged': True,
        'forward_only_migration_30': MIG30_PATH,
        'migration_30_sha256': EXPECTED_MIG30_SHA256,
        'forward_only_migration_31': MIG31_PATH,
        'migration_31_sha256': EXPECTED_MIG31_SHA256,
        'forward_only_migration_32': MIG32_PATH,
        'migration_32_sha256': EXPECTED_MIG32_SHA256,
        'migration_hashes': migration_hashes,
        'frozen_archives_unchanged': baseline['frozen_archives'],
        'database_public_tables_identical_after_cleanup': runtime['public_table_count'],
        'database_before_sha256': runtime['database_before_sha256'],
        'database_after_sha256': runtime['database_after_sha256'],
        'canonical_boq_or_contract_mutations': 0,
        'duplicate_source_authorities_or_accounting_engines': 0,
        'protected_databases_modified': False,
    },
    'remaining_blockers_and_holds': {
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains preserved and unresolved; #1-#31 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency statutory print layouts and wet/digital signatory blocks remain unspecified; T8-T10 are strictly internal non-statutory analytical views (isFormalComplianceOutput: false).',
        'future_wp3_batch_d': 'Batch D (ratified T11_VARIATION_IMPACT & T12_CHANGE_REGISTER + signed round-trip workbook re-import) remains deferred until Batch C independent review acceptance.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'head': baseline['git_head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-Batch-C files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-batch-c-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-batch-c-review.zip'
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
    'prior_accepted_batch_b_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-b-review.zip'],
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'source_records_verified': len(manifest),
    'batch_c_r2_targeted_pass': len(r2_targeted['checks']),
    'batch_c_r2_targeted_fail': 0,
    'batch_c_ir_targeted_pass': len(ir_targeted['checks']),
    'batch_c_ir_targeted_fail': 0,
    'batch_c_runtime_pass': len(runtime['checks']),
    'batch_c_runtime_fail': 0,
    'reused_increment01_runtime_pass': 14,
    'reused_increment02_runtime_pass': 13,
    'reused_increment02_ir_pass': 6,
    'reused_batch_a_runtime_pass': 8,
    'reused_batch_a_ir01_pass': 6,
    'reused_batch_b_runtime_pass': 7,
    'reused_batch_b_ir_pass': 7,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'frozen_archives_unchanged': True,
    'migrations_1_to_31_unchanged': True,
    'migration_30_sha256': EXPECTED_MIG30_SHA256,
    'migration_31_sha256': EXPECTED_MIG31_SHA256,
    'migration_32_sha256': EXPECTED_MIG32_SHA256,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
