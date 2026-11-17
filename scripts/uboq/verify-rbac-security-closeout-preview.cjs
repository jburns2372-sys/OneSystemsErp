'use strict';
// Read-only Preview regression. This script cannot import or modify RBAC records.
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createNeonWsClient,endPgClientBounded}=require('./neon-ws-transport.cjs');
const {loadTs}=require('./security-test-harness.cjs');
const {PERMISSION_FIELDS:fields}=loadTs('src/lib/authorizationActions.ts');
const dir='artifacts/uboq/phase8';
const baselinePath=`${dir}/rbac-security-closeout-baseline.json`;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const target={database:'oserp_uboq_preview',project_id:'long-recipe-20782583',branch_id:'br-quiet-rice-bc1edkvd',endpoint_id:'ep-small-paper-bcyvlhat'};
async function main(){
  assert.ok(['--baseline','--verify'].includes(process.argv[2]));
  const raw=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Add-Type -AssemblyName System.Security; [Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes('.env.preview-activation/credential.dpapi'),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)))"],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000});
  const url=new URL(raw);
  assert.ok(['ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech','ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech'].includes(url.hostname)&&url.pathname==='/oserp_uboq_preview');
  const db=createNeonWsClient(raw,'oserp_preview_rbac_security_closeout_readonly',{connectionTimeoutMillis:20000,query_timeout:30000});db.on('error',()=>{});
  try{
    await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const identity=(await db.query(`SELECT current_database() AS database,current_setting('neon.project_id',true) AS project_id,current_setting('neon.branch_id',true) AS branch_id,current_setting('neon.endpoint_id',true) AS endpoint_id`)).rows[0];
    assert.deepEqual(identity,target);
    const config={};for(const table of ['Role','SystemRole','Module','RolePermission'])config[table]=(await db.query(`SELECT row_to_json(t) AS r FROM "${table}" t ORDER BY id`)).rows.map(x=>x.r);
    const protectedDigests={};for(const table of ['User','UserRole','ProjectUserAssignment'])protectedDigests[table]=digest((await db.query(`SELECT row_to_json(t) AS r FROM "${table}" t ORDER BY id`)).rows);
    const counts=Object.fromEntries(Object.entries(config).map(([k,v])=>[k,v.length]));
    assert.deepEqual(counts,{Role:32,SystemRole:32,Module:23,RolePermission:470});
    const baseline={recordedAt:new Date().toISOString(),identity,counts,rbacDigest:digest(config),protectedDigests};
    if(process.argv[2]==='--baseline'){
      if(fs.existsSync(baselinePath)){const prior=JSON.parse(fs.readFileSync(baselinePath));assert.equal(prior.rbacDigest,baseline.rbacDigest);assert.deepEqual(prior.protectedDigests,protectedDigests);}
      else fs.writeFileSync(baselinePath,JSON.stringify(baseline,null,2)+'\n',{flag:'wx'});
      await db.query('COMMIT');console.log(JSON.stringify({status:'READ_ONLY_BASELINE_PASS',counts,rbacDigest:baseline.rbacDigest}));return;
    }
    const before=JSON.parse(fs.readFileSync(baselinePath));assert.equal(baseline.rbacDigest,before.rbacDigest);assert.deepEqual(protectedDigests,before.protectedDigests);
    const authorizationFindings=(await db.query(`SELECT
      has_column_privilege('oserp_preview_runtime_app','public."User"','failedLoginAttempts','UPDATE') AS counter_update,
      has_column_privilege('oserp_preview_runtime_app','public."User"','lockedUntil','UPDATE') AS lock_update,
      has_table_privilege('oserp_preview_runtime_app','public."PasswordRecoveryRateLimit"','SELECT') AS recovery_rate_select,
      has_table_privilege('oserp_preview_runtime_app','public."PasswordRecoveryRateLimit"','INSERT') AS recovery_rate_insert,
      has_table_privilege('oserp_preview_runtime_app','public."PasswordRecoveryRateLimit"','UPDATE') AS recovery_rate_update,
      has_table_privilege('oserp_preview_runtime_app','public."PasswordRecoveryToken"','SELECT') AS recovery_token_select`)).rows[0];
    await db.query('COMMIT');
    let permissionComparisons=0,missingModuleDenyChecks=0,newModuleDenyChecks=0,guestApprovedViewChecks=0;
    const guestSummary=[];
    for(const role of config.Role){
      const roleRows=config.RolePermission.filter(p=>p.roleId===role.id);
      const prisma={user:{findUnique:async()=>({role:role.roleCode,status:'ACTIVE',lockedUntil:null})},userRole:{findMany:async()=>[]},role:{findFirst:async({where})=>{const r=config.Role.find(r=>where.OR.some(q=>Object.entries(q).every(([k,v])=>r[k]===v)));return r?{...r,rolePermissions:config.RolePermission.filter(p=>p.roleId===r.id)}:null;}}};
      const api=loadTs('src/lib/permissions.ts',{'@/lib/prisma':{prisma},'next/headers':{cookies:async()=>({get:()=>undefined})}});
      const direct=await api.getPermissionsForRole(role.roleCode),user=await api.getUserPermissions('synthetic-read-only-actor');
      const guest=['GUEST USER','GUEST_USER'].includes(role.roleCode);let views=0;
      for(const module of config.Module){
        const stored=roleRows.find(p=>p.moduleId===module.id);
        for(const field of fields){
          const expected=!!(stored?.[field]===true&&(!guest||(field==='canView'&&!['SYSTEM_ROLES','SYSTEM_SETTINGS','USERS'].includes(module.moduleName))));
          assert.equal(direct[module.moduleName]?.[field]===true,expected);assert.equal(user[module.moduleName]?.[field]===true,expected);permissionComparisons+=2;
        }
        if(!stored){assert.equal(direct[module.moduleName],undefined);assert.equal(user[module.moduleName],undefined);missingModuleDenyChecks++;}
        if(guest&&direct[module.moduleName]?.canView===true){assert.equal(stored.canView,true);views++;guestApprovedViewChecks++;}
        if(role.roleCode!=='SUPER_ADMIN'&&['PAYMENT_ISSUANCE','PROJECT_SCHEDULING','Scheduling'].includes(module.moduleName)){assert.ok(fields.every(f=>direct[module.moduleName]?.[f]!==true));newModuleDenyChecks++;}
      }
      for(const field of fields){assert.equal(await api.hasPermission('synthetic-read-only-actor','UNCONFIGURED_SECURITY_CLOSEOUT_MODULE',field),false);missingModuleDenyChecks++;}
      assert.equal(await api.hasPermission('synthetic-read-only-actor','DASHBOARD','UNSUPPORTED_ACTION'),false);
      if(guest)guestSummary.push({roleCode:role.roleCode,explicitViewGrants:views,automaticAuditLogGrants:0});
    }
    assert.equal(newModuleDenyChecks,93);assert.equal(guestApprovedViewChecks,18);
    const permissionSourceSha256=crypto.createHash('sha256').update(fs.readFileSync('src/lib/permissions.ts','utf8').replace(/\r\n/g,'\n')).digest('hex');
    const result={recordedAt:new Date().toISOString(),status:'PASS_RBAC_TARGETED_READ_ONLY_PREVIEW_REGRESSION',identity,counts,rbacDigest:baseline.rbacDigest,rbacConfigurationUnchanged:true,credentialsAndAssignmentsUnchanged:true,databaseWrites:0,databaseImportRepeated:false,permissionComparisons,missingModuleDenyChecks,newModuleDenyChecks,guestSummary,permissionSourceSha256,method:'Actual authorization source executed in isolated VM against read-only live Preview configuration; synthetic actor identities only in memory, no accounts or sessions created',authorizationFindings,productionModified:false};
    fs.writeFileSync(`${dir}/rbac-security-closeout-preview-regression.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
  }finally{await endPgClientBounded(db);}
}
main().catch(e=>{console.error(JSON.stringify({status:'READ_ONLY_PREVIEW_REGRESSION_FAILED',type:e.name,code:e.code||null}));process.exitCode=1;});
