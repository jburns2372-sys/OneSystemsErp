from pathlib import Path
import json,zipfile,hashlib,re
base=Path('artifacts/uboq/g02-r3');out=base/'bounded-blocker-correction'
def sha(b):return hashlib.sha256(b).hexdigest()
with zipfile.ZipFile(base/'independent-review-candidate.zip') as z:
 old=z.read('source/apps/aws-backend/src/routes/payroll.ts').decode('utf-8-sig').replace('\r\n','\n')
 new=Path('apps/aws-backend/src/routes/payroll.ts').read_text(encoding='utf-8-sig').replace('\r\n','\n')
 marker='export async function computePayrollForPeriod';end="router.post('/engine/compute'"
 oldcompute=old[old.index(marker):old.index(end)];newcompute=new[new.index(marker):new.index(end)]
 assert oldcompute==newcompute
 files=['apps/aws-backend/src/lib/employerPayrollAuthorization.ts','apps/aws-backend/src/routes/companyPayroll.ts','scripts/uboq/provision-local-restricted-logins.ts','scripts/uboq/verify-h02b-scram-runtime.ts']
 binding=[]
 for p in files:
  before=z.read('source/'+p).decode('utf-8-sig').replace('\r\n','\n');after=Path(p).read_text(encoding='utf-8-sig').replace('\r\n','\n');assert before==after;binding.append({'path':p,'normalized_sha256':sha(after.encode()),'unchanged_from_prior_candidate':True})
 (out/'review-package.before-correction.json').write_bytes((base/'review-package.json').read_bytes())
 (out/'reused-evidence-binding.json').write_text(json.dumps({'status':'PASS','original_43_runtime_checks':'Retained. Company router, signed company authorization, compute engine, migrations18-20 and their security functions remain unchanged except ownership guard new-project INSERT branch. New company create/view/edit/delete and protected-state regressions cover shared guard; prior company DTR/compute evidence applies to identical code. No entire43-check rerun.','original_12_offline_checks':'Retained within matching source scope. The project Worker source fixture is superseded by updated passing fixture; affected TypeScript and schema/SQL validation recorded separately.','H01':'12/12 actual runtime PASS retained; no H01 function/dependency changed.','M02':'Actual SCRAM login/wrong-password/revocation evidence retained, unchanged generator and verifier plus migration20 hash confirmed. Full multi-role provisioner rollback remains untested evidence limit.','unchanged_sources':binding,'unchanged_compute_engine_sha256':sha(newcompute.encode()),'preserved_archive_sha256':sha((base/'independent-review-candidate.zip').read_bytes())},indent=2))
 print('PASS precise unchanged company/compute/SCRAM bindings; original index preserved')
