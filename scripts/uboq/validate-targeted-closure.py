from pathlib import Path
import subprocess,json,concurrent.futures,datetime
OUT=Path('artifacts/uboq/g02-r3/targeted-review-closure')
commands=[('backend-typescript',['node','node_modules/typescript/bin/tsc','--noEmit','-p','apps/aws-backend/tsconfig.json']),('root-typescript',['node','node_modules/typescript/bin/tsc','--noEmit','--incremental','false']),('prisma-root',['node','node_modules/prisma/build/index.js','validate','--schema','prisma/schema.prisma']),('prisma-backend',['node','node_modules/prisma/build/index.js','validate','--schema','apps/aws-backend/prisma/schema.prisma']),('affected-project-source',['node','node_modules/tsx/dist/cli.mjs','scripts/uboq/verify-h02-payroll-worker-source.ts']),('sql-parser',['python','-c',"import sys;sys.path.insert(0,'C:/Users/user/AppData/Local/Temp/uboq-g02-r3-pglast');from pathlib import Path;from pglast import parse_sql;p=Path('prisma/migrations/20261113110000_g02_operation_reads_and_worker_projection/migration.sql'); print('PASS statements:',len(parse_sql(p.read_text())))"])]
def run(item):
    name,cmd=item;r=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8',errors='replace');(OUT/(name+'.log')).write_text(r.stdout+r.stderr,encoding='utf-8');return {'name':name,'command':cmd,'exit_code':r.returncode,'result':'PASS' if r.returncode==0 else 'FAIL','log':name+'.log'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(run,commands))
report={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'status':'PASS' if all(x['result']=='PASS' for x in checks) else 'FAIL'}
(OUT/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
raise SystemExit(0 if report['status']=='PASS' else 1)
