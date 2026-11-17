'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {loadTs}=require('./security-test-harness.cjs');
function authHarness(valid,attempts=0){
  let provider;
  const api=loadTs('src/auth.ts',{
    'next-auth':{__esModule:true,default:config=>{provider=config.providers[0];return {};}},
    'next-auth/providers/credentials':{__esModule:true,default:config=>config},
    'bcryptjs':{__esModule:true,default:{compare:async()=>valid}},
    '@/lib/prisma':{prisma:{user:{findFirst:async()=>({id:'synthetic',role:'SUPER_ADMIN',status:'ACTIVE',passwordHash:'synthetic-placeholder',failedLoginAttempts:attempts,sessionVersion:2}),update:async()=>{throw Object.assign(new Error('permission denied'),{code:'42501'});}}}},
    './auth.config':{authConfig:{}},
  });
  return provider.authorize;
}
test('unresolved login-counter authorization: wrong password never authenticates when UPDATE is denied',async()=>{
  await assert.rejects(()=>authHarness(false)({email:'synthetic@example.invalid',password:'synthetic'}),e=>e.code==='42501');
});
test('unresolved login-counter authorization: valid login with a nonzero counter fails on denied reset',async()=>{
  await assert.rejects(()=>authHarness(true,1)({email:'synthetic@example.invalid',password:'synthetic'}),e=>e.code==='42501');
});
test('current owner login with valid credentials and zero counter remains functional',async()=>{
  const result=await authHarness(true)({email:'synthetic@example.invalid',password:'synthetic'});
  assert.equal(result.role,'SUPER_ADMIN');
});
test('unresolved recovery authorization denies token creation and delivery when rate-limit access fails',async()=>{
  let tokens=0,emails=0;
  const recovery=loadTs('src/app/actions/recovery.ts',{
    '@/lib/prisma':{prisma:{passwordRecoveryRateLimit:{findFirst:async()=>{throw Object.assign(new Error('permission denied'),{code:'42501'});}},passwordRecoveryToken:{create:async()=>{tokens++;}}}},
    'crypto':require('node:crypto'),'bcryptjs':{},
    'next/headers':{headers:async()=>new Map()},
    '@/lib/services/PasswordRecoveryMailer':{PasswordRecoveryMailer:{isConfigured:()=>true,sendResetLink:async()=>{emails++;return true;}}},
    '@/lib/passwordPolicy':{validatePasswordPolicy:()=>({valid:true})},
  });
  const result=await recovery.requestPasswordReset('synthetic@example.invalid');
  assert.equal(result.success,true);assert.equal(tokens,0);assert.equal(emails,0);
});
