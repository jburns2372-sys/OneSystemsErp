
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import pg from 'pg';
const require=createRequire(import.meta.url);
const evidencePath='artifacts/uboq/g02-r3/h02-b-implementation/local-database.json';
const receipt=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
const config=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'connection.json'),'utf8'));
if(config.host!=='127.0.0.1'||config.port!==55483||config.database!==receipt.target_database||!/^oserp_h02b_local_[0-9a-f]+$/.test(config.database))throw Error('ISOLATED_DATABASE_REQUIRED');
const checks:any[]=[];
const currentReport='artifacts/uboq/g02-r3/h02-b-implementation/runtime-tests.json';
if(fs.existsSync(currentReport))fs.copyFileSync(currentReport,currentReport.replace('.json','-'+Date.now()+'.json'));
function scram(password:string){const salt=crypto.randomBytes(16),salted=crypto.pbkdf2Sync(password,salt,4096,32,'sha256');
 const client=crypto.createHmac('sha256',salted).update('Client Key').digest(),stored=crypto.createHash('sha256').update(client).digest(),
 server=crypto.createHmac('sha256',salted).update('Server Key').digest();
 return 'SCRAM-SHA-256$4096:'+salt.toString('base64')+'$'+stored.toString('base64')+':'+server.toString('base64');}
const admin=new pg.Client(config);
let server:any;
async function check(name:string,fn:()=>Promise<unknown>){await fn();checks.push({name,result:'PASS'});console.log('PASS '+name);}
(async()=>{
 await admin.connect();
 const actual=(await admin.query('SELECT current_database() db,host(inet_server_addr()) host,inet_server_port() port')).rows[0];
 assert.equal(actual.db,receipt.target_database);assert.equal(actual.host,'127.0.0.1');assert.equal(actual.port,55483);
 const sql=fs.readFileSync('prisma/migrations/20261112120000_h02b_verified_employer_payroll/migration.sql','utf8');
 const suffix=crypto.randomBytes(4).toString('hex'),prefix='SYNTH-H02B-'+suffix;
 const ids={a:prefix+'-admin',b:prefix+'-other-admin',low:prefix+'-low',e1:prefix+'-E1',e2:prefix+'-E2',
 p1:prefix+'-P1',p2:prefix+'-P2',p3:prefix+'-P3',w1:prefix+'-W1',w2:prefix+'-W2',w3:prefix+'-W3',unassigned:prefix+'-WU',unknown:prefix+'-unknown'};
 const companyLogin='h02b_company_'+suffix,projectLogin='h02b_project_'+suffix,companyPw=crypto.randomBytes(24).toString('hex'),projectPw=crypto.randomBytes(24).toString('hex');
 for(const [login,password,group]of [[companyLogin,companyPw,'oserp_company_payroll_app'],[projectLogin,projectPw,'oserp_compat_app']]){
  await admin.query('CREATE ROLE "'+login+'" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '+ "'"+scram(password)+"'");
  await admin.query('GRANT '+group+' TO "'+login+'"');
  await admin.query('GRANT CONNECT ON DATABASE "'+config.database+'" TO "'+login+'"');
 }
 const signing=crypto.randomBytes(32).toString('hex');
 await admin.query('INSERT INTO _company_payroll_trust_anchor(id,secret_hex) VALUES(true,$1) ON CONFLICT(id) DO UPDATE SET secret_hex=excluded.secret_hex',[signing]);
 await admin.query('INSERT INTO _uboq_rls_trust_anchor("anchorId","secretHex") VALUES(\'PRIMARY\',$1) ON CONFLICT("anchorId") DO UPDATE SET "secretHex"=excluded."secretHex"',[signing]);
 for(const [id,role]of [[ids.a,'SUPER_ADMIN'],[ids.b,'SUPER_ADMIN'],[ids.low,'ADMIN']])
  await admin.query('INSERT INTO "User"(id,name,role,status,"sessionVersion","updatedAt") VALUES($1,$1,$2,\'ACTIVE\',7,now())',[id,role]);
 for(const e of [ids.e1,ids.e2])await admin.query('INSERT INTO "Employer"(id,"legalName","verificationEvidenceRef","verificationState","verifiedAt","updatedAt") VALUES($1,$1,\'ISOLATED-SYNTHETIC-FIXTURE-NOT-PRODUCTION\',\'VERIFIED\',now(),now())',[e]);
 for(const [p,e]of [[ids.p1,ids.e1],[ids.p2,ids.e1],[ids.p3,ids.e2]])
  await admin.query('INSERT INTO "Project"(id,name,"employerId","employerOwnershipEvidenceRef","employerOwnershipVerifiedAt","updatedAt") VALUES($1,$1,$2,\'ISOLATED-FIXTURE\',now(),now())',[p,e]);
 for(const [w,e,p]of [[ids.w1,ids.e1,ids.p1],[ids.w2,ids.e1,ids.p2],[ids.w3,ids.e2,ids.p3],[ids.unassigned,ids.e1,null]])
  await admin.query('INSERT INTO "Worker"(id,"firstName","lastName","employerId","employerOwnershipEvidenceRef","employerOwnershipVerifiedAt","projectId","payrollCategory","dailyRate","updatedAt") VALUES($1,$1,\'Synthetic\',$2,\'ISOLATED-FIXTURE\',now(),$3,\'Monthly\',100,now())',[w,e,p]);
 const ops=['VIEW','CREATE_PERIOD','EDIT_DRAFT','COMPUTE_DRAFT','IMPORT_DTR','DELETE_DRAFT'];
 for(const [u,e]of [[ids.a,ids.e1],[ids.b,ids.e2],[ids.low,ids.e1]])for(const op of ops)
  await admin.query('INSERT INTO "EmployerPayrollAuthority"("employerId","userId",operation,enabled,"verificationEvidenceRef","verifiedAt","updatedAt") VALUES($1,$2,$3,true,\'ISOLATED-FIXTURE\',now(),now())',[e,u,op]);
 const url=(login:string,pw:string)=>'postgresql://'+login+':'+pw+'@127.0.0.1:55483/'+config.database;
 process.env.DATABASE_URL=url(projectLogin,projectPw);process.env.DIRECT_URL=process.env.DATABASE_URL;
 process.env.COMPANY_PAYROLL_DATABASE_URL=url(companyLogin,companyPw);process.env.COMPANY_PAYROLL_CONTEXT_SECRET=signing;
 process.env.AUTH_SECRET=crypto.randomBytes(32).toString('hex');process.env.UBOQ_RLS_CONTEXT_SECRET=signing;
 const express=require('express'),{requireAuth}=require('../../apps/aws-backend/src/middleware/auth'),router=require('../../apps/aws-backend/src/routes/payroll').default;
 const app=express();app.use(express.json());app.use('/api',requireAuth);app.use('/api/payroll',router);
 server=await new Promise<any>(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base='http://127.0.0.1:'+server.address().port;
 function token(user=ids.a,sv=7,sim:string|null=null,secret=process.env.AUTH_SECRET!){
  const now=Math.floor(Date.now()/1000),encoded=Buffer.from(JSON.stringify({uid:user,role:'SUPER_ADMIN',sv,pid:null,sim,iat:now,exp:now+60})).toString('base64url');
  return 'v1.'+encoded+'.'+crypto.createHmac('sha256',secret).update('v1.'+encoded).digest('hex');
 }
 async function call(operation:string,data:any={},periodId?:string,employerId=ids.e1,user=ids.a,sv=7,sim:string|null=null,secret?:string){
  const r=await fetch(base+'/api/payroll/company/command',{method:'POST',headers:{'Content-Type':'application/json','x-internal-auth':token(user,sv,sim,secret)},body:JSON.stringify({operation,employerId,periodId,data})});
  return {status:r.status,body:await r.json() as any};
 }
 const periodData={month:11,year:2026,calendarRule:'MONTHLY',periodType:'FULL_MONTH',startDate:'2026-11-01',endDate:'2026-11-30',payrollDate:'2026-11-30'};
 let periodId='';
 await check('HTTP authenticated company create includes workers across two projects and unassigned',async()=>{
  const r=await call('CREATE_PERIOD',periodData);assert.equal(r.status,200,JSON.stringify(r.body));periodId=r.body.period.id;
  assert.equal(r.body.period.projectId,null);assert.equal(r.body.period.employerId,ids.e1);
  const rows=(await admin.query('SELECT "workerId" FROM "Payroll" WHERE "payrollPeriodId"=$1 ORDER BY "workerId"',[periodId])).rows.map(x=>x.workerId);
  assert.deepEqual(rows.sort(),[ids.w1,ids.w2,ids.unassigned].sort());
 });
 await check('explicit VIEW permits only employer workers and company periods',async()=>{const r=await call('VIEW');assert.equal(r.status,200,JSON.stringify(r.body));assert.ok(!r.body.workers.some((w:any)=>w.id===ids.w3));assert.ok(r.body.periods.every((p:any)=>p.employerId===ids.e1));});
 await check('real SUPER_ADMIN without other-employer membership denied',async()=>{assert.equal((await call('VIEW',{},undefined,ids.e2)).status,403);});
 await check('lower real actor cannot elevate using signed SUPER_ADMIN simulation',async()=>{assert.equal((await call('VIEW',{},undefined,ids.e1,ids.low,7,'SUPER_ADMIN')).status,403);});
 await check('invalid internal session signature denied',async()=>{assert.equal((await call('VIEW',{},undefined,ids.e1,ids.a,7,null,'wrong-signing-key')).status,401);});
 await check('stale session version denied',async()=>{assert.equal((await call('VIEW',{},undefined,ids.e1,ids.a,6)).status,401);});
 await check('explicit operation grant revocation blocks next request',async()=>{await admin.query('UPDATE "EmployerPayrollAuthority" SET enabled=false,"revokedAt"=now() WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);assert.equal((await call('VIEW')).status,403);await admin.query('UPDATE "EmployerPayrollAuthority" SET enabled=true,"revokedAt"=NULL WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);});
 await check('cross-employer Worker import rejected atomically',async()=>{const before=(await admin.query('SELECT count(*) FROM "DailyTimeRecord" WHERE "payrollPeriodId"=$1',[periodId])).rows[0].count;
  assert.equal((await call('IMPORT_DTR',{entries:[{workerId:ids.w1,date:'2026-11-03',regularHours:8,overtimeHours:0},{workerId:ids.w3,date:'2026-11-03',regularHours:8,overtimeHours:0}]},periodId)).status,403);
  assert.equal((await admin.query('SELECT count(*) FROM "DailyTimeRecord" WHERE "payrollPeriodId"=$1',[periodId])).rows[0].count,before);});
 await check('valid own-employer attendance import and existing compute engine commit atomically',async()=>{const r=await call('IMPORT_DTR',{entries:[{workerId:ids.w1,date:'2026-11-03',regularHours:8,overtimeHours:0},{workerId:ids.w2,date:'2026-11-03',regularHours:8,overtimeHours:0}]},periodId);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.count,2);});
 await check('valid own-employer draft notes edit preserves ownership',async()=>{const r=await call('EDIT_DRAFT',{notes:'Verified employer draft'},periodId);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.period.employerId,ids.e1);});
 await check('cross-employer payroll period target denied',async()=>{assert.equal((await call('VIEW',{},periodId,ids.e2,ids.b)).status,403);});
 await check('immutable employer/project ownership cannot be reparented by draft edit',async()=>{assert.equal((await call('EDIT_DRAFT',{employerId:ids.e2},periodId)).status,403);});
 await check('approved period rejects draft computation and deletion',async()=>{
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "PayrollPeriod" SET status=\'APPROVED\',"approvedById"=$2,"dateApproved"=now() WHERE id=$1',[periodId,ids.a]);await admin.query('COMMIT');
  assert.equal((await call('COMPUTE_DRAFT',{},periodId)).status,403);assert.equal((await call('DELETE_DRAFT',{},periodId)).status,403);
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "PayrollPeriod" SET status=\'DRAFT\',"approvedById"=NULL,"dateApproved"=NULL WHERE id=$1',[periodId]);await admin.query('COMMIT');
 });
 await check('locked period rejects draft edit',async()=>{
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "PayrollPeriod" SET "isLocked"=true WHERE id=$1',[periodId]);await admin.query('COMMIT');
  assert.equal((await call('EDIT_DRAFT',{notes:'forbidden'},periodId)).status,403);
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "PayrollPeriod" SET "isLocked"=false WHERE id=$1',[periodId]);await admin.query('COMMIT');
 });
 await check('paid payroll rejects recompute and delete',async()=>{
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "Payroll" SET "paymentStatus"=\'PAID\' WHERE "payrollPeriodId"=$1',[periodId]);await admin.query('COMMIT');
  assert.equal((await call('COMPUTE_DRAFT',{},periodId)).status,403);assert.equal((await call('DELETE_DRAFT',{},periodId)).status,403);
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");await admin.query('UPDATE "Payroll" SET "paymentStatus"=\'PENDING\' WHERE "payrollPeriodId"=$1',[periodId]);await admin.query('COMMIT');
 });
 await check('actual company login cannot read Worker or enroll employer grants directly',async()=>{
  const c=new pg.Client({...config,user:companyLogin,password:companyPw});await c.connect();try{
   await assert.rejects(()=>c.query('SELECT * FROM "Worker"'),/permission denied/);
   await assert.rejects(()=>c.query('UPDATE "EmployerPayrollAuthority" SET enabled=true'),/permission denied/);
   assert.equal((await c.query('SELECT * FROM "PayrollPeriod"')).rowCount,0);
  }finally{await c.end();}
 });
 await check('parallel duplicate company create commits at most one run',async()=>{
  const results=await Promise.all([call('CREATE_PERIOD',{...periodData,periodType:'CONCURRENT'}),call('CREATE_PERIOD',{...periodData,periodType:'CONCURRENT'})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);
 });
 await check('audit survives successful operations and authority revocation',async()=>{
  assert.ok((await admin.query('SELECT 1 FROM "PayrollAuditLog" WHERE "userId"=$1 AND "actionType" LIKE \'COMPANY_%\'',[ids.a])).rowCount!>0);
  assert.ok((await admin.query('SELECT 1 FROM "PayrollAuditLog" WHERE "userId"=$1 AND "actionType"=\'EMPLOYER_AUTHORITY_UPDATE\'',[ids.a])).rowCount!>0);
 });
 await check('runtime and verifier roles cannot bypass FORCE RLS',async()=>{
  const rows=(await admin.query("SELECT rolname,rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname=ANY($1::text[])",[['oserp_company_payroll_app','oserp_company_payroll_verifier',companyLogin]])).rows;
  assert.ok(rows.every(x=>!x.rolsuper&&!x.rolbypassrls));
  const tables=(await admin.query("SELECT relname,relforcerowsecurity FROM pg_class WHERE relname=ANY($1::text[])",[['Employer','EmployerPayrollAuthority','PayrollPeriod','Payroll','DailyTimeRecord']])).rows;
  assert.ok(tables.every(x=>x.relforcerowsecurity));
 });
 await check('unlocked unpaid draft deletion remains atomic',async()=>{const r=await call('DELETE_DRAFT',{},periodId);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal((await admin.query('SELECT 1 FROM "PayrollPeriod" WHERE id=$1',[periodId])).rowCount,0);});
 fs.writeFileSync(path.join(receipt.runtime_directory,'fixture-config.json'),JSON.stringify({ids,companyLogin,companyPw,projectLogin,projectPw,signing}),{mode:0o600});
 const report={status:'PASS_AFFECTED_RUNTIME_TESTS',database:actual,fixture_identity_prefix:prefix,synthetic_only:true,checks,
  source18_sha256:crypto.createHash('sha256').update(sql).digest('hex'),limits:'Actual signed HTTP and restricted SQL against the final clean 20-migration chain. No function refresh, real employer enrollment or protected database/worktree access.'};
 fs.writeFileSync('artifacts/uboq/g02-r3/h02-b-implementation/runtime-tests.json',JSON.stringify(report,null,2)+'\n');
 console.log('PASS '+checks.length+' real HTTP/database checks on isolated synthetic fixtures');
})().catch(e=>{
 fs.writeFileSync('artifacts/uboq/g02-r3/h02-b-implementation/runtime-tests.json',JSON.stringify({status:'FAILED',checks,error:e.message,stack:e.stack,database:receipt.target_database},null,2)+'\n');
 console.error(e.message);process.exitCode=1;
}).finally(async()=>{if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));await admin.end();setTimeout(()=>process.exit(process.exitCode||0),100).unref();});
