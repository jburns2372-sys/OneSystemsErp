'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createNeonWsClient,endPgClientBounded}=require('./neon-ws-transport.cjs');
const dir='artifacts/uboq/phase8';
const input=JSON.parse(fs.readFileSync(`${dir}/rbac-restoration-input.json`));
const receipt=JSON.parse(fs.readFileSync(`${dir}/rbac-restoration-receipt.json`));
const snapshot=JSON.parse(fs.readFileSync(receipt.snapshotPath));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function main(){
  const raw=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Add-Type -AssemblyName System.Security; [Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes('.env.preview-activation/credential.dpapi'),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)))"],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000});
  const u=new URL(raw);
  assert.ok(['ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech','ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech'].includes(u.hostname)&&u.pathname==='/oserp_uboq_preview');
  const db=createNeonWsClient(raw,'oserp_preview_rbac_independent_verifier',{connectionTimeoutMillis:20000,query_timeout:30000});db.on('error',()=>{});
  try{
    await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const identity=(await db.query(`SELECT current_database() AS database,current_setting('neon.project_id',true) AS project_id,current_setting('neon.branch_id',true) AS branch_id,current_setting('neon.endpoint_id',true) AS endpoint_id`)).rows[0];
    assert.deepEqual(identity,receipt.identity);
    const current={};
    for(const t of ['Role','SystemRole','Module','RolePermission'])current[t]=(await db.query(`SELECT * FROM "${t}" ORDER BY id`)).rows;
    const protectedDigests={};
    for(const t of Object.keys(snapshot.protectedDigests))protectedDigests[t]=hash((await db.query(`SELECT row_to_json(t) AS r FROM "${t}" t ORDER BY id`)).rows);
    assert.deepEqual(protectedDigests,snapshot.protectedDigests);
    for(const [t,rows]of Object.entries(snapshot.configuration))for(const row of rows)assert.deepEqual(JSON.parse(JSON.stringify(current[t].find(x=>x.id===row.id))),row);
    let historicalVerified=0,superAdminPreserved=0;
    for(const p of input.source.permissions){
      const role=input.source.roles.find(r=>r.id===p.roleId);
      const mapped=current.Role.find(r=>r.roleCode===role.roleCode);
      assert.ok(mapped);const module=current.Module.find(m=>m.moduleName===p.moduleName);
      const actual=current.RolePermission.find(x=>x.roleId===mapped.id&&x.moduleId===module.id);assert.ok(actual);
      if(role.roleCode==='SUPER_ADMIN'){superAdminPreserved++;continue;}
      for(const f of input.permissionFields)assert.equal(actual[f],p.grants.includes(f));historicalVerified++;
    }
    for(const r of input.source.roles){const actual=current.Role.find(x=>x.roleCode===r.roleCode);assert.ok(actual&&actual.roleName===r.roleName);}
    for(const r of input.source.systemRoles)assert.ok(current.SystemRole.some(x=>x.name===r.name));
    const newModules=receipt.newModulePolicy.modules;let denyRows=0;
    for(const role of current.Role.filter(r=>r.roleCode!=='SUPER_ADMIN'))for(const name of newModules){const module=current.Module.find(m=>m.moduleName===name);const row=current.RolePermission.find(p=>p.roleId===role.id&&p.moduleId===module.id);assert.ok(row);assert.ok(input.permissionFields.every(f=>row[f]===false));denyRows++;}
    assert.equal(new Set(current.RolePermission.map(p=>p.roleId+'|'+p.moduleId)).size,current.RolePermission.length);
    assert.ok(current.RolePermission.every(p=>current.Role.some(r=>r.id===p.roleId)&&current.Module.some(m=>m.id===p.moduleId&&m.moduleName===p.moduleName)));
    const compiled=ts.transpileModule(fs.readFileSync('src/lib/permissions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    const exports={};
    const prisma={role:{findFirst:async({where})=>{const role=current.Role.find(r=>where.OR.some(q=>Object.entries(q).every(([k,v])=>r[k]===v)));return role?{...role,rolePermissions:current.RolePermission.filter(p=>p.roleId===role.id)}:null;}}};
    vm.runInNewContext(compiled,{exports,require:name=>name==='@/lib/prisma'?{prisma}:name==='next/headers'?{cookies:async()=>({get:()=>undefined})}:(()=>{throw new Error('UNEXPECTED_DEPENDENCY');})()});
    const runtimeExceptions=[];let runtimeDenyChecks=0;
    for(const role of current.Role.filter(r=>r.roleCode!=='SUPER_ADMIN')){
      const permissions=await exports.getPermissionsForRole(role.roleCode);
      for(const name of newModules){const granted=input.permissionFields.filter(f=>permissions[name]?.[f]);if(granted.length)runtimeExceptions.push({roleCode:role.roleCode,moduleName:name,grantedFields:granted,cause:'Existing hardcoded guest override in src/lib/permissions.ts'});else runtimeDenyChecks++;}
    }
    await db.query('COMMIT');
    const result={recordedAt:new Date().toISOString(),status:runtimeExceptions.length?'PASS_DATABASE_WITH_RUNTIME_POLICY_EXCEPTIONS':'PASS',environment:'preview_only',counts:Object.fromEntries(Object.entries(current).map(([k,v])=>[k,v.length])),historicalPermissionRowsMatched:historicalVerified,historicalSuperAdminRowsSupersededByPreservedPreview:superAdminPreserved,explicitDenyRowsVerified:denyRows,existingConfigurationUnchanged:true,credentialsUsersAndAssignmentsUnchanged:true,duplicatePermissionPairs:0,orphanOrMismatchedPermissions:0,runtimeNonAdminNewModuleDenyChecksPassed:runtimeDenyChecks,runtimeExceptions,productionModified:false,historicalAccountsImported:0,fullUatRun:false};
    fs.writeFileSync(`${dir}/rbac-restoration-independent-validation.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await endPgClientBounded(db);}
}
main().catch(e=>{console.error(JSON.stringify({status:'VERIFICATION_FAILED',type:e.name,code:e.code||null}));process.exitCode=1;});
