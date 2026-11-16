from pathlib import Path
import json,hashlib,subprocess,zipfile,os,re,difflib,tempfile,datetime
ROOT=Path.cwd();BASE=ROOT/'artifacts/uboq/g02-r3';OUT=BASE/'targeted-review-closure'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],stderr=subprocess.PIPE,cwd=ROOT)
baseline=read(OUT/'baseline.json');archive=BASE/'independent-review-candidate.zip'
assert sha(archive.read_bytes())==baseline['archive_sha256'],'Existing archive must match validated baseline'
with zipfile.ZipFile(archive) as z:payload={n:z.read(n) for n in z.namelist()}
old_index=payload['review-package.json'];prior=read(OUT/'review-package.before-closure.json');assert json.loads(old_index)==prior
old_payload=dict(payload)
validation=read(OUT/'validation.json');assert validation['status']=='PASS'
runtime=[read(OUT/n) for n in ['post23.json','http-regression.json','m02-rollback.json']]
assert all(x['status']=='PASS' for x in runtime)
preserved=read(OUT/'preservation-final.json');assert preserved['status']=='PASS'
provenance=read(OUT/'migration14-provenance.json')
config=read(Path(read(BASE/'h02-b-implementation/local-database.json')['runtime_directory'])/'connection.json')
fixture=read(Path(read(BASE/'h02-b-implementation/local-database.json')['runtime_directory'])/'fixture-config.json')
secrets=[str(x) for x in [config.get('password'),fixture.get('companyPw'),fixture.get('projectPw'),fixture.get('signing')] if x]
uri=re.compile(r'(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis(?:s)?)://[^\s\x22\x27<>`]+',re.I)
redactions=[]
def sanitize(name,b):
    text=b.decode('utf-8-sig');text,n=uri.subn('[REDACTED_DATABASE_CONNECTION]',text)
    if n:redactions.append({'path':name,'connection_literals':n})
    b=text.encode()
    for secret in secrets:assert secret.encode() not in b,'Private value found in '+name
    return b
def source_file(p):return not p.startswith('artifacts/') and Path(p).suffix in {'.ts','.tsx','.js','.cjs','.mjs','.py','.prisma','.sql','.json'} and not any(x in Path(p).parts for x in ['node_modules','.git'])
tracked=sorted(p for p in git('diff','--name-only','HEAD','-z').decode().split('\0') if p and source_file(p))
untracked=sorted(p for p in git('ls-files','--others','--exclude-standard','-z').decode().split('\0') if p and source_file(p))
patch=git('diff','--binary','HEAD','--',*tracked).decode() if tracked else ''
for p in untracked:
    text=(ROOT/p).read_text(encoding='utf-8-sig').replace('\r\n','\n')
    if not text.endswith('\n'):text+='\n'
    patch+='diff --git a/'+p+' b/'+p+'\nnew file mode 100644\n'+''.join(difflib.unified_diff([],text.splitlines(keepends=True),fromfile='/dev/null',tofile='b/'+p))
payload['evidence/targeted-review-closure/prior-review-package.json']=old_index
payload['evidence/targeted-review-closure/prior-current-source.patch']=payload['current-source.patch']
payload['current-source.patch']=sanitize('current-source.patch',patch.encode())
manifest=[]
for p in sorted(set(tracked+untracked)):
    raw=(ROOT/p).read_bytes();normal=raw.decode('utf-8-sig').replace('\r\n','\n').encode();clean=sanitize('source/'+p,normal)
    payload['source/'+p]=clean
    manifest.append({'path':p,'raw_sha256':sha(raw),'normalized_lf_sha256':sha(normal),'package_sha256':sha(clean),'connection_literal_redacted':normal!=clean})
runtime_files=['apps/aws-backend/src/routes/companyPayroll.ts','apps/aws-backend/src/routes/payroll.ts']
old_engine=old_payload['source/apps/aws-backend/src/routes/payroll.ts'].decode().split('// ------------------------------------------------------------------')[0]
new_engine=(ROOT/runtime_files[1]).read_text(encoding='utf-8-sig').replace('\r\n','\n').split('// ------------------------------------------------------------------')[0]
assert old_engine==new_engine,'Payroll computation/payment code changed'
for p,h in baseline['migrations'].items():assert sha((ROOT/p).read_bytes())==h
new_migration='prisma/migrations/20261113110000_g02_operation_reads_and_worker_projection/migration.sql'
payload[new_migration]=(ROOT/new_migration).read_bytes()
assert sha(payload[new_migration])==preserved['ledger'][-1]['checksum']
delta=''
closure_files=runtime_files+[new_migration]+[p for p in untracked if 'targeted-closure' in p or 'closure-migration14' in p]
for p in sorted(set(closure_files)):
    old=old_payload.get('source/'+p,b'').decode('utf-8-sig');new=payload['source/'+p].decode('utf-8-sig')
    delta+='diff --git a/'+p+' b/'+p+'\n'
    if not old:delta+='new file mode 100644\n'
    delta+=''.join(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='a/'+p if old else '/dev/null',tofile='b/'+p))
payload['targeted-closure-delta.patch']=delta.encode()
for kind,patch_bytes,files in [('cumulative',payload['current-source.patch'],tracked),('closure_delta',delta.encode(),runtime_files)]:
    with tempfile.TemporaryDirectory(prefix='oserp-closure-patch-') as td:
        temp=Path(td)
        for p in files:
            raw=git('show','HEAD:'+p) if kind=='cumulative' else old_payload['source/'+p]
            dest=temp/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
        pp=temp/'candidate.patch';pp.write_bytes(patch_bytes)
        r=subprocess.run(['git','apply','--check','--unsafe-paths',str(pp)],cwd=temp,capture_output=True,text=True)
        assert r.returncode==0,kind+': '+r.stderr
for p in sorted(OUT.iterdir()):
    if p.is_file() and p.suffix in ['.json','.log'] and p.name not in ['archive-delivery.json','completion-report.json','review-package.before-closure.json']:
        key='evidence/targeted-review-closure/'+p.name;payload[key]=sanitize(key,p.read_bytes())
prior_evidence=[n for n in old_payload if n.startswith('evidence/')]
assert all(payload[n]==old_payload[n] for n in prior_evidence),'Prior evidence changed'
hashes={p:sha((ROOT/p).read_bytes()) for p in runtime_files+[new_migration,'scripts/uboq/provision-local-restricted-logins.ts']}
tests=sum(len(x['checks']) for x in runtime)
summary={
 'A. Changes implemented':[
  'One forward-only migration #23 restricts CREATE_PERIOD reads to the exact target inserted in the current transaction. Existing historical targets return no period/Payroll/DTR rows. VIEW and exact-target authorized workflows remain intact.',
  'Duplicate detection uses CREATE-only SECURITY DEFINER boolean metadata helper under the existing employer lock. Company INSERT followed by scoped readback remains one atomic signed transaction.',
  'Worker helper projects five VIEW display fields, four CREATE fields, only engine-used computation fields for COMPUTE/IMPORT, and zero fields for EDIT/DELETE. No new direct Worker SELECT or verifier membership.',
  'Project payroll AuditLog userId and userRole retain authenticated DB actor identity/role; structured remarks store simulatedRole separately.',
  'Existing review-package.json and single archive updated. Prior evidence retained; migrations1-22 and existing ledger rows preserved. No production changes or deployment.'
 ],
 'B. Source and migration hashes':{'head':git('rev-parse','HEAD').decode().strip(),'sha256':hashes,'compute_engine_unchanged':True,'compute_engine_sha256':sha(new_engine.encode()),'source_manifest':manifest,'migration_checksums':preserved['ledger'],'cumulative_patch_sha256':sha(payload['current-source.patch']),'closure_delta_sha256':sha(delta.encode())},
 'C. Affected tests executed':{'runtime_pass':tests,'runtime_fail':0,'runtime_suites':[{'evidence':name,'pass':len(x['checks'])} for name,x in zip(['post23.json','http-regression.json','m02-rollback.json'],runtime)],'reproduction_checks':read(OUT/'reproduce.json')['checks'],'validation':validation,'sql_migration_actual_execution':read(OUT/'apply23.json')['status'],'prior_H01_M01':'Valid completed evidence retained without rerun. H02 rerun limited to changed operation reads, helper projection, company create/duplicate/compute/DTR and project audit dependencies.','attempts':'Preserved harness attempts (Windows path/date normalization, fixture selection/payment expectation, SQL parser module path) and failed INSERT RETURNING regression; final checks pass. No repeated M02 SQL injection after its successful one-shot result.'},
 'D. Negative authorization results':{'pre_fix':'CREATE-only, VIEW explicitly disabled, exposed historical PayrollPeriod/Payroll/DTR. Confirmed and preserved.','post_fix':'All three historical SELECT counts zero, including an existing ID used as CREATE target. VIEW disabled denied at SQL and HTTP. Explicit VIEW positive passed. Cross-employer DTR import and company access to real-project periods denied. Direct Worker SELECT and verifier membership absent.','worker_fields':'VIEW exact five-key whitelist; CREATE exact four-key whitelist; compute exact engine property whitelist; EDIT/DELETE empty.','effective_catalog':'evidence/targeted-review-closure/preservation-final.json'},
 'E. M02 rollback verdict':{'verdict':'PASS_ACTUAL_INJECTED_SQL_FAILURE','evidence':'evidence/targeted-review-closure/m02-rollback.json','details':runtime[2],'scope':'Separate disposable testdb_uboq_closure database on verified isolated localhost:55483 cluster; provisioner safety check unchanged. Three role password/attribute changes, memberships, CONNECT ACL and changed trust anchor rolled back exactly. Test database removed. Protected databases never tested.'},
 'F. Migration #14 provenance disposition':{'verdict':'BYTE_EXACT_HISTORICALLY_APPLIED_SQL_NOT_ESTABLISHED','exact_HEAD':provenance['exact_HEAD'],'current_worktree':provenance['current_worktree'],'reported_historical_ledger_checksum':provenance['reported_historical_ledger_checksum'],'disposition':provenance['disposition'],'evidence':'evidence/targeted-review-closure/migration14-provenance.json'},
 'G. Remaining release blockers':['Historical migration14 applied SQL/ledger provenance remains unresolved; authoritative historical artifact and independent disposition required.','Independent security acceptance of this exact closure candidate remains pending. No production promotion or freeze authorized.'],
 'H. Independent review readiness':{'ready_for_targeted_independent_review':True,'independent_G02_PASS_claimed':False,'automatic_freeze':False,'production_changes':False,'stop_after_bounded_closure':True,'prior_payload_integrity':baseline['archive_integrity'],'prior_evidence_payloads_preserved_byte_exact':len(prior_evidence),'patch_checks':'PASS cumulative against HEAD and delta against prior candidate'}
}
completion=(json.dumps(summary,indent=2)+'\n').encode();payload['evidence/targeted-review-closure/completion-report.json']=completion
report={'id':'OSERP-G02-R3-INDEPENDENT-REVIEW-TARGETED-CLOSURE','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'TARGETED_CLOSURE_VERIFIED_PENDING_INDEPENDENT_REVIEW_AND_MIGRATION14_DISPOSITION',**summary,'archive':'artifacts/uboq/g02-r3/independent-review-candidate.zip','single_archive_only':True,'prior_archive_sha256':baseline['archive_sha256'],'sanitization_redactions':redactions,'package_payload_manifest':[{'path':n,'sha256':sha(b),'bytes':len(b)} for n,b in sorted(payload.items()) if n!='review-package.json'],'index_self_hash':'Index excluded from payload manifest; archive-delivery.json hashes index and archive.'}
index=sanitize('review-package.json',(json.dumps(report,indent=2)+'\n').encode());payload['review-package.json']=index
tmp=archive.with_suffix('.zip.tmp')
with zipfile.ZipFile(tmp,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for n,b in sorted(payload.items()):z.writestr(n,b)
with zipfile.ZipFile(tmp) as z:
    assert z.testzip() is None
    for row in report['package_payload_manifest']:assert sha(z.read(row['path']))==row['sha256']
    for n in z.namelist():
        b=z.read(n)
        for secret in secrets:assert secret.encode() not in b
        assert uri.search(b.decode('utf-8-sig')) is None,n
os.replace(tmp,archive);(BASE/'review-package.json').write_bytes(index);(OUT/'completion-report.json').write_bytes(completion)
delivery={'status':report['status'],'archive':report['archive'],'archive_sha256':sha(archive.read_bytes()),'review_package_sha256':sha(index),'payload_integrity':{'pass':len(report['package_payload_manifest']),'fail':0},'archive_entries':len(payload),'runtime_pass':tests,'validation_pass':len(validation['checks']),'sha256':hashes,'historical_migrations1_to22_preserved':True,'production_changes':False,'independent_PASS_claimed':False}
(OUT/'archive-delivery.json').write_text(json.dumps(delivery,indent=2)+'\n');print(json.dumps(delivery,indent=2))
