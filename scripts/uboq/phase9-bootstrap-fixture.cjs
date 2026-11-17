'use strict';
// Disposable loopback-only PostgreSQL 18 cluster. Never reads an env/connection file.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process'), vm = require('node:vm');
const { Client } = require('pg'), { PrismaClient } = require('@prisma/client');
const ts = require('typescript');
const root = process.cwd(), out = path.join(root, 'artifacts/phase9-bootstrap');
const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-p9-bootstrap-'));
const bin = process.env.PHASE9_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
const port = 55549, database = 'phase9_disposable', secret = crypto.randomBytes(32).toString('hex');
const migration = 'prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql';
const report = { base: '08d2a43e631ee3d2ee7cd08d00b8e600e35f110c', environment: 'Disposable PostgreSQL 18.4, loopback only', checks: [] };
fs.mkdirSync(out, { recursive: true });
function command(exe, args) { return execFileSync(path.join(bin, exe + '.exe'), args, { windowsHide: true, stdio: 'ignore', timeout: 60000 }); }
function load(file, deps, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports, Buffer, FormData, globalThis: {}, process: { env }, require: n => {
    if (Object.hasOwn(deps, n)) return deps[n];
    throw Error('Unallowlisted dependency: ' + n);
  } }, { filename: file });
  return exports;
}
const ownership = load('src/lib/uboq/project-ownership.ts', {
  'node:async_hooks': require('node:async_hooks'), 'node:crypto': crypto,
}, { UBOQ_RLS_CONTEXT_SECRET: secret });
async function check(name, fn) { await fn(); report.checks.push({ name, result: 'PASS' }); console.log('PASS ' + name); }
let admin, app, stranger, legacy, prisma, started = false;
const config = { host: '127.0.0.1', port, database, password: 'disposable-only' };
async function connect(user) { const c = new Client({ ...config, user }); await c.connect(); return c; }
async function transaction(c, fn) { await c.query('BEGIN'); try { const r = await fn(); await c.query('COMMIT'); return r; } catch (e) { await c.query('ROLLBACK'); throw e; } }
async function context(c, id, actor = 'creator', sv = 7, proof) {
  await c.query(`SELECT set_config('app.enforce_project_rls','on',true),set_config('app.current_project_id',$1,true),
    set_config('app.current_user_id',$2,true),set_config('app.current_session_version',$3,true),set_config('app.current_rls_proof',$4,true)`,
  [id, actor, String(sv), proof ?? ownership.mintSignedRlsProof({ projectId: id, userId: actor, sessionVersion: sv })]);
}
async function create(c, id, opts = {}) {
  return transaction(c, async () => {
    if (!opts.unsigned) await context(c, id, opts.actor, opts.sv, opts.proof);
    return c.query('SELECT public.phase9_create_project_profile($1,$2,NULL,NULL,NULL,$3,NULL)', [opts.target || id, opts.name || 'Synthetic project', opts.sector || 'CORPORATE']);
  });
}
async function denied(fn, code = '42501') { await assert.rejects(fn, e => e.code === code); }
function functionSql(source, name) {
  const re = new RegExp('CREATE OR REPLACE FUNCTION ' + name + '\\([\\s\\S]*?\\$\\$;');
  const sql = source.match(re)?.[0]; assert.ok(sql, name); return sql;
}
const read = p => fs.readFileSync(p, 'utf8');
async function catalog() {
  return (await admin.query(`SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,
    (SELECT jsonb_agg(p ORDER BY p.policyname) FROM pg_policies p WHERE p.tablename=c.relname AND p.schemaname='public') policies
    FROM pg_class c WHERE c.relname IN ('Project','ProjectUserAssignment') ORDER BY c.relname`)).rows;
}
(async () => {
  command('initdb', ['-D', path.join(runtime, 'data'), '-U', 'fixture_admin', '--auth=trust', '--no-locale', '--encoding=UTF8']);
  started = true;
  command('pg_ctl', ['-D', path.join(runtime, 'data'), '-l', path.join(runtime, 'postgres.log'), '-o', '-h 127.0.0.1 -p ' + port, '-w', 'start']);
  const initial = new Client({ ...config, user: 'fixture_admin', database: 'postgres' }); await initial.connect();
  await initial.query('CREATE DATABASE phase9_disposable'); await initial.end();
  admin = await connect('fixture_admin');
  const identity = (await admin.query("SELECT current_database() db,host(inet_server_addr()) host,current_setting('data_directory') dir,version() version")).rows[0];
  assert.equal(identity.db, database); assert.equal(identity.host, '127.0.0.1');
  assert.equal(path.resolve(identity.dir).toLowerCase(), path.resolve(runtime, 'data').toLowerCase());
  report.identity = { database, host: identity.host, version: identity.version };
  await admin.query(`CREATE ROLE oserp_migrations_owner NOLOGIN NOSUPERUSER BYPASSRLS;
    CREATE ROLE oserp_compat_app NOLOGIN NOBYPASSRLS;
    CREATE ROLE oserp_legacy_app NOLOGIN NOBYPASSRLS;
    CREATE ROLE oserp_maint_cleanup_role NOLOGIN NOBYPASSRLS;
    CREATE ROLE fixture_app LOGIN NOBYPASSRLS; GRANT oserp_compat_app TO fixture_app;
    CREATE ROLE fixture_stranger LOGIN NOBYPASSRLS;
    CREATE ROLE fixture_legacy LOGIN NOBYPASSRLS; GRANT oserp_legacy_app TO fixture_legacy;
    REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO PUBLIC;`);
  // Generate DDL offline, but instantiate only creation and permission-reference tables.
  const schemaFile = path.join(out, 'schema.sql');
  if (!fs.existsSync(schemaFile)) execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script', '--output', schemaFile], { windowsHide: true, timeout: 60000 });
  const schema = read(schemaFile), tables = ['User', 'Role', 'Module', 'RolePermission', 'Project', 'ProjectUserAssignment'];
  for (const table of tables) {
    const ddl = schema.match(new RegExp('CREATE TABLE "(?:public"\\.")?' + table + '" \\([\\s\\S]*?\\n\\);'))?.[0];
    assert.ok(ddl, table); await admin.query(ddl);
  }
  for (const statement of schema.split(';')) {
    if (/CREATE UNIQUE INDEX/.test(statement) && tables.some(t => statement.includes('ON "' + t + '"'))) await admin.query(statement);
    if (/ALTER TABLE/.test(statement) && tables.some(t => statement.includes('ALTER TABLE "' + t + '"')) && tables.some(t => statement.includes('REFERENCES "' + t + '"'))) await admin.query(statement);
  }
  const m15 = read('prisma/migrations/20261104233000_uboq_g02_remediation_hardening/migration.sql');
  const m16 = read('prisma/migrations/20261105043000_uboq_g02_r1_security_and_cleanup_hardening/migration.sql');
  // Real signed verifier, actor verifier, and RLS predicate; no fake proof acceptance.
  await admin.query(`CREATE TABLE public._uboq_rls_trust_anchor ("anchorId" text PRIMARY KEY,"secretHex" text);
    ALTER TABLE public._uboq_rls_trust_anchor OWNER TO oserp_migrations_owner;
    REVOKE ALL ON public._uboq_rls_trust_anchor FROM PUBLIC;
    GRANT SELECT ON public."User",public."Project",public."ProjectUserAssignment" TO oserp_migrations_owner;`);
  await admin.query('INSERT INTO public._uboq_rls_trust_anchor VALUES (\'PRIMARY\',$1)', [secret]);
  for (const [source, name, signature] of [
    [m16, 'uboq_verify_signed_rls_proof', 'text,text,text,text'],
    [m15, 'uboq_verify_bound_actor_for_project', 'text,text,text'],
    [m16, 'uboq_check_tenant_rls', 'text'],
  ]) { await admin.query(functionSql(source, name)); await admin.query(`ALTER FUNCTION public.${name}(${signature}) OWNER TO oserp_migrations_owner`); }
  // Legacy-only predicate dependency is irrelevant to compat flow, fail closed.
  await admin.query('CREATE FUNCTION public.uboq_is_governed_project(text) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$');
  await admin.query(`ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY; ALTER TABLE public."Project" FORCE ROW LEVEL SECURITY;
    CREATE POLICY rls_permissive_app_access ON public."Project" AS PERMISSIVE FOR ALL TO PUBLIC USING(true) WITH CHECK(true);
    CREATE POLICY rls_restrictive_tenant_scope ON public."Project" AS RESTRICTIVE FOR ALL TO PUBLIC
      USING(public.uboq_check_tenant_rls(id)) WITH CHECK(public.uboq_check_tenant_rls(id));
    GRANT SELECT ON public."User",public."Role",public."RolePermission",public."ProjectUserAssignment" TO oserp_compat_app;
    GRANT SELECT,INSERT,UPDATE,DELETE ON public."Project" TO oserp_compat_app;`);
  const pua = m16.slice(m16.indexOf('ALTER TABLE "ProjectUserAssignment" ENABLE'), m16.indexOf('-- 3b.'));
  await admin.query(pua);
  await admin.query(`INSERT INTO public."Role"(id,"roleCode","roleName","updatedAt") VALUES('role','PROJECT_MANAGER','Fixture role',now());
    INSERT INTO public."Module"(id,"moduleName","updatedAt") VALUES('module','PROJECT_MANAGEMENT',now());
    INSERT INTO public."RolePermission"(id,"roleId","moduleId","moduleName","canCreate","updatedAt") VALUES('permission','role','module','PROJECT_MANAGEMENT',true,now());
    INSERT INTO public."User"(id,name,role,status,"sessionVersion","updatedAt") VALUES
      ('creator','Synthetic creator','PROJECT_MANAGER','ACTIVE',7,now()),('peer','Synthetic peer','PROJECT_MANAGER','ACTIVE',7,now());`);
  app = await connect('fixture_app'); stranger = await connect('fixture_stranger'); legacy = await connect('fixture_legacy');
  await check('original nested creation blocked by Project RLS / PUA ACL', async () => {
    await denied(() => app.query(`INSERT INTO public."Project"(id,name,"updatedAt") VALUES('original','Original',now())`));
    await denied(() => app.query(`INSERT INTO public."ProjectUserAssignment"(id,"userId","projectId","projectRole","accessLevel","updatedAt") VALUES('original','creator','original','PROJECT_MANAGER','FULL',now())`));
  });
  const before = await catalog(); await admin.query(read(migration));
  await check('existing runtime ACL and FORCE RLS policies unchanged', async () => { assert.deepEqual(await catalog(), before); });
  await check('unsigned / forged / expired / wrong-project context denied', async () => {
    await denied(() => create(app, 'unsigned', { unsigned: true }));
    await denied(() => create(app, 'forged', { proof: '0.fake.fake' }));
    await denied(() => create(app, 'expired', { proof: ownership.mintSignedRlsProof({ projectId: 'expired', userId: 'creator', sessionVersion: 7, issuedEpochSec: Math.floor(Date.now()/1000)-600 }) }));
    await denied(() => create(app, 'signed', { target: 'different' }));
  });
  await check('nonmember and legacy logins cannot execute bootstrap', async () => { await denied(() => create(stranger, 'stranger')); await denied(() => create(legacy, 'legacy')); });
  await check('stale / inactive / locked / password-change actors denied', async () => {
    await denied(() => create(app, 'stale', { sv: 6 }));
    for (const [set, reset] of [["status='INACTIVE'", "status='ACTIVE'"], ['"lockedUntil"=now()+interval \'1 hour\'', '"lockedUntil"=NULL'], ['"mustChangePassword"=true', '"mustChangePassword"=false']]) {
      await admin.query('UPDATE public."User" SET ' + set + " WHERE id='creator'");
      try { await denied(() => create(app, 'account-denied')); } finally { await admin.query('UPDATE public."User" SET ' + reset + " WHERE id='creator'"); }
    }
  });
  await check('database permission revocation and inactive role deny even with valid proof', async () => {
    for (const [table, column] of [['RolePermission','canCreate'],['Role','isActive']]) {
      await admin.query(`UPDATE public."${table}" SET "${column}"=false`);
      try { await denied(() => create(app, 'rbac-denied')); } finally { await admin.query(`UPDATE public."${table}" SET "${column}"=true`); }
    }
  });
  await check('database validates profile independently', async () => { await denied(() => create(app, 'bad-name', { name: 'ab' }), '22023'); await denied(() => create(app, 'bad-sector', { sector: 'UNKNOWN' }), '22023'); });
  prisma = new PrismaClient({ datasourceUrl: `postgresql://fixture_app:disposable-only@127.0.0.1:${port}/${database}?schema=public` });
  let session = { userId: 'creator', role: 'PROJECT_MANAGER', sessionVersion: 7 };
  const action = load('src/app/actions/project-intake.ts', {
    '@/lib/prisma': { prisma }, '@/lib/dal/auth': { verifyOperationalSession: async () => session },
    'node:crypto': crypto, '@/lib/uboq/project-ownership': ownership,
  }).createProjectProfile;
  const form = () => { const f = new FormData(); f.set('name','Synthetic new workspace'); f.set('sector','CORPORATE'); f.set('userId','peer'); f.set('projectRole','SUPER_ADMIN'); return f; };
  let created;
  await check('actual action + Prisma transaction creates planning project and only authenticated creator', async () => {
    created = (await action(form())).projectId; assert.ok(created);
    const p = (await admin.query('SELECT * FROM public."Project" WHERE id=$1',[created])).rows[0];
    assert.equal(p.status,'PLANNING'); assert.equal(p.contractAmount,0); assert.equal(p.uboqGovernanceEnabled,false);
    const a = (await admin.query('SELECT * FROM public."ProjectUserAssignment" WHERE "projectId"=$1',[created])).rows;
    assert.equal(a.length,1); assert.equal(a[0].userId,'creator'); assert.equal(a[0].assignedBy,'creator'); assert.equal(a[0].projectRole,'PROJECT_MANAGER'); assert.equal(a[0].accessLevel,'FULL');
  });
  await check('new non-global creator can read workspace; peer and unbound sessions cannot', async () => {
    await transaction(app,async()=>{await context(app,created);assert.equal((await app.query('SELECT id FROM public."Project" WHERE id=$1',[created])).rowCount,1);assert.equal((await app.query('SELECT id FROM public."ProjectUserAssignment" WHERE "projectId"=$1',[created])).rowCount,1);});
    await transaction(app,async()=>{await context(app,created,'peer');assert.equal((await app.query('SELECT id FROM public."Project" WHERE id=$1',[created])).rowCount,0);assert.equal((await app.query('SELECT id FROM public."ProjectUserAssignment" WHERE "projectId"=$1',[created])).rowCount,0);});
    assert.equal((await app.query('SELECT id FROM public."Project"')).rowCount,0);
  });
  await check('existing project replay cannot add a second creator', async () => { await denied(() => create(app,created,{actor:'peer'}),'23505'); assert.equal((await admin.query('SELECT id FROM public."ProjectUserAssignment" WHERE "projectId"=$1',[created])).rowCount,1); });
  await check('assignment failure rolls back actual action project insert', async () => {
    const count = (await admin.query('SELECT count(*) n FROM public."Project"')).rows[0].n;
    await admin.query(`CREATE FUNCTION public.fixture_fail_assignment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture assignment failure'; END $$;
      CREATE TRIGGER fixture_fail_assignment BEFORE INSERT ON public."ProjectUserAssignment" FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_assignment()`);
    try { await assert.rejects(()=>action(form()),/fixture assignment failure/); } finally { await admin.query('DROP TRIGGER fixture_fail_assignment ON public."ProjectUserAssignment"'); }
    assert.equal((await admin.query('SELECT count(*) n FROM public."Project"')).rows[0].n,count);
  });
  await check('action rejects absent session and invalid fields without writes', async () => {
    session=null; assert.ok((await action(form())).error); session={userId:'creator',role:'PROJECT_MANAGER',sessionVersion:7};
    for(const [key,value] of [['name','ab'],['sector','UNKNOWN'],['description','x'.repeat(2001)]]) {const f=form();f.set(key,value);assert.ok((await action(f)).error);}
  });
  await check('direct PUA mutations and trusted function-owner assumption remain denied', async () => {
    await denied(()=>app.query('UPDATE public."ProjectUserAssignment" SET "userId"=\'peer\''));
    await denied(()=>app.query('DELETE FROM public."ProjectUserAssignment"'));
    await denied(()=>app.query('SET ROLE oserp_migrations_owner'));
    assert.equal((await app.query("SELECT has_table_privilege(current_user,'public.\"ProjectUserAssignment\"','INSERT') allowed")).rows[0].allowed,false);
  });
  report.status='PASS';
})().catch(e=>{report.status='FAIL';report.error=e.message;console.error(e);process.exitCode=1;}).finally(async()=>{
  if(prisma)await prisma.$disconnect();
  for(const c of [app,stranger,legacy,admin])if(c)await c.end();
  if(started) { command('pg_ctl',['-D',path.join(runtime,'data'),'-m','fast','-w','stop']); report.clusterStopped=true; }
  report.sources=Object.fromEntries([migration,'src/app/actions/project-intake.ts','src/lib/uboq/project-ownership.ts', 'scripts/uboq/phase9-bootstrap-fixture.cjs'].map(p=>[p,crypto.createHash('sha256').update(read(p).replaceAll('\r\n','\n')).digest('hex')]));
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');
  console.log(report.status+' '+report.checks.length+' focused checks; cluster stopped: '+Boolean(report.clusterStopped));
});
