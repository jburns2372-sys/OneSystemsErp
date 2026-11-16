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
OUT = ROOT / 'artifacts/uboq/wp3/batch-d'
ACCEL = ROOT / 'artifacts/uboq/wp3/accelerated-plan'

EXPECTED_MIG33_SHA256 = 'ab6209317fa5634f682610770daaae695f9ad47bc8b2110ef56328f74d6d2e33'
MIG33_PATH = 'prisma/migrations/20261113220000_wp3_batch_d_signed_t0_t1_roundtrip_import/migration.sql'

EXPECTED_PRE_BATCH_D_SCHEMA_SHA256 = '91e335b27157a0a04460d2ad72a8073ad5cd8d50723907dcf758d211446748fe'
EXPECTED_PRE_BATCH_D_TB_SHA256 = '6a36634f93f51f0f56d4c9a81ff0e901f4b45dab373c862d1216d4d6bfb966fc'


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


baseline = read_json(OUT / 'baseline.json')
d0_specs = read_json(OUT / 'd0-t11-t12-contract-specifications.json')
runtime = read_json(OUT / 'runtime-tests.json')
validation = read_json(OUT / 'validation-exits.json')
mig33_receipt = read_json(OUT / 'migration33-apply.json')

batch_c_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-c/archive-delivery.json')
batch_c_pkg = read_json(ROOT / 'artifacts/uboq/wp3/batch-c/review-package.json')
batch_b_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-b/archive-delivery.json')
batch_a_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-a/archive-delivery.json')
inc02_baseline = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/baseline.json')
inc02_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/archive-delivery.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')
phase1_crosswalk = read_json(ACCEL / 'phase1-t0-t12-crosswalk.json')

assert baseline['git_branch'] == 'release/oserp-proj-uboq-001'
assert baseline['git_head'] == '79a2c5bd3853711cf4960c5d45cff755aaf219d2'
assert baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-c-review.zip'] == (
    '666ad50c880bd0918a3e2d2b1589843b1664cc7598f8a9ac95c4c78b1609be9c'
)

# 1A. Verify Phase D0 contract validation & pending ratification specifications
assert d0_specs['ratification_status'] == 'PENDING_PROJECT_OWNER_RATIFICATION'
assert d0_specs['project_owner_formal_approval_found'] is False
assert d0_specs['runtime_implementation_status'] == 'NOT_IMPLEMENTED_FAIL_CLOSED_UNTIL_RATIFIED'
assert d0_specs['proposed_contracts']['T11_VARIATION_ORDER_REGISTER']['implemented_in_runtime'] is False
assert d0_specs['proposed_contracts']['T12_CASHFLOW_VARIANCE_TREASURY']['implemented_in_runtime'] is False

# 1B. Verify consolidated Batch D 7/7 runtime, security/tamper, non-regression & browser E2E suite
assert runtime['status'] == 'PASS', f"Batch D runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 7, f"Expected 7 Batch D check groups, got {len(runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in runtime['checks'])
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['public_table_count'] == 251
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

for png_name in [
    'browser-d1-t1-roundtrip-desktop.png',
    'browser-d1-t0-roundtrip-desktop.png',
    'browser-d1-roundtrip-mobile.png',
]:
    png_file = OUT / png_name
    assert png_file.is_file() and png_file.stat().st_size > 10_000, f"Missing/empty browser screenshot: {png_name}"

# 1C. Verify OpenXML cell types & 0 formula tags across all sheets of browser-d1-t1-signed.xlsx
xlsx_file = OUT / 'browser-d1-t1-signed.xlsx'
assert xlsx_file.is_file() and xlsx_file.stat().st_size > 4_000, 'Missing browser-d1-t1-signed.xlsx'
with zipfile.ZipFile(xlsx_file, 'r') as xz:
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    sheet_entries = [n for n in xz.namelist() if n.startswith('xl/worksheets/') and n.endswith('.xml')]
    assert len(sheet_entries) == 3, f'Expected 3 worksheets (T1 + __OSERP_META + __OSERP_SIGNATURE), got {len(sheet_entries)}'
    for se in sheet_entries:
        s_root = ET.fromstring(xz.read(se))
        assert len(s_root.findall('.//m:f', ns)) == 0, f'Formula <f> tag detected in {se}'
    sheet1_root = ET.fromstring(xz.read('xl/worksheets/sheet1.xml'))
    cells_by_ref = {c.attrib.get('r'): c for c in sheet1_root.findall('.//m:c', ns)}
    verified_numeric_cells = 0
    for row_num in (2, 3):
        for col_letter in ('F', 'G', 'H', 'I'):
            ref = f'{col_letter}{row_num}'
            c_el = cells_by_ref.get(ref)
            assert c_el is not None, f'Missing cell {ref} in browser-d1-t1-signed.xlsx'
            t_attr = c_el.attrib.get('t')
            assert t_attr not in ('s', 'str', 'inlineStr'), f'Cell {ref} serialized as string type t={t_attr}'
            v_el = c_el.find('m:v', ns)
            assert v_el is not None and v_el.text is not None, f'Cell {ref} missing numeric <v> value'
            float(v_el.text)
            verified_numeric_cells += 1
    assert verified_numeric_cells == 8

signed_t0_json_file = OUT / 'browser-d1-t0-signed.json'
assert signed_t0_json_file.is_file() and signed_t0_json_file.stat().st_size > 500
signed_t0_obj = read_json(signed_t0_json_file)
assert signed_t0_obj['roundTripContractVersion'] == 'OSERP_T0_T1_ROUNDTRIP_V1'
assert len(signed_t0_obj['manifest']['manifestSignature']) == 64

# 2. Verify TypeScript, ESLint, and Prisma static validation gate
assert len(validation['checks']) == 3
for chk in validation['checks']:
    assert chk['exitCode'] == 0, f"Validation check failed: {chk['name']} -> {chk['exitCode']}"

# 3. Verify Forward-Only Migration #33 receipt & rollback preflight
assert mig33_receipt['migration_number'] == 33
assert mig33_receipt['migration_name'] == '20261113220000_wp3_batch_d_signed_t0_t1_roundtrip_import'
assert mig33_receipt['migrations_1_to_32_verified'] == 32
assert mig33_receipt['rollback_preflight'] == 'PASS'
assert mig33_receipt['result'] in ('APPLIED_AND_VERIFIED', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig33_receipt['sha256'] == EXPECTED_MIG33_SHA256
assert mig33_receipt['final_ledger_count'] == 33
assert mig33_receipt['migrations_1_to_32_preserved_post_apply'] is True
for tbl_name in ('UboqSignedRoundTripPackage', 'UboqRoundTripImportSubmission'):
    privs = mig33_receipt['compat_direct_write_privileges'][tbl_name]
    assert privs['can_insert'] is False
    assert privs['can_update'] is False
    assert privs['can_delete'] is False

# 4. Verify safe build script invariant
pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

# 5. Verify all 6 frozen prior gate archives are 100% byte-identical
assert len(baseline['frozen_archives']) == 6
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

# 7. Verify historical migrations #1-#32 byte-identical + forward-only migration #33 exact match
assert len(baseline['migrations_1_to_32']) == 32
for rel_path, expected_hash in baseline['migrations_1_to_32'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Historical migration modified: {rel_path}"
    )

assert sha256_bytes((ROOT / MIG33_PATH).read_bytes()) == EXPECTED_MIG33_SHA256, (
    'Applied migration #33 hash mismatch on disk'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 33, f"Expected 33 migrations on disk, found {len(all_migrations)}"

# 8. Verify accepted T0-T10 core engines, catalog, presets, adapters, and routes were NOT modified
reused_unchanged_paths = [
    'src/lib/uboq/field-catalog.ts',
    'src/lib/uboq/template-builder.ts',
    'src/lib/uboq/cashflow-engine.ts',
    'src/lib/uboq/tax-engine.ts',
    'src/lib/cpm-engine.ts',
    'src/lib/uboq/validation-engine.ts',
    'src/lib/uboq/security/redact-payload.ts',
    'src/lib/uboq/security/stage-rbac.ts',
    'src/lib/uboq/templates/canonical-source-adapters.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/lib/uboq/templates/t0-t1.ts',
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/app/api/uboq/templates/route.ts',
    'src/app/api/uboq/templates/layouts/route.ts',
    'src/app/api/uboq/templates/formal-export/route.ts',
    'src/app/projects/[id]/uboq/templates/page.tsx',
]
batch_c_reused = batch_c_pkg['reused_unchanged_components']['files_verified_byte_identical']
batch_c_source_map = {row['path']: row['sha256'] for row in batch_c_pkg['source_manifest']}

assert batch_c_source_map['prisma/schema.prisma'] == EXPECTED_PRE_BATCH_D_SCHEMA_SHA256
assert batch_c_source_map['src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx'] == EXPECTED_PRE_BATCH_D_TB_SHA256

reused_unchanged_file_hashes = {}
for rel_path in reused_unchanged_paths:
    actual_sha = sha256_bytes((ROOT / rel_path).read_bytes())
    if rel_path in batch_c_reused:
        assert actual_sha == batch_c_reused[rel_path], f"Reused core file modified since Batch C: {rel_path}"
    elif rel_path in batch_c_source_map:
        assert actual_sha == batch_c_source_map[rel_path], f"Accepted Batch C file modified in Batch D: {rel_path}"
    reused_unchanged_file_hashes[rel_path] = actual_sha

# 9. Verify pre-Batch-D backups & clean unified diff patch
expected_before_hashes = {
    'prisma/schema.prisma': EXPECTED_PRE_BATCH_D_SCHEMA_SHA256,
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx': EXPECTED_PRE_BATCH_D_TB_SHA256,
}
assert baseline['before_file_hashes'] == expected_before_hashes
allowed_modified = set(expected_before_hashes.keys())
for rel_path, expected_before_hash in expected_before_hashes.items():
    before_file = OUT / 'before' / rel_path
    assert before_file.is_file(), f"Missing pre-Batch-D backup for {rel_path}"
    assert sha256_bytes(before_file.read_bytes()) == expected_before_hash, (
        f"Pre-Batch-D backup hash mismatch for {rel_path}"
    )

sources = [
    'prisma/schema.prisma',
    MIG33_PATH,
    'src/lib/uboq/templates/round-trip-import.ts',
    'src/app/api/uboq/templates/round-trip/route.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'scripts/uboq/apply-wp3-batch-d-migration33.cjs',
    'scripts/uboq/verify-wp3-batch-d.ts',
    'scripts/uboq/package-wp3-batch-d.py',
    'docs/uboq/wp3-batch-d.md',
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
payload['wp3-batch-d.patch'] = patch_bytes
(OUT / 'wp3-batch-d.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-batch-d-patch-') as td:
    temp = Path(td)
    for mod_path in sorted(allowed_modified):
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'batch-d.patch'
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
    'wp3-batch-d.patch',
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
    **baseline['migrations_1_to_32'],
    MIG33_PATH: EXPECTED_MIG33_SHA256,
}

bd_details = {
    c['name'].split(':')[0]: c['detail']
    for c in runtime['checks']
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-D',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'WP3_BATCH_D_PHASE_D0_PENDING_RATIFICATION_AND_PHASE_D1_SIGNED_ROUNDTRIP_LOCALLY_VERIFIED_PENDING_INDEPENDENT_REVIEW_NOT_FINAL_FREEZE',
    'governance_gate': 'STOPPED_AT_BATCH_D_INDEPENDENT_REVIEW',
    'independent_acceptance_claimed': False,
    'prior_batch_c_handoff': {
        'review_id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-C-R2-ACCEPTANCE-2026-11-15',
        'verdict': 'PASS_FOR_CONTINUED_ISOLATED_LOCAL_DEVELOPMENT',
        'accepted_batch_c_archive': batch_c_delivery['archive'],
        'accepted_batch_c_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-c-review.zip'],
    },
    'phase_d0_contract_validation': {
        'specification_artifact': 'evidence/d0-t11-t12-contract-specifications.json',
        'ratification_status': d0_specs['ratification_status'],
        'project_owner_formal_approval_found': d0_specs['project_owner_formal_approval_found'],
        'runtime_implementation_status': d0_specs['runtime_implementation_status'],
        'proposed_templates': {
            'T11_VARIATION_ORDER_REGISTER': {
                'status': 'PENDING_PROJECT_OWNER_RATIFICATION',
                'implemented_in_runtime': False,
                'row_grain': 'VARIATION_ORDER_ITEM',
                'canonical_authority': 'VariationOrder + VariationOrderItem + VariationOrderApproval + UboqAwardedPhaseLine (strictly bans legacy /variation-orders/[voId]/approve/route.ts; separates Client VO vs Subcontractor VO)',
            },
            'T12_CASHFLOW_VARIANCE_TREASURY': {
                'status': 'PENDING_PROJECT_OWNER_RATIFICATION',
                'implemented_in_runtime': False,
                'row_grain': 'CASH_FLOW_PERIOD',
                'canonical_authority': 'loadReconciledBatchCCashFlowSchedule + verified UboqClientReceipt/Allocation + AccountsPayable/PaymentRecord/Expense/Payroll actuals',
            },
        },
        'phase_d2_status': 'DEFERRED_PENDING_PROJECT_OWNER_RATIFICATION',
    },
    'authoritative_crosswalk_alignment': {
        'crosswalk_json': 'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
        'template_ids_preserved_without_renaming': phase1_crosswalk['source_of_truth']['template_ids_preserved_without_renaming'],
        'ratified_templates_t0_to_t10_count': 11,
        'unratified_templates_blocked_fail_closed': [
            'T11_VARIATION_ORDER_REGISTER',
            'T12_CASHFLOW_VARIANCE_TREASURY',
            'T11_VARIATION_IMPACT',
            'T12_CHANGE_REGISTER',
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
        'batch_c_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-c-review.zip'],
        'batch_c_runtime_pass': batch_c_delivery['batch_c_runtime_pass'],
        'batch_c_ir_pass': batch_c_delivery['batch_c_ir_targeted_pass'],
        'batch_c_r2_pass': batch_c_delivery['batch_c_r2_targeted_pass'],
    },
    'implemented_phase_d1': {
        'signed_round_trip_packages': 'Signed T0_MASTER_CONTRACT and T1_PHASE_BOQ round-trip package issuance (XLSX with __OSERP_META + __OSERP_SIGNATURE veryHidden sheets, genuine numeric OpenXML cells & 0 <f> tags, and JSON OSERP_T0_T1_ROUNDTRIP_V1) across WORKING_PRESET, SAVED_LAYOUT, and FORMAL_CONTRACT modes.',
        'nine_gate_verification_pipeline': 'Enforces Gate 0 zero silent overwrite (OVERWRITE_APPROVED_IN_PLACE blocked 409), Gate 1 document/macro/formula/DDE/prompt-injection scan, Gate 2 _uboq_rls_trust_anchor cryptographic manifest signature (timingSafeEqual + SQL SECURITY DEFINER), Gate 3 project/source/expiry/replay verification, Gate 4 concurrent canonical source drift detection, Gate 5 layout hash/header/saved-revision supersession compatibility, Gate 6 __OSERP_META row lineage & immutable identity anchors, Gate 7 strict commercial/financial field authorization + RLS financial proposal isolation, and Gate 8 deterministic unit-price line-amount reconciliation.',
        'zero_canonical_mutation': 'Verified imports stage immutable STAGED_PENDING_APPROVAL proposals (canonicalRecordsMutated: 0) or confirm VERIFIED_NO_CHANGES; UboqContractAuthority, UboqOperationalSnapshot, UboqAwardedPhaseLine, AwardedBOQItem, and ConsolidatedBOQItem remain 100% untouched.',
        'forward_only_migration_33': f'Migration #33 ({EXPECTED_MIG33_SHA256}): Creates UboqSignedRoundTripPackage & UboqRoundTripImportSubmission with ENABLE + FORCE RLS, revokes direct INSERT/UPDATE/DELETE from oserp_compat_app, enforces kernel current_user = oserp_migrations_owner + _uboq_rls_trust_anchor call & manifest attestation with zero custom GUC reliance, and restricts financialChangeCount > 0 SELECT visibility to commercial roles.',
    },
    'security_and_verification_metrics': bd_details,
    'tests': {
        'batch_d_consolidated_runtime_pass': len(runtime['checks']),
        'batch_d_consolidated_runtime_fail': 0,
        'batch_d_runtime_report': 'evidence/runtime-tests.json',
        'browser_e2e': 'PASS — real headless Chromium E2E signed T1 XLSX download, offline scope + reconciled commercial proposal upload -> STAGED_PENDING_APPROVAL, and signed T0 JSON download + VERIFY_ONLY -> VERIFIED_NO_CHANGES at 1440x900 desktop & 390x844 mobile with 8/8 numeric F2:I3 OpenXML cells, 0 <f> tags across all 3 worksheets, 0 console errors, 0 horizontal overflow, and 0 server modules in client bundle.',
        'validation': {c['name']: c['exitCode'] for c in validation['checks']},
    },
    'preservation': {
        'migration_count': 33,
        'migrations_1_to_32_byte_unchanged': True,
        'forward_only_migration_33': MIG33_PATH,
        'migration_33_sha256': EXPECTED_MIG33_SHA256,
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
        't11_t12_project_owner_ratification': 'PENDING_PROJECT_OWNER_RATIFICATION — exact proposed specifications for T11_VARIATION_ORDER_REGISTER and T12_CASHFLOW_VARIANCE_TREASURY are prepared in evidence/d0-t11-t12-contract-specifications.json; Phase D2 runtime implementation remains blocked until formal Project Owner ratification.',
        'staged_proposal_canonical_apply_workflow': 'GOVERNED_APPROVAL_GATE_PRESERVED — Phase D1 stages immutable round-trip proposals (canonicalRecordsMutated: 0); mutating live approved BOQ/Contract baselines remains gated behind formal VO / Snapshot Revision approval workflows.',
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains preserved and unresolved; #1-#32 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency statutory print layouts and wet/digital signatory blocks remain unspecified.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'head': baseline['git_head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-Batch-D files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-batch-d-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-batch-d-review.zip'
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
    'prior_accepted_batch_c_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-c-review.zip'],
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'source_records_verified': len(manifest),
    'phase_d0_ratification_status': d0_specs['ratification_status'],
    'phase_d2_status': 'DEFERRED_PENDING_PROJECT_OWNER_RATIFICATION',
    'batch_d_runtime_pass': len(runtime['checks']),
    'batch_d_runtime_fail': 0,
    'reused_increment01_runtime_pass': 14,
    'reused_increment02_runtime_pass': 13,
    'reused_increment02_ir_pass': 6,
    'reused_batch_a_runtime_pass': 8,
    'reused_batch_a_ir01_pass': 6,
    'reused_batch_b_runtime_pass': 7,
    'reused_batch_b_ir_pass': 7,
    'reused_batch_c_runtime_pass': 7,
    'reused_batch_c_ir_pass': 5,
    'reused_batch_c_r2_pass': 3,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'frozen_archives_unchanged': True,
    'migrations_1_to_32_unchanged': True,
    'migration_33_sha256': EXPECTED_MIG33_SHA256,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
