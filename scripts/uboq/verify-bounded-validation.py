from pathlib import Path
import subprocess,json,datetime,os
out=Path('artifacts/uboq/g02-r3/bounded-blocker-correction');env=os.environ.copy()
env['DATABASE_URL']='postgresql://validation.invalid/schema';env['DIRECT_URL']=env['DATABASE_URL'];env['PYTHONPATH']='C:/Users/user/AppData/Local/Temp/uboq-g02-r3-pglast'
checks=[]
commands=[('worker-source-fixture',['node','node_modules/tsx/dist/cli.mjs','scripts/uboq/verify-h02-payroll-worker-source.ts']),('backend-typescript',['node','node_modules/typescript/bin/tsc','--noEmit','-p','apps/aws-backend/tsconfig.json']),('prisma-root-schema',['node','node_modules/prisma/build/index.js','validate','--schema','prisma/schema.prisma']),('prisma-backend-schema',['node','node_modules/prisma/build/index.js','validate','--schema','apps/aws-backend/prisma/schema.prisma']),('forward-sql-parser',['python','-c',"from pathlib import Path; from pglast import parse_sql; files=[p for p in Path('prisma/migrations').glob('20261113*/migration.sql')]; assert len(files)==2; print([(str(p),len(parse_sql(p.read_text()))) for p in files])"])]
for name,cmd in commands:
 r=subprocess.run(cmd,env=env,capture_output=True,text=True,encoding='utf8',errors='replace');log=(r.stdout+r.stderr).replace(env['DATABASE_URL'],'[REDACTED_DATABASE_CONNECTION]');(out/(name+'.log')).write_text(log,encoding='utf8');checks.append({'name':name,'result':'PASS' if r.returncode==0 else 'FAIL','exit_code':r.returncode,'command':cmd,'log':name+'.log'});print(checks[-1]['result'],name);print(log[-1200:] if r.returncode else '')
(out/'validation.json').write_text(json.dumps({'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks},indent=2));assert all(c['result']=='PASS' for c in checks)
