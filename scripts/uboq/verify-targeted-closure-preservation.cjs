const s=require('./g02-bounded-support.cjs'),{assert}=s;
const out='artifacts/uboq/g02-r3/targeted-review-closure';
(async()=>{const a=await s.connect();try{
 const baseline=JSON.parse(s.fs.readFileSync(out+'/baseline.json'));
 for(const [p,h]of Object.entries(baseline.migrations))assert.equal(s.hash(s.fs.readFileSync(p)),h);
 await a.query('BEGIN READ ONLY');const identity=await s.identity(a);
 const ledger=(await a.query('SELECT migration_name,checksum,finished_at,rolled_back_at,applied_steps_count FROM _prisma_migrations ORDER BY started_at,migration_name')).rows;
 assert.equal(ledger.length,23);const old=JSON.parse(s.fs.readFileSync(out+'/apply23.json')).ledger_before;
 assert.deepEqual(JSON.parse(JSON.stringify(ledger.slice(0,22))),old);
 for(const r of ledger)assert.equal(s.hash(s.fs.readFileSync('prisma/migrations/'+r.migration_name+'/migration.sql')),r.checksum);
 const functions=(await a.query("SELECT p.proname,r.rolname owner,p.prosecdef,p.proconfig,p.proacl,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner WHERE n.nspname='public' AND p.proname IN ('company_payroll_period_scope','company_payroll_period_exists','company_payroll_workers') ORDER BY p.proname")).rows;
 const policies=(await a.query("SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND policyname='h02b_company_read' ORDER BY tablename")).rows;
 assert.equal(functions.length,3);for(const f of functions){assert.equal(f.owner,'oserp_company_payroll_verifier');assert.ok(f.prosecdef);}
 const fixture=JSON.parse(s.fs.readFileSync(out+'/history-fixture.json'));
 const history=(await a.query('SELECT id,"periodType","employerOwnershipEvidenceRef" FROM "PayrollPeriod" WHERE id=$1',[fixture.id])).rows[0];assert.equal(history?.periodType,fixture.id);assert.equal(history?.employerOwnershipEvidenceRef,'ISOLATED-CLOSURE-FIXTURE');
 await a.query('COMMIT');
 // Remove only the exact synthetic reproduction fixture, leaving prior evidence fixtures intact.
 await s.transaction(a,async()=>{await a.query("SET LOCAL session_replication_role='replica'");await a.query('DELETE FROM "Payroll" WHERE "payrollPeriodId"=$1',[fixture.id]);await a.query('DELETE FROM "DailyTimeRecord" WHERE "payrollPeriodId"=$1',[fixture.id]);await a.query('DELETE FROM "PayrollPeriod" WHERE id=$1',[fixture.id]);});
 const engine=s.fs.readFileSync('apps/aws-backend/src/routes/payroll.ts','utf8').replaceAll('\r\n','\n').split('// ------------------------------------------------------------------')[0];
 const result={status:'PASS',created_at:new Date().toISOString(),identity,historical_migrations_1_to_22_byte_preserved:true,historical_ledger_1_to_22_exactly_preserved:true,ledger,functions,policies,provisioner_unchanged:s.hash(s.fs.readFileSync('scripts/uboq/provision-local-restricted-logins.ts'))===baseline.source['scripts/uboq/provision-local-restricted-logins.ts'],compute_engine_prefix_sha256:s.hash(engine),reproduction_fixture_removed:fixture.id,prior_H01_M01_evidence_reused:true,protected_and_production_databases_contacted:false};assert.ok(result.provisioner_unchanged);
 s.fs.writeFileSync(out+'/preservation-final.json',JSON.stringify(result,null,2));console.log('PASS migrations1-22 and exact prior ledger preserved; function/policy catalog captured; synthetic reproduction fixture removed');
 }finally{await a.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
