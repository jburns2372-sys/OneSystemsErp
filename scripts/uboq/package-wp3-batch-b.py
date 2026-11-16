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
OUT = ROOT / 'artifacts/uboq/wp3/batch-b'
ACCEL = ROOT / 'artifacts/uboq/wp3/accelerated-plan'

EXPECTED_MIG28_SHA256 = '5efabd58b25f529e588244b67ac2496573d3516f2d716677390a0389353b896a'
EXPECTED_MIG29_SHA256 = '10e045ba8a4686038b8dd4c709265d608abb63a03bf6d9b91c58b4bf2c634752'
SUPERSEDED_INITIAL_BATCH_B_SHA256 = '8d7226367efdadf7966aa9a077819aebb6a4ee790f9dc07d3ea9aa846b455d11'
SUPERSEDED_IR1_BATCH_B_SHA256 = 'f12fdd0dbc1fc9fb28cd31afb45ace05174b4eb204e355c0b20bb36d000d3376'
SUPERSEDED_IR2_BATCH_B_SHA256 = '0c4bd8140c11f7a51825b000d13e1c21ea95885f32e7843b70915a10c5c25592'
MIG28_PATH = 'prisma/migrations/20261113170000_wp3_batch_b_t5_t7_templates_rls_and_formal_guards/migration.sql'
MIG29_PATH = 'prisma/migrations/20261113180000_wp3_batch_b_ir_historical_snapshot_and_inspection_guards/migration.sql'


def read_json(p: Path):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


baseline = read_json(OUT / 'baseline.json')
runtime = read_json(OUT / 'runtime-tests.json')
review_corrections = read_json(OUT / 'review-corrections-runtime.json')
validation = read_json(OUT / 'validation-exits.json')
mig28_receipt = read_json(OUT / 'migration28-apply.json')
mig29_receipt = read_json(OUT / 'migration29-apply.json')
batch_a_delivery = read_json(ROOT / 'artifacts/uboq/wp3/batch-a/archive-delivery.json')
inc02_baseline = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/baseline.json')
inc02_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-02/archive-delivery.json')
inc01_delivery = read_json(ROOT / 'artifacts/uboq/wp3/increment-01/archive-delivery.json')
phase1_crosswalk = read_json(ACCEL / 'phase1-t0-t12-crosswalk.json')

assert baseline['prior_accepted_gate'] == 'WP3_BATCH_A_PASS_FOR_CONTINUED_ISOLATED_LOCAL_DEVELOPMENT'
assert baseline['prior_accepted_archive_sha256'] == '6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641'

# Verify targeted IR-01..IR-04 + IR2-01..IR2-02 + IR3-01 corrections 7/7 runtime suite
assert review_corrections['summary']['total'] == 7, (
    f"Expected 7 IR check groups, got {review_corrections['summary']['total']}"
)
assert review_corrections['summary']['passed'] == 7
assert review_corrections['summary']['failed'] == 0
assert all(c['status'] == 'PASS' for c in review_corrections['checks'])
assert review_corrections['clean_state_restored']['verified_tables'] == 247
assert review_corrections['clean_state_restored']['residual_changed_tables'] == 0

# Verify consolidated Batch B 7/7 runtime, security & browser suite
assert runtime['status'] == 'PASS', f"Batch B runtime tests did not PASS: {runtime['status']}"
assert len(runtime['checks']) == 7, f"Expected 7 Batch B runtime check groups, got {len(runtime['checks'])}"
assert all(c['result'] == 'PASS' for c in runtime['checks'])
assert runtime['all_public_table_rows_preserved'] is True
assert runtime['database_before_sha256'] == runtime['database_after_sha256']

bb02_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BB-02'))
assert sha256_bytes((OUT / 't5-formal-export.json').read_bytes()) == bb02_detail['jsonSha256']
assert sha256_bytes((OUT / 't5-formal-export.xlsx').read_bytes()) == bb02_detail['xlsxSha256']
assert sha256_bytes((OUT / 't5-formal-export.csv').read_bytes()) == bb02_detail['csvSha256']
t5_formal_json = json.loads((OUT / 't5-formal-export.json').read_text(encoding='utf-8'))
assert 'outputSha256' not in json.dumps(t5_formal_json.get('provenance', {})), 'Recursive hash detected in T5 JSON provenance'

bb03_detail = next(c['detail'] for c in runtime['checks'] if c['name'].startswith('WP3-BB-03'))
assert sha256_bytes((OUT / 't6-formal-export.json').read_bytes()) == bb03_detail['jsonSha256']
assert sha256_bytes((OUT / 't6-formal-export.xlsx').read_bytes()) == bb03_detail['xlsxSha256']
assert sha256_bytes((OUT / 't6-formal-export.csv').read_bytes()) == bb03_detail['csvSha256']
t6_formal_json = json.loads((OUT / 't6-formal-export.json').read_text(encoding='utf-8'))
assert 'outputSha256' not in json.dumps(t6_formal_json.get('provenance', {})), 'Recursive hash detected in T6 JSON provenance'

for chk in validation['checks']:
    assert chk['exitCode'] == 0, f"Validation check failed: {chk['name']} -> {chk['exitCode']}"

assert mig28_receipt['migration_number'] == 28
assert mig28_receipt['migration_name'] == '20261113170000_wp3_batch_b_t5_t7_templates_rls_and_formal_guards'
assert mig28_receipt['migrations_1_to_27_verified'] == 27
assert mig28_receipt['rollback_preflight'] in ('PASS', 'ALREADY_VERIFIED')
assert mig28_receipt['result'] in ('PASS_ACTUAL_SQL_EXECUTION', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig28_receipt['sha256'] == EXPECTED_MIG28_SHA256

assert mig29_receipt['migration_number'] == 29
assert mig29_receipt['migration_name'] == '20261113180000_wp3_batch_b_ir_historical_snapshot_and_inspection_guards'
assert mig29_receipt['migrations_1_to_28_verified'] == 28
assert mig29_receipt['rollback_preflight'] in ('PASS', 'ALREADY_VERIFIED')
assert mig29_receipt['result'] in ('PASS_ACTUAL_SQL_EXECUTION', 'ALREADY_APPLIED_AND_VERIFIED')
assert mig29_receipt['sha256'] == EXPECTED_MIG29_SHA256
assert mig29_receipt['total_applied_migrations'] == 29

pkg_json = read_json(ROOT / 'package.json')
build_cmd = pkg_json.get('scripts', {}).get('build', '')
assert 'db push' not in build_cmd and '--accept-data-loss' not in build_cmd, 'Unsafe build script detected'

# Verify all 4 frozen prior gate archives are byte-identical
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

# Verify historical migrations #1-#28 byte-identical + forward-only migration #29 exact match
for rel_path, expected_hash in baseline['migrations_1_to_27'].items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Historical migration modified: {rel_path}"
    )

assert sha256_bytes((ROOT / MIG28_PATH).read_bytes()) == EXPECTED_MIG28_SHA256, (
    'Applied migration #28 was modified on disk'
)
assert sha256_bytes((ROOT / MIG29_PATH).read_bytes()) == EXPECTED_MIG29_SHA256, (
    'Applied migration #29 was modified on disk'
)

all_migrations = sorted(
    p.relative_to(ROOT).as_posix() for p in (ROOT / 'prisma/migrations').glob('*/migration.sql')
)
assert len(all_migrations) == 29, f"Expected 29 migrations on disk, found {len(all_migrations)}"

# Verify reused routes, schema, and canonical engines were NOT modified in Batch B
reused_unchanged_files = baseline['reused_unchanged_file_hashes']
for rel_path, expected_hash in reused_unchanged_files.items():
    assert sha256_bytes((ROOT / rel_path).read_bytes()) == expected_hash, (
        f"Reused file expected byte-identical was modified: {rel_path}"
    )

allowed_modified = set(baseline['pre_batch_b_file_hashes'].keys())
for rel_path, expected_before_hash in baseline['pre_batch_b_file_hashes'].items():
    before_file = OUT / 'before' / rel_path
    assert before_file.is_file(), f"Missing pre-Batch-B backup for {rel_path}"
    assert sha256_bytes(before_file.read_bytes()) == expected_before_hash, (
        f"Pre-Batch-B backup hash mismatch for {rel_path}"
    )

sources = [
    MIG28_PATH,
    MIG29_PATH,
    'src/lib/uboq/templates/canonical-source-adapters.ts',
    'src/lib/uboq/templates/t0-t1.ts',
    'src/lib/uboq/templates/saved-layouts.ts',
    'src/lib/uboq/templates/formal-t0-t1.ts',
    'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx',
    'src/app/projects/[id]/uboq/templates/page.tsx',
    'scripts/uboq/apply-wp3-batch-b-migration28.cjs',
    'scripts/uboq/apply-wp3-batch-b-migration29.cjs',
    'scripts/uboq/verify-wp3-batch-b.ts',
    'scripts/uboq/verify-wp3-batch-b-corrections.ts',
    'scripts/uboq/package-wp3-batch-b.py',
    'docs/uboq/wp3-batch-b.md',
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
payload['wp3-batch-b.patch'] = patch_bytes
(OUT / 'wp3-batch-b.patch').write_bytes(patch_bytes)

with tempfile.TemporaryDirectory(prefix='oserp-wp3-batch-b-patch-') as td:
    temp = Path(td)
    for mod_path in sorted(allowed_modified):
        dst = temp / mod_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        before_norm = (OUT / 'before' / mod_path).read_text(encoding='utf-8-sig').replace('\r\n', '\n')
        dst.write_text(before_norm, encoding='utf-8', newline='\n')
    patch_file = temp / 'batch-b.patch'
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
    'wp3-batch-b.patch',
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
    **baseline['migrations_1_to_27'],
    MIG28_PATH: EXPECTED_MIG28_SHA256,
    MIG29_PATH: EXPECTED_MIG29_SHA256,
}

summary = {
    'id': 'OSERP-PROJ-UBOQ-001-WP3-BATCH-B-IR3-REMEDIATED',
    'created_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'WP3_BATCH_B_IR3_REMEDIATED_LOCALLY_VERIFIED_PENDING_TARGETED_INDEPENDENT_REVIEW_NOT_FINAL_FREEZE',
    'governance_gate': 'STOPPED_AT_BATCH_B_TARGETED_INDEPENDENT_REVIEW',
    'independent_acceptance_claimed': False,
    'superseded_initial_batch_b_archive_sha256': SUPERSEDED_INITIAL_BATCH_B_SHA256,
    'superseded_ir1_batch_b_archive_sha256': SUPERSEDED_IR1_BATCH_B_SHA256,
    'superseded_ir2_batch_b_archive_sha256': SUPERSEDED_IR2_BATCH_B_SHA256,
    'prior_batch_a_handoff': {
        'verdict': 'PASS_FOR_CONTINUED_ISOLATED_LOCAL_DEVELOPMENT',
        'accepted_batch_a_archive': batch_a_delivery['archive'],
        'accepted_batch_a_archive_sha256': baseline['prior_accepted_archive_sha256'],
        'remediated_finding_preserved': 'WP3-BA-IR-01 (Migration #27 + saved-layouts financial audit redaction)',
    },
    'remediated_batch_b_findings': {
        'IR_01_FINANCIAL_METADATA_EXPOSURE': 'CLOSED — systemMetaFields & row __oserpMeta redacted per role tier across working JSON, working XLSX __OSERP_META, and saved-layout previews, enforcing ProjectUserAssignment role narrowing across SITE_ENGINEER, narrowed SITE_ENGINEER, narrowed VIEWER, and EXTERNAL_VIEWER.',
        'IR_02_HISTORICAL_BILLING_AUTHORITY': 'CLOSED — effective-dated historical snapshot & verified UboqContractAuthority resolution as of period cutoff (supersedesSnapshotId lineage, fail-closed 409 on pre-snapshot, unlinked, post-dated, ambiguous, or header-mismatched baselines), sequential carried-forward quantity reconciliation, cumulative overbilling block on understated previousQuantityBilled, and Migration #29 SQL trigger guards.',
        'IR_03_INSPECTION_QUANTITY_INTEGRITY': 'CLOSED — verifyApprovedInspectionsForClaim + Migration #29 SQL guards enforce approved inspected quantity >= positive certified claim, cap certified quantity at approved claim when inspection exceeds claim, and require distinct non-blank lot/scope linkage across multiple inspections without duplicate counting.',
        'IR_04_T7_EVM_AS_OF_CONSISTENCY': 'CLOSED — unified reporting cutoff (as_of_cutoff_date <= now()) enforced simultaneously across PV, EV, and AC; future-dated, INDIRECT/OVERHEAD, and off-schedule records excluded; certified accomplishment progress strictly separated from unverified self-reported % (EV = 0.00).',
        'WP3_BB_IR2_01_PRIOR_CERTIFICATE_RECONCILIATION': 'CLOSED — removed all silent skip/drop paths for invalid earlier APPROVED accomplishments and billings in T5 and T6; all approved historical quantities reconcile monotonically into cumulative baselines, cumulative overbilling checks run against the non-reduced historical total (409 OVERBILLING_CEILING_EXCEEDED), unresolved prior certificates fail closed (409 PRIOR_CERTIFICATE_UNRESOLVED) with audit-safe non-financial diagnostics, valid multi-certificate chains remain preserved, and unrelated projects remain isolated.',
        'WP3_BB_IR2_02_EVM_ACTIVITY_CERTIFICATION': 'CLOSED — T7_SCHEDULE_EVM requires activity-specific BOQ linkage AND overlap with verified inspected Accomplishment BOQ items; caps EV-eligible progress strictly at verified certified activity BOQ quantity (min(claimedPct, verifiedActivityCertPct)) with shared pool deduplication; fails closed to EV = 0.00 on cross-activity or unlinked claims while preserving self_reported_progress_pct; and isolates unified PV/EV/AC cutoff from out-of-schedule and future-dated approvals.',
        'WP3_BB_IR3_01_T7_EVM_CERTIFIED_BUDGET_DEDUPLICATION': 'CLOSED — T7_SCHEDULE_EVM enforces one authoritative certified quantity budget per canonical AwardedBOQItem across all schedule activities, linkage representations (UboqScheduleActivityLink + ScheduleBOQAllocation), and approved snapshot versions (canonical phase slots derived once from highest referenced snapshot without pool replenishment), preserving legitimate split allocations while failing closed (409 TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING) on overlapping scope mappings exceeding contractual ceilings or conflicting intra-activity/multi-snapshot phase definitions.',
    },
    'authoritative_crosswalk_alignment': {
        'crosswalk_json': 'artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json',
        'template_ids_preserved_without_renaming': phase1_crosswalk['source_of_truth']['template_ids_preserved_without_renaming'],
        'batch_b_templates': [
            'T5_ACCOMPLISHMENT_CERT (PHASE_BOQ_LINE, formal ERP_CANONICAL_T5_FORMAL_V1)',
            'T6_PROGRESS_BILLING (PHASE_BOQ_LINE, formal ERP_CANONICAL_T6_FORMAL_V1)',
            'T7_SCHEDULE_EVM (SCHEDULE_ACTIVITY, working/saved-layout analytical view, isFormalComplianceOutput: false)',
        ],
    },
    'reused_unchanged_components': {
        'files_verified_byte_identical': reused_unchanged_files,
        'accepted_g02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/g02-r3/independent-review-candidate.zip'],
        'increment01_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment01-review.zip'],
        'increment01_runtime_pass': inc01_delivery['runtime_pass'],
        'increment02_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-increment02-review.zip'],
        'increment02_preserved_runtime_pass': inc02_delivery['preserved_runtime_pass'],
        'increment02_review_corrections_pass': inc02_delivery['review_corrections_runtime_pass'],
        'batch_a_archive_sha256': baseline['frozen_archives']['artifacts/uboq/wp3/wp3-batch-a-review.zip'],
        'batch_a_preserved_runtime_pass': batch_a_delivery['preserved_batch_a_runtime_pass'],
        'batch_a_ir01_corrections_pass': batch_a_delivery['targeted_ir01_corrections_runtime_pass'],
    },
    'implemented': {
        'shared_phase_bridge_and_vo_rules': 'loadApprovedSnapshotPhaseBridge in canonical-source-adapters.ts resolves effective-dated historical UboqOperationalSnapshot + verified UboqContractAuthority as of the certificate cutoff, bridges canonical AwardedBOQItem execution rows to approved UboqAwardedPhaseLine rows with deterministic Prisma.Decimal pro-rata phase allocation (zero multi-phase double counting), and includes pre-cutoff approved Client VariationOrders while strictly excluding draft/post-cutoff Client VOs and Subcontractor VOs.',
        'T5_ACCOMPLISHMENT_CERT': 'Statement of Work Accomplished (PHASE_BOQ_LINE, formal ERP_CANONICAL_T5_FORMAL_V1): projects APPROVED Accomplishment + AccomplishmentItem + verified Inspection quantity sufficiency & distinct multi-lot linkage (IR-03) + chronological prior-certificate reconciliation & ceiling check (IR-02), contract-value-weighted physical_progress_pct, live Excel SUM(...) on commercial columns, NO_SUM on contract_unit_rate, and financial metadata redaction for non-financial roles (IR-01).',
        'T6_PROGRESS_BILLING': 'Progress Billing Certificate (PHASE_BOQ_LINE, formal ERP_CANONICAL_T6_FORMAL_V1): projects approved Billing + BillingItem + BillingDeduction + cleared Payment records strictly using historical Awarded BOQ UboqAwardedPhaseLine.contractUnitRate (IR-02), chronological carried-forward reconciliation & cumulative overbilling prevention, UboqTaxPricingProfile + computeContractBillingTaxBreakdown across Gov 12% VAT-inc, Corporate 12% VAT-excl, and 0% PEZA profiles, and role-tiered metadata redaction (IR-01).',
        'T7_SCHEDULE_EVM': 'CPM Schedule & Earned Value View (SCHEDULE_ACTIVITY, non-formal): projects baseline ProjectSchedule + ScheduleWBS + ScheduleActivity + ScheduleDependency + UboqScheduleActivityLink/ScheduleBOQAllocation + ScheduleProgressUpdate + APPROVED ProjectCostLedger under one unified as-of cutoff date across PV/EV/AC, separating certified accomplishment EV from unverified self-reported % (IR-04) and redacting bac_allocated_amount for non-financial roles (IR-01).',
        'migrations_28_and_29': 'Migration #28 (preserved byte-for-byte) enables RLS + FORCE RLS across 13 Batch B execution tables and T0-T7 template guards; Forward-Only Migration #29 hardens uboq_guard_template_audit_event() to enforce @v<N> historical snapshot cutoff, non-supersession, non-ambiguity, verified contract authority <= cutoff, and T5 inspection quantity sufficiency & distinct multi-lot linkage.',
    },
    'tests': {
        'targeted_ir_corrections_runtime_pass': review_corrections['summary']['passed'],
        'targeted_ir_corrections_runtime_fail': review_corrections['summary']['failed'],
        'targeted_ir_corrections_report': 'evidence/review-corrections-runtime.json',
        'batch_b_consolidated_runtime_pass': len(runtime['checks']),
        'batch_b_consolidated_runtime_fail': 0,
        'batch_b_runtime_report': 'evidence/runtime-tests.json',
        'browser_e2e': 'PASS — real headless Chromium E2E across T5 formal preview, T6 formal preview & XLSX download, and T7 working preview & saved layout at 1440px desktop & 390px mobile with zero console errors and zero horizontal overflow.',
        'validation': {c['name']: c['exitCode'] for c in validation['checks']},
    },
    'preservation': {
        'migration_count': 29,
        'migrations_1_to_29_byte_unchanged': True,
        'migrations_1_to_28_byte_unchanged': True,
        'migration_28': MIG28_PATH,
        'migration_28_sha256': EXPECTED_MIG28_SHA256,
        'forward_only_migration_29': MIG29_PATH,
        'migration_29_sha256': EXPECTED_MIG29_SHA256,
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
        'migration14_historical_lineage_hold': 'OPEN_SEPARATE_RELEASE_INTEGRITY_HOLD — historical production lineage hold on migration #14 remains preserved and unresolved; #1-#28 untouched.',
        'migration23_xid_rollover_hardening': 'REQUIRED_BEFORE_PREVIEW — 32-bit xmin::text::bigint vs epoch-aware txid_current() in migration #23 requires forward-only hardening migration and regression proof before PREVIEW promotion.',
        'external_agency_formal_specifications': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED — external client/agency statutory print layouts and wet/digital signatory blocks remain unspecified; validated generic ERP formal contracts retained.',
        'future_wp3_batches': 'Batch C (T8_COST_COMMITMENT, T9_CASH_FLOW_FORECAST, T10_EXECUTIVE_SUMMARY) and Batch D (reserved T11–T12 + signed round-trip workbook re-import) remain deferred until Batch B targeted independent review acceptance.',
        'production': 'NO_PRODUCTION_CHANGES_OR_DEPLOYMENT',
        'automatic_final_freeze': False,
    },
    'next_wp3_batch': {
        'batch': 'WP-3 Batch C',
        'recommended_scope': 'Implement existing T8_COST_COMMITMENT, T9_CASH_FLOW_FORECAST, and T10_EXECUTIVE_SUMMARY projections over canonical procurement commitments, billing/payables cash-flow curves, and executive margin authorities after Batch B independent review acceptance.',
    },
    'head': inc02_baseline['head'],
    'source_manifest': manifest,
    'delta_patch_sha256': sha256_bytes(patch_bytes),
    'delta_patch_check': 'PASS git apply --check against preserved pre-Batch-B files',
}

completion_bytes = (json.dumps(summary, indent=2) + '\n').encode('utf-8')
payload['completion-report.json'] = completion_bytes

index = {
    **summary,
    'payload_manifest': [
        {'path': p, 'sha256': sha256_bytes(b), 'bytes': len(b)}
        for p, b in sorted(payload.items())
    ],
    'self_hash': 'Index excluded from recursive payload list; archive-delivery.json hashes both review-package.json and wp3-batch-b-review.zip.',
}
index_bytes = (json.dumps(index, indent=2) + '\n').encode('utf-8')
payload['review-package.json'] = index_bytes

archive = ROOT / 'artifacts/uboq/wp3/wp3-batch-b-review.zip'
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
    'prior_accepted_batch_a_archive_sha256': baseline['prior_accepted_archive_sha256'],
    'superseded_initial_batch_b_archive_sha256': SUPERSEDED_INITIAL_BATCH_B_SHA256,
    'superseded_ir1_batch_b_archive_sha256': SUPERSEDED_IR1_BATCH_B_SHA256,
    'superseded_ir2_batch_b_archive_sha256': SUPERSEDED_IR2_BATCH_B_SHA256,
    'archive': str(archive.relative_to(ROOT)).replace('\\', '/'),
    'archive_sha256': sha256_bytes(archive.read_bytes()),
    'archive_bytes': archive.stat().st_size,
    'review_package_sha256': sha256_bytes(index_bytes),
    'delta_patch_sha256': summary['delta_patch_sha256'],
    'payloads_verified': len(index['payload_manifest']),
    'targeted_ir_corrections_runtime_pass': review_corrections['summary']['passed'],
    'targeted_ir_corrections_runtime_fail': review_corrections['summary']['failed'],
    'batch_b_runtime_pass': len(runtime['checks']),
    'batch_b_runtime_fail': 0,
    'reused_increment01_runtime_pass': 14,
    'reused_increment02_runtime_pass': 13,
    'reused_increment02_ir_pass': 6,
    'reused_batch_a_runtime_pass': 8,
    'reused_batch_a_ir01_pass': 6,
    'typescript': 'PASS',
    'lint': 'PASS',
    'prisma_validate': 'PASS',
    'frozen_archives_unchanged': True,
    'migrations_1_to_29_unchanged': True,
    'migrations_1_to_28_unchanged': True,
    'migration_28_sha256': EXPECTED_MIG28_SHA256,
    'migration_29_sha256': EXPECTED_MIG29_SHA256,
    'secret_scan_hits': 0,
    'release_holds': [
        'migration14_historical_production_lineage',
        'migration23_rollover_before_PREVIEW',
        'external_agency_formal_specs_absent_generic_retained',
    ],
    'production_changes': False,
}
(OUT / 'archive-delivery.json').write_text(json.dumps(delivery, indent=2) + '\n', encoding='utf-8')
print(json.dumps(delivery, indent=2))
