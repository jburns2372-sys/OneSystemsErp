from pathlib import Path
import subprocess,hashlib,json,os,zipfile,re
ROOT=Path.cwd();OUT=ROOT/'artifacts/uboq/g02-r3/targeted-review-closure'
REL='prisma/migrations/20261104193000_add_uboq_engine_and_g01_exc_01/migration.sql'
TARGET='2b26be208ef667ceb135b97a664a40f0ba73cea0f45c0f5413698d5ce55daa17'
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,stderr=subprocess.PIPE)
def entry(label,b):return {'source':label,'bytes':len(b),'sha256':sha(b),'matches_reported_old_ledger':sha(b)==TARGET}
head=git('show','HEAD:'+REL);disk=(ROOT/REL).read_bytes()
report={'mode':'READ_ONLY_SOURCE_AND_ARTIFACT_INVESTIGATION','head':git('rev-parse','HEAD').decode().strip(),'exact_HEAD':entry('HEAD:'+REL,head),'current_worktree':entry(REL,disk),'reported_historical_ledger_checksum':TARGET,'artifacts':[],'git_versions':[]}
for commit in git('log','--all','--format=%H','--',REL).decode().split():
    try:b=git('show',commit+':'+REL)
    except subprocess.CalledProcessError:continue
    report['git_versions'].append({**entry(commit+':'+REL,b),'commit':commit,'blob':git('rev-parse',commit+':'+REL).decode().strip()})
report['git_reflog_versions']=[]
seen={x['blob'] for x in report['git_versions']}
for commit in set(git('reflog','--all','--format=%H').decode().split()):
    try:
        blob=git('rev-parse',commit+':'+REL).decode().strip()
        if blob in seen:continue
        seen.add(blob);report['git_reflog_versions'].append({**entry(commit+':'+REL,git('cat-file','blob',blob)),'blob':blob})
    except subprocess.CalledProcessError:pass
search_roots=[ROOT/'artifacts',ROOT/'.next',ROOT/'.vercel',ROOT.parent/'UBOQ_G02_R3_MIGRATION_EVIDENCE',ROOT.parent/'OneSystemsErp/NEW MASTER PROJECT MODULE AND TEMPLATE BLUEPRINT']
report['search_roots']=[{'path':str(p),'exists':p.exists()} for p in search_roots]
report['historical_ledger_artifacts']=[]
for root in search_roots:
    for parent,dirs,files in os.walk(root):
        dirs[:]=[d for d in dirs if d not in ['node_modules','.git','targeted-review-closure']]
        for name in files:
            p=Path(parent)/name
            if name=='migration.sql' and p.parent.name==Path(REL).parent.name or name=='REVIEWED_HEAD_migration.sql':
                report['artifacts'].append(entry(str(p),p.read_bytes()))
            elif p.suffix=='.zip' and p.name=='independent-review-candidate.zip':
                with zipfile.ZipFile(p) as z:
                    for key in z.namelist():
                        if key.endswith(REL):report['artifacts'].append(entry(str(p)+'!'+key,z.read(key)))
            elif p.suffix in ['.json','.md','.log','.sql'] and p.stat().st_size<3000000:
                b=p.read_bytes()
                if TARGET.encode() in b:
                    # Preserve only custody and ledger metadata, never arbitrary SQL/credentials.
                    report['historical_ledger_artifacts'].append({'path':str(p),'sha256':sha(b),'contains_reported_checksum':True})
report['line_ending_comparison']={'HEAD_as_CRLF_sha256':sha(head.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n')),'worktree_as_LF_sha256':sha(disk.replace(b'\r\n',b'\n')),'HEAD_and_worktree_normalized_equal':head.replace(b'\r\n',b'\n')==disk.replace(b'\r\n',b'\n')}
matches=[x for key in ['git_versions','git_reflog_versions','artifacts'] for x in report[key] if x['matches_reported_old_ledger']]
report['historically_applied_bytes_established']=False
report['matching_artifacts']=matches
report['disposition']='UNRESOLVED_RELEASE_BLOCKER: No available exact SQL artifact matches preserved historical checksum. HEAD/worktree/reviewed references are compared explicitly; historical ledger report is secondary evidence, not an independently captured original ledger export. Historical checksum was previously reported as rewritten from 8f860386...; even a matching SQL artifact alone would require execution/custody evidence. No live forensic database connection, reset, migration edit, ledger rewrite or reconciliation performed.'
report['available_build_deployment_artifacts']='Local .next/.vercel and preserved review/build reports inspected. No original migration SQL execution artifact or original ledger export establishing byte-exact applied SQL found. No network/production deployment access performed.'
(OUT/'migration14-provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['exact_HEAD','current_worktree','line_ending_comparison','historically_applied_bytes_established','disposition']},indent=2))
