const fs=require('fs'),path=require('path'),crypto=require('crypto'),pg=require('pg');
(async()=>{
 const out='artifacts/uboq/g02-r3/h02-b-implementation',r=JSON.parse(fs.readFileSync(out+'/local-database.json')),config=JSON.parse(fs.readFileSync(path.join(r.runtime_directory,'connection.json')));
 if(config.host!=='127.0.0.1'||config.port!==55483||config.database!==r.target_database||!/^oserp_h02b_local_[0-9a-f]+$/.test(config.database))throw Error('ISOLATED_TARGET_REQUIRED');
 const c=new pg.Client(config);await c.connect();try{
 await c.query('BEGIN READ ONLY');
 const identity=(await c.query('SELECT current_database() db,host(inet_server_addr()) host,inet_server_port() port')).rows[0];
 if(identity.db!==r.target_database||identity.host!=='127.0.0.1'||identity.port!==55483)throw Error('CONNECTED_TARGET_MISMATCH');
 const rows=(await c.query('SELECT migration_name,checksum,finished_at,applied_steps_count FROM _prisma_migrations ORDER BY migration_name')).rows;
 for(const row of rows){const bytes=fs.readFileSync('prisma/migrations/'+row.migration_name+'/migration.sql');if(crypto.createHash('sha256').update(bytes).digest('hex')!==row.checksum||!row.finished_at||row.applied_steps_count!==1)throw Error('MIGRATION_DRIFT:'+row.migration_name);}
 if(rows.length!==20)throw Error('EXPECTED_20_MIGRATIONS');
 const funcs=(await c.query(`SELECT p.proname,r.rolname owner,r.rolsuper,r.rolbypassrls,p.prosecdef,p.proconfig,
 EXISTS(SELECT 1 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') public_execute
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner WHERE n.nspname='public' AND p.proname LIKE 'company_payroll_%' ORDER BY p.proname`)).rows;
 for(const f of funcs)if(f.owner!=='oserp_company_payroll_verifier'||f.rolsuper||f.rolbypassrls||f.public_execute)throw Error('FUNCTION_PRIVILEGE_FAILURE:'+f.proname);
 const tables=(await c.query(`SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[['Employer','EmployerPayrollAuthority','PayrollPeriod','Payroll','DailyTimeRecord','_company_payroll_commands','_company_payroll_trust_anchor']])).rows;
 if(tables.length!==7||tables.some(x=>!x.relrowsecurity||!x.relforcerowsecurity))throw Error('FORCE_RLS_REQUIRED');
 const defaults=(await c.query('SELECT defaclrole::regrole::text owner,defaclnamespace::regnamespace::text schema,defaclobjtype,defaclacl::text FROM pg_default_acl')).rows;
 const audited=(await c.query(`SELECT count(*)::int n FROM "PayrollAuditLog" WHERE "actionType" LIKE 'COMPANY_%' OR "actionType" LIKE 'EMPLOYER_AUTHORITY_%'`)).rows[0].n;
 if(audited===0)throw Error('AUDIT_REQUIRED');
 await c.query('COMMIT');
 fs.writeFileSync(out+'/catalog-verification.json',JSON.stringify({status:'PASS_ACTUAL_DATABASE_CATALOG_AND_CHECKSUMS',identity,migration_count:rows.length,migrations:rows,functions:funcs,force_rls:tables,default_acls:defaults,audit_rows:audited,mode:'READ_ONLY',limits:'Disposable synthetic database only; does not resolve historical migration #14 provenance in other environments.'},null,2)+'\n');
 console.log('PASS: 20 actual migration checksums, '+funcs.length+' restricted verifier functions, 7 FORCE RLS tables, recorded default ACLs and audit rows');
 }finally{await c.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
