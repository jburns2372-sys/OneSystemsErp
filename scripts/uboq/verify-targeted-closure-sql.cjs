const s=require('./g02-bounded-support.cjs'),{assert}=s;
const out='artifacts/uboq/g02-r3/targeted-review-closure',mode=process.argv[2];
const report={mode,checks:[],created_at:new Date().toISOString()};let a,c,authority;
const save=()=>s.fs.writeFileSync(out+'/'+mode+'.json',JSON.stringify(report,null,2));
async function check(name,fn){const detail=await fn();report.checks.push({name,result:'PASS',detail});save();console.log('PASS '+name);}
async function context(op,target,fn){return s.transaction(c,async()=>{
 const x=[s.f.ids.e1,s.f.ids.a,'7',op,target,s.hash('targeted-closure'),String(Math.floor(Date.now()/1000)),s.crypto.randomBytes(16).toString('hex'),''];
 const mac=s.crypto.createHmac('sha256',Buffer.from(s.f.signing,'hex')).update(['OSERP_COMPANY_PAYROLL_V1',...x].join('|')).digest('hex');
 const keys=['employer_id','user_id','session_version','operation','target_id','payload_hash','issued','nonce','simulated_role','signature'];
 for(let i=0;i<keys.length;i++)await c.query('SELECT set_config($1,$2,true)',['app.company_'+keys[i],[...x,mac][i]]);
 await c.query('SELECT public.company_payroll_begin()');const r=await fn();await c.query('SELECT public.company_payroll_finish()');return r;
});}
(async()=>{a=await s.connect();report.identity=await s.identity(a);c=await s.connect({user:s.f.companyLogin,password:s.f.companyPw});
 const before=JSON.parse(s.fs.readFileSync(out+'/baseline.json'));
 before.migrations=Object.fromEntries(Object.entries(before.migrations).map(([p,h])=>[p.replaceAll('\\','/'),h]));
 for(const [p,h]of Object.entries(before.migrations))assert.equal(s.hash(s.fs.readFileSync(p)),h);
 report.ledger_before=(await a.query('SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM _prisma_migrations ORDER BY started_at,migration_name')).rows;
 for(const row of report.ledger_before)assert.equal(s.hash(s.fs.readFileSync('prisma/migrations/'+row.migration_name+'/migration.sql')),row.checksum);
 if(mode==='apply23'){
  assert.equal(report.ledger_before.length,22);
  const name='20261113110000_g02_operation_reads_and_worker_projection',bytes=s.fs.readFileSync('prisma/migrations/'+name+'/migration.sql');
  await s.transaction(a,async()=>{await a.query(bytes.toString());await a.query('INSERT INTO _prisma_migrations(id,checksum,migration_name,finished_at,applied_steps_count) VALUES($1,$2,$3,now(),1)',[s.crypto.randomUUID(),s.hash(bytes),name]);});
  report.migration={name,sha256:s.hash(bytes)};report.status='PASS';save();return;
 }
 authority=(await a.query('SELECT operation,enabled,"revokedAt" FROM "EmployerPayrollAuthority" WHERE "employerId"=$1 AND "userId"=$2',[s.f.ids.e1,s.f.ids.a])).rows;
 await a.query('UPDATE "EmployerPayrollAuthority" SET enabled=(operation=\'CREATE_PERIOD\'),"revokedAt"=CASE WHEN operation=\'CREATE_PERIOD\' THEN NULL ELSE now() END WHERE "employerId"=$1 AND "userId"=$2',[s.f.ids.e1,s.f.ids.a]);
 report.explicit_grants=(await a.query('SELECT operation,enabled FROM "EmployerPayrollAuthority" WHERE "employerId"=$1 AND "userId"=$2 ORDER BY operation',[s.f.ids.e1,s.f.ids.a])).rows;
 if(mode==='reproduce'){
  const id='SYNTH-CLOSURE-HISTORY-'+s.crypto.randomBytes(6).toString('hex');
  await s.transaction(a,async()=>{await a.query("SET LOCAL session_replication_role='replica'");
   await a.query(`INSERT INTO "PayrollPeriod"(id,"payrollBatchNumber",month,year,"calendarRule","periodType","startDate","endDate","payrollDate","employerId","employerOwnershipVerifiedAt","employerOwnershipEvidenceRef","createdById","updatedAt") VALUES($1,$1,12,2098,'MONTHLY',$1,'2098-12-01','2098-12-31','2098-12-31',$2,now(),'ISOLATED-CLOSURE-FIXTURE',$3,now())`,[id,s.f.ids.e1,s.f.ids.a]);
   await a.query(`INSERT INTO "Payroll"(id,"workerId","payrollPeriodId","compensationType",rate,"basicPay","netPay","updatedAt") VALUES($1,$2,$3,'DAILY',100,100,100,now())`,[id+'-PAY',s.f.ids.w1,id]);
   await a.query(`INSERT INTO "DailyTimeRecord"(id,"workerId",date,"payrollPeriodId","regularHours","updatedAt") VALUES($1,$2,'2098-12-09',$3,8,now())`,[id+'-DTR',s.f.ids.w1,id]);
  });s.fs.writeFileSync(out+'/history-fixture.json',JSON.stringify({id,synthetic_only:true}));
 }
 const fixture=JSON.parse(s.fs.readFileSync(out+'/history-fixture.json'));
 const history=(await a.query('SELECT p.id,p.month,p.year,p."calendarRule",p."periodType" FROM "PayrollPeriod" p WHERE p.id=$1',[fixture.id])).rows[0];assert.ok(history);
 await check('CREATE_PERIOD only; VIEW explicitly disabled at database authorization boundary',async()=>{await assert.rejects(()=>context('VIEW','*',()=>c.query('SELECT 1')),/COMPANY_PAYROLL/);});
 await check(mode==='reproduce'?'CONFIRMED #18 historical period Payroll DTR exposure':'CREATE_PERIOD cannot SELECT historical periods Payroll or DTR',async()=>{
  const counts=await context('CREATE_PERIOD',s.crypto.randomUUID(),async()=>{const result={};for(const table of ['PayrollPeriod','Payroll','DailyTimeRecord'])result[table]=(await c.query('SELECT id FROM "'+table+'"')).rowCount;return result;});
  for(const value of Object.values(counts))mode==='reproduce'?assert.ok(value>0):assert.equal(value,0);return counts;
 });
 if(mode==='post23'){
  await check('CREATE existing exact target does not reveal historical rows',async()=>context('CREATE_PERIOD',history.id,async()=>{for(const table of ['PayrollPeriod','Payroll','DailyTimeRecord'])assert.equal((await c.query('SELECT id FROM "'+table+'"')).rowCount,0);}));
  await check('duplicate metadata is boolean only; existing true and absent false',async()=>context('CREATE_PERIOD',s.crypto.randomUUID(),async()=>{for(const [kind,expected]of [[history.periodType,true],['SYNTH-ABSENT-'+s.crypto.randomUUID(),false]]){const r=await c.query('SELECT company_payroll_period_exists($1,$2,$3,$4) present',[history.month,history.year,history.calendarRule,kind]);assert.deepEqual(r.rows,[{present:expected}]);}}));
  await check('CREATE Worker projection contains only enrollment inputs',async()=>context('CREATE_PERIOD',s.crypto.randomUUID(),async()=>{const rows=(await c.query('SELECT company_payroll_workers() w')).rows;assert.ok(rows.length);for(const {w}of rows)assert.deepEqual(Object.keys(w).sort(),['dailyRate','employmentType','id','payrollCategory']);}));
  await a.query('UPDATE "EmployerPayrollAuthority" SET enabled=true,"revokedAt"=NULL WHERE "employerId"=$1 AND "userId"=$2',[s.f.ids.e1,s.f.ids.a]);
  await check('explicit VIEW grants own-employer history and excludes project/other employer',async()=>context('VIEW','*',async()=>{const periods=(await c.query('SELECT id,"employerId","projectId" FROM "PayrollPeriod"')).rows;assert.ok(periods.some(p=>p.id===history.id));for(const p of periods){assert.equal(p.employerId,s.f.ids.e1);assert.equal(p.projectId,null);}for(const table of ['Payroll','DailyTimeRecord']){const rows=(await c.query('SELECT "payrollPeriodId" FROM "'+table+'"')).rows;assert.ok(rows.length);for(const r of rows)assert.ok(periods.some(p=>p.id===r.payrollPeriodId));}}));
  await check('VIEW Worker projection is exact minimal display fields; helper CREATE-only',async()=>context('VIEW','*',async()=>{const rows=(await c.query('SELECT company_payroll_workers() w')).rows;assert.ok(rows.length);for(const {w}of rows){assert.deepEqual(Object.keys(w).sort(),['firstName','id','lastName','payrollCategory','projectId']);assert.notEqual(w.id,s.f.ids.w3);}await assert.rejects(()=>c.query('SELECT company_payroll_period_exists(11,2026,\'MONTHLY\',\'FULL_MONTH\')'),/CREATE_CONTEXT_REQUIRED/);throw new Error('EXPECTED_ABORT');}).catch(e=>{assert.match(e.message,/EXPECTED_ABORT|current transaction is aborted/);}));
  await check('Worker computation projection matches engine property accesses and excludes unrelated fields',async()=>context('COMPUTE_DRAFT',history.id,async()=>{const engine=s.fs.readFileSync('apps/aws-backend/src/routes/payroll.ts','utf8').split('// ------------------------------------------------------------------')[0];const required=[...new Set([...engine.matchAll(/worker\.(\w+)/g)].map(x=>x[1]).filter(x=>x!=='findMany'))].sort();const rows=(await c.query('SELECT company_payroll_workers() w')).rows;assert.ok(rows.length);for(const {w}of rows)assert.deepEqual(Object.keys(w).sort(),required);return {fields:required};}));
  for(const op of ['EDIT_DRAFT','DELETE_DRAFT'])await check(op+' retrieves no Worker fields',async()=>context(op,history.id,async()=>assert.equal((await c.query('SELECT company_payroll_workers()')).rowCount,0)));
  await check('runtime has no direct Worker SELECT or verifier membership',async()=>{await assert.rejects(()=>c.query('SELECT id FROM "Worker"'),e=>e.code==='42501');assert.equal((await c.query("SELECT pg_has_role(current_user,'oserp_company_payroll_verifier','MEMBER') member")).rows[0].member,false);});
 }
 report.status='PASS';save();
})().catch(e=>{report.status='FAIL';report.error={message:e.message,code:e.code};save();console.error(e.message);process.exitCode=1;}).finally(async()=>{if(c)await c.end();if(a){if(authority)for(const r of authority)await a.query('UPDATE "EmployerPayrollAuthority" SET enabled=$3,"revokedAt"=$4 WHERE "employerId"=$1 AND "userId"=$2 AND operation=$5',[s.f.ids.e1,s.f.ids.a,r.enabled,r.revokedAt,r.operation]);await a.end();}});
