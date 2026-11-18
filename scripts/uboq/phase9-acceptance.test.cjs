'use strict';
// No application imports outside this allowlisted VM loader; no live DB/storage credentials.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
function load(file, deps = {}, env = {}, source, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(source ?? fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(compiled.outputText, {
    exports, Buffer, File, FormData, Request, Response, Uint8Array, Error, console,
    ...globals, process: { env }, require: name => {
      if (Object.hasOwn(deps, name)) return deps[name];
      throw Error('Unmocked dependency prohibited: ' + name);
    },
  }, { filename: file });
  return exports;
}
test('project listing: simulator cookie never elevates DB scope', () => {
  const { mayReadAllProjects } = load('src/lib/uboq/project-list-visibility.ts');
  const cases = [
    ['PROJECT_MANAGER', null, false],
    ['PROJECT_MANAGER', 'SUPER_ADMIN', false],
    ['PROJECT_DIRECTOR', 'SUPER_ADMIN', false],
    ['DIRECTORS', 'SYSTEM_ADMIN', false],
    ['ADMINISTRATOR', 'SUPER_ADMIN', false],
    ['FINANCE_OFFICER', 'SUPER_ADMIN', false],
    ['GUEST USER', 'SUPER_ADMIN', false],
    ['SUPER_ADMIN', null, true],
    ['SUPER_ADMIN', 'SUPER_ADMIN', true],
    ['SUPER_ADMIN', 'PROJECT_MANAGER', false],
    ['SUPER_ADMIN', 'FINANCE_OFFICER', false],
    ['SYSTEM_ADMIN', null, true],
    ['SYSTEM_ADMIN', 'PROJECT_MANAGER', false],
  ];
  for (const [role, cookie, expected] of cases) {
    assert.equal(mayReadAllProjects(role, cookie), expected,
      'actual role ' + role + ', simulated role ' + String(cookie));
  }
  // Regression guard: the actual project query must consume this bounded
  // decision; no cookie-derived effectiveRole should decide the DB scope.
  const page = fs.readFileSync('src/app/projects/page.tsx', 'utf8');
  assert.match(page, /mayReadAllProjects\(user\?\.role, simulatedRole\)/);
  assert.doesNotMatch(page, /const isSuperAdmin = effectiveRole/);
});

test('backend project routes reject simulator-based elevation', async () => {
  const backend = load('apps/aws-backend/src/lib/projectVisibility.ts');
  const frontend = load('src/lib/uboq/project-list-visibility.ts');
  for (const [role, sim] of [
    ['PROJECT_DIRECTOR', 'SUPER_ADMIN'], ['ADMINISTRATOR', 'SUPER_ADMIN'],
    ['FINANCE_OFFICER', 'SYSTEM_ADMIN'], ['SUPER_ADMIN', 'PROJECT_MANAGER'],
    ['SUPER_ADMIN', 'SUPER_ADMIN'], ['SYSTEM_ADMIN', null],
  ]) {
    assert.equal(backend.mayReadAllProjects(role, sim), frontend.mayReadAllProjects(role, sim));
  }

  const handlers = {};
  let actualRole = 'PROJECT_DIRECTOR';
  let mutationCalls = 0;
  const fakeRouter = {
    get: (path, fn) => { handlers['GET ' + path] = fn; },
    post: (path, fn) => { handlers['POST ' + path] = fn; },
    delete: (path, fn) => { handlers['DELETE ' + path] = fn; },
  };
  const fakeDb = {
    project: { findUnique: async () => ({ id: 'unassigned-project' }) },
    user: { findUnique: async () => ({
      role: actualRole, projectAssignments: [{ projectId: 'assigned-project' }],
    }) },
  };
  load('apps/aws-backend/src/routes/projects.ts', {
    '../lib/h02ProjectMutation': { invokeH02ProjectMutation: async () => { mutationCalls++; } },
    '../lib/projectVisibility': backend,
    'express': { Router: () => fakeRouter },
    '@prisma/client': { PrismaClient: class { constructor() { return fakeDb; } } },
  });
  const res = () => ({
    statusCode: 200, output: undefined,
    status(n) { this.statusCode = n; return this; },
    json(payload) { this.output = payload; return this; },
  });
  const ctx = {
    headers: {
      'x-user-session': 'user-1', 'x-simulated-role': 'SUPER_ADMIN',
      'x-active-project-id': 'unassigned-project',
    },
    params: { id: 'unassigned-project' }, body: {},
  };
  assert.equal(typeof handlers['GET /dashboard-stats'], 'function');
  assert.equal(typeof handlers['DELETE /:id'], 'function');
  const dashboard = res();
  await handlers['GET /dashboard-stats'](ctx, dashboard);
  assert.equal(dashboard.statusCode, 403,
    'Project Director simulating SUPER_ADMIN must not read unassigned financial stats');
  const deletion = res();
  await handlers['DELETE /:id'](ctx, deletion);
  assert.equal(deletion.statusCode, 403,
    'Project Director simulating SUPER_ADMIN must not authorize project deletion');
  assert.equal(mutationCalls, 0);

  actualRole = 'SUPER_ADMIN';
  const narrowed = res();
  await handlers['GET /dashboard-stats']({
    ...ctx, headers: { ...ctx.headers, 'x-simulated-role': 'PROJECT_MANAGER' },
  }, narrowed);
  assert.equal(narrowed.statusCode, 403,
    'Admin simulating Project Manager must not see unassigned project');

  const executive = fs.readFileSync('src/app/actions/executiveActions.ts', 'utf8');
  assert.equal((executive.match(/mayReadAllProjects\\(user\\.role, effectiveRole\\)/g) || []).length, 2,
    'Executive portfolio and overview must use authoritative user role and simulated restriction');
});

test('Phase 9 PR CI does not create or delete Neon branches', () => {
  const workflow = fs.readFileSync('.github/workflows/neon-branch.yml', 'utf8');
  const create = workflow.split('  create_neon_branch:')[1]?.split('  delete_neon_branch:')[0];
  const remove = workflow.split('  delete_neon_branch:')[1];
  assert.ok(create && remove, 'Neon branch lifecycle jobs must remain explicit');
  for (const job of [create, remove]) {
    assert.match(job, /github\.event\.pull_request\.base\.ref != 'release\/oserp-proj-uboq-001'/);
    assert.match(job, /github\.event\.pull_request\.base\.ref != 'feat\/oserp-unified-project-intake-p9'/);
  }
});

const actor = { userId: 'synthetic-user', role: 'PROJECT_MANAGER', sessionVersion: 1 };
const rls = { withUboqRlsContext: (_ctx, fn) => fn(), applyProjectRlsSessionVars: async () => {}, uboqRlsStorage: { getStore: () => undefined } };
const response = { NextResponse: Response };
const taxEngine = () => load('src/lib/uboq/tax-engine.ts');
function intakeFixture(overrides = {}) {
  const calls = [];
  const db = { project: { findUnique: async () => ({ projectCategory: 'CORPORATE' }) },
    uboqSourceDocument:{findFirst:async()=>({metadataJson:{stagedIntakeOptions:{sectorType:'CORPORATE',taxProfileCode:'CORP_PH_VAT_EXCL_12'}}})} };
  const deps = {
    'next/server': response, '@/lib/prisma': { prisma: db },
    '@/lib/dal/auth': { verifyOperationalSession: async () => actor },
    '@/lib/uboq/project-ownership': rls,
    '@/lib/uboq/security/stage-rbac': { assertUboqStageAuthorization: async () => {} },
    '@/lib/uboq/security/redact-payload': { redactUboqPayloadForRole: v => v },
    '@/lib/uboq/tax-engine': taxEngine(),
    '@/lib/uboq/intake/security-guard': { scanUploadedDocumentSecurity: () => ({ safe: true, findings: [] }) },
    '@/lib/uboq/adapters/snapshot-orchestrator': {
      ingestAndStageProjectUboqPackage: async (_db, p) => { calls.push(p); return { snapshot: { status: 'DRAFT' } }; },
      regenerateDraftSnapshotFromVerifiedDocument:async(_db,p)=>{calls.push(p);return {snapshot:{status:'DRAFT'}};},
    },
    ...overrides,
  };
  return { calls, db, post: load('src/app/api/uboq/intake/route.ts', deps).POST };
}
function request(fields = {}) {
  const form = new FormData();
  form.set('projectId', 'synthetic-project');
  form.set('file', new File(['a,b\n1,2'], 'boq.csv', { type: 'text/csv' }));
  for (const [k,v] of Object.entries(fields)) form.set(k,v);
  return new Request('http://fixture/api/uboq/intake', { method: 'POST', body: form });
}
for (const fields of [{}, { sectorType: 'CORPORATE' }, { sectorType: 'CORPORATE', taxProfileCode: 'UNKNOWN' }, { sectorType: 'GOVERNMENT', taxProfileCode: 'CORP_PH_VAT_EXCL_12' }, { sectorType: 'PRIVATE', taxProfileCode: 'PRIVATE_NON_VAT_EXEMPT' }]) {
  test('BOQ rejects missing/invalid/project-incompatible confirmation: ' + JSON.stringify(fields), async () => {
    const f = intakeFixture(); const res = await f.post(request(fields));
    assert.equal(res.status, 400); assert.equal(f.calls.length, 0);
  });
}
test('BOQ passes explicitly confirmed compatible profile and remains DRAFT', async () => {
  const f = intakeFixture(); const res = await f.post(request({ sectorType: 'CORPORATE', taxProfileCode: 'CORP_PH_VAT_INCL_12' }));
  assert.equal(res.status, 201); assert.equal(f.calls[0].taxProfileCode, 'CORP_PH_VAT_INCL_12');
  assert.equal((await res.json()).snapshot.status, 'DRAFT');
});
test('draft regeneration rejects sector-incompatible tax override',async()=>{
  const f=intakeFixture();const res=await f.post(new Request('http://fixture/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'REGENERATE_DRAFT_SNAPSHOT',projectId:'synthetic-project',sourceDocumentId:'doc',taxProfileCode:'GOV_PH_DUPA_5PCT_EST'})}));
  assert.equal(res.status,400);assert.equal(f.calls.length,0);
});
test('draft regeneration reuses saved explicit compatible tax selection',async()=>{
  const f=intakeFixture();const res=await f.post(new Request('http://fixture/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'REGENERATE_DRAFT_SNAPSHOT',projectId:'synthetic-project',sourceDocumentId:'doc'})}));
  assert.equal(res.status,200);assert.equal(f.calls[0].taxProfileCode,'CORP_PH_VAT_EXCL_12');
});
test('BOQ rejects unclassified legacy project and denied staging actor',async()=>{
  const f=intakeFixture();f.db.project.findUnique=async()=>({projectCategory:null});
  assert.equal((await f.post(request({sectorType:'CORPORATE',taxProfileCode:'CORP_PH_VAT_EXCL_12'}))).status,400);assert.equal(f.calls.length,0);
  const denied=intakeFixture({'@/lib/uboq/security/stage-rbac':{assertUboqStageAuthorization:async()=>{throw Error('PBAC_DENIED');}}});
  assert.equal((await denied.post(request({sectorType:'CORPORATE',taxProfileCode:'CORP_PH_VAT_EXCL_12'}))).status,403);assert.equal(denied.calls.length,0);
});
function evidenceFixture() {
  let doc = null, deleted = 0, writes = 0, reads = 0;
  const vault = { putImmutableAndVerify: async () => ({ storageUri: 'fixture://object', newlyCreated: true }), getAndVerify: async () => { reads++; return { buffer: Buffer.from('a,b\n1,2') }; }, deleteOrphanIfCreated: async () => { deleted++; } };
  const db = { $transaction: async fn => fn(db), uboqSourceDocument: {
    findUnique: async () => doc,
    create: async ({data}) => { writes++; doc = { id: 'document', ...data }; return doc; },
  } };
  const deps = { 'next/server': response, '@/lib/prisma': { prisma: db }, '@/lib/dal/auth': { verifyOperationalSession: async () => actor },
    '@/lib/uboq/security/stage-rbac': { assertUboqStageAuthorization: async () => {} }, '@/lib/uboq/project-ownership': rls,
    '@/lib/uboq/intake/security-guard': { scanUploadedDocumentSecurity: () => ({ safe: true, findings: [], sha256Hash: 'a'.repeat(64), canonicalMimeType: 'text/csv' }) },
    '@/lib/uboq/storage/vault-storage': { resolveUboqVaultStorageProvider: () => vault },
    '@/lib/uboq/security/document-permissions': { requireProjectDocumentPermission: async () => {} } };
  return { db, vault, deps, counts: () => ({ deleted, writes, reads }), post: () => load('src/app/api/projects/[id]/documents/route.ts', deps).POST, context: { params: Promise.resolve({ id: 'synthetic-project' }) } };
}
test('sequential evidence duplicates verify vault and create one document', async () => {
  const f = evidenceFixture(); const post = f.post();
  assert.equal((await post(request({documentRole:'CONTRACT'}), f.context)).status, 201);
  const replay = await post(request({documentRole:'CONTRACT'}), f.context);
  assert.equal((await replay.json()).duplicate, true);
  assert.deepEqual(f.counts(), { deleted:0, writes:1, reads:1 });
});
test('concurrent evidence insert loser preserves winner vault and replays its ID', async () => {
  const f = evidenceFixture(); let lookups = 0, release;
  const barrier = new Promise(r => release=r);
  let winner;
  f.db.uboqSourceDocument.findUnique = async () => {
    if (++lookups <= 2) { if (lookups===2) release(); await barrier; return null; }
    return winner;
  };
  let inserts=0;
  f.db.uboqSourceDocument.create = async ({data}) => {
    if (++inserts===1) { winner={id:'winner',...data}; return winner; }
    throw Object.assign(Error('unique'),{code:'P2002'});
  };
  const post=f.post(); const results=await Promise.all([post(request({documentRole:'CONTRACT'}),f.context),post(request({documentRole:'CONTRACT'}),f.context)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);
  assert.equal(f.counts().deleted,0); assert.ok(f.counts().reads>=1);
});
test('evidence failed insert retains potential shared vault object for reconciliation', async () => {
  const f=evidenceFixture(); f.db.uboqSourceDocument.create=async()=>{throw Error('fixture database unavailable');};
  assert.equal((await f.post()(request({documentRole:'CONTRACT'}),f.context)).status,400);
  assert.equal(f.counts().deleted,0);
});
module.exports = { load, intakeFixture, evidenceFixture, request, actor, rls };

function orchestratorFixture({ concurrent = false, pending = false } = {}) {
  let document=null, snapshots=0, deletes=0, reads=0, lookups=0, release;
  const barrier=new Promise(r=>release=r);
  const vault={ backendName:'LOCAL_DURABLE_TEST', putImmutableAndVerify:async()=>({storageUri:'fixture://object',newlyCreated:true}),
    getAndVerify:async()=>{reads++;}, deleteOrphanIfCreated:async()=>{deletes++;} };
  const fields={work_description:'Concrete',unit:'m3',approved_qty:1,contract_unit_rate:100};
  const candidate={sheetOrPageRef:'P1',sourceRowNumber:1,sourceCellRef:'A1',mappedFields:fields,rawFormulas:{},requiresHumanReview:pending};
  const db={ $transaction:async fn=>fn(db),
    uboqSourceDocument:{findUnique:async()=>{
      if(concurrent && ++lookups<=2){if(lookups===2)release();await barrier;return null;}
      return document;
    },create:async({data})=>{
      if(document)throw Object.assign(Error('unique source'),{code:'P2002'});
      document={id:'source',...data,candidates:[],snapshots:[]}; return document;
    }},
    uboqDocumentSection:{create:async()=>({id:'section'})},
    uboqExtractionCandidate:{create:async({data})=>{const c={id:'candidate',...data,section:{sheetOrPageRef:'P1'}};document.candidates.push(c);return c;}},
    uboqTaxPricingProfile:{upsert:async()=>({id:'profile'})},
    uboqOperationalSnapshot:{findFirst:async()=>null,create:async({data})=>{snapshots++;const s={id:'snapshot',...data};document.snapshots.push(s);return s;}},
    uboqContractAuthority:{create:async({data})=>{assert.equal(data.status,'DRAFT');return {id:'authority'};}},
    uboqAwardedPhaseLine:{create:async()=>({id:'line'})},
  };
  const deps={ 'node:crypto':crypto,'../intake/parsers':{extractUniversalDocumentPackage:async()=>({blockingErrors:[],security:{sha256Hash:'a'.repeat(64),canonicalMimeType:'text/csv'},sections:[],candidates:[candidate]})},
    '../field-catalog':{},'../uom-registry':{normalizeUom:()=>({normalizedCode:'m3',dimensionFamily:'VOLUME'})},
    '../validation-engine':{buildSafePhaseConsolidation:()=>({groups:[],issues:[]}),computeSpecSignatureHash:()=> 'hash'},
    '../tax-engine':taxEngine(),'../resource-ledger':{},'../storage/vault-storage':{resolveUboqVaultStorageProvider:()=>vault},
    '../security/stage-rbac':{assertUboqStageAuthorization:async()=>{}},'../project-ownership':rls };
  const path='src/lib/uboq/adapters/snapshot-orchestrator.ts';
  const baseline=process.env.PHASE9_COMPARE_BASELINE ? require('node:child_process').execFileSync('git',['show','f7ce05cb3041c23626ba4d3826909b4b6f1b9069:'+path],{encoding:'utf8'}) : undefined;
  const ingest=load(path,deps,{},baseline).ingestAndStageProjectUboqPackage;
  return {vault,db,run:()=>ingest(db,{projectId:'synthetic-project',uploadedByUserId:actor.userId,fileName:'boq.csv',buffer:Buffer.from('fixture'),sectorType:'CORPORATE',taxProfileCode:'CORP_PH_VAT_EXCL_12'}),counts:()=>({snapshots,deletes,reads})};
}
test('BOQ sequential duplicate verifies immutable vault and creates one DRAFT snapshot',async()=>{
  const f=orchestratorFixture();const first=await f.run();assert.equal(first.snapshot.status,'DRAFT');
  const second=await f.run();assert.equal(second.duplicateIdempotentReplay,true);
  assert.deepEqual(f.counts(),{snapshots:1,deletes:0,reads:1});
});
test('BOQ concurrent duplicate creates one snapshot and preserves vault',async()=>{
  const f=orchestratorFixture({concurrent:true});const result=await Promise.all([f.run(),f.run()]);
  assert.equal(result.filter(r=>r.duplicateIdempotentReplay).length,1);
  assert.equal(f.counts().snapshots,1);assert.equal(f.counts().deletes,0);assert.equal(f.counts().reads,1);
});
test('BOQ unresolved human-review candidate cannot create financial snapshot',async()=>{
  const f=orchestratorFixture({pending:true});const r=await f.run();assert.equal(r.snapshot,null);assert.equal(f.counts().snapshots,0);
});

function projectFixture({grant=true,failAssignment=false,session=actor}={}) {
  const rows={commands:[],contexts:[]};
  const tx={$queryRaw:async(strings,...values)=>{
    if(failAssignment)throw Error('fixture assignment failure');
    rows.commands.push({sql:strings.join('?'),values});
  }};
  const db={rolePermission:{findFirst:async()=>grant?{id:'grant'}:null},$transaction:async fn=>fn(tx)};
  const action=load('src/app/actions/project-intake.ts',{'@/lib/prisma':{prisma:db},'@/lib/dal/auth':{verifyOperationalSession:async()=>session},
    'node:crypto':{randomUUID:()=> 'new-project'},
    '@/lib/uboq/project-ownership':{applyProjectRlsSessionVars:async(client,ctx)=>{assert.equal(client,tx);rows.contexts.push(ctx);}},
  }).createProjectProfile;
  const form=()=>{const f=new FormData();f.set('name','Synthetic project');f.set('sector','CORPORATE');return f;};
  return {action,form,rows};
}
test('project creation binds authenticated context and invokes bounded bootstrap command',async()=>{
  const f=projectFixture();const r=await f.action(f.form());assert.equal(r.projectId,'new-project');
  assert.equal(f.rows.contexts.length,1);assert.equal(f.rows.contexts[0].userId,actor.userId);
  assert.equal(f.rows.contexts[0].sessionVersion,actor.sessionVersion);assert.equal(f.rows.contexts[0].projectId,'new-project');
  assert.equal(f.rows.commands.length,1);assert.match(f.rows.commands[0].sql,/SELECT public.phase9_create_project_profile/);
  assert.deepEqual(Array.from(f.rows.commands[0].values),['new-project','Synthetic project',null,null,null,'CORPORATE',null]);
});
test('project command failure propagates without returning success',async()=>{
  const f=projectFixture({failAssignment:true});await assert.rejects(f.action(f.form()),/assignment failure/);
  assert.equal(f.rows.commands.length,0);
});
for(const opts of [{grant:false},{session:null}])test('project creation requires session and create grant '+JSON.stringify(opts),async()=>{
  const f=projectFixture(opts);assert.ok((await f.action(f.form())).error);assert.equal(f.rows.commands.length,0);
});
for(const [key,value] of [['name','ab'],['sector','UNKNOWN'],['description','x'.repeat(2001)]])test('project rejects invalid '+key,async()=>{
  const f=projectFixture();const form=f.form();form.set(key,value);assert.ok((await f.action(form)).error);assert.equal(f.rows.commands.length,0);
});
for(const condition of ['stage','document','corrupt'])test('evidence rejects '+condition+' denial before persistence',async()=>{
  const f=evidenceFixture();
  if(condition==='stage')f.deps['@/lib/uboq/security/stage-rbac'].assertUboqStageAuthorization=async()=>{throw Error('PBAC_DENIED');};
  if(condition==='document')f.deps['@/lib/uboq/security/document-permissions'].requireProjectDocumentPermission=async()=>{throw Error('DOCUMENT_PERMISSION_DENIED');};
  if(condition==='corrupt')f.deps['@/lib/uboq/intake/security-guard'].scanUploadedDocumentSecurity=()=>({safe:false,findings:['MIME_MISMATCH']});
  const res=await f.post()(request({documentRole:'CONTRACT'}),f.context);assert.ok(res.status>=400);assert.equal(f.counts().writes,0);
});
for(const type of ['empty','too-large','string'])test('evidence rejects '+type+' file',async()=>{
  const f=evidenceFixture();const form=new FormData();form.set('documentRole','CONTRACT');
  form.set('file',type==='string'?'bad':new File([type==='empty'?'':Buffer.alloc(25*1024*1024+1)],'test.csv'));
  const res=await f.post()(new Request('http://fixture/documents',{method:'POST',body:form}),f.context);
  assert.equal(res.status,400);assert.equal(f.counts().writes,0);
});
function downloadFixture({denied=false,missing=false,corrupt=false,documentDenied=false}={}) {
  let query,read=0;
  const db={$transaction:async fn=>fn(db),uboqSourceDocument:{findFirst:async args=>{query=args;return missing?null:{fileName:'report\r\n"/test.csv',mimeType:'text/csv',storageUri:'fixture://object',sha256Hash:'hash'};}}};
  const deps={'next/server':response,'@/lib/prisma':{prisma:db},'@/lib/dal/auth':{verifyOperationalSession:async()=>actor},'@/lib/uboq/project-ownership':rls,
    '@/lib/uboq/security/stage-rbac':{assertUboqStageAuthorization:async()=>{if(denied)throw Error('PBAC_DENIED');}},
    '@/lib/uboq/security/document-permissions':{requireProjectDocumentPermission:async()=>{if(documentDenied)throw Error('DOCUMENT_PERMISSION_DENIED');}},
    '@/lib/uboq/storage/vault-storage':{resolveUboqVaultStorageProvider:()=>({getAndVerify:async p=>{read++;assert.equal(p.expectedProjectId,'synthetic-project');assert.equal(p.expectedSha256Hash,'hash');if(corrupt)throw Error('INTEGRITY_CORRUPTION');return{buffer:Buffer.from('evidence')};}})}};
  return {get:()=>load('src/app/api/projects/[id]/documents/[docId]/download/route.ts',deps).GET(null,{params:Promise.resolve({id:'synthetic-project',docId:'synthetic-document'})}),inspect:()=>({query,read})};
}
test('download binds project/document, sanitizes filename and returns private attachment bytes',async()=>{
  const f=downloadFixture();const res=await f.get();assert.equal(res.status,200);assert.equal(await res.text(),'evidence');
  assert.equal(f.inspect().query.where.projectId,'synthetic-project');assert.equal(f.inspect().query.where.id,'synthetic-document');
  assert.equal(res.headers.get('cache-control'),'private, no-store');assert.equal(res.headers.get('x-content-type-options'),'nosniff');
  assert.ok(!res.headers.get('content-disposition').includes('\r'));assert.ok(!res.headers.get('content-disposition').includes('/'));
});
for(const [opts,status] of [[{denied:true},403],[{documentDenied:true},403],[{missing:true},404],[{corrupt:true},404]])test('download fails closed '+JSON.stringify(opts),async()=>{
  const f=downloadFixture(opts);const res=await f.get();assert.equal(res.status,status);if(!opts.corrupt)assert.equal(f.inspect().read,0);
});
test('real scanner rejects empty, oversized and magic/extension mismatches',()=>{
  const scan=load('src/lib/uboq/intake/security-guard.ts',{'node:crypto':crypto,'node:path':require('node:path'),'node:zlib':require('node:zlib'),xlsx:require('xlsx')}).scanUploadedDocumentSecurity;
  assert.throws(()=>scan('empty.csv',Buffer.alloc(0)),/EMPTY/);
  assert.throws(()=>scan('large.csv',Buffer.alloc(25*1024*1024+1)),/SIZE_EXCEEDED/);
  assert.throws(()=>scan('fake.csv',Buffer.from('%PDF-1.4 fixture'),'text/csv'),/MISMATCH/);
  assert.throws(()=>scan('valid.csv',Buffer.from('a,b\n1,2'),'application/pdf'),/MIME_MISMATCH/);
  const result=scan('valid.csv',Buffer.from('a,b\n1,2'),'text/csv');assert.equal(result.safe,true);
  for(const mime of [undefined,'','application/octet-stream','application/csv','application/vnd.ms-excel','text/csv; charset=utf-8']) {
    assert.equal(scan('valid.csv',Buffer.from('a,b\n1,2'),mime).safe,true);
  }
});


test('real scanner verifies ZIP central directory, descriptors and bounded inflation',()=>{
  const zlib=require('node:zlib');
  const scan=load('src/lib/uboq/intake/security-guard.ts',{
    'node:crypto':crypto,'node:path':require('node:path'),'node:zlib':zlib,xlsx:require('xlsx'),
  }).scanUploadedDocumentSecurity;
  const mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // A valid ordinary workbook must remain supported.
  const XLSX=require('xlsx');
  const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([['Item','Qty'],['A',1]]),'BOQ');
  const ordinary=Buffer.from(XLSX.write(workbook,{bookType:'xlsx',type:'buffer'}));
  assert.equal(scan('ordinary.xlsx',ordinary,mime).safe,true);

  // With ZIP flag bit 3, local-header sizes are zero; only central sizes count.
  const descriptorZip=(data,reportedSize=data.length)=>{
    const name=Buffer.from('xl/workbook.xml');
    const compressed=zlib.deflateRawSync(data);
    const local=Buffer.alloc(30+name.length);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
    local.writeUInt16LE(8,6);local.writeUInt16LE(8,8);
    local.writeUInt16LE(name.length,26);name.copy(local,30);
    const descriptor=Buffer.alloc(16);
    descriptor.writeUInt32LE(0x08074b50,0);
    descriptor.writeUInt32LE(compressed.length,8);
    descriptor.writeUInt32LE(data.length,12);
    const central=Buffer.alloc(46+name.length);
    central.writeUInt32LE(0x02014b50,0);
    central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
    central.writeUInt16LE(8,8);central.writeUInt16LE(8,10);
    central.writeUInt32LE(compressed.length,20);
    central.writeUInt32LE(reportedSize,24);
    central.writeUInt16LE(name.length,28);name.copy(central,46);
    const eocd=Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50,0);
    eocd.writeUInt16LE(1,8);eocd.writeUInt16LE(1,10);
    eocd.writeUInt32LE(central.length,12);
    eocd.writeUInt32LE(local.length+compressed.length+descriptor.length,16);
    return Buffer.concat([local,compressed,descriptor,central,eocd]);
  };
  assert.equal(scan('descriptor.xlsx',descriptorZip(Buffer.from('<workbook/>')),mime).safe,true);
  const oversized=descriptorZip(Buffer.alloc(81*1024*1024,32));
  assert.ok(oversized.length<25*1024*1024);
  assert.throws(()=>scan('oversized.xlsx',oversized,mime),/ZIP_BOMB_BLOCKED/);
  const forged=descriptorZip(Buffer.alloc(2*1024*1024,32),1024);
  assert.throws(()=>scan('forged.xlsx',forged,mime),/ZIP_SIZE_MISMATCH/);
  const corrupt=Buffer.from(descriptorZip(Buffer.from('<workbook/>')));
  corrupt.writeUInt32LE(0,corrupt.length-22+16);
  assert.throws(()=>scan('corrupt.xlsx',corrupt,mime),/ZIP_DIRECTORY_INVALID/);
});



function officeZipFixture(entryName, content, { descriptor = false, reportedSize = content.length } = {}) {
  const zlib = require('node:zlib');
  const name = Buffer.from(entryName, 'utf8');
  const compressed = zlib.deflateRawSync(content);
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(descriptor ? 8 : 0, 6);
  local.writeUInt16LE(8, 8);
  if (!descriptor) {
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(reportedSize, 22);
  }
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);
  const dd = descriptor ? Buffer.alloc(16) : Buffer.alloc(0);
  if (descriptor) {
    dd.writeUInt32LE(0x08074b50, 0);
    dd.writeUInt32LE(compressed.length, 8);
    dd.writeUInt32LE(content.length, 12);
  }
  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(descriptor ? 8 : 0, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(reportedSize, 24);
  central.writeUInt16LE(name.length, 28);
  name.copy(central, 46);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length + compressed.length + dd.length, 16);
  return Buffer.concat([local, compressed, dd, central, eocd]);
}

test('real scanner caps ZIP entry count and preserves old adversarial classifications', () => {
  const guard = load('src/lib/uboq/intake/security-guard.ts', {
    'node:crypto': crypto, 'node:path': require('node:path'),
    'node:zlib': require('node:zlib'), xlsx: require('xlsx'),
  });
  const scan = guard.scanUploadedDocumentSecurity;
  assert.throws(() => scan('nested.xlsx', officeZipFixture('xl/payload.zip', Buffer.from('abc'))), /NESTED_ARCHIVE_BLOCKED/);
  assert.throws(() => scan('macro.xlsx', officeZipFixture('xl/vbaProject.bin', Buffer.from('abc'))), /MACRO_BLOCKED/);
  assert.throws(() => scan('bomb.xlsx', officeZipFixture('xl/workbook.xml', Buffer.from('x'), { reportedSize: 95 * 1024 * 1024 })), /ZIP_BOMB_BLOCKED/);

  const localParts = [], centralParts = [];
  let localOffset = 0;
  for (let i = 0; i < 2049; i++) {
    const name = Buffer.from('xl/e' + i + '.xml');
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    name.copy(central, 46);
    localParts.push(local); centralParts.push(central);
    localOffset += local.length;
  }
  const directory = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(2049, 8);
  eocd.writeUInt16LE(2049, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  const tooMany = Buffer.concat([...localParts, directory, eocd]);
  assert.ok(tooMany.length < 25 * 1024 * 1024);
  assert.throws(() => scan('many.xlsx', tooMany), /ZIP_ENTRY_COUNT_EXCEEDED/);
});


test('real scanner rejects duplicate central directory references before inflation', () => {
  const scan = load('src/lib/uboq/intake/security-guard.ts', {
    'node:crypto': crypto, 'node:path': require('node:path'),
    'node:zlib': require('node:zlib'), xlsx: require('xlsx'),
  }).scanUploadedDocumentSecurity;
  const original = officeZipFixture('xl/workbook.xml', Buffer.from('<workbook/>'), {descriptor: true});
  const oldEnd = original.length - 22;
  const cdStart = original.readUInt32LE(oldEnd + 16);
  const cd = original.subarray(cdStart, oldEnd);
  const eocd = Buffer.from(original.subarray(oldEnd));
  eocd.writeUInt16LE(2, 8);
  eocd.writeUInt16LE(2, 10);
  eocd.writeUInt32LE(cd.length * 2, 12);
  const forged = Buffer.concat([original.subarray(0, oldEnd), cd, eocd]);
  assert.throws(
    () => scan('duplicate.xlsx', forged),
    /UBOQ_SEC_ZIP_DUPLICATE_ENTRY/,
  );
});




test('real scanner and XLSX extraction reject central-directory disagreement before ExcelJS', async () => {
  const zlib = require('node:zlib');
  const XLSX = require('xlsx');
  const ExcelJS = require('exceljs');
  const guard = load('src/lib/uboq/intake/security-guard.ts', {
    'node:crypto': crypto, 'node:path': require('node:path'),
    'node:zlib': zlib, xlsx: XLSX,
  });
  let workbookConstructed = 0;
  const observedExcelJS = {
    Workbook: class extends ExcelJS.Workbook {
      constructor() { super(); workbookConstructed++; }
    },
  };
  const parser = load('src/lib/uboq/intake/parsers.ts', {
    exceljs: observedExcelJS, xlsx: XLSX, 'csv-parse/sync': require('csv-parse/sync'),
    '../field-catalog': { resolveCanonicalFieldId: () => null },
    './security-guard': guard,
  });

  // A normal workbook must still reach the REAL ExcelJS parser and produce BOQ data.
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Item Code', 'Work Description', 'Unit', 'Quantity', 'Unit Rate'],
    ['P1-01', 'Excavation', 'cu.m', 3, 100],
  ]), 'BOQ');
  const ordinary = Buffer.from(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  const ordinaryResult = await parser.extractUniversalDocumentPackage('ordinary.xlsx', ordinary);
  assert.ok(workbookConstructed > 0, 'Ordinary XLSX must use real ExcelJS');
  assert.ok(ordinaryResult.candidates.some(c => c.mappedFields.item_code === 'P1-01'),
    'Legitimate BOQ row should remain extractable');

  // The scanner's old EOCD selection chose the outer directory whose ZIP
  // comment ends exactly at EOF, whereas ExcelJS/JSZip picked the last EOCD
  // signature within that comment. Only the latter lists this >100:1 entry.
  const outerEnd = ordinary.length - 22;
  assert.equal(ordinary.readUInt32LE(outerEnd), 0x06054b50);
  assert.equal(ordinary.readUInt16LE(outerEnd + 20), 0);
  const origDirOffset = ordinary.readUInt32LE(outerEnd + 16);
  const origDirSize = ordinary.readUInt32LE(outerEnd + 12);
  assert.equal(origDirOffset + origDirSize, outerEnd);
  const originalDirectory = ordinary.subarray(origDirOffset, outerEnd);
  const originalCount = ordinary.readUInt16LE(outerEnd + 10);

  const hiddenData = Buffer.alloc(1024 * 1024, 65);
  const compressed = zlib.deflateRawSync(hiddenData);
  assert.ok(hiddenData.length / compressed.length > 100);
  const name = Buffer.from('xl/media/unchecked-media.bin');
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(hiddenData.length, 22);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);
  const unverifiedRecordOffset = ordinary.length;

  const extraCentral = Buffer.alloc(46 + name.length);
  extraCentral.writeUInt32LE(0x02014b50, 0);
  extraCentral.writeUInt16LE(20, 4);
  extraCentral.writeUInt16LE(20, 6);
  extraCentral.writeUInt16LE(8, 10);
  extraCentral.writeUInt32LE(compressed.length, 20);
  extraCentral.writeUInt32LE(hiddenData.length, 24);
  extraCentral.writeUInt16LE(name.length, 28);
  extraCentral.writeUInt32LE(unverifiedRecordOffset, 42);
  name.copy(extraCentral, 46);

  const alternateDirOffset = ordinary.length + local.length + compressed.length;
  const alternateDirSize = originalDirectory.length + extraCentral.length;
  const alternateEnd = Buffer.alloc(22);
  alternateEnd.writeUInt32LE(0x06054b50, 0);
  alternateEnd.writeUInt16LE(originalCount + 1, 8);
  alternateEnd.writeUInt16LE(originalCount + 1, 10);
  alternateEnd.writeUInt32LE(alternateDirSize, 12);
  alternateEnd.writeUInt32LE(alternateDirOffset, 16);
  // The alternate EOCD must NOT itself terminate at EOF. This is the mismatch.
  const suffix = Buffer.from('AFTER-ALT-EOCD');
  const zipComment = Buffer.concat([
    local, compressed, originalDirectory, extraCentral, alternateEnd, suffix,
  ]);
  assert.ok(zipComment.length < 65535, 'Reproduction remains bounded');
  const outerEocd = Buffer.from(ordinary.subarray(outerEnd));
  outerEocd.writeUInt16LE(zipComment.length, 20);
  const conflicting = Buffer.concat([ordinary.subarray(0, outerEnd), outerEocd, zipComment]);
  assert.ok(conflicting.length < 25 * 1024 * 1024);
  assert.ok(conflicting.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) > outerEnd);

  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  assert.throws(() => guard.scanUploadedDocumentSecurity('disagreement.xlsx', conflicting, mime),
    /UBOQ_SEC_ZIP_AMBIGUOUS_DIRECTORY/);
  const before = workbookConstructed;
  await assert.rejects(() => parser.extractUniversalDocumentPackage('disagreement.xlsx', conflicting),
    /UBOQ_SEC_ZIP_AMBIGUOUS_DIRECTORY/);
  assert.equal(workbookConstructed, before,
    'The real XLSX extraction path must reject before constructing ExcelJS, not inflate unverified media');
});


test('real WP2 ZIP fixture helper preserves security classifications', () => {
  // Exercise the actual WP2 generator in isolation; never invoke WP2 live DB checks.
  const file = 'scripts/uboq/run-wp2-local-verification.ts';
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf('function buildMinimalZipEntry(');
  const end = source.indexOf('\nasync function generateMultiPageNativePdfBuffer()', start);
  assert.ok(start >= 0 && end > start, 'WP2 archive fixture helper must exist');
  const helperSource = "import zlib from 'node:zlib';\n" +
    source.slice(start, end) + '\nexport { buildMinimalZipEntry };';
  const helper = load(file, { 'node:zlib': require('node:zlib') }, {}, helperSource);
  const guard = load('src/lib/uboq/intake/security-guard.ts', {
    'node:crypto': crypto, 'node:path': require('node:path'),
    'node:zlib': require('node:zlib'), xlsx: require('xlsx'),
  });
  const make = helper.buildMinimalZipEntry;
  assert.equal(typeof make, 'function');
  assert.throws(() => guard.scanUploadedDocumentSecurity(
    'nested.xlsx', make('xl/payload.zip', Buffer.from('nested')),
  ), /UBOQ_SEC_NESTED_ARCHIVE_BLOCKED/);
  assert.throws(() => guard.scanUploadedDocumentSecurity(
    'macro.xlsx', make('xl/vbaProject.bin', Buffer.from('macro')),
  ), /UBOQ_SEC_MACRO_BLOCKED/);
  assert.throws(() => guard.scanUploadedDocumentSecurity(
    'bomb.xlsx', make('xl/workbook.xml', Buffer.from('x'), 95 * 1024 * 1024),
  ), /UBOQ_SEC_ZIP_BOMB_BLOCKED/);
  assert.equal(guard.scanUploadedDocumentSecurity(
    'normal.xlsx', make('xl/workbook.xml', Buffer.from('<workbook/>')),
  ).detectedFormat, 'XLSX');
});


test('DOCX descriptor entry extraction preserves BOQ table candidates', async () => {
  const guard = load('src/lib/uboq/intake/security-guard.ts', {
    'node:crypto': crypto, 'node:path': require('node:path'),
    'node:zlib': require('node:zlib'), xlsx: require('xlsx'),
  });
  const parser = load('src/lib/uboq/intake/parsers.ts', {
    exceljs: require('exceljs'), xlsx: require('xlsx'),
    'csv-parse/sync': require('csv-parse/sync'),
    '../field-catalog': { resolveCanonicalFieldId: () => null },
    './security-guard': guard,
  });
  const xml = Buffer.from('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl>' +
    '<w:tr><w:tc><w:p><w:t>Item Code</w:t></w:p></w:tc><w:tc><w:p><w:t>Work Description</w:t></w:p></w:tc><w:tc><w:p><w:t>Unit</w:t></w:p></w:tc><w:tc><w:p><w:t>Quantity</w:t></w:p></w:tc><w:tc><w:p><w:t>Unit Rate</w:t></w:p></w:tc></w:tr>' +
    '<w:tr><w:tc><w:p><w:t>DOC-01</w:t></w:p></w:tc><w:tc><w:p><w:t>Steel Staircase</w:t></w:p></w:tc><w:tc><w:p><w:t>pcs</w:t></w:p></w:tc><w:tc><w:p><w:t>5</w:t></w:p></w:tc><w:tc><w:p><w:t>700</w:t></w:p></w:tc></w:tr>' +
    '</w:tbl></w:body></w:document>');
  const zip = officeZipFixture('word/document.xml', xml, { descriptor: true });
  assert.equal(guard.scanUploadedDocumentSecurity('table.docx', zip).detectedFormat, 'DOCX');
  const extracted = await parser.extractUniversalDocumentPackage('table.docx', zip);
  assert.equal(extracted.blockingErrors.length, 0);
  assert.equal(extracted.candidates.length, 1);
  assert.equal(extracted.candidates[0].mappedFields.item_code, 'DOC-01');
  assert.equal(extracted.candidates[0].mappedFields.work_description, 'Steel Staircase');
  assert.equal(Number(extracted.candidates[0].mappedFields.approved_qty), 5);
});


function vaultModule(env={},blob={}) {
  return load('src/lib/uboq/storage/vault-storage.ts',{'node:crypto':crypto,'node:fs/promises':require('node:fs/promises'),'node:path':require('node:path'),'@vercel/blob':blob},env);
}
test('private encrypted vault concurrent writes recover verified existing immutable object',async()=>{
  class BlobNotFoundError extends Error {}
  let bytes,pathname,heads=0,release;
  const barrier=new Promise(r=>release=r);
  const blob={BlobNotFoundError,head:async()=>{if(++heads===2)release();await barrier;throw new BlobNotFoundError();},
    put:async(p,b,options)=>{assert.equal(options.allowOverwrite,false);if(bytes)throw Error('blob already exists');pathname=p;bytes=b;},
    get:async()=>({statusCode:200,blob:{pathname},stream:new ReadableStream({start(c){c.enqueue(bytes);c.close();}})})};
  const Provider=vaultModule({UBOQ_VAULT_BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_fixture_secret',UBOQ_VAULT_ENCRYPTION_KEY:'0'.repeat(64),UBOQ_VAULT_ENV_NAMESPACE:'fixture'},blob).VercelBlobPrivateVaultProvider;
  const provider=new Provider();const buffer=Buffer.from('immutable evidence');const sha=crypto.createHash('sha256').update(buffer).digest('hex');
  const params={projectId:'synthetic-project',sha256Hash:sha,buffer,fileName:'evidence.csv',mimeType:'text/csv'};
  const receipts=await Promise.all([provider.putImmutableAndVerify(params),provider.putImmutableAndVerify(params)]);
  assert.equal(receipts.filter(r=>r.newlyCreated).length,1);
  assert.ok(!bytes.includes(buffer));
  await assert.rejects(provider.getAndVerify({storageUri:receipts[0].storageUri,expectedProjectId:'another-project',expectedSha256Hash:sha}),/CROSS_PROJECT/);
  bytes[bytes.length-1]^=1;
  await assert.rejects(provider.getAndVerify({storageUri:receipts[0].storageUri,expectedProjectId:'synthetic-project',expectedSha256Hash:sha}));
});
test('local disposable vault sequential replay, input hash and project binding',async()=>{
  const path=require('node:path');const root=path.resolve('artifacts/phase9-vault-'+crypto.randomUUID());
  assert.ok(root.startsWith(path.resolve('artifacts')+path.sep));
  const provider=vaultModule({UBOQ_VAULT_BACKEND:'local_durable',UBOQ_LOCAL_VAULT_DIR:root,NODE_ENV:'test'}).resolveUboqVaultStorageProvider();
  const buffer=Buffer.from('synthetic fixture');const sha=crypto.createHash('sha256').update(buffer).digest('hex');
  const p={projectId:'synthetic-project',sha256Hash:sha,buffer,fileName:'evidence.csv',mimeType:'text/csv'};
  const first=await provider.putImmutableAndVerify(p);assert.equal(first.newlyCreated,true);
  assert.equal((await provider.putImmutableAndVerify(p)).newlyCreated,false);
  await assert.rejects(provider.putImmutableAndVerify({...p,buffer:Buffer.from('different')}),/HASH_MISMATCH/);
  await assert.rejects(provider.getAndVerify({storageUri:first.storageUri,expectedProjectId:'other',expectedSha256Hash:sha}),/CROSS_PROJECT/);
});

function walk(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const result=walk(child,predicate);if(result)return result;}return null;}
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
test('document register query and rendered rows stay project-scoped without vault URI',async()=>{
  let query;
  const db={$transaction:async fn=>fn(db),project:{findUnique:async()=>({id:'synthetic-project',name:'Synthetic',projectCategory:'CORPORATE'})},
    uboqSourceDocument:{findMany:async args=>{query=args;return[{id:'doc',fileName:'evidence.csv',documentRole:'CONTRACT',byteSize:5,createdAt:new Date(),sha256Hash:'hash',snapshots:[]}];}},rolePermission:{findFirst:async()=>null}};
  const Client=()=>{};
  const page=load('src/app/projects/[id]/documents/page.tsx',{'react/jsx-runtime':jsx,'next/link':{default:()=>{}},'next/navigation':{redirect:()=>{throw Error('redirect');}},
    '@/lib/prisma':{prisma:db},'@/lib/dal/auth':{verifyOperationalSession:async()=>actor},'@/lib/uboq/project-ownership':rls,
    '@/lib/uboq/security/stage-rbac':{assertUboqStageAuthorization:async()=>{},isRolePermittedForUboqStage:()=>true},
    '@/lib/uboq/security/document-permissions':{requireProjectDocumentPermission:async()=>{}},'./ProjectDocumentIntakeClient':Client}).default;
  const tree=await page({params:Promise.resolve({id:'synthetic-project'})});const client=walk(tree,n=>n.type===Client);
  assert.equal(query.where.projectId,'synthetic-project');assert.equal(query.select.storageUri,undefined);
  assert.equal(client.props.files.length,1);assert.equal(client.props.canUploadEvidence,false);assert.ok(!JSON.stringify(client.props).includes('storageUri'));
});
test('document UI requires explicit tax confirmation then uploads files individually with partial failure',async()=>{
  let index=0,refreshes=0;const state=[];const requests=[];
  const ref={current:{files:[new File(['a'],'one.csv'),new File(['b'],'two.csv')],value:'selected'}};
  const component=load('src/app/projects/[id]/documents/ProjectDocumentIntakeClient.tsx',{
    'react/jsx-runtime':jsx,react:{useRef:()=>ref,useState:initial=>{const i=index++;if(!(i in state))state[i]=initial;return[state[i],v=>state[i]=v];}},
    'next/navigation':{useRouter:()=>({refresh:()=>refreshes++})},'next/link':{default:()=>{}}}, {},undefined,
    {fetch:async(url,options)=>{requests.push({url,form:options.body});return{ok:requests.length===1,status:requests.length===1?201:400,json:async()=>({error:'synthetic rejection'})};}}).default;
  const props={projectId:'synthetic-project',sector:'CORPORATE',canStageBoq:true,canUploadEvidence:true,files:[]};
  const render=()=>{index=0;return component(props);};
  let tree=render();await walk(tree,n=>n.type==='button').props.onClick();assert.equal(requests.length,0);
  const tax=walk(tree,n=>n.type==='select'&&n.props.required);tax.props.onChange({target:{value:'CORP_PH_VAT_EXCL_12'}});
  tree=render();await walk(tree,n=>n.type==='button').props.onClick();assert.equal(requests.length,2);
  assert.equal(requests[0].form.get('taxProfileCode'),'CORP_PH_VAT_EXCL_12');assert.equal(requests[0].url,'/api/uboq/intake');
  assert.equal(refreshes,1);assert.equal(state[3].length,2);assert.match(state[3][1],/synthetic rejection/);
});
