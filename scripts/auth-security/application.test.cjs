'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
function load(file,deps={},env={}){const exports={},logs=[];const c=ts.transpileModule(fs.readFileSync(file,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});assert.equal(c.diagnostics.length,0);vm.runInNewContext(c.outputText,{exports,process:{env},Buffer,URL,Date,setTimeout:callback=>{callback();return 0;},console:{error:(...args)=>logs.push(args.join(' '))},require:name=>{assert.ok(Object.hasOwn(deps,name),'Unexpected dependency '+name);return deps[name];}},{filename:file});return{api:exports,logs};}
const token='07'.repeat(32),tokenHash=crypto.createHash('sha256').update(token).digest('hex');
function recovery(options={}){const queued=[],calls={prepare:[],deliver:[],record:[],hash:[],reset:[]};const db={prepareRecovery:async(...args)=>{calls.prepare.push(args);if(options.prepareError)throw new Error('private DB failure');return options.absent?null:{email:'synthetic@example.invalid',tokenId:'synthetic-token'};},recordDelivery:async(...args)=>{calls.record.push(args);return true;},inspectRecovery:async()=>options.invalid?null:{email:'synthetic@example.invalid'},resetPassword:async(...args)=>{calls.reset.push(args);if(options.resetError)throw new Error('private DB failure');return options.resetSuccess!==false;}};const result=load('src/app/actions/recovery.ts',{'node:crypto':{...crypto,randomBytes:size=>Buffer.alloc(size,7)},'bcryptjs':{hash:async(...args)=>{calls.hash.push(args);return 'synthetic-password-hash';}},'next/server':{after:callback=>queued.push(callback)},'@/lib/auth-security/database':{authDatabase:db},'@/lib/services/PasswordRecoveryMailer':{PasswordRecoveryMailer:{isConfigured:()=>options.configured!==false,dispatchResetLink:async(...args)=>{calls.deliver.push(args);if(options.providerThrows)throw new Error('provider-private-payload');return options.providerRejects?{accepted:false,providerId:null}:{accepted:true,providerId:'synthetic-provider'};}}},'@/lib/passwordPolicy':load('src/lib/passwordPolicy.ts').api});return{...result,queued,calls};}
test('recovery response is identical for unknown, eligible, provider-missing and persistence-error cases',async()=>{const variants=[{}, {absent:true},{configured:false},{prepareError:true}];const responses=[];for(const v of variants)responses.push(JSON.stringify(await recovery(v).api.requestPasswordReset('synthetic@example.invalid')));assert.equal(new Set(responses).size,1);assert.ok(!responses[0].includes('synthetic@'));assert.ok(!responses[0].includes(token));});
test('provider work is deferred until after the generic response',async()=>{const h=recovery();await h.api.requestPasswordReset('  Synthetic@Example.Invalid ');assert.equal(h.calls.deliver.length,0);assert.equal(h.calls.prepare[0][0],'synthetic@example.invalid');assert.equal(h.calls.prepare[0][1],tokenHash);assert.equal(h.queued.length,1);await h.queued[0]();assert.equal(h.calls.deliver[0][1],token);assert.equal(h.calls.record[0][0],tokenHash);assert.equal(h.calls.record[0][1],true);});
for(const options of [{providerRejects:true},{providerThrows:true}])test('provider failure records token revocation: '+JSON.stringify(options),async()=>{const h=recovery(options);await h.api.requestPasswordReset('synthetic@example.invalid');await h.queued[0]();assert.equal(h.calls.record.at(-1)[1],false);assert.equal(h.calls.record.at(-1)[2],null);assert.ok(!h.logs.join(' ').includes(token));assert.ok(!h.logs.join(' ').includes('synthetic@'));});
test('invalid request identifiers never reach the auth operation',async()=>{for(const input of ['',null,{},'not-an-email','a'.repeat(255)+'@example.invalid']){const h=recovery();assert.equal((await h.api.requestPasswordReset(input)).success,true);assert.equal(h.calls.prepare.length,0);}});
test('inactive or unknown account produces no provider dispatch',async()=>{const h=recovery({absent:true});await h.api.requestPasswordReset('synthetic@example.invalid');await h.queued[0]();assert.equal(h.calls.deliver.length,0);});
test('password reset hashes with cost 12 and sends only digests to the atomic operation',async()=>{const h=recovery();assert.equal((await h.api.executePasswordReset(token,'Long-synthetic-password!')).success,true);assert.equal(h.calls.hash[0][1],12);assert.equal(h.calls.reset[0][0],tokenHash);assert.equal(h.calls.reset[0][1],'synthetic-password-hash');});
test('invalid, expired, revoked and consumed tokens share a generic failure',async()=>{const h=recovery({invalid:true});const expected=JSON.stringify(await h.api.executePasswordReset(token,'Long-synthetic-password!'));assert.equal(expected,JSON.stringify(await h.api.executePasswordReset('malformed','Long-synthetic-password!')));assert.equal(h.calls.hash.length,0);});
test('a racing token consumption cannot become a successful application reset',async()=>{const h=recovery({resetSuccess:false});assert.equal((await h.api.executePasswordReset(token,'Long-synthetic-password!')).success,false);});
test('reset persistence failure stays generic and does not expose tokens or DB errors',async()=>{const h=recovery({resetError:true});const result=await h.api.executePasswordReset(token,'Long-synthetic-password!');assert.equal(result.success,false);assert.ok(!JSON.stringify(result).includes('private'));assert.ok(!h.logs.join().includes(token));});
test('password policy and bcrypt UTF-8 boundary are enforced before mutation',async()=>{const h=recovery();for(const password of ['short','password123','😀'.repeat(19),'synthetic@example.invalid'])assert.equal((await h.api.executePasswordReset(token,password)).success,false);assert.equal(h.calls.reset.length,0);});

function login(options={}){
 const calls={attempt:[]};
 const actor={id:'synthetic-actor',role:'SUPER_ADMIN',sessionVersion:2,mustChangePassword:false};
 const h=load('src/lib/auth-security/login.ts',{'./database':{authDatabase:{
   verifyLogin:async(...args)=>{calls.attempt.push(args);if(options.error)throw new Error('private DB error');return options.denied?null:actor;}
 }}});
 return{...h,calls,actor};
}
test('valid login returns only the database-proven minimal actor',async()=>{
 const h=login();const result=await h.api.authenticateCredentials('Synthetic@Example.Invalid','synthetic-password');
 assert.equal(result.id,h.actor.id);assert.equal(result.passwordHash,undefined);
 assert.deepEqual(Array.from(h.calls.attempt[0]),['synthetic@example.invalid','synthetic-password']);
});
test('a rejected login returns a generic failure',async()=>{
 const h=login({denied:true});assert.equal(await h.api.authenticateCredentials('synthetic@example.invalid','wrong'),null);
 assert.equal(h.calls.attempt[0][1],'wrong');
});
test('database failures do not leak internal detail',async()=>{
 const h=login({error:true});assert.equal(await h.api.authenticateCredentials('synthetic@example.invalid','wrong'),null);
 assert.ok(!h.logs.join().includes('private'));assert.ok(!h.logs.join().includes('wrong'));
});
test('malformed NUL and oversized credentials cannot call database',async()=>{
 const h=login();for(const [email,password]of [[{},'value'],['x',{}],['a'.repeat(255),'x'],['a','x'.repeat(1025)],['a','nul\0here']])
   assert.equal(await h.api.authenticateCredentials(email,password),null);
 assert.equal(h.calls.attempt.length,0);
});

const validEnv={PASSWORD_RECOVERY_EMAIL_PROVIDER:'resend',PASSWORD_RECOVERY_EMAIL_FROM:'OneSystemsERP <security@example.invalid>',RESEND_API_KEY:'re_synthetic_key_never_contact_provider',APP_BASE_URL:'https://oserp-auth-preview-verify.vercel.app',VERCEL_URL:'oserp-auth-preview-verify.vercel.app',VERCEL_GIT_COMMIT_REF:'fix/oserp-p8-auth-security-closeout',VERCEL_ENV:'preview'};
function mailer(options={}){const calls=[];class Resend{constructor(){this.emails={send:async value=>{calls.push(value);if(options.throws)throw new Error('private provider payload '+token);return options.response||{data:{id:'synthetic-provider'},error:null};}};}}const h=load('src/lib/services/PasswordRecoveryMailer.ts',{'resend':{Resend}},{...validEnv,...options.env});return{...h,calls};}
test('configured Resend acceptance returns the receipt ID and a pinned Preview link',async()=>{const h=mailer();assert.equal(h.api.PasswordRecoveryMailer.isConfigured(),true);const r=await h.api.PasswordRecoveryMailer.dispatchResetLink('synthetic@example.invalid',token);assert.equal(r.accepted,true);assert.equal(r.providerId,'synthetic-provider');assert.ok(h.calls[0].text.includes(validEnv.APP_BASE_URL+'/reset-password?token='+token));});
for(const env of [{RESEND_API_KEY:''},{PASSWORD_RECOVERY_EMAIL_PROVIDER:'smtp'},{PASSWORD_RECOVERY_EMAIL_FROM:''},{PASSWORD_RECOVERY_EMAIL_FROM:'onboarding@resend.dev'},{PASSWORD_RECOVERY_EMAIL_FROM:'Bad <security@example.invalid'},{PASSWORD_RECOVERY_EMAIL_FROM:'security@example.invalid\r\nBcc:x@example.invalid'},{APP_BASE_URL:'http://example.invalid'},{APP_BASE_URL:'https://production.example.invalid'},{APP_BASE_URL:validEnv.APP_BASE_URL+':8443'},{VERCEL_ENV:'production'},{VERCEL_URL:''},{VERCEL_URL:'other-branch.vercel.app'},{VERCEL_GIT_COMMIT_REF:'release/oserp-proj-uboq-001'},{APP_BASE_URL:'https://other-branch.vercel.app'}])test('unsafe mail configuration fails closed: '+Object.keys(env).join(','),async()=>{const h=mailer({env});assert.equal(h.api.PasswordRecoveryMailer.isConfigured(),false);assert.equal((await h.api.PasswordRecoveryMailer.dispatchResetLink('synthetic@example.invalid',token)).accepted,false);assert.equal(h.calls.length,0);});
for(const failure of [{response:{data:null,error:{message:'private payload '+token}}},{response:{data:{},error:null}},{throws:true}])test('Resend failures cannot be mistaken for delivery acceptance',async()=>{const h=mailer(failure);assert.equal((await h.api.PasswordRecoveryMailer.dispatchResetLink('synthetic@example.invalid',token)).accepted,false);assert.ok(!h.logs.join().includes(token));assert.ok(!h.logs.join().includes('synthetic@'));});
test('malformed recovery tokens are never sent',async()=>{const h=mailer();assert.equal((await h.api.PasswordRecoveryMailer.dispatchResetLink('synthetic@example.invalid','<malformed>')).accepted,false);assert.equal(h.calls.length,0);});

test('a reset sessionVersion increment makes old sessions unusable and permits the new version',async()=>{let version=0;const h=load('src/lib/dal/auth.ts',{'@/auth':{auth:async()=>({user:{id:'synthetic',sessionVersion:0}})},'@/lib/prisma':{prisma:{user:{findUnique:async()=>({id:'synthetic',status:'ACTIVE',role:'SUPER_ADMIN',sessionVersion:version,mustChangePassword:false,lockedUntil:null})}}}});assert.ok(await h.api.verifySession());version=1;assert.equal(await h.api.verifySession(),null);});
test('the public login action maps every authentication-service error to the same generic failure',async()=>{const outputs=[];for(const error of [new Error('inactive'),new Error('locked'),new Error('counter failure'),{type:'CredentialsSignin'}]){const h=load('src/app/actions/auth.ts',{'@/auth':{signIn:async()=>{throw error;},signOut:async()=>{}},'next/headers':{cookies:async()=>({delete(){}})}});outputs.push(JSON.stringify(await h.api.login({get:key=>key==='email'?'synthetic@example.invalid':'value'})));}assert.equal(new Set(outputs).size,1);assert.ok(outputs[0].includes('Invalid email or password'));});

const authUrl='postgresql://oserp_preview_auth_service:synthetic-password@ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech/oserp_uboq_preview?sslmode=disable';
function database(env){const calls={configs:[],queries:[]};class Pool{constructor(config){calls.configs.push(config);}on(){}async query(...args){calls.queries.push(args);return{rows:[{result:null}]};}}return{...load('src/lib/auth-security/database.ts',{'server-only':{},'pg':{Pool}},env),calls};}
test('auth database adapter uses verified TLS and parameterized execute-only operations',async()=>{const h=database({AUTH_DATABASE_URL:authUrl});await h.api.authDatabase.verifyLogin("untrusted'); DROP TABLE User;--", "synthetic-secret");assert.equal(h.calls.configs[0].ssl.rejectUnauthorized,true);assert.equal(h.calls.configs[0].user,'oserp_preview_auth_service');assert.equal(h.calls.queries[0][0],'SELECT oserp_auth_private.login_attempt($1,$2) AS result');assert.equal(h.calls.queries[0][1][0],"untrusted'); DROP TABLE User;--");});
for(const env of [{DATABASE_URL:authUrl},{AUTH_DATABASE_URL:authUrl.replace('oserp_preview_auth_service','oserp_preview_runtime_app')},{AUTH_DATABASE_URL:authUrl,VERCEL_ENV:'production'},{AUTH_DATABASE_URL:authUrl.replace('oserp_uboq_preview','production')},{AUTH_DATABASE_URL:authUrl,NODE_TLS_REJECT_UNAUTHORIZED:'0'}])test('unsafe or missing auth-only credentials are rejected without an ERP fallback',async()=>{const h=database(env);await assert.rejects(()=>h.api.authDatabase.verifyLogin('synthetic@example.invalid','synthetic-secret'),/AUTH_DATABASE/);assert.equal(h.calls.configs.length,0);});

test('delivery result requires a different database login with the exact dispatch identity',async()=>{
  const deliveryUrl=authUrl.replace('oserp_preview_auth_service','oserp_preview_delivery_service');
  const h=database({AUTH_DATABASE_URL:authUrl,AUTH_DELIVERY_DATABASE_URL:deliveryUrl});
  await h.api.authDatabase.recordDelivery('a'.repeat(64),true,'synthetic-provider-id');
  assert.equal(h.calls.configs[0].user,'oserp_preview_delivery_service');
  assert.equal(h.calls.queries[0][0],'SELECT oserp_auth_private.recovery_delivery_result($1,$2,$3) AS result');
});
test('delivery attestation fails closed when the independent credential is missing or mis-scoped',async()=>{
  for(const env of [
    {AUTH_DATABASE_URL:authUrl},
    {AUTH_DATABASE_URL:authUrl,AUTH_DELIVERY_DATABASE_URL:authUrl},
    {AUTH_DATABASE_URL:authUrl,AUTH_DELIVERY_DATABASE_URL:authUrl.replace('oserp_uboq_preview','production')},
  ]){
    const h=database(env);
    await assert.rejects(()=>h.api.authDatabase.recordDelivery('a'.repeat(64),true,'fake-provider'),/AUTH_DATABASE/);
    assert.equal(h.calls.configs.length,0);
  }
});

test('login request never supplies the old caller-authored proof boolean',async()=>{
 const h=login();await h.api.authenticateCredentials(' test@example.invalid ','Only-synthetic-secret!');
 assert.equal(h.calls.attempt.length,1);assert.equal(h.calls.attempt[0].length,2);
 assert.equal(h.calls.attempt[0][0],'test@example.invalid');
 assert.equal(h.calls.attempt[0][1],'Only-synthetic-secret!');
});
test('login adapter has no legacy snapshot or finish methods',async()=>{
 const h=database({AUTH_DATABASE_URL:authUrl});
 assert.equal(typeof h.api.authDatabase.loginSnapshot,'undefined');
 assert.equal(typeof h.api.authDatabase.finishLogin,'undefined');
 assert.equal(typeof h.api.authDatabase.verifyLogin,'function');
});
test('login errors remain generic independently of service error message',async()=>{
 const h=login({error:true});assert.equal(await h.api.authenticateCredentials('synthetic@example.invalid','ultra-private-value'),null);
 assert.ok(!h.logs.join(' ').includes('ultra-private-value'));
});
test('recovery does not accept NUL-containing passwords incompatible with PostgreSQL text',async()=>{
 const h=recovery();const r=await h.api.executePasswordReset(token,'Long-password\0synthetic');
 assert.equal(r.success,false);assert.equal(h.calls.hash.length,0);assert.equal(h.calls.reset.length,0);
});
