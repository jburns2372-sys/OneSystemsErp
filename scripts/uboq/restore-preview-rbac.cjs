'use strict';
// Additive, Preview-pinned restoration. Never imports users or overwrites rows.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createNeonWsClient, endPgClientBounded } = require('./neon-ws-transport.cjs');
const inputPath = 'artifacts/uboq/phase8/rbac-restoration-input.json';
const out = 'artifacts/uboq/phase8';
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const target = { project_id: 'long-recipe-20782583', branch_id: 'br-quiet-rice-bc1edkvd', endpoint_id: 'ep-small-paper-bcyvlhat', database: 'oserp_uboq_preview' };
const fields = input.permissionFields;
const hash = x => crypto.createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex');
const assert = (v, message) => { if (!v) throw new Error(message); };
const quote = x => '"' + x.replaceAll('"', '""') + '"';
async function identity(db) {
  const row = (await db.query(`SELECT current_database() AS database, current_setting('neon.project_id',true) AS project_id, current_setting('neon.branch_id',true) AS branch_id, current_setting('neon.endpoint_id',true) AS endpoint_id`)).rows[0];
  assert(Object.keys(target).every(k => row[k] === target[k]), 'PREVIEW_IDENTITY_MISMATCH');
  return row;
}
async function state(db) {
  const r = {};
  for (const t of ['Role', 'SystemRole', 'Module', 'RolePermission']) r[t] = (await db.query(`SELECT * FROM ${quote(t)} ORDER BY id`)).rows;
  return r;
}
async function protectedDigests(db) {
  // Digests only: credentials, user data and assignments are never written to artifacts.
  const result = {};
  for (const t of ['User', 'UserRole', 'ProjectAssignment']) {
    const exists = (await db.query('SELECT to_regclass($1) AS t', ['public.' + quote(t)])).rows[0].t;
    if (exists) result[t] = hash((await db.query(`SELECT row_to_json(t) AS r FROM ${quote(t)} t ORDER BY id`)).rows);
  }
  return result;
}
async function schema(db) {
  return (await db.query(`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1) ORDER BY table_name,column_name`, [['Role','SystemRole','Module','RolePermission']])).rows;
}
async function insert(db, table, row) {
  const keys = Object.keys(row);
  await db.query(`INSERT INTO ${quote(table)} (${keys.map(quote).join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`, keys.map(k=>row[k]));
}
async function main() {
  assert(['--check','--apply'].includes(process.argv[2]), 'USE_CHECK_OR_APPLY');
  const raw = execFileSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command', "Add-Type -AssemblyName System.Security; [Console]::Out.Write([Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes('.env.preview-activation/credential.dpapi'),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)))"], {encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000});
  const url = new URL(raw);
  assert(['postgres:','postgresql:'].includes(url.protocol) && ['ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech','ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech'].includes(url.hostname) && url.pathname === '/'+target.database, 'PREVIEW_URL_MISMATCH');
  const db = createNeonWsClient(raw, 'oserp_preview_rbac_restoration', {connectionTimeoutMillis:20000,query_timeout:30000});
  db.on('error',()=>{});
  let committed = false;
  try {
    await db.connect();
    await db.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    await db.query("SET LOCAL lock_timeout='5s'");
    const verifiedIdentity = await identity(db);
    // Stabilize snapshot and ensure no concurrent configuration changes during restoration.
    await db.query('LOCK TABLE "Role", "SystemRole", "Module", "RolePermission" IN SHARE ROW EXCLUSIVE MODE');
    const before = await state(db), protectedBefore = await protectedDigests(db), columns = await schema(db);
    assert(JSON.stringify(columns) === JSON.stringify(input.destinationSchema.columns), 'DESTINATION_SCHEMA_DRIFT');
    const signature = rows => rows.map(({table_name,column_name,data_type,is_nullable})=>({table_name,column_name,data_type,is_nullable}));
    assert(JSON.stringify(signature(columns)) === JSON.stringify(signature(input.sourceSchema.columns)), 'SOURCE_SCHEMA_INCOMPATIBLE');
    assert(fields.length === 22 && fields.every(f=>columns.some(c=>c.table_name==='RolePermission'&&c.column_name===f&&c.data_type==='boolean'&&c.column_default==='false')), 'PERMISSION_SCHEMA_NOT_DENY_DEFAULT');
    assert(input.source.roles.length === 32 && input.source.permissions.length === 374, 'SOURCE_COUNTS_UNEXPECTED');
    const roleByCode = new Map(before.Role.map(r=>[r.roleCode,r]));
    const moduleByName = new Map(before.Module.map(m=>[m.moduleName,m]));
    assert(roleByCode.size===before.Role.length && moduleByName.size===before.Module.length, 'AMBIGUOUS_STABLE_IDENTIFIERS');
    const systemByName = new Map(before.SystemRole.map(r=>[r.name,r]));
    const sourceRoles = new Map(input.source.roles.map(r=>[r.id,r]));
    const sourceModules = new Map(input.source.modules.map(m=>[m.id,m]));
    assert(sourceRoles.size===32 && new Set(input.source.roles.map(r=>r.roleCode)).size===32, 'AMBIGUOUS_SOURCE_ROLES');
    for(const p of input.source.permissions) assert(sourceRoles.has(p.roleId)&&sourceModules.get(p.moduleId)?.moduleName===p.moduleName&&p.grants.every(f=>fields.includes(f)), 'INVALID_SOURCE_PERMISSION');
    const snapshot = {recordedAt:new Date().toISOString(),identity:verifiedIdentity,backupSnapshot:input.backupSnapshot,configuration:before,protectedDigests:protectedBefore,schema:columns};
    const snapshotPath = `${out}/rbac-before-${Date.now()}.json`;
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot,null,2)+'\n', {flag:'wx'});
    const receipt = {recordedAt:new Date().toISOString(),environment:'preview_only',identity:verifiedIdentity,sourceSha256:hash(fs.readFileSync(inputPath,'utf8')),snapshotPath,snapshotSha256:hash(fs.readFileSync(snapshotPath,'utf8')),backupSnapshot:input.backupSnapshot,schemaCompatibility:'PASS_44_COLUMNS_22_DENY_DEFAULT_FLAGS',beforeCounts:Object.fromEntries(Object.entries(before).map(([k,v])=>[k,v.length])),inserted:{Role:0,SystemRole:0,RolePermission:0},preservedExistingPermissions:0,exceptions:[],productionModified:false,historicalUsersImported:0};
    const pending = [];
    for(const r of input.source.roles) {
      const existing=roleByCode.get(r.roleCode);
      if(existing) { assert(existing.roleName===r.roleName,'ROLE_NAME_CODE_CONFLICT'); continue; }
      assert(!before.Role.some(x=>x.roleName===r.roleName||x.id===r.id),'ROLE_ID_OR_NAME_COLLISION');
      roleByCode.set(r.roleCode,r); pending.push(['Role',r]); receipt.inserted.Role++;
    }
    for(const r of input.source.systemRoles) if(!systemByName.has(r.name)) {
      assert(!before.SystemRole.some(x=>x.id===r.id),'SYSTEM_ROLE_ID_COLLISION');
      pending.push(['SystemRole',r]); receipt.inserted.SystemRole++;
    }
    for(const m of input.source.modules) assert(moduleByName.has(m.moduleName),'HISTORICAL_MODULE_NOT_PRESENT:'+m.moduleName);
    const existingPerms = new Map(before.RolePermission.map(p=>[p.roleId+'|'+p.moduleId,p]));
    const expected = [];
    for(const p of input.source.permissions) {
      const role=roleByCode.get(sourceRoles.get(p.roleId).roleCode), module=moduleByName.get(sourceModules.get(p.moduleId).moduleName);
      const key=role.id+'|'+module.id;
      if(existingPerms.has(key)) { receipt.preservedExistingPermissions++; continue; }
      const row={id:'rbac-'+hash(key).slice(0,32),roleId:role.id,moduleId:module.id,moduleName:module.moduleName,...Object.fromEntries(fields.map(f=>[f,p.grants.includes(f)])),createdAt:p.createdAt,updatedAt:p.updatedAt};
      assert(!before.RolePermission.some(x=>x.id===row.id),'PERMISSION_ID_COLLISION');
      assert(!expected.some(x=>x.roleId===row.roleId&&x.moduleId===row.moduleId),'DUPLICATE_SOURCE_PAIR');
      expected.push(row); pending.push(['RolePermission',row]); receipt.inserted.RolePermission++;
    }
    const newModules=before.Module.filter(m=>!input.source.modules.some(s=>s.moduleName===m.moduleName));
    let denyCount=0;
    for(const role of roleByCode.values()) for(const module of newModules) {
      const key=role.id+'|'+module.id;
      if(existingPerms.has(key)) continue;
      const row={id:'rbac-'+hash(key).slice(0,32),roleId:role.id,moduleId:module.id,moduleName:module.moduleName,...Object.fromEntries(fields.map(f=>[f,false])),createdAt:new Date(),updatedAt:new Date()};
      expected.push(row);pending.push(['RolePermission',row]);receipt.inserted.RolePermission++;denyCount++;
    }
    receipt.newModulePolicy={modules:newModules.map(m=>m.moduleName),explicitDenyRows:denyCount,existingSuperAdminPreserved:true};
    receipt.exceptions=['SUPER_ADMIN historical permissions skipped in favor of all existing working Preview permissions.','GUEST USER and GUEST_USER retained as distinct stable identifiers.','Missing historical role/module pairs remain implicit DENY; no inferred grants.'];
    if(process.argv[2]==='--check') {
      await db.query('ROLLBACK'); receipt.status='PREFLIGHT_PASS_NO_DATABASE_WRITES';
      fs.writeFileSync(`${out}/rbac-restoration-preflight.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));return;
    }
    for(const [table,row] of pending) await insert(db,table,row);
    const after=await state(db), protectedAfter=await protectedDigests(db);
    assert(JSON.stringify(protectedBefore)===JSON.stringify(protectedAfter),'USER_OR_ASSIGNMENT_CHANGED');
    for(const [t,rows] of Object.entries(before)) for(const row of rows) assert(JSON.stringify(row)===JSON.stringify(after[t].find(x=>x.id===row.id)),'EXISTING_CONFIGURATION_CHANGED:'+t);
    for(const row of expected) {
      const actual=after.RolePermission.find(x=>x.roleId===row.roleId&&x.moduleId===row.moduleId);
      assert(actual&&actual.moduleName===row.moduleName&&fields.every(f=>actual[f]===row[f]),'PERMISSION_ROUNDTRIP_MISMATCH');
    }
    const orphan=(await db.query('SELECT count(*)::int AS n FROM "RolePermission" p LEFT JOIN "Role" r ON r.id=p."roleId" LEFT JOIN "Module" m ON m.id=p."moduleId" WHERE r.id IS NULL OR m.id IS NULL OR p."moduleName"<>m."moduleName"')).rows[0].n;
    assert(orphan===0,'ORPHAN_OR_MODULE_NAME_MISMATCH');
    assert(after.Role.length===32&&after.SystemRole.length===32,'RESTORED_ROLE_COUNTS_MISMATCH');
    receipt.afterCounts=Object.fromEntries(Object.entries(after).map(([k,v])=>[k,v.length]));
    receipt.validation={existingConfigurationUnchanged:true,userCredentialsAndAssignmentsUnchanged:true,restoredPermissionRowsVerified:expected.length,permissionBooleanComparisons:expected.length*fields.length,orphans:orphan};
    await db.query('COMMIT');committed=true;
    receipt.status='DATABASE_RESTORATION_PASS_UI_PENDING';
    fs.writeFileSync(`${out}/rbac-restoration-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
    console.log(JSON.stringify(receipt));
  } catch(e) {
    if(!committed) await db.query('ROLLBACK').catch(()=>{});
    console.error(JSON.stringify({status:committed?'COMMITTED_RECEIPT_FAILURE':'ROLLED_BACK',code:e.code||null,message:/^[A-Z_0-9 :]+$/.test(e.message)?e.message:'DATABASE_OR_TRANSPORT_FAILURE'}));process.exitCode=1;
  } finally { await endPgClientBounded(db); }
}
main().catch(()=>{console.error('RESTORATION_INITIALIZATION_FAILED');process.exitCode=1;});
