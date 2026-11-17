'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {loadTs}=require('./security-test-harness.cjs');
const permissionModel=fs.readFileSync('prisma/managed-pg18-rc-v1/schema.prisma','utf8').match(/model RolePermission \{([\s\S]*?)\n\}/)[1];
const fields=Array.from(permissionModel.matchAll(/^\s+(can\w+)\s+Boolean/gm),match=>match[1]);
assert.equal(fields.length,22);
const modules=['PAYMENT_ISSUANCE','PROJECT_SCHEDULING','Scheduling'];
function load(primary,assignedGuest=false){
  const denied=modules.map(moduleName=>({moduleName,...Object.fromEntries(fields.map(f=>[f,false]))}));
  const configured=primary==='SUPER_ADMIN'?denied.map(row=>({...row,...Object.fromEntries(fields.map(f=>[f,true]))})):denied;
  const role={roleCode:primary,roleName:primary,isActive:true,rolePermissions:[...configured,{moduleName:'DASHBOARD',canView:true,canCreate:false}]};
  const prisma={user:{findUnique:async()=>({role:primary,status:'ACTIVE',lockedUntil:null})},userRole:{findMany:async()=>assignedGuest?[{role:{...role,roleCode:'GUEST_USER',roleName:'GUEST_USER'}}]:[]},role:{findFirst:async()=>role}};
  const exports={};
  const result=ts.transpileModule(fs.readFileSync('src/lib/permissions.ts','utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
  assert.equal(result.diagnostics.length,0);
  vm.runInNewContext(result.outputText,{exports,require:n=>n==='@/lib/prisma'?{prisma}:n==='next/headers'?{cookies:async()=>({get:()=>undefined})}:n==='./authorizationActions'?loadTs('src/lib/authorizationActions.ts'):(()=>{throw new Error('Unexpected dependency');})()});
  return exports;
}
for(const guest of ['GUEST_USER','GUEST USER'])test(`${guest} honors explicit deny in user and simulated role paths`,async()=>{
  const api=load(guest);
  for(const permissions of [await api.getUserPermissions('synthetic'),await api.getPermissionsForRole(guest)]){
    for(const mod of modules)for(const field of fields)assert.equal(permissions[mod][field],false);
    assert.equal(permissions.DASHBOARD.canView,true);assert.equal(permissions.DASHBOARD.canCreate,false);
  }
  assert.equal(await api.hasPermission('synthetic','PROJECT_SCHEDULING','canView'),false);
});
test('assigned guest role honors explicit deny without changing role assignments',async()=>{
  const permissions=await load('ACCOUNTANT',true).getUserPermissions('synthetic');
  for(const mod of modules)for(const field of fields)assert.equal(permissions[mod][field],false);
});
test('SUPER_ADMIN bypass remains intact',async()=>{
  const api=load('SUPER_ADMIN');
  assert.equal(await api.hasPermission('synthetic','PROJECT_SCHEDULING','canView'),true);
  assert.equal((await api.getPermissionsForRole('SUPER_ADMIN')).IS_ADMIN,true);
});
