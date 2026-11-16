import concurrent.futures,subprocess,os,json,pathlib,hashlib,datetime
root=pathlib.Path.cwd(); out=root/'artifacts/uboq/g02-r3/h02-b-implementation'; env=dict(os.environ,DATABASE_URL='postgresql://offline:offline@127.0.0.1:1/offline',DIRECT_URL='postgresql://offline:offline@127.0.0.1:1/offline',PYTHONPATH='C:/Users/user/AppData/Local/Temp/uboq-g02-r3-pglast')
checks=[]
for name in ['verify-h02-controlled-source','verify-h02-targets-source','verify-h02-payroll-worker-source','verify-payroll-delete-source','verify-review-source','verify-scram-source']:
 checks.append((name,['node','node_modules/tsx/dist/cli.mjs','scripts/uboq/'+name+'.ts']))
checks += [('backend-typescript',['node','node_modules/typescript/bin/tsc','--noEmit','--incremental','false','-p','apps/aws-backend/tsconfig.json']),('frontend-typescript',['node','node_modules/typescript/bin/tsc','--noEmit','--incremental','false']),('root-prisma',['node','node_modules/prisma/build/index.js','validate','--schema','prisma/schema.prisma']),('backend-prisma',['node','node_modules/prisma/build/index.js','validate','--schema','apps/aws-backend/prisma/schema.prisma']),('migration17-sql',['python','scripts/uboq/verify-migration17-static.py']),('diff-check',['git','diff','--check'])]
def run(pair):
 name,cmd=pair
 try:
  result=subprocess.run(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=300)
  (out/(name+'.log')).write_bytes(result.stdout)
  return {'name':name,'command':cmd,'exit_code':result.returncode,'result':'PASS' if result.returncode==0 else 'FAIL','log':name+'.log'}
 except Exception as ex:return {'name':name,'result':'ERROR','error':str(ex)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(run,checks))
historical=json.loads((root/'artifacts/uboq/g02-r3/historical-migration-hashes.json').read_text())
preservation=[]
for row in historical:
 p=root/'prisma/migrations'/row['name']/'migration.sql'; actual=hashlib.sha256(p.read_bytes()).hexdigest();preservation.append({'name':row['name'],'sha256':actual,'matches_previous_evidence':actual==row['diskSha256']})
report={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':results,'historical_migrations':preservation,'database_activity':'NONE; schema validation uses offline dummy URL'}
(out/'offline-verification.json').write_text(json.dumps(report,indent=2)+'\n')
for r in results:print(r['name']+': '+r['result'])
print('Historical migrations preserved: '+str(all(x['matches_previous_evidence'] for x in preservation)))
