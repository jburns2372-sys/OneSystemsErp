
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import pg from 'pg';
const receipt=JSON.parse(fs.readFileSync('artifacts/uboq/g02-r3/h02-b-implementation/local-database.json','utf8'));
const config=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'connection.json'),'utf8'));
if(config.host!=='127.0.0.1'||config.port!==55483||config.database!==receipt.target_database)throw Error('ISOLATED_DATABASE_REQUIRED');
const f=JSON.parse(fs.readFileSync(path.join(receipt.runtime_directory,'fixture-config.json'),'utf8')),ids=f.ids;
const admin=new pg.Client(config),company={...config,user:f.companyLogin,password:f.companyPw},checks:any[]=[];
const current='artifacts/uboq/g02-r3/h02-b-implementation/security-tests.json';
if(fs.existsSync(current))fs.copyFileSync(current,current.replace('.json','-'+Date.now()+'.json'));
async function check(name:string,fn:()=>Promise<unknown>){await fn();checks.push({name,result:'PASS'});console.log('PASS '+name);}
function signed(operation='VIEW',target='*',overrides:any={}){
 const x:any={employer:ids.e1,user:ids.a,sv:'7',operation,target,hash:crypto.createHash('sha256').update('isolated-security-test').digest('hex'),
  issued:String(Math.floor(Date.now()/1000)),nonce:crypto.randomBytes(16).toString('hex'),sim:'',...overrides};
 x.signature=crypto.createHmac('sha256',Buffer.from(f.signing,'hex')).update(['OSERP_COMPANY_PAYROLL_V1',x.employer,x.user,x.sv,x.operation,x.target,x.hash,x.issued,x.nonce,x.sim].join('|')).digest('hex');
 return x;
}
async function context(c:any,x:any){await c.query('BEGIN');await c.query(`SELECT set_config('app.company_employer_id',$1,true),set_config('app.company_user_id',$2,true),
 set_config('app.company_session_version',$3,true),set_config('app.company_operation',$4,true),set_config('app.company_target_id',$5,true),
 set_config('app.company_payload_hash',$6,true),set_config('app.company_issued',$7,true),set_config('app.company_nonce',$8,true),
 set_config('app.company_simulated_role',$9,true),set_config('app.company_signature',$10,true)`,
 [x.employer,x.user,x.sv,x.operation,x.target,x.hash,x.issued,x.nonce,x.sim,x.signature]);}
async function denied(x:any,query='SELECT public.company_payroll_begin()'){
 const c=new pg.Client(company);await c.connect();try{await context(c,x);await assert.rejects(()=>c.query(query));}finally{await c.query('ROLLBACK');await c.end();}}
(async()=>{await admin.connect();
 const identity=(await admin.query('SELECT current_database() db,host(inet_server_addr()) host,inet_server_port() port')).rows[0];
 assert.equal(identity.db,receipt.target_database);assert.equal(identity.host,'127.0.0.1');assert.equal(identity.port,55483);
 const period=(await admin.query('SELECT id FROM "PayrollPeriod" WHERE "employerId"=$1 AND status=\'DRAFT\' AND "projectId" IS NULL LIMIT 1',[ids.e1])).rows[0].id;
 await check('direct SQL rejects forged signature even with correct real user and employer',async()=>{await denied({...signed(),signature:'0'.repeat(64)});});
 await check('direct SQL rejects stale signed session version',async()=>{await denied(signed('VIEW','*',{sv:'6'}));});
 await check('direct SQL rejects expired correctly signed command',async()=>{await denied(signed('VIEW','*',{issued:String(Math.floor(Date.now()/1000)-120)}));});
 await check('direct SQL rejects future correctly signed command',async()=>{await denied(signed('VIEW','*',{issued:String(Math.floor(Date.now()/1000)+120)}));});
 await check('direct SQL rejects target tampering',async()=>{const x=signed('VIEW',period);x.target=ids.w3;await denied(x);});
 await check('direct SQL rejects operation tampering',async()=>{const x=signed('VIEW',period);x.operation='DELETE_DRAFT';await denied(x);});
 await check('direct SQL rejects payload digest tampering',async()=>{const x=signed();x.hash='0'.repeat(64);await denied(x);});
 await check('real SUPER_ADMIN has no implicit other-employer SQL authority',async()=>{await denied(signed('VIEW','*',{employer:ids.e2}));});
 await check('revoked employer verification denies a previously signed command',async()=>{
  const x=signed();await admin.query('UPDATE "Employer" SET "verificationState"=\'REVOKED\' WHERE id=$1',[ids.e1]);
  await denied(x);await admin.query('UPDATE "Employer" SET "verificationState"=\'VERIFIED\' WHERE id=$1',[ids.e1]);
 });
 await check('account session revocation denies previously signed command at DB boundary',async()=>{
  const x=signed();await admin.query('UPDATE "User" SET "sessionVersion"=8 WHERE id=$1',[ids.a]);await denied(x);
  await admin.query('UPDATE "User" SET "sessionVersion"=7 WHERE id=$1',[ids.a]);
 });
 await check('operation grant revocation is checked in DB, not only HTTP',async()=>{
  const x=signed();await admin.query('UPDATE "EmployerPayrollAuthority" SET enabled=false,"revokedAt"=now() WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);
  await denied(x);await admin.query('UPDATE "EmployerPayrollAuthority" SET enabled=true,"revokedAt"=NULL WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);
 });
 await check('committed signed nonce cannot be replayed',async()=>{
  const x=signed(),c=new pg.Client(company);await c.connect();
  try{await context(c,x);await c.query('SELECT public.company_payroll_begin()');assert.ok((await c.query('SELECT * FROM "PayrollPeriod"')).rowCount!>0);
   await c.query('SELECT public.company_payroll_finish()');assert.equal((await c.query('SELECT * FROM "PayrollPeriod"')).rowCount,0);await c.query('COMMIT');
  }finally{await c.end();}await denied(x);
 });
 await check('cross-employer Worker and explicit Project DTR inserts denied',async()=>{
  for(const [worker,project]of [[ids.w3,null],[ids.w1,ids.p3]]){
   const c=new pg.Client(company);await c.connect();try{await context(c,signed('IMPORT_DTR',period));await c.query('SELECT public.company_payroll_begin()');
    await assert.rejects(()=>c.query('INSERT INTO "DailyTimeRecord"(id,"workerId",date,"projectId","payrollPeriodId","regularHours","updatedAt") VALUES($1,$2,\'2026-11-08\',$3,$4,8,now())',[crypto.randomUUID(),worker,project,period]));
   }finally{await c.query('ROLLBACK');await c.end();}
  }
 });
 await check('unverified historical company-period owner remains denied',async()=>{
  const unknown=ids.unknown;await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");
  await admin.query('INSERT INTO "PayrollPeriod"(id,"payrollBatchNumber",month,year,"periodType","startDate","endDate","payrollDate","updatedAt") VALUES($1,$1,11,2026,\'UNKNOWN_HISTORY\',\'2026-11-01\',\'2026-11-30\',\'2026-11-30\',now())',[unknown]);await admin.query('COMMIT');await denied(signed('VIEW',unknown));
  assert.equal((await admin.query('SELECT "employerId" FROM "PayrollPeriod" WHERE id=$1',[unknown])).rows[0].employerId,null);
 });
 let projectPeriod='';
 await check('existing signed real-project period and NULL-child inheritance work with employer-owned Worker',async()=>{
  const c=new pg.Client({...config,user:f.projectLogin,password:f.projectPw});await c.connect();
  try{await c.query('BEGIN');const issued=String(Math.floor(Date.now()/1000)),nonce=crypto.randomBytes(12).toString('hex');
   const mac=crypto.createHash('sha256').update(f.signing+'|UBOQ_RLS_V1|'+ids.p1+'|'+ids.a+'|7|'+issued+'|'+nonce).digest('hex');
   await c.query("SELECT set_config('app.enforce_project_rls','on',true),set_config('app.current_project_id',$1,true),set_config('app.current_user_id',$2,true),set_config('app.current_session_version','7',true),set_config('app.current_rls_proof',$3,true)",[ids.p1,ids.a,issued+'.'+nonce+'.'+mac]);
   projectPeriod=crypto.randomUUID();
   await c.query('INSERT INTO "PayrollPeriod"(id,"payrollBatchNumber",month,year,"periodType","startDate","endDate","payrollDate","projectId","createdById","updatedAt") VALUES($1,$1,11,2026,\'PROJECT\',\'2026-11-01\',\'2026-11-30\',\'2026-11-30\',$2,$3,now())',[projectPeriod,ids.p1,ids.a]);
   await c.query('INSERT INTO "DailyTimeRecord"(id,"workerId",date,"payrollPeriodId","regularHours","updatedAt") VALUES($1,$2,\'2026-11-07\',$3,8,now())',[crypto.randomUUID(),ids.w1,projectPeriod]);
   assert.equal((await c.query('SELECT "projectId" FROM "DailyTimeRecord" WHERE "payrollPeriodId"=$1',[projectPeriod])).rows[0].projectId,null);
   await c.query('COMMIT');
  }finally{await c.end();}
 });
 await check('verified project period validates same-employer unassigned Worker and denies unassigned peer-employer Worker',async()=>{
  const owned=crypto.randomUUID(),peer=crypto.randomUUID();
  await admin.query(`INSERT INTO "Worker"(id,"firstName","lastName","employerId","employerOwnershipEvidenceRef","employerOwnershipVerifiedAt","updatedAt") VALUES($1,$1,$1,$2,'ISOLATED-FIXTURE',now(),now())`,[peer,ids.e2]);
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");
  await admin.query(`INSERT INTO "PayrollPeriod" SELECT (jsonb_populate_record(NULL::public."PayrollPeriod",to_jsonb(p)||jsonb_build_object('id',$1::text,'payrollBatchNumber',$1::text,'projectId',$3::text))).* FROM "PayrollPeriod" p WHERE id=$2`,[owned,period,ids.p1]);
  await admin.query('COMMIT');
  const c=new pg.Client({...config,user:f.projectLogin,password:f.projectPw});await c.connect();
  async function projectContext(){await c.query('BEGIN');const issued=String(Math.floor(Date.now()/1000)),nonce=crypto.randomBytes(12).toString('hex');
   const mac=crypto.createHash('sha256').update(f.signing+'|UBOQ_RLS_V1|'+ids.p1+'|'+ids.a+'|7|'+issued+'|'+nonce).digest('hex');
   await c.query("SELECT set_config('app.enforce_project_rls','on',true),set_config('app.current_project_id',$1,true),set_config('app.current_user_id',$2,true),set_config('app.current_session_version','7',true),set_config('app.current_rls_proof',$3,true)",[ids.p1,ids.a,issued+'.'+nonce+'.'+mac]);}
  try{
   await projectContext();await c.query(`INSERT INTO "DailyTimeRecord"(id,"workerId",date,"payrollPeriodId","regularHours","updatedAt") VALUES($1,$2,'2026-11-09',$3,8,now())`,[crypto.randomUUID(),ids.unassigned,owned]);await c.query('COMMIT');
   await projectContext();await assert.rejects(()=>c.query(`INSERT INTO "DailyTimeRecord"(id,"workerId",date,"payrollPeriodId","regularHours","updatedAt") VALUES($1,$2,'2026-11-09',$3,8,now())`,[crypto.randomUUID(),peer,owned]),/PERIOD_WORKER_EMPLOYER_MISMATCH/);
  }finally{await c.query('ROLLBACK');await c.end();}
 });
 await check('company command cannot take over a real-project period',async()=>{await denied(signed('COMPUTE_DRAFT',projectPeriod));});
 await check('released period rejected even with zero child records',async()=>{
  const released=crypto.randomUUID();await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");
  await admin.query(`INSERT INTO "PayrollPeriod" SELECT (jsonb_populate_record(NULL::public."PayrollPeriod",to_jsonb(p)||jsonb_build_object('id',$1::text,'payrollBatchNumber',$1::text,'status','RELEASED','dateReleased',now(),'employerOwnershipEvidenceRef','ISOLATED-PROTECTED-FIXTURE'))).* FROM "PayrollPeriod" p WHERE id=$2`,[released,period]);
  await admin.query('COMMIT');await denied(signed('COMPUTE_DRAFT',released));await denied(signed('DELETE_DRAFT',released));
 });
 await check('authority revocation serializes against an in-flight transaction and then takes effect',async()=>{
  const c=new pg.Client(company),revoke=new pg.Client(config);await c.connect();await revoke.connect();
  try{await context(c,signed('VIEW',period));await c.query('SELECT public.company_payroll_begin()');
   await revoke.query("SET lock_timeout='500ms'");
   await assert.rejects(()=>revoke.query('UPDATE "EmployerPayrollAuthority" SET enabled=false,"revokedAt"=now() WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]),(e:any)=>e.code==='55P03');
   await c.query('SELECT public.company_payroll_finish()');await c.query('COMMIT');
   await revoke.query('UPDATE "EmployerPayrollAuthority" SET enabled=false,"revokedAt"=now() WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);
   await denied(signed());await revoke.query('UPDATE "EmployerPayrollAuthority" SET enabled=true,"revokedAt"=NULL WHERE "userId"=$1 AND operation=\'VIEW\'',[ids.a]);
  }finally{await c.query('ROLLBACK');await c.end();await revoke.end();}
 });
 await check('period lock prevents a racing protected-state transition',async()=>{
  const c=new pg.Client(company),racer=new pg.Client(config);await c.connect();await racer.connect();
  try{await context(c,signed('VIEW',period));await c.query('SELECT public.company_payroll_begin()');await racer.query("BEGIN; SET LOCAL lock_timeout='500ms'; SET LOCAL session_replication_role='replica'");
   await assert.rejects(()=>racer.query('UPDATE "PayrollPeriod" SET "isLocked"=true WHERE id=$1',[period]),(e:any)=>e.code==='55P03');await racer.query('ROLLBACK');
   await c.query('SELECT public.company_payroll_finish()');await c.query('COMMIT');
  }finally{await c.query('ROLLBACK');await c.end();await racer.end();}
 });
 await check('posted payment-batch dependency blocks compute, edit and delete',async()=>{
  const bank=crypto.randomUUID(),batch=crypto.randomUUID();
  await admin.query('INSERT INTO "PayrollBankAccount"(id,"bankName","accountNumber","accountName","createdById") VALUES($1,\'SYNTHETIC TEST BANK\',\'0000000000\',\'ISOLATED FIXTURE\',$2)',[bank,ids.a]);
  await admin.query('INSERT INTO "PaymentBatch"(id,"batchNumber","payrollPeriodId","paymentMethodType","payrollBankAccountId",status,"totalAmount","totalWorkers","preparedById","updatedAt") VALUES($1,$1,$2,\'BANK\',$3,\'POSTED\',0,0,$4,now())',[batch,period,bank,ids.a]);
  for(const op of ['COMPUTE_DRAFT','EDIT_DRAFT','DELETE_DRAFT'])await denied(signed(op,period));
 });
 await check('unverified deduction ownership fails closed at the restricted SQL boundary',async()=>{
  const ledger=crypto.randomUUID();
  await admin.query(`INSERT INTO "DeductionLedger"(id,"workerId",type,"principalAmount","deductionPerPayroll",balance,"updatedAt") VALUES($1,$2,'LOAN',100,10,100,now())`,[ledger,ids.w1]);
  const c=new pg.Client(company);await c.connect();
  try{await context(c,signed());await c.query('SELECT public.company_payroll_begin()');
   await assert.rejects(()=>c.query('SELECT public.company_payroll_ledgers($1)',[ids.w1]),/UNVERIFIED_FINANCIAL_DEPENDENCY/);
  }finally{await c.query('ROLLBACK');await c.end();}
 });
 await check('privileged enrollment cannot relabel protected unverified historical period',async()=>{
  await admin.query("BEGIN; SET LOCAL session_replication_role='replica'");
  await admin.query(`UPDATE "PayrollPeriod" SET status='APPROVED' WHERE id=$1`,[ids.unknown]);await admin.query('COMMIT');
  await assert.rejects(()=>admin.query(`UPDATE "PayrollPeriod" SET "employerId"=$1,"employerOwnershipEvidenceRef"='FORBIDDEN-HISTORY',"employerOwnershipVerifiedAt"=now() WHERE id=$2`,[ids.e1,ids.unknown]),/PROTECTED_HISTORY|H02_PAYROLL_OWNERSHIP_REQUIRED/);
  assert.equal((await admin.query('SELECT "employerId" FROM "PayrollPeriod" WHERE id=$1',[ids.unknown])).rows[0].employerId,null);
 });
 const report={status:'PASS_SECURITY_AND_CONCURRENCY',database:identity,synthetic_only:true,checks,limits:'Direct restricted SQL plus actual signed sessions; fixture setup uses isolated privileged client only. No production, protected database, or real identity enrollment.'};
 fs.writeFileSync(current,JSON.stringify(report,null,2)+'\n');console.log('PASS '+checks.length+' direct SQL security/concurrency checks');
})().catch(e=>{fs.writeFileSync(current,JSON.stringify({status:'FAILED',checks,error:e.message,stack:e.stack},null,2)+'\n');console.error(e.message);process.exitCode=1;}).finally(()=>admin.end());
