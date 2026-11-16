import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),s=require('./g02-bounded-support.cjs'),{assert}=s;
const {provisionEphemeralRestrictedLogins}=require('./provision-local-restricted-logins');
const report:any={created_at:new Date().toISOString(),checks:[]};
const db='testdb_uboq_closure_'+s.crypto.randomBytes(6).toString('hex');let admin:any,test:any,original:any,created=false;
const file='artifacts/uboq/g02-r3/targeted-review-closure/m02-rollback.json';
(async()=>{
 admin=await s.connect();report.cluster=await s.identity(admin);assert.match(db,/^testdb_uboq_closure_[a-f0-9]+$/);
 await admin.query('CREATE DATABASE "'+db+'"');created=true;
 test=await s.connect({database:db});assert.equal((await test.query('SELECT current_database() db')).rows[0].db,db);
 await test.query('CREATE TABLE public._uboq_rls_trust_anchor("anchorId" text PRIMARY KEY,"secretHex" text,"rotatedAt" timestamptz DEFAULT now())');
 await test.query('INSERT INTO _uboq_rls_trust_anchor("anchorId","secretHex") VALUES(\'PRIMARY\',$1)',[s.crypto.randomBytes(32).toString('hex')]);
 const snapshot=async()=>({roles:(await test.query("SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls,rolpassword,rolvaliduntil FROM pg_authid WHERE rolname IN ('oserp_compat_login','oserp_legacy_login','oserp_maint_login') ORDER BY rolname")).rows,
 memberships:(await test.query('SELECT roleid,member,grantor,admin_option FROM pg_auth_members ORDER BY roleid,member,grantor')).rows,
 acl:(await test.query('SELECT datacl FROM pg_database WHERE datname=$1',[db])).rows,
 anchor:(await test.query('SELECT * FROM _uboq_rls_trust_anchor ORDER BY "anchorId"')).rows});
 const before=await snapshot();let injected=0,rolesAltered=0,grants=0,anchorChanged=false;
 original=s.pg.Client.prototype.query;
 s.pg.Client.prototype.query=async function(this:any,...args:any[]){
  const text=typeof args[0]==='string'?args[0]:args[0]?.text;
  if(this.connectionParameters.database===db){
   if(/^ALTER ROLE .* PASSWORD/.test(text))rolesAltered++;
   if(/^GRANT oserp_/.test(text))grants++;
   if(text==='COMMIT'){
    const inside=(await original.call(this,'SELECT * FROM _uboq_rls_trust_anchor')).rows;
    anchorChanged=inside[0].secretHex!==before.anchor[0].secretHex;assert.ok(anchorChanged);assert.equal(rolesAltered,3);assert.equal(grants,3);
    injected++;return original.call(this,'SELECT 1/0 /* SYNTHETIC_CLOSURE_M02_LATE_FAILURE */');
   }
  }
  return original.apply(this,args);
 };
 const u=new URL('postgresql://127.0.0.1');u.hostname=s.config.host;u.port=String(s.config.port);u.pathname='/'+db;u.username=s.config.user;u.password=s.config.password;
 try{await assert.rejects(()=>provisionEphemeralRestrictedLogins(u.toString()),(e:any)=>e.code==='22012');}finally{s.pg.Client.prototype.query=original;original=null;}
 assert.equal(injected,1);const after=await snapshot();assert.deepEqual(after,before);
 report.database=db;report.injected_after={roles_altered:rolesAltered,membership_grants:grants,trust_anchor_changed_inside_transaction:anchorChanged};
 report.snapshot_hashes={before:s.hash(JSON.stringify(before)),after:s.hash(JSON.stringify(after))};
 report.checks=[{name:'actual unmodified multi-role provisioner late SQL failure rolls back all role credentials/attributes, memberships, CONNECT ACL and trust anchor',result:'PASS'}];
 report.status='PASS';
})().catch((e:any)=>{report.status='FAIL';report.error={message:e.message,code:e.code};process.exitCode=1;}).finally(async()=>{
 if(original)s.pg.Client.prototype.query=original;
 if(test)await test.end();
 if(admin){if(created){assert.match(db,/^testdb_uboq_closure_[a-f0-9]+$/);await admin.query('DROP DATABASE "'+db+'"');report.disposable_database_removed=true;}await admin.end();}
 s.fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
});
