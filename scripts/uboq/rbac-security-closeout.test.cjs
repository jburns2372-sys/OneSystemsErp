'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { loadTs } = require('./security-test-harness.cjs');
fs.mkdirSync('artifacts/uboq/phase8',{recursive:true});
const actions = loadTs('src/lib/authorizationActions.ts');
const { PERMISSION_FIELDS: fields, resolveAuthorizationAction: resolve } = actions;
const row = (moduleName, grants = {}) => ({ moduleName, ...Object.fromEntries(fields.map(f => [f, false])), ...grants });
const role = (roleCode, rows = [], isActive = true) => ({ roleCode, roleName: roleCode, rolePermissions: rows, isActive });
function permissionsHarness(primary = 'ACCOUNTANT', options = {}) {
  const roles = options.roles || [role(primary, options.rows || [])];
  const user = options.user === null ? null : { id: 'actor', role: primary, status: 'ACTIVE', lockedUntil: null, ...options.user };
  const prisma = {
    user: { findUnique: async () => user },
    userRole: { findMany: async () => { if (options.failAssignments) throw new Error('DB unavailable'); return (options.assigned || []).map(role => ({ role })); } },
    role: { findFirst: async ({where}) => roles.find(r => where.OR.some(q => Object.entries(q).every(([k,v]) => r[k] === v))) || null },
  };
  const api = loadTs('src/lib/permissions.ts', { './prisma': { prisma }, 'next/headers': { cookies: async () => ({get: () => options.simulate ? {value: options.simulate} : undefined}) } });
  return { api, prisma, user };
}
function accessHarness(options = {}) {
  const user = options.user === null ? null : { id:'actor', role:'ACCOUNTANT', status:'ACTIVE', ...options.user };
  const permissions = options.permissions || { FINANCE: row('FINANCE', {canView:true}) };
  let audits = 0;
  const assignment = options.assignment === undefined ? { projectRole:'ACCOUNTANT', accessLevel:'full', assignmentStatus:'active' } : options.assignment;
  const prisma = {
    user: { findUnique: async () => user },
    project: { findUnique: async ({where}) => options.projectMissing || where.id !== 'project-a' ? null : {id:'project-a'} },
    projectUserAssignment: { findUnique: async ({where}) => where.userId_projectId.projectId === 'project-a' ? assignment : null },
    auditLog: { create: async () => { audits++; return {id:'audit'}; } },
  };
  const permissionApi = { getUserPermissions: async () => permissions, getPermissionsForRole: async () => options.projectPermissions || {} };
  const access = loadTs('src/lib/accessControl.ts', {'./prisma':{prisma}, './permissions':permissionApi});
  const engine = loadTs('src/lib/securityEngine.ts', {'@/lib/prisma':{prisma}, '@/lib/permissions':permissionApi, './securityLogger':{logFullSecurityEvent:async()=>{}}});
  const scheduling = loadTs('src/lib/scheduling/authUtils.ts', {'@/lib/prisma':{prisma}, '@/lib/permissions':permissionApi, '@/lib/dal/auth':{verifySession:async()=>user}, 'next/headers':{cookies:async()=>({get:()=>undefined})}});
  return {access,engine,scheduling,audits:()=>audits};
}

test('the action allowlist maps only to the 22 persisted schema fields', () => {
  const model = fs.readFileSync('prisma/managed-pg18-rc-v1/schema.prisma','utf8').match(/model RolePermission \{([\s\S]*?)\n\}/)[1];
  const actual = Array.from(model.matchAll(/^\s+(can\w+)\s+Boolean/gm), m=>m[1]).sort();
  assert.deepEqual(Array.from(fields).sort(), actual);
  for (const value of Object.values(actions.ACTION_PERMISSION_MAP)) assert.ok(fields.includes(value));
});

test('every static authorization caller action is explicitly supported', () => {
  const inventory = [];
  function walk(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name); if(entry.isDirectory()) { walk(file); continue; }
    if(!/\.tsx?$/.test(file)) continue;
    const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
    function visit(node) {
      if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['checkUserAccess','checkSchedulingAccess','hasPermission','requirePermission'].includes(node.expression.text)) {
        const arg=node.arguments[node.expression.text==='hasPermission'||node.expression.text==='requirePermission'?2:3];
        if(arg&&ts.isStringLiteral(arg)) {
          assert.ok(resolve(arg.text), `${file}: ${arg.text}`);
          const moduleArg=node.arguments[node.expression.text==='hasPermission'||node.expression.text==='requirePermission'?1:2];
          const moduleName=node.expression.text==='checkSchedulingAccess'?'PROJECT_MANAGEMENT':moduleArg&&ts.isStringLiteral(moduleArg)?moduleArg.text:'<dynamic>';
          inventory.push({file:file.replaceAll('\\','/'),caller:node.expression.text,moduleName,action:arg.text,permission:resolve(arg.text)});
        }
        else assert.ok(arg&&ts.isIdentifier(arg)&&['action'].includes(arg.text), 'Review new dynamic action boundary: '+file);
      }
      ts.forEachChild(node,visit);
    } visit(source);
  }} walk('src');
  assert.ok(inventory.length>=30);
  fs.writeFileSync('artifacts/uboq/phase8/rbac-security-closeout-action-inventory.json',JSON.stringify(inventory,null,2)+'\n');
});

for (const guest of ['GUEST USER','GUEST_USER']) {
  test(`${guest}: missing modules deny, configured View survives, writes and audit never appear`, async()=>{
    const api=permissionsHarness(guest,{rows:[row('DASHBOARD',{canView:true}),row('PAYROLL',{canView:true}),row('PROJECT_SCHEDULING')]}).api;
    for(const p of [await api.getUserPermissions('actor'),await api.getPermissionsForRole(guest)]) {
      assert.equal(p.DASHBOARD.canView,true); assert.equal(p.PAYROLL.canView,true);
      assert.equal(p.DOCUMENTS,undefined); assert.equal(p.PROJECT_SCHEDULING.canView,false);
      for(const mod of ['DASHBOARD','PAYROLL']) for(const f of fields.filter(f=>f!=='canView')) assert.equal(p[mod][f],false);
    }
    assert.equal(await api.hasPermission('actor','DOCUMENTS','canView'),false);
  });
  test(`${guest}: mixed explicit denial cannot turn into an implicit View grant`, async()=>{
    const p=await permissionsHarness(guest,{rows:[row('FINANCE',{canCreate:true,canViewAuditLogs:true}),row('SYSTEM_ROLES',{canView:true})]}).api.getUserPermissions('actor');
    for(const f of fields)assert.equal(p.FINANCE[f],false);
    assert.equal(p.SYSTEM_ROLES.canView,false);
  });
}

test('guest identifiers are not reconciled or normalized', async()=>{
  const roles=[role('GUEST USER',[row('DASHBOARD',{canView:true})]),role('GUEST_USER')];
  const api=permissionsHarness('GUEST_USER',{roles}).api;
  assert.equal((await api.getPermissionsForRole('GUEST USER')).DASHBOARD.canView,true);
  assert.equal((await api.getPermissionsForRole('GUEST_USER')).DASHBOARD,undefined);
  assert.equal((await api.getPermissionsForRole('guest user')).DASHBOARD,undefined);
});
test('inactive assigned guest does not revoke an approved non-guest role',async()=>{
  const api=permissionsHarness('ACCOUNTANT',{rows:[row('FINANCE',{canApprove:true})],assigned:[role('GUEST_USER',[],false)]}).api;
  assert.equal(await api.hasPermission('actor','FINANCE','canApprove'),true);
});
test('active role union preserves approved legacy grants and excludes inactive roles',async()=>{
  const api=permissionsHarness('ACCOUNTANT',{rows:[row('FINANCE',{canView:true})],assigned:[role('FINANCE_OFFICER',[row('FINANCE',{canApprove:true})]),role('DISABLED',[row('FINANCE',{canReleasePayment:true})],false)]}).api;
  assert.equal(await api.hasPermission('actor','FINANCE','APPROVE'),true);
  assert.equal(await api.hasPermission('actor','FINANCE','RELEASE_PAYMENT'),false);
});
test('inactive system-admin role cannot simulate an active privileged role',async()=>{
  const api=permissionsHarness('SUPER_ADMIN',{roles:[role('SUPER_ADMIN',[],false),role('FINANCE_OFFICER',[row('FINANCE',{canApprove:true})])],simulate:'FINANCE_OFFICER'}).api;
  assert.equal((await api.getUserPermissions('actor')).IS_ADMIN,undefined);
  assert.equal(await api.hasPermission('actor','FINANCE','APPROVE'),false);
});
for(const variant of [{user:null},{user:{status:'DISABLED'}},{user:{lockedUntil:new Date(Date.now()+60000)}},{failAssignments:true}])test(`permission lookup fails closed: ${JSON.stringify(variant)}`,async()=>{
  const api=permissionsHarness('ACCOUNTANT',{rows:[row('FINANCE',{canView:true})],...variant}).api;
  assert.equal(await api.hasPermission('actor','FINANCE','READ'),false);
});
for(const primary of ['ACCOUNTANT','ADMIN','PROJECT_DIRECTOR'])test(`${primary} cannot become SUPER_ADMIN through the simulation cookie`,async()=>{
  const api=permissionsHarness(primary,{roles:[role(primary),role('SUPER_ADMIN',[row('SYSTEM_ROLES',{canApprove:true})])],simulate:'SUPER_ADMIN'}).api;
  assert.equal((await api.getUserPermissions('actor')).IS_ADMIN,undefined);
  assert.equal(await api.hasPermission('actor','SYSTEM_ROLES','APPROVE'),false);
});
test('SUPER_ADMIN retains configured authority but cannot authorize missing modules or unknown actions',async()=>{
  const api=permissionsHarness('SUPER_ADMIN',{rows:[row('FINANCE',Object.fromEntries(fields.map(f=>[f,true])))]}).api;
  for(const f of fields)assert.equal(await api.hasPermission('actor','FINANCE',f),true);
  assert.equal(await api.hasPermission('actor','MISSING','READ'),false);
  assert.equal(await api.hasPermission('actor','FINANCE','MANAGE_ROLES'),false);
});
test('legacy SYSTEM_ADMIN resolves the approved SUPER_ADMIN record consistently',async()=>{
  const api=permissionsHarness('SYSTEM_ADMIN',{roles:[role('SUPER_ADMIN',[row('SYSTEM_ROLES',{canView:true,canApprove:true})])]}).api;
  assert.equal(await api.hasPermission('actor','SYSTEM_ROLES','APPROVE'),true);
  assert.equal((await api.getPermissionsForRole('SYSTEM_ADMIN')).SYSTEM_ROLES.canApprove,true);
});
test('SUPER_ADMIN simulation can restrict access to an unconfigured guest without synthesizing grants',async()=>{
  const api=permissionsHarness('SUPER_ADMIN',{roles:[role('SUPER_ADMIN',[row('FINANCE',{canView:true})]),role('GUEST_USER')],simulate:'GUEST_USER'}).api;
  assert.equal((await api.getUserPermissions('actor')).IS_ADMIN,false);
  assert.equal(await api.hasPermission('actor','FINANCE','READ'),false);
});
test('truthy strings and admin markers cannot override an explicit false permission',async()=>{
  const api=permissionsHarness('SUPER_ADMIN',{rows:[row('FINANCE',{canApprove:'true',canView:true})]}).api;
  assert.equal(await api.hasPermission('actor','FINANCE','APPROVE'),false);
});

for(const [action,field] of Object.entries({RELEASE_PAYMENT:'canReleasePayment',MARK_AS_PAID:'canMarkAsPaid',APPROVE:'canApprove',DELETE:'canDeleteDraft',EXPORT:'canExport',EDIT:'canEditDraft',UPDATE:'canEditDraft',VIEW_AUDIT_LOGS:'canViewAuditLogs'}))test(`${action} requires ${field}, never View`,async()=>{
  const denied=accessHarness();assert.equal((await denied.access.checkUserAccess('actor','project-a','FINANCE',action)).allowed,false);
  const approved=accessHarness({permissions:{FINANCE:row('FINANCE',{canView:true,[field]:true})}});
  assert.equal((await approved.access.checkUserAccess('actor','project-a','FINANCE',action)).allowed,true);
});
for(const action of ['PAY','PROCESS_PAYROLL','MANAGE_USERS','MANAGE_ROLES','RESET_DATA','BACKUP_RESTORE','TYPO','__proto__','constructor','toString','',null])test(`unsupported action denied even for SUPER_ADMIN: ${action}`,async()=>{
  const api=accessHarness({user:{role:'SUPER_ADMIN'},permissions:{IS_ADMIN:true,FINANCE:row('FINANCE',{canView:true})}});
  assert.equal((await api.access.checkUserAccess('actor','project-a','FINANCE',action)).allowed,false);
  assert.equal(await api.engine.canAccess({userId:'actor',projectId:'project-a',module:'FINANCE',action}),false);
});
test('PAYROLL View cannot approve, release payments, delete or export',async()=>{
  const api=accessHarness({permissions:{PAYROLL:row('PAYROLL',{canView:true})}}).access;
  for(const action of ['APPROVE','RELEASE_PAYMENT','MARK_AS_PAID','DELETE','EXPORT'])assert.equal((await api.checkUserAccess('actor','project-a','PAYROLL',action)).allowed,false);
  assert.equal((await api.checkUserAccess('actor','project-a','PAYROLL','read')).allowed,true);
});
test('missing module never uses a wildcard ALL grant',async()=>{
  const api=accessHarness({permissions:{ALL:{canView:true}}}).access;
  assert.equal((await api.checkUserAccess('actor','project-a','MISSING','READ')).allowed,false);
});
for(const assignment of [null,{assignmentStatus:'revoked',accessLevel:'full'},{assignmentStatus:'inactive',accessLevel:'full'}])test(`unassigned or revoked project denies: ${JSON.stringify(assignment)}`,async()=>{
  const api=accessHarness({assignment});
  assert.equal((await api.access.checkUserAccess('actor','project-a','FINANCE','READ')).allowed,false);
  assert.equal(await api.engine.canAccess({userId:'actor',projectId:'project-a',module:'FINANCE',action:'read'}),false);
});
test('project view_only allows normalized READ/VIEW but denies export even when RBAC permits it',async()=>{
  const api=accessHarness({assignment:{assignmentStatus:'active',accessLevel:'view_only'},permissions:{FINANCE:row('FINANCE',{canView:true,canExport:true})}});
  for(const action of ['READ','read','VIEW'])assert.equal((await api.access.checkUserAccess('actor','project-a','FINANCE',action)).allowed,true);
  assert.equal((await api.access.checkUserAccess('actor','project-a','FINANCE','EXPORT')).allowed,false);
  assert.equal(await api.engine.canAccess({userId:'actor',projectId:'project-a',module:'FINANCE',action:'export'}),false);
});
test('missing project or foreign database project denies even a SUPER_ADMIN',async()=>{
  const api=accessHarness({user:{role:'SUPER_ADMIN'},permissions:{IS_ADMIN:true,FINANCE:row('FINANCE',{canView:true})}});
  assert.equal((await api.access.checkUserAccess('actor','foreign-tenant-project','FINANCE','READ')).allowed,false);
  assert.equal(await api.engine.canAccess({userId:'actor',projectId:'foreign-tenant-project',module:'FINANCE',action:'read'}),false);
  assert.equal((await api.access.checkUserAccess('actor',null,'FINANCE','READ')).allowed,false);
});
test('scheduling global grants do not bypass project assignment or caller-role spoofing',async()=>{
  const api=accessHarness({assignment:null,permissions:{PROJECT_MANAGEMENT:row('PROJECT_MANAGEMENT',{canEditDraft:true})}}).scheduling;
  assert.equal((await api.checkSchedulingAccess('actor','SUPER_ADMIN','project-a','canEdit')).allowed,false);
});
test('approved project-role scheduling grants survive only within the active assigned project',async()=>{
  const api=accessHarness({assignment:{assignmentStatus:'active',accessLevel:'full',projectRole:'PROJECT_ENGINEER'},projectPermissions:{PROJECT_MANAGEMENT:row('PROJECT_MANAGEMENT',{canEditDraft:true})}}).scheduling;
  assert.equal((await api.checkSchedulingAccess('actor','ACCOUNTANT','project-a','canEdit')).allowed,true);
  assert.equal((await api.checkSchedulingAccess('actor','ACCOUNTANT','foreign-project','canEdit')).allowed,false);
});
test('project role cannot promote a user to system admin or bypass guest restrictions',async()=>{
  const grants={PROJECT_MANAGEMENT:row('PROJECT_MANAGEMENT',{canApprove:true})};
  for(const extra of [{assignment:{assignmentStatus:'active',accessLevel:'full',projectRole:'SUPER_ADMIN'}},{permissions:{IS_GUEST_USER:true}}]) {
    const api=accessHarness({projectPermissions:grants,...extra}).scheduling;
    assert.equal((await api.checkSchedulingAccess('actor','SUPER_ADMIN','project-a','canApprove')).allowed,false);
  }
});
test('securityEngine requires true, not undefined, on every action including edit/upload/delete',async()=>{
  const api=accessHarness({permissions:{DOCUMENTS:{canView:true}}}).engine;
  for(const action of ['edit','upload','delete','export'])assert.equal(await api.canAccess({userId:'actor',projectId:'project-a',module:'DOCUMENTS',action}),false);
});
test('sensitive security-engine operations require project context even with an explicit grant',async()=>{
  const api=accessHarness({permissions:{PAYROLL:row('PAYROLL',{canView:true,canApprove:true})}}).engine;
  assert.equal(await api.canAccess({userId:'actor',module:'PAYROLL',action:'approve'}),false);
});
test('locked actors cannot use project-role scheduling fallback',async()=>{
  const api=accessHarness({user:{lockedUntil:new Date(Date.now()+60000)},projectPermissions:{PROJECT_MANAGEMENT:row('PROJECT_MANAGEMENT',{canApprove:true})}}).scheduling;
  assert.equal((await api.checkSchedulingAccess('actor','SUPER_ADMIN','project-a','canApprove')).allowed,false);
});

function adminHarness(actorRole) {
  const calls={create:0,update:0,delete:0};
  const prisma={role:{findUnique:async()=>({id:'role-super',roleCode:'SUPER_ADMIN',roleName:'SUPER_ADMIN'})},user:{findUnique:async()=>({id:'target',role:'SUPER_ADMIN',status:'ACTIVE'}),update:async()=>{calls.update++;}},userRole:{findUnique:async()=>null,create:async()=>{calls.create++;},delete:async()=>{calls.delete++;}},rolePermission:{upsert:async()=>{calls.update++;}}};
  const deps={'@/lib/prisma':{prisma},'@/lib/dal/auth':{verifySession:async()=>({id:'actor',role:actorRole})},'next/cache':{revalidatePath(){}},'next/navigation':{redirect(){throw new Error('redirect');}},'ai':{generateText(){}},'@ai-sdk/google':{createGoogleGenerativeAI(){}}};
  return {roles:loadTs('src/app/actions/user-roles.ts',deps),permissions:loadTs('src/app/actions/permissions.ts',deps),calls};
}
test('ordinary users cannot assign or revoke roles through administrative actions',async()=>{
  const h=adminHarness('PROJECT_ENGINEER');
  await assert.rejects(()=>h.roles.assignRoleToUser('actor','role-super'),/Forbidden/);
  await assert.rejects(()=>h.roles.removeRoleFromUser('actor','role-super'),/Forbidden/);
  assert.equal(h.calls.create+h.calls.delete,0);
});
test('non-super administrators cannot assign/revoke SUPER_ADMIN or modify its status/permissions',async()=>{
  const h=adminHarness('PROJECT_DIRECTOR');
  assert.equal((await h.roles.assignRoleToUser('target','role-super')).success,false);
  assert.equal((await h.roles.removeRoleFromUser('target','role-super')).success,false);
  await assert.rejects(()=>h.roles.updateUserStatus('target','INACTIVE'),/SUPER_ADMIN/);
  await assert.rejects(()=>h.permissions.saveRolePermission('role-super','module','canView',false),/SUPER_ADMIN/);
  assert.equal(h.calls.create+h.calls.update+h.calls.delete,0);
});
test('SUPER_ADMIN cannot disable its own active account',async()=>{
  const h=adminHarness('SUPER_ADMIN');
  await assert.rejects(()=>h.roles.updateUserStatus('actor','INACTIVE'),/own account/);
  assert.equal(h.calls.update,0);
});

test('tenant project graph rejects a forged SUPER_ADMIN snapshot without actual membership',async()=>{
  const graph=loadTs('src/lib/uboq/project-ownership.ts',{'node:async_hooks':require('node:async_hooks'),'node:crypto':require('node:crypto')});
  const db={user:{findUnique:async()=>({role:'ACCOUNTANT',status:'ACTIVE'})},project:{findUnique:async()=>({id:'project-a',managerId:'another',uboqGovernanceEnabled:true})},projectUserAssignment:{findFirst:async()=>null}};
  await assert.rejects(()=>graph.assertProjectGraphOwnership(db,{userId:'actor',userRole:'SUPER_ADMIN',projectId:'project-a'}),/PROJECT_ACCESS_DENIED/);
});
test('tenant project graph denies a foreign-owned resource even to a real SUPER_ADMIN',async()=>{
  const graph=loadTs('src/lib/uboq/project-ownership.ts',{'node:async_hooks':require('node:async_hooks'),'node:crypto':require('node:crypto')});
  const db={user:{findUnique:async()=>({role:'SUPER_ADMIN',status:'ACTIVE'})},project:{findUnique:async()=>({id:'project-a',uboqGovernanceEnabled:true})},materialRequest:{findUnique:async()=>({id:'foreign-request',projectId:'project-b'})}};
  await assert.rejects(()=>graph.assertProjectGraphOwnership(db,{userId:'actor',userRole:'SUPER_ADMIN',projectId:'project-a',mrId:'foreign-request'}),/CROSS_PROJECT_SPOOFING_BLOCKED/);
});
test('tenant project graph retains access for an explicitly assigned actor and same-project resource',async()=>{
  const graph=loadTs('src/lib/uboq/project-ownership.ts',{'node:async_hooks':require('node:async_hooks'),'node:crypto':require('node:crypto')});
  const db={user:{findUnique:async()=>({role:'ACCOUNTANT',status:'ACTIVE'})},project:{findUnique:async()=>({id:'project-a',managerId:'another',uboqGovernanceEnabled:true})},projectUserAssignment:{findFirst:async()=>({id:'assignment'})},materialRequest:{findUnique:async()=>({id:'request-a',projectId:'project-a'})}};
  assert.equal((await graph.assertProjectGraphOwnership(db,{userId:'actor',userRole:'ACCOUNTANT',projectId:'project-a',mrId:'request-a'})).isGlobalAdmin,false);
});
