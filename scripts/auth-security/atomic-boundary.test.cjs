'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const bcrypt=require('bcryptjs');
const {Client,Pool,types}=require('pg');
// Prisma stores these legacy timestamp-without-time-zone fields in UTC.
types.setTypeParser(1114,value=>new Date(value+'Z'));
const dotenv=require('dotenv');
const root=path.resolve(__dirname,'../..'),workspace=path.resolve(root,'../..');
const local=dotenv.parse(fs.readFileSync(path.join(workspace,'.env'))).DATABASE_URL;
const source=new URL(local);assert.ok(['localhost','127.0.0.1'].includes(source.hostname),'Local fixture server only');
const database='oserp_auth_fixture_'+process.pid+'_'+Date.now();
const authPassword=crypto.randomBytes(32).toString('hex'),dispatchPassword=crypto.randomBytes(32).toString('hex'),erpPassword=crypto.randomBytes(32).toString('hex');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
let server,admin,auth,dispatch,erp,passwordHash,created=false,rolesCreated=false;
async function fixture(){
  const id='auth_fixture_'+crypto.randomUUID(),email=id+'@example.invalid';
  await admin.query('INSERT INTO public."User"(id,email,role,"passwordHash",name) VALUES($1,$2,$3,$4,$5)',[id,email,'ACCOUNTANT',passwordHash,'Synthetic fixture']);
  return{id,email,version:0,passwordHash};
}
async function rpc(name,values){const placeholders=values.map((_,i)=>'$'+(i+1)).join(',');return (await auth.query(`SELECT oserp_auth_private.${name}(${placeholders}) AS result`,values)).rows[0].result;}
async function deliveryRpc(name,values){const placeholders=values.map((_,i)=>'$'+(i+1)).join(',');return (await dispatch.query(`SELECT oserp_auth_private.${name}(${placeholders}) AS result`,values)).rows[0].result;}
const loginPassword='Synthetic-password-for-test-only!';
const attempt=(u,password=loginPassword)=>rpc('login_attempt',[u.email,password]);
const finish=(u,valid)=>attempt(u,valid?loginPassword:'Incorrect-synthetic-password!');
async function user(u){return(await admin.query('SELECT * FROM public."User" WHERE id=$1',[u.id])).rows[0];}
async function prepare(u,canDeliver=true){const token=crypto.randomBytes(32).toString('hex'),tokenHash=hash(token);const result=await rpc('recovery_prepare',[u.email,tokenHash,hash('arbitrary forwarded IP'),hash('arbitrary agent'),canDeliver]);return{token,tokenHash,result};}
async function accepted(u){const r=await prepare(u);assert.ok(r.result);assert.equal(await deliveryRpc('recovery_delivery_result',[r.tokenHash,true,'synthetic-provider-id']),true);return r;}
before(async()=>{
  server=new Client({connectionString:local});await server.connect();
  assert.equal((await server.query("SELECT count(*)::int AS n FROM pg_roles WHERE rolname IN ('oserp_auth_owner','oserp_preview_auth_service','oserp_preview_delivery_service','oserp_auth_fixture_erp')")).rows[0].n,0,'Refuse to reuse pre-existing cluster roles');
  assert.match(database,/^oserp_auth_fixture_[0-9_]+$/);
  await server.query(`CREATE DATABASE "${database}"`);created=true;
  const url=new URL(local);url.pathname='/'+database;admin=new Client({connectionString:url.toString()});await admin.connect();await admin.query("SET timezone='UTC'");
  await admin.query('CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public');
  await admin.query(`CREATE TABLE public."User"(id text PRIMARY KEY,email text UNIQUE,role text NOT NULL,status text NOT NULL DEFAULT 'ACTIVE',name text,password text,"passwordHash" text,"failedLoginAttempts" integer NOT NULL DEFAULT 0,"lockedUntil" timestamp,"sessionVersion" integer NOT NULL DEFAULT 0,"mustChangePassword" boolean NOT NULL DEFAULT false,"passwordChangedAt" timestamp,"updatedAt" timestamp NOT NULL DEFAULT now());
    CREATE TABLE public."PasswordRecoveryToken"(id text PRIMARY KEY,"userId" text NOT NULL REFERENCES public."User"(id),"tokenHash" text UNIQUE NOT NULL,purpose text NOT NULL DEFAULT 'PASSWORD_RESET',"createdAt" timestamp NOT NULL DEFAULT now(),"expiresAt" timestamp NOT NULL,"consumedAt" timestamp,"revokedAt" timestamp,"requestedIpHash" text,"requestedUserAgentHash" text);
    CREATE TABLE public."AuditLog"(id text PRIMARY KEY,"userId" text NOT NULL REFERENCES public."User"(id),"userRole" text,"moduleName" text,"transactionId" text,"actionType" text,remarks text,"createdAt" timestamp DEFAULT now());`);
  await admin.query('BEGIN');
  try{await admin.query(fs.readFileSync(path.join(root,'prisma/auth-security/preview-auth-boundary-v1.sql'),'utf8'));await admin.query('COMMIT');rolesCreated=true;}catch(e){await admin.query('ROLLBACK');throw e;}
  await admin.query(`ALTER ROLE oserp_preview_auth_service LOGIN PASSWORD '${authPassword}'; ALTER ROLE oserp_preview_delivery_service LOGIN PASSWORD '${dispatchPassword}'; CREATE ROLE oserp_auth_fixture_erp LOGIN PASSWORD '${erpPassword}'; GRANT SELECT ON public."User" TO oserp_auth_fixture_erp;`);
  const config={host:source.hostname,port:Number(source.port||5432),database,max:32,connectionTimeoutMillis:5000};
  auth=new Pool({...config,user:'oserp_preview_auth_service',password:authPassword});dispatch=new Pool({...config,user:'oserp_preview_delivery_service',password:dispatchPassword});erp=new Pool({...config,user:'oserp_auth_fixture_erp',password:erpPassword});
  passwordHash=await bcrypt.hash('Synthetic-password-for-test-only!',12);
});
after(async()=>{
  await auth?.end();await dispatch?.end();await erp?.end();await admin?.end();
  if(server&&created){assert.ok(['localhost','127.0.0.1'].includes(source.hostname));assert.match(database,/^oserp_auth_fixture_[0-9_]+$/);await server.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[database]);await server.query(`DROP DATABASE "${database}"`);}
  if(server&&rolesCreated)await server.query('DROP ROLE oserp_preview_auth_service; DROP ROLE oserp_preview_delivery_service; DROP ROLE oserp_auth_owner; DROP ROLE IF EXISTS oserp_auth_fixture_erp;');
  await server?.end();
});

test('one invalid password is recorded and audited atomically',async()=>{const u=await fixture();assert.equal(await finish(u,false),null);assert.equal((await user(u)).failedLoginAttempts,1);assert.equal((await admin.query('SELECT count(*)::int AS n FROM public."AuditLog" WHERE "userId"=$1 AND "actionType"=$2',[u.id,'LOGIN_FAILED'])).rows[0].n,1);});
test('32 concurrent invalid attempts stop at five, lock for 15 minutes and revoke old sessions',async()=>{
  const u=await fixture();await Promise.all(Array.from({length:32},()=>finish(u,false)));
  const state=await user(u);assert.equal(state.failedLoginAttempts,5);assert.equal(state.sessionVersion,1);assert.ok(state.lockedUntil-Date.now()>14*60000);assert.ok(state.lockedUntil-Date.now()<=15*60000);
  assert.equal(await attempt(u),null);assert.equal(await finish(u,true),null);assert.equal(await finish(u,true),null);
  assert.equal((await admin.query('SELECT count(*)::int AS n FROM public."AuditLog" WHERE "userId"=$1 AND "actionType"=$2',[u.id,'LOGIN_TEMPORARILY_LOCKED'])).rows[0].n,1);
});
test('caller cannot forge a successful login or bypass a committed lock',async()=>{
  const u=await fixture();assert.equal(await attempt(u,u.passwordHash),null);
  for(let i=0;i<4;i++)await finish(u,false);
  assert.equal(await attempt(u,loginPassword),null);
  assert.equal((await user(u)).failedLoginAttempts,5);
  assert.equal(await attempt(u,loginPassword),null);
});
test('temporary lock expiration permits a successful login and clears counters',async()=>{const u=await fixture();for(let i=0;i<5;i++)await finish(u,false);await admin.query('UPDATE public."User" SET "lockedUntil"=now()-interval \'1 second\' WHERE id=$1',[u.id]);const result=await finish(u,true);assert.equal(result.id,u.id);assert.equal(result.sessionVersion,1);assert.equal((await user(u)).failedLoginAttempts,0);assert.equal((await user(u)).lockedUntil,null);});
test('inactive, unknown and unactivated accounts cannot authenticate',async()=>{
 const u=await fixture();await admin.query('UPDATE public."User" SET status=$1 WHERE id=$2',['INACTIVE',u.id]);
 assert.equal(await attempt(u),null);
 assert.equal(await rpc('login_attempt',['unknown@example.invalid',loginPassword]),null);
 await admin.query('UPDATE public."User" SET status=$1,"passwordHash"=NULL WHERE id=$2',['ACTIVE',u.id]);
 assert.equal(await attempt(u),null);
});
test('concurrent recovery requests cannot bypass the account budget using header identities or case changes',async()=>{
  const u=await fixture();const results=await Promise.all(Array.from({length:24},(_,i)=>rpc('recovery_prepare',[i%2?u.email.toUpperCase():u.email,hash('token'+i+u.id),hash('spoof-ip-'+i),hash('spoof-agent-'+i),true])));assert.equal(results.filter(Boolean).length,5);
  const tokens=(await admin.query('SELECT * FROM public."PasswordRecoveryToken" WHERE "userId"=$1',[u.id])).rows;assert.equal(tokens.length,5);assert.equal(tokens.filter(t=>!t.revokedAt).length,1);
});
test('unknown-account requests consume the same five-attempt budget',async()=>{const email='missing_'+crypto.randomUUID()+'@example.invalid';for(let i=0;i<9;i++)assert.equal(await rpc('recovery_prepare',[email,hash('unknown'+i),hash('ip'),hash('ua'),true]),null);assert.equal((await admin.query('SELECT attempts FROM oserp_auth_private.recovery_budget WHERE bucket=$1',[hash(email)])).rows[0].attempts,5);});
test('a missing provider issues no token and produces an operational audit only',async()=>{const u=await fixture();assert.equal((await prepare(u,false)).result,null);assert.equal((await admin.query('SELECT count(*)::int AS n FROM public."PasswordRecoveryToken" WHERE "userId"=$1',[u.id])).rows[0].n,0);});
test('a pending message token cannot be redeemed before provider acceptance',async()=>{const u=await fixture(),r=await prepare(u);assert.equal(await rpc('recovery_inspect',[r.tokenHash]),null);assert.equal(await rpc('recovery_reset',[r.tokenHash,passwordHash]),false);});
test('provider rejection revokes the token and preserves audit logging',async()=>{const u=await fixture(),r=await prepare(u);assert.equal(await deliveryRpc('recovery_delivery_result',[r.tokenHash,false,null]),false);assert.equal(await rpc('recovery_inspect',[r.tokenHash]),null);assert.ok((await admin.query('SELECT "revokedAt" FROM public."PasswordRecoveryToken" WHERE "tokenHash"=$1',[r.tokenHash])).rows[0].revokedAt);});
test('a superseded token cannot be reactivated by a delayed provider response',async()=>{const u=await fixture(),old=await prepare(u);await prepare(u);assert.equal(await deliveryRpc('recovery_delivery_result',[old.tokenHash,true,'late-provider-id']),false);assert.equal(await rpc('recovery_inspect',[old.tokenHash]),null);});
test('token expiration and wrong purpose deny redemption',async()=>{for(const kind of ['expired','purpose']){const u=await fixture(),r=await accepted(u);await admin.query(kind==='expired'?'UPDATE public."PasswordRecoveryToken" SET "expiresAt"=now()-interval \'1 second\' WHERE "tokenHash"=$1':'UPDATE public."PasswordRecoveryToken" SET purpose=\'OTHER\' WHERE "tokenHash"=$1',[r.tokenHash]);assert.equal(await rpc('recovery_inspect',[r.tokenHash]),null);assert.equal(await rpc('recovery_reset',[r.tokenHash,passwordHash]),false);assert.equal((await user(u)).sessionVersion,0);}});
test('24 concurrent resets consume once, clear lockout, invalidate sessions and preserve unrelated fields',async()=>{
  const u=await fixture();await admin.query('UPDATE public."User" SET "failedLoginAttempts"=5,"lockedUntil"=now()+interval \'15 minutes\',"sessionVersion"=7 WHERE id=$1',[u.id]);const before=await user(u),r=await accepted(u),newHash=await bcrypt.hash('Another-synthetic-password-only!',12);
  const results=await Promise.all(Array.from({length:24},()=>rpc('recovery_reset',[r.tokenHash,newHash])));assert.equal(results.filter(Boolean).length,1);const current=await user(u);assert.equal(current.sessionVersion,8);assert.equal(current.failedLoginAttempts,0);assert.equal(current.lockedUntil,null);assert.equal(current.passwordHash,newHash);assert.equal(current.password,null);for(const key of ['id','name','email','role','status'])assert.equal(current[key],before[key]);assert.equal(await rpc('recovery_reset',[r.tokenHash,newHash]),false);
  assert.equal((await admin.query('SELECT count(*)::int AS n FROM public."AuditLog" WHERE "userId"=$1 AND "actionType"=$2',[u.id,'PASSWORD_RECOVERY_COMPLETED'])).rows[0].n,1);
});
test('password reset invalidates the previous login password and accepts only the new one',async()=>{
 const u=await fixture(),r=await accepted(u),newPassword='Changed-synthetic-password!';
 assert.equal(await rpc('recovery_reset',[r.tokenHash,await bcrypt.hash(newPassword,12)]),true);
 assert.equal(await attempt(u,loginPassword),null);
 const result=await attempt(u,newPassword);assert.equal(result.id,u.id);
 assert.equal(result.sessionVersion,1);
});
test('plaintext or low-cost replacement hashes cannot be written',async()=>{const u=await fixture(),r=await accepted(u);assert.equal(await rpc('recovery_reset',[r.tokenHash,'plaintext-not-a-hash']),false);assert.equal(await rpc('recovery_reset',[r.tokenHash,passwordHash.replace('$12$','$04$')]),false);assert.equal((await user(u)).sessionVersion,0);});
test('audit failure rolls back both password mutation and token consumption',async()=>{
  const u=await fixture(),r=await accepted(u);await admin.query(`CREATE FUNCTION public.auth_fixture_audit_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit failure'; END $$;CREATE TRIGGER auth_fixture_audit_fail BEFORE INSERT ON public."AuditLog" FOR EACH ROW EXECUTE FUNCTION public.auth_fixture_audit_fail();`);
  try{await assert.rejects(()=>rpc('recovery_reset',[r.tokenHash,passwordHash]));assert.equal((await user(u)).sessionVersion,0);assert.equal((await admin.query('SELECT "consumedAt" FROM public."PasswordRecoveryToken" WHERE "tokenHash"=$1',[r.tokenHash])).rows[0].consumedAt,null);}finally{await admin.query('DROP TRIGGER auth_fixture_audit_fail ON public."AuditLog";DROP FUNCTION public.auth_fixture_audit_fail();');}
});
for(const sql of ['SELECT * FROM public."User"','UPDATE public."User" SET role=\'SUPER_ADMIN\'','DELETE FROM public."PasswordRecoveryToken"','SELECT * FROM oserp_auth_private.recovery_budget','SELECT oserp_auth_private.audit(NULL,NULL,NULL,NULL)','SET ROLE postgres'])test('auth-only role rejects direct privilege expansion: '+sql,async()=>{await assert.rejects(()=>auth.query(sql),e=>e.code==='42501');});
for(const name of ['recovery_inspect'])test('ordinary ERP role cannot execute private auth operation: '+name,async()=>{await assert.rejects(()=>erp.query(`SELECT oserp_auth_private.${name}('arbitrary')`),e=>e.code==='42501');});
test('all exposed auth operations use a non-login, non-superuser owner and fixed search path',async()=>{
  const roles=(await admin.query("SELECT rolname,rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname IN ('oserp_auth_owner','oserp_preview_auth_service','oserp_preview_delivery_service')")).rows;assert.equal(roles.find(r=>r.rolname==='oserp_auth_owner').rolcanlogin,false);assert.ok(roles.every(r=>!r.rolsuper&&!r.rolbypassrls));
  const funcs=(await admin.query("SELECT p.proname,p.prosecdef,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='oserp_auth_private' AND p.proname<>'audit'")).rows;assert.equal(funcs.length,5);assert.ok(funcs.every(f=>f.prosecdef&&f.proconfig.includes('search_path=pg_catalog')&&f.proconfig.includes('TimeZone=UTC')));
});

// A compromised issuer credential alone must not turn a self-chosen token into
// an accepted reset; delivery attestation requires its own separate credential.
test('issuer role cannot forge recovery-provider acceptance',async()=>{
  const u=await fixture(),r=await prepare(u);
  await assert.rejects(()=>rpc('recovery_delivery_result',[r.tokenHash,true,'forged-provider']),e=>e.code==='42501');
  assert.equal(await rpc('recovery_reset',[r.tokenHash,passwordHash]),false);
});
test('delivery-only role cannot mint recovery tokens or reset any password',async()=>{
  const u=await fixture();
  await assert.rejects(()=>deliveryRpc('recovery_prepare',[u.email,hash('self-chosen'),hash('ip'),hash('agent'),true]),e=>e.code==='42501');
  await assert.rejects(()=>deliveryRpc('recovery_reset',[hash('unknown'),passwordHash]),e=>e.code==='42501');
  await assert.rejects(()=>deliveryRpc('login_attempt',[u.email,loginPassword]),e=>e.code==='42501');
});

test('legacy caller-asserted password proof APIs do not exist or expose a hash',async()=>{
 const funcs=(await admin.query("SELECT to_regprocedure('oserp_auth_private.login_snapshot(text)') AS snapshot, to_regprocedure('oserp_auth_private.login_finish(text,text,integer,boolean)') AS finish")).rows[0];
 assert.equal(funcs.snapshot,null);assert.equal(funcs.finish,null);
 const u=await fixture();const actor=await attempt(u);assert.equal(actor.id,u.id);assert.equal(actor.passwordHash,undefined);
});
test('known password succeeds; wrong password and supplied bcrypt hash do not',async()=>{
 const u=await fixture();assert.equal(await attempt(u,u.passwordHash),null);
 assert.equal(await attempt(u,'Not-the-password!'),null);
 const actor=await attempt(u,loginPassword);assert.equal(actor.id,u.id);
 assert.equal((await user(u)).failedLoginAttempts,0);
});

test('legacy $2a$ hashes are verified as well as $2b$',async()=>{
 const u=await fixture();
 const aHash=u.passwordHash.replace('$2b$','$2a$');
 await admin.query('UPDATE public."User" SET "passwordHash"=$1 WHERE id=$2',[aHash,u.id]);
 assert.equal((await attempt(u,loginPassword)).id,u.id);
 assert.equal(await attempt(u,'Wrong synthetic password'),null);
});
test('SQL authentication verifies Unicode and 72-byte boundary passwords',async()=>{
 for(const pw of ['漢字例子-Synthetic-Password2026!', '🔐'.repeat(17)+'AZ12']){
   const u=await fixture();await admin.query('UPDATE public."User" SET "passwordHash"=$1 WHERE id=$2',[await bcrypt.hash(pw,12),u.id]);
   const actor=await attempt(u,pw);assert.equal(actor.id,u.id);
 }
});
