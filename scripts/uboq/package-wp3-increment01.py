from pathlib import Path
import json,hashlib,subprocess,difflib,zipfile,tempfile,datetime,os
ROOT=Path.cwd();OUT=ROOT/'artifacts/uboq/wp3/increment-01'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(b):return hashlib.sha256(b).hexdigest()
baseline=read(OUT/'baseline.json');runtime=read(OUT/'runtime-tests.json');checks=read(OUT/'validation-exits.json')
assert runtime['status']=='PASS' and len(runtime['checks'])==14 and runtime['all_public_table_rows_preserved']
assert checks=={'eslint_exit':0,'typescript_exit':0},checks
allowed='src/app/projects/[id]/uboq/page.tsx'
for p,h in baseline['source'].items():
    if p!=allowed:assert sha((ROOT/p).read_bytes())==h,'Existing source changed outside increment: '+p
for p,h in baseline['migrations'].items():assert sha((ROOT/p).read_bytes())==h,'Migration changed: '+p
assert len(list((ROOT/'prisma/migrations').glob('*/migration.sql')))==23
for p,h in baseline['G02_evidence'].items():assert sha((ROOT/p).read_bytes())==h,'G02 evidence changed: '+p
old=(OUT/'before'/allowed).read_text(encoding='utf-8-sig').replace('\r\n','\n')
current=(ROOT/allowed).read_text(encoding='utf-8-sig').replace('\r\n','\n')
link='          <Link href={`/projects/${project.id}/uboq/templates`}>Build T0 / T1 template</Link>\n'
assert current.replace(link,'')==old,'Workbench change exceeded the single builder link'
sources=[allowed,'src/lib/uboq/templates/t0-t1.ts','src/app/api/uboq/templates/route.ts',
 'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx','src/app/projects/[id]/uboq/templates/page.tsx',
 'scripts/uboq/verify-wp3-increment01.ts','scripts/uboq/verify-wp3-type-bridge.cjs','scripts/uboq/package-wp3-increment01.py','docs/uboq/wp3-increment-01.md']
payload={};manifest=[];patch=''
for p in sources:
    raw=(ROOT/p).read_bytes();text=raw.decode('utf-8-sig').replace('\r\n','\n')
    payload['source/'+p]=raw;manifest.append({'path':p,'sha256':sha(raw),'bytes':len(raw)})
    before=old if p==allowed else ''
    patch+='diff --git a/'+p+' b/'+p+'\n'
    if not before:patch+='new file mode 100644\n'
    patch+=''.join(difflib.unified_diff(before.splitlines(keepends=True),text.splitlines(keepends=True),fromfile='a/'+p if before else '/dev/null',tofile='b/'+p))
payload['wp3-increment01.patch']=patch.encode();(OUT/'wp3-increment01.patch').write_bytes(patch.encode())
with tempfile.TemporaryDirectory(prefix='oserp-wp3-patch-') as td:
    temp=Path(td);p=temp/allowed;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(old,encoding='utf-8')
    pp=temp/'increment.patch';pp.write_bytes(patch.encode());r=subprocess.run(['git','apply','--check','--unsafe-paths',str(pp)],cwd=temp,capture_output=True,text=True);assert r.returncode==0,r.stderr
for p in OUT.rglob('*'):
    if p.is_file() and p.name not in ['review-package.json','archive-delivery.json','completion-report.json','wp3-increment01.patch'] and not p.name.endswith('.tsbuildinfo'):
        payload['evidence/'+p.relative_to(OUT).as_posix()]=p.read_bytes()
review=read(OUT/'independent-technical-review.json')
assert review['archive']['sha256']==baseline['accepted_archive_sha256']
receipt=read(ROOT/'artifacts/uboq/g02-r3/h02-b-implementation/local-database.json')
config=read(Path(receipt['runtime_directory'])/'connection.json');fixture=read(Path(receipt['runtime_directory'])/'fixture-config.json')
secrets=[str(x) for x in [config.get('password'),fixture.get('companyPw'),fixture.get('projectPw'),fixture.get('signing')] if x]
for name,b in payload.items():
    for secret in secrets:assert secret.encode() not in b,'Secret leak: '+name
equivalence=read(OUT/'type-bridge-equivalence.json');assert equivalence['status']=='PASS'
summary={
 'id':'OSERP-PROJ-UBOQ-001-WP3-INCREMENT-01','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'status':'FIRST_LOCAL_INCREMENT_VERIFIED_PENDING_OWNER_REVIEW_NOT_FULL_WP3_ACCEPTANCE',
 'technical_review_recorded':{'review_id':review['review_id'],'verdict':review['verdicts']['targeted_G02_R3_independent_source_and_evidence_review'],'limitation':review['review_limitation'],'accepted_G02_archive_sha256':baseline['accepted_archive_sha256'],'accepted_archive_unchanged':True},
 'implemented':['Read-only T0/T1 builder linked from existing UBOQ workbench.','Approved source/version selection, field selection, rename/reorder, JSON preview and working XLSX/CSV downloads.','Exactly one contract authority or one approved snapshot; distinct phase/section/line IDs, exact decimal values and selected-authorized-only Decimal totals.','Existing DB-backed UBOQ_VIEW/PBAC and signed RLS within repeatable-read read-only transactions. No new data write or schema path.','Strict layout allowlist, no supplied role/canonical facts/formulas/grain overrides; fail closed for draft/superseded/foreign/unbound sources.'],
 'entry_points':{'page':'/projects/[id]/uboq/templates','API':'GET/POST /api/uboq/templates'},
 'tests':{'runtime_pass':14,'runtime_fail':0,'validation':{'root_typescript':'PASS','focused_eslint':'PASS'},'runtime_report':'evidence/runtime-tests.json','browser':'PASS real headless Chromium controls, XLSX download, T0 client PO preview and mobile 390px layout; no page errors; no server-only modules in client bundle.','test_scope_limitation':'Only session DAL stubbed. Actual route handlers, restricted Prisma connection, signed PostgreSQL RLS and canonical reads used. Full Next application-shell/login/browser authentication not exercised.','type_bridge':equivalence,'completed_H01_M01_H02_M02_remediation_repeated':False},
 'preservation':{'migration_count':23,'migrations1_to23_byte_unchanged':True,'migration_hashes':baseline['migrations'],'accepted_G02_evidence_files_byte_unchanged':len(baseline['G02_evidence']),'preexisting_source_files_preserved_except_one_workbench_link':True,'database_public_tables_identical_after_cleanup':runtime['public_table_count'],'database_before_sha256':runtime['database_before_sha256'],'database_after_sha256':runtime['database_after_sha256'],'new_migrations':0,'ERP_postings_or_awarded_BOQ_mutations':0},
 'review_checks':['Accessible labels, fieldsets, table headers and status/error messages; controls disabled while requests run.','Stable source/field/line keys; bounded visible preview; aborted catalog request on unmount.','Type-only server imports erased; browser bundler proves no Prisma/ExcelJS/template-server modules in client bundle.','Only the new page and client UI were added; existing workbench receives one link. React and verification skill checks applied.'],
 'remaining_work':['Full WP3 T0–T12 implementation remains open.','Versioned layout persistence and write authorization, configurable formulas, signed/validated editable round-trip imports, formal compliance/signatory/tax-basis exports and PDF are deferred.','Current bounded source list: up to100 approved sources per template; T1 export requests over1000 rows fail explicitly; pagination is future work.','Working XLSX stores decimal facts as exact text; hidden metadata is provenance, not import authority.'],
 'release_gates':{'migration14':'HISTORICAL_PRODUCTION_LINEAGE_HOLD_UNRESOLVED; original database and ledger unchanged, no reconciliation.','migration23_rollover':'Recorded: 32-bit xmin versus epoch-aware txid_current can fail closed after rollover. Forward-only correction with regression/proof required BEFORE PREVIEW; #23 unchanged.','production':'NO_DEPLOYMENT_OR_MIGRATIONS','overall_G02_release':'NOT_CLOSED','automatic_final_acceptance_or_freeze':False},
 'head':baseline['head'],'source_manifest':manifest,'delta_patch_sha256':sha(patch.encode()),'delta_patch_check':'PASS against preserved pre-increment workbench source',
}
completion=(json.dumps(summary,indent=2)+'\n').encode();payload['completion-report.json']=completion
index={**summary,'payload_manifest':[{'path':p,'sha256':sha(b),'bytes':len(b)} for p,b in sorted(payload.items())],'self_hash':'Index excluded from recursive payload list; delivery receipt hashes index/archive.'}
index_bytes=(json.dumps(index,indent=2)+'\n').encode();payload['review-package.json']=index_bytes
archive=ROOT/'artifacts/uboq/wp3/wp3-increment01-review.zip';temporary=archive.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as z:
    for name,b in sorted(payload.items()):z.writestr(name,b)
with zipfile.ZipFile(temporary) as z:
    assert z.testzip() is None
    for row in index['payload_manifest']:assert sha(z.read(row['path']))==row['sha256']
os.replace(temporary,archive);(OUT/'review-package.json').write_bytes(index_bytes);(OUT/'completion-report.json').write_bytes(completion)
delivery={'status':summary['status'],'archive':str(archive.relative_to(ROOT)).replace('\\','/'),'archive_sha256':sha(archive.read_bytes()),'review_package_sha256':sha(index_bytes),'payloads_verified':len(index['payload_manifest']),'runtime_pass':14,'runtime_fail':0,'typescript':'PASS','lint':'PASS','accepted_G02_archive_unchanged':True,'migrations1_to23_unchanged':True,'release_holds':['migration14_historical_production_lineage','migration23_rollover_before_PREVIEW'],'production_changes':False}
(OUT/'archive-delivery.json').write_text(json.dumps(delivery,indent=2)+'\n');print(json.dumps(delivery,indent=2))
