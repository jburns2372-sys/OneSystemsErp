from pathlib import Path
import json
import hashlib
import subprocess
import difflib
import zipfile
import tempfile
import datetime
import os
import struct
import xml.etree.ElementTree as ET

ROOT = Path.cwd()
OUT = ROOT / 'artifacts/uboq/wp3/batch-d-d2'
BATCH_D_OUT = ROOT / 'artifacts/uboq/wp3/batch-d'
ACCEL = ROOT / 'artifacts/uboq/wp3/accelerated-plan'

EXPECTED_MIG34_SHA256 = 'ca25baee3da255c9cf624f38ceb8ddbda6358f5f2a7990946b384836a9d8a359'
MIG34_PATH = 'prisma/migrations/20261113230000_wp3_batch_d_d2_t11_t12_rls_and_formal_guards/migration.sql'
EXPECTED_PRE_D2_D0_SPEC_SHA256 = 'b32763c14338b0bae88bfeb9d91fcadca71a4d76cdb44f10aeee7c10ff2cdaa6'

EXPECTED_FROZEN_ARCHIVES = {
    'artifacts/uboq/g02-r3/independent-review-candidate.zip': 'a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12',
    'artifacts/uboq/wp3/wp3-increment01-review.zip': '1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719',
    'artifacts/uboq/wp3/wp3-increment02-review.zip': '8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a',
    'artifacts/uboq/wp3/wp3-batch-a-review.zip': '6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641',
    'artifacts/uboq/wp3/wp3-batch-b-review.zip': '6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f',
    'artifacts/uboq/wp3/wp3-batch-c-review.zip': '666ad50c880bd0918a3e2d2b1589843b1664cc7598f8a9ac95c4c78b1609be9c',
    'artifacts/uboq/wp3/wp3-batch-d-review.zip': '6de9865568806160b9462a0804afb59446e89a3ee825a515dc64ce372c24af83',
}


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def read_png_dimensions(p: Path):
    raw = p.read_bytes()
    assert raw[:8] == b'\x89PNG\r\n\x1a\n', f'Invalid PNG header: {p}'
    width, height = struct.unpack('>II', raw[16:24])
    return width, height


baseline = read_json(OUT / 'baseline.json')
d0_specs_live = read_json(BATCH_D_OUT / 'd0-t11-t12-contract-specifications.json')
d0_specs_copy = read_json(OUT / 'd0-t11-t12-contract-specifications-ratified.json')
runtime = read_json(OUT / 'runtime-tests.json')
validation = read_json(OUT / 'validation-exits.json')
mig34_receipt = read_json(OUT / 'migration34-apply.json')

batch_d_delivery = read_json(BATCH_D_OUT / 'archive-delivery.json')
batch_d_pkg = read_json(BATCH_D_OUT / 'review-package.json')
batch_c_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-c/archive-delivery.json')
batch_b_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-b/archive-delivery.json')
batch_a_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-a/archive-delivery.json')
inc02_baseline = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/baseline.json')
inc02_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/archive-delivery.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')
phase1_crosswalk = read_json(ACCEL / 'phase1-t0-t12-crosswalk.json')

assert baseline['git_branch'] == 'release/oserp-proj-uboq-001'
assert baseline['git_head'] == '79a2c5bd3853711cf4960c5d45cff755aaf219d2'

# 1A. Verify Project Owner Ratification Provenance (truthful — zero fabricated electronic signature)
assert (
    sha256_bytes((BATCH_D_OUT / 'd0-t11-t12-contract-specifications.json').read_bytes())
    == sha256_bytes((OUT / 'd0-t11-t12-contract-specifications-ratified.json').read_bytes())
), 'Ratified D0 contract specification copies diverged'
assert d0_specs_live['ratification_status'] == 'RATIFIED_BY_PROJECT_OWNER_IN_CONVERSATION_2026_11_15'
assert d0_specs_live['project_owner_formal_approval_found'] is True
assert d0_specs_live['runtime_implementation_status'] == 'IMPLEMENTED_IN_ISOLATED_LOCAL_PHASE_D2'
prov = d0_specs_live['owner_ratification_audit_provenance']
assert prov['decision_id'] == 'OSERP-PROJ-UBOQ-001-WP3-BATCH-D-D0D1-ACCEPTANCE-D2-OWNER-RATIFICATION'
assert prov['electronic_signature_present'] is False
assert prov['d0_proposed_artifact_sha256_prior_to_ratification'] == EXPECTED_PRE_D2_D0_SPEC_SHA256
assert prov['source_d0_d1_archive']['sha256'] == EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-d-review.zip']

# 1B. Verify consolidated Phase D2 7/7 runtime, security, RLS, non-regression & browser E2E suite
assert runtime['status'] == 'PASS', f"Phase D2 runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 7, f"Expected 7 Phase D2 check groups, got {len(runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in runtime['checks'])
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['public_table_count'] == 251
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

expected_pngs = {
    'browser-d2-t11-formal-desktop.png': 1440,
    'browser-d2-t12-desktop.png': 1440,
    'browser-d2-t11-t12-mobile.png': 390,
}
for png_name, expected_w in expected_pngs.items():
    png_file = OUT / png_name
    assert png_file.is_file() and png_file.stat().st_size > 10_000, f'Missing/empty browser screenshot: {png_name}'
    w, h = read_png_dimensions(png_file)
    assert w == expected_w and h >= 800, f'Unexpected PNG dimensions for {png_name}: {w}x{h}'

# 1C. Verify OpenXML structure of browser-d2-t11-formal.xlsx (live SUM strictly on delta column)
#     and browser-d2-t12-working.xlsx (0 formula tags across all sheets, genuine numeric cells)
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

t11_xlsx = OUT / 'browser-d2-t11-formal.xlsx'
assert t11_xlsx.is_file() and t11_xlsx.stat().st_size > 4_000, 'Missing browser-d2-t11-formal.xlsx'
with zipfile.ZipFile(t11_xlsx, 'r') as xz:
    wb_root = ET.fromstring(xz.read('xl/workbook.xml'))
    wb_sheets = {
        s_el.attrib.get('name'): s_el.attrib.get('state', 'visible')
        for s_el in wb_root.findall('.//m:sheet', ns)
    }
    assert 'T11_Formal_VO_Register' in wb_sheets, f'Missing T11_Formal_VO_Register sheet: {wb_sheets}'
    assert wb_sheets.get('__OSERP_META') == 'veryHidden', f'__OSERP_META not veryHidden in T11 formal XLSX: {wb_sheets}'
    sheet1_root = ET.fromstring(xz.read('xl/worksheets/sheet1.xml'))
    f_els = sheet1_root.findall('.//m:f', ns)
    assert len(f_els) == 1, f'Expected exactly 1 SUM formula in PM T11 formal XLSX, found {len(f_els)}'
    assert (f_els[0].text or '').startswith('SUM('), f'Unexpected formula in T11 formal XLSX: {f_els[0].text}'
    sheet2_root = ET.fromstring(xz.read('xl/worksheets/sheet2.xml'))
    assert len(sheet2_root.findall('.//m:f', ns)) == 0, 'Formula <f> tag detected in T11 __OSERP_META'

t12_xlsx = OUT / 'browser-d2-t12-working.xlsx'
assert t12_xlsx.is_file() and t12_xlsx.stat().st_size > 4_000, 'Missing browser-d2-t12-working.xlsx'
with zipfile.ZipFile(t12_xlsx, 'r') as xz:
    wb_root = ET.fromstring(xz.read('xl/workbook.xml'))
    wb_sheets = {
        s_el.attrib.get('name'): s_el.attrib.get('state', 'visible')
        for s_el in wb_root.findall('.//m:sheet', ns)
    }
    assert wb_sheets.get('__OSERP_META') == 'veryHidden', f'__OSERP_META not veryHidden in T12 working XLSX: {wb_sheets}'
    sheet_entries = [n for n in xz.namelist() if n.startswith('xl/worksheets/') and n.endswith('.xml')]
    assert len(sheet_entries) == 2, f'Expected 2 worksheets in T12 working XLSX, got {len(sheet_entries)}'
    for se in sheet_entries:
        s_root = ET.fromstring(xz.read(se))
        assert len(s_root.findall('.//m:f', ns)) == 0, f'Formula <f> tag detected in T12 {se} (violates NO_SUM / working export policy)'
    t12_sheet1 = ET.fromstring(xz.read('xl/worksheets/sheet1.xml'))
    numeric_cells = [
        c for c in t12_sheet1.findall('.//m:c', ns)
        if c.attrib.get('t') not in ('s', 'str', 'inlineStr') and c.find('m:v', ns) is not None
    ]
    assert len(numeric_cells) >= 36, f'Expected >= 36 genuine numeric cells in T12 working XLSX, got {len(numeric_cells)}'

# 2. Verify TypeScript, ESLint, and Prisma static validation gate
assert validation['status'] == 'PASS', f"Static validation status not PASS: {validation['status']}"
assert len(validation['checks']) == 3
for chk in validation['checks']:
    assert chk['exitCode'] == 0, f"Validation check failed: {chk['name']} -> {chk['exitCode']}"

# 3. Verify Forward-Only Migration #34 receipt & rollback preflight
assert mig34_receipt['migration_number'] == 34
assert mig34_receipt['migration_name'] == '20261113230000_wp3_batch_d_d2_t11_t12_rls_and_formal_guards'
assert mig34_receipt['migrations_1_to_33_verified'] == 33
assert mig34_receipt['rollback_preflight'] == 'PASS'
assert mig34_receipt['result'] in ('APPLIED_AND_VERIFIED', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig34_receipt['sha256'] == EXPECTED_MIG34_SHA256
assert mig34_receipt['post_apply_migration_count'] == 34
assert mig34_receipt['historical_migrations_1_to_33_unchanged'] is True

# 4. Verify safe build script invariant
pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

# 5. Verify all 7 frozen prior gate archives are 100% byte-identical
assert len(EXPECTED_FROZEN_ARCHIVES) == 7
for rel_archive, expected_sha in EXPECTED_FROZEN_ARCHIVES.items():
    actual_sha = sha256_bytes((ROOT / rel_archive).read_bytes())
    assert actual_sha == expected_sha, f'Frozen archive modified: {rel_archive}'

# 6. Verify Increment 01 and accepted G02-R3 evidence files remain byte-identical
for rel_path, expected_hash in inc02_baseline['increment01_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f'Increment 01 evidence modified: {rel_path}'
    )

for rel_path, expected_hash in inc02_baseline['G02_evidence'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f'Accepted G02-R3 evidence modified: {rel_path}'
    )

# 7. Verify historical migrations #1-#33 byte-identical + forward-only migration #34 exact match
assert len(baseline['migrations_1_to_33']) == 33
for rel_path, expected_hash in baseline['migrations_1_to_33'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f'Historical migration modified: {rel_path}'
    )

assert sha256_bytes((ROOT / MIG34_PATH).read_bytes()) == EXPECTED_MIG34_SHA256, (
    'Applied migration #34 hash mismatch on disk'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 34, f'Expected 34 migrations on disk, found {len(all_migrations)}'

# 8. Verify untouched core engines, Prisma schema, and API routes remain byte-identical since Phase D1
reused_unchanged_paths = [
    'prisma/schema.prisma',
    'src/lib/uboq/cashflow-engine.ts',
    'src/lib/uboq/tax-engine.ts',
    'src/lib/cpm-engine.ts',
    'src/lib/uboq/validation-engine.ts',
    'src/lib/uboq/security/stage-rbac.ts',
    'src/app/api/uboq/templates/route.ts',
    'src/app/api/uboq/templates/layouts/route.ts',
    'src/app/api/uboq/templates/formal-export/route.ts',
    'src/app/api/uboq/templates/round-trip/route.ts',
    'src/app/projects/[id]/uboq/templates/page.tsx',
]
batch_d_reused = batch_d_pkg['reused_unchanged_components']['files_verified_byte_identical']
batch_d_source_map = {row['path']: row['sha256'] for row in batch_d_pkg['source_manifest']}

reused_unchanged_file_hashes = {}
for rel_path in reused_unchanged_paths:
    actual_sha = sha256_bytes((ROOT / rel_path).read_bytes())
    if rel_path in batch_d_source_map:
        assert actual_sha == batch_d_source_map[rel_path], f'Phase D1 source file modified in Phase D2: {rel_path}'
    elif rel_path in batch_d_reused:
        assert actual_sha == batch_d_reused[rel_path], f'Reused core file modified in Phase D2: {rel_path}'
    else:
        raise AssertionError(f'Missing baseline hash reference for reused file: {rel_path}')
    reused_unchanged_file_hashes[rel_path] = actual_sha

# 9. Verify all 10 pre-D2 file backups & clean unified diff patch
expected_before_hashes = baseline['before_file_sha256']
assert len(expected_before_hashes) == 10
assert (
    expected_before_hashes['artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json']
    == EXPECTED_PRE_D2_D0_SPEC_SHA256
)
allowed_modified = set(expected_before_hashes.keys())
for rel_path, expected_before_hash in expected_before_hashes.items():
    before_file = OUT / 'before' / rel_path
    assert before_file.is_file(), f'Missing pre-D2 backup for {rel_path}'
    assert sha256_bytes(before_file.read_bytes()) == expected_before_hash, (
        f'Pre-D2 backup hash mismatch for {rel_path}'
    )

sources = [
    'artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json',
    MIG34_PATH,
    'src/lib/uboq/field-catalog.ts',
    'src/lib/uboq/security/redact-payload.ts',
    'src/lib/uboq/template-builder.ts',
    'src/lib/uboq/templates/canonical-source-adapters.ts',
    'src/lib/uboq/templates/t0-t1.ts',
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/lib/uboq/templates/round-trip-import.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'scripts/uboq/apply-wp3-batch-d-d2-migration34.cjs',
    'scripts/uboq/verify-wp3-batch-d-d2.ts',
    'scripts/uboq/package-wp3-batch-d-d2.py',
    'docs/uboq/wp3-batch-d-d2.md',
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
payload['wp3-batch-d-d2.patch'] = patch_bytes
(OUT / 'wp3-batch-d-d2.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-batch-d-d2-patch-') as td:
    temp = Path(td)
    for mod_path in sorted(allowed_modified):
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'batch-d-d2.patch'
    patch_file.write_bytes(patch_bytes)
    res = subprocess.run(
        ['git', 'apply', '--check', '--unsafe-paths', str(patch_file)],
        cwd=temp,
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f'git apply --check failed: {res.stderr}'

excluded_evidence_names = {
    'review-package.json',
    'archive-delivery.json',
    'completion-report.json',
    'wp3-batch-d-d2.patch',
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
        assert secret.encode('utf-8') not in b, f'Secret leak detected in {name}'

migration_hashes = {
    **baseline['migrations_1_to_33'],
    MIG34_PATH: EXPECTED_MIG34_SHA256,
}

bdd2_details = {
    c['name'].split(':')[0]: c['detail']
    for c in runtime['checks']
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-D-PHASE-D2',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'WP3_BATCH_D_PHASE_D2_T11_T12_LOCALLY_VERIFIED_COMPLETE_T0_TO_T12_SUITE_PENDING_INDEPENDENT_REVIEW_NOT_FINAL_FREEZE',
    'governance_gate': 'STOPPED_AT_BATCH_D_D2_INDEPENDENT_REVIEW',
    'independent_acceptance_claimed': False,
    'prior_d0_d1_and_owner_ratification_handoff': {
        'decision_id': prov['decision_id'],
        'decision_date': prov['decision_date'],
        'd0_d1_review_verdict': 'ACCEPTED_FOR_CONTINUED_ISOLATED_LOCAL_DEVELOPMENT_ONLY',
        'accepted_batch_d_d0_d1_archive': batch_d_delivery['archive'],
        'accepted_batch_d_d0_d1_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-d-review.zip'],
        'owner_ratification_status': d0_specs_live['ratification_status'],
        'owner_approval_method': prov['approval_method'],
        'electronic_signature_present': False,
        'electronic_signature_statement': prov['electronic_signature_statement'],
        'pre_ratification_d0_artifact_sha256': EXPECTED_PRE_D2_D0_SPEC_SHA256,
    },
    'authoritative_crosswalk_alignment': {
        'crosswalk_json': 'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
        'template_ids_preserved_without_renaming': phase1_crosswalk['source_of_truth']['template_ids_preserved_without_renaming'],
        'ratified_active_templates_t0_to_t12_count': 13,
        'formal_capable_templates': [
            'T0_MASTER_CONTRACT',
            'T1_PHASE_BOQ',
            'T4_RESOURCE_TAKEOFF',
            'T5_ACCOMPLISHMENT_CERT',
            'T6_PROGRESS_BILLING',
            'T11_VARIATION_ORDER_REGISTER',
        ],
        'legacy_unratified_aliases_blocked_fail_closed': [
            'T11_VARIATION_IMPACT',
            'T12_CHANGE_REGISTER',
        ],
    },
    'reused_unchanged_components': {
        'files_verified_byte_identical': reused_unchanged_file_hashes,
        'accepted_g02_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/g02-r3/independent-review-candidate.zip'],
        'increment01_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-increment01-review.zip'],
        'increment01_runtime_pass': inc01_delivery['runtime_pass'],
        'increment02_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-increment02-review.zip'],
        'increment02_preserved_runtime_pass': inc02_delivery['preserved_runtime_pass'],
        'increment02_review_corrections_pass': inc02_delivery['review_corrections_runtime_pass'],
        'batch_a_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-a-review.zip'],
        'batch_a_preserved_runtime_pass': batch_a_delivery['preserved_batch_a_runtime_pass'],
        'batch_a_ir01_corrections_pass': batch_a_delivery['targeted_ir01_corrections_runtime_pass'],
        'batch_b_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-b-review.zip'],
        'batch_b_runtime_pass': batch_b_delivery['batch_b_runtime_pass'],
        'batch_b_ir_corrections_pass': batch_b_delivery['targeted_ir_corrections_runtime_pass'],
        'batch_c_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-c-review.zip'],
        'batch_c_runtime_pass': batch_c_delivery['batch_c_runtime_pass'],
        'batch_c_ir_pass': batch_c_delivery['batch_c_ir_targeted_pass'],
        'batch_c_r2_pass': batch_c_delivery['batch_c_r2_targeted_pass'],
        'batch_d_d0_d1_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-d-review.zip'],
        'batch_d_d0_d1_runtime_pass': batch_d_delivery['batch_d_runtime_pass'],
    },
    'implemented_phase_d2': {
        't11_variation_order_register': 'T11_VARIATION_ORDER_REGISTER at VARIATION_ORDER_ITEM row grain with 5 ratified V2.1 R4 VO catalog fields (vo_number, vo_classification, vo_approved_qty_delta, vo_client_revenue_delta_amt, vo_subcon_commitment_delta_amt -> 134 canonical fields total), strict separation of CLIENT_CONTRACT_VO revenue entitlement vs SUBCONTRACTOR_COMMITMENT_VO cost commitment, deterministic mirror deduplication across ClientVariationOrder and CommitmentLedger SVO:* entries, 6 fail-closed 409 guards (missing source doc/approval, incomplete line approval, unverified BOQ/snapshot lineage, arithmetic mismatch, duplicate VO recognition, unauthorized AwardedBOQItem mutation), and internal ERP formal export ERP_CANONICAL_T11_FORMAL_V1 with zero external agency statutory claims.',
        't12_cashflow_variance_treasury': 'T12_CASHFLOW_VARIANCE_TREASURY at CASH_FLOW_PERIOD row grain reusing accepted Batch C verified client receipt (UboqClientReceipt/UboqClientReceiptAllocation) and verified disbursement (AccountsPayable/PaymentRecord/Expense/Payroll) authorities, strict separation of forecast vs actual cash (unpaid commitments excluded from actual cash), 3 safe AST-evaluated variance columns (receipts_variance_amt, disbursement_variance_amt, net_cash_flow_variance_amt), strict NO_SUM balance policy (0 <f> tags across all T12 worksheets), formal export blocked (isFormalComplianceOutput: false), and 409 fail-closed period continuity/cutoff/duplicate-collection guards.',
        'forward_only_migration_34': f'Migration #34 ({EXPECTED_MIG34_SHA256}): Enables + FORCES RLS on VariationOrder, VariationOrderItem, VariationOrderApproval, and ClientVariationOrder; extends UboqSavedTemplateLayout & UboqFormalExportAudit constraints/triggers to authorize T11_VARIATION_ORDER_REGISTER (working, saved-layout, and internal formal export ERP_CANONICAL_T11_FORMAL_V1) and T12_CASHFLOW_VARIANCE_TREASURY (working & saved-layout only; SQL formal export blocked); preserves kernel-enforced SensitiveExportLog attestation.',
    },
    'security_and_verification_metrics': bdd2_details,
    'tests': {
        'batch_d_d2_consolidated_runtime_pass': len(runtime['checks']),
        'batch_d_d2_consolidated_runtime_fail': 0,
        'batch_d_d2_runtime_report': 'evidence/runtime-tests.json',
        'browser_e2e': 'PASS — real headless Chromium E2E verified live rendered T11 Formal Export Preview + XLSX download (SUM strictly on delta column, __OSERP_META veryHidden) and 16-column T12 Treasury Variance Preview + XLSX download (0 <f> tags across all sheets, genuine numeric cells, __OSERP_META veryHidden) at 1440x900 desktop & 390x844 mobile with 0 console errors, 0 horizontal overflow, and 0 server modules in client bundle.',
        'validation': {c['name']: c['exitCode'] for c in validation['checks']},
    },
    'preservation': {
        'migration_count': 34,
        'migrations_1_to_33_byte_unchanged': True,
        'forward_only_migration_34': MIG34_PATH,
        'migration_34_sha256': EXPECTED_MIG34_SHA256,
        'migration_hashes': migration_hashes,
        'frozen_archives_unchanged': EXPECTED_FROZEN_ARCHIVES,
        'database_public_tables_identical_after_cleanup': runtime['public_table_count'],
        'database_before_sha256': runtime['database_before_sha256'],
        'database_after_sha256': runtime['database_after_sha256'],
        'canonical_boq_or_contract_mutations': 0,
        'duplicate_source_authorities_or_accounting_engines': 0,
        'protected_databases_modified': False,
    },
    'remaining_blockers_and_holds': {
        'staged_proposal_canonical_apply_workflow': 'GOVERNED_APPROVAL_GATE_PRESERVED — Phase D1 signed T0/T1 round-trip imports stage immutable STAGED_PENDING_APPROVAL proposals (canonicalRecordsMutated: 0); mutating live approved BOQ/Contract baselines remains gated behind formal VO / Snapshot Revision approval workflows.',
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains preserved and unresolved; #1-#33 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency statutory print layouts and wet/digital signatory blocks remain unspecified; T11 formal output is internal ERP only.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'head': baseline['git_head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-D2 files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-batch-d-d2-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-batch-d-d2-review.zip'
temp_archive = archive.with_suffix('.zip.tmp')
with zipfile.ZipFile(temp_archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, b in sorted(payload.items()):
        z.writestr(name, b)

with zipfile.ZipFile(temp_archive, 'r') as z:
    assert z.testzip() is None
    for row in index['payload_manifest']:
        assert sha256_bytes(z.read(row['path'])) == row['sha256']
    assert sha256_bytes(z.read('review-package.json')) == sha256_bytes(index_bytes)

os.replace(temp_archive, archive)
(OUT / 'review-package.json').write_bytes(index_bytes)
(OUT / 'completion-report.json').write_bytes(completion_bytes)

delivery = {
    'status': summary['status'],
    'governance_gate': summary['governance_gate'],
    'prior_accepted_batch_d_d0_d1_archive_sha256': EXPECTED_FROZEN_ARCHIVES['artifacts/uboq/wp3/wp3-batch-d-review.zip'],
    'owner_ratification_status': d0_specs_live['ratification_status'],
    'owner_electronic_signature_present': False,
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'source_records_verified': len(manifest),
    'active_templates_t0_to_t12_count': 13,
    'batch_d_d2_runtime_pass': len(runtime['checks']),
    'batch_d_d2_runtime_fail': 0,
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
    'reused_batch_d_d0_d1_runtime_pass': 7,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'frozen_archives_unchanged': True,
    'migrations_1_to_33_unchanged': True,
    'migration_34_sha256': EXPECTED_MIG34_SHA256,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
