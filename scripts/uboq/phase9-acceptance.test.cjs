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
  const rows={projects:[],assignments:[]};
  const tx={project:{create:async({data})=>{rows.projects.push(data);return{id:'new-project'};}},
    projectUserAssignment:{create:async({data})=>{if(failAssignment)throw Error('fixture assignment failure');rows.assignments.push(data);}}};
  const db={rolePermission:{findFirst:async()=>grant?{id:'grant'}:null},$transaction:async fn=>{
    try{return await fn(tx);}catch(e){rows.projects.length=0;rows.assignments.length=0;throw e;}
  }};
  const action=load('src/app/actions/project-intake.ts',{'@/lib/prisma':{prisma:db},'@/lib/dal/auth':{verifyOperationalSession:async()=>session}}).createProjectProfile;
  const form=()=>{const f=new FormData();f.set('name','Synthetic project');f.set('sector','CORPORATE');return f;};
  return {action,form,rows};
}
test('project creation inserts only zero-value planning profile and creator assignment',async()=>{
  const f=projectFixture();const r=await f.action(f.form());assert.equal(r.projectId,'new-project');
  assert.equal(f.rows.projects[0].status,'PLANNING');assert.equal(f.rows.projects[0].contractAmount,0);
  assert.equal(f.rows.projects[0].uboqGovernanceEnabled,false);
  assert.equal(f.rows.assignments.length,1);assert.equal(f.rows.assignments[0].userId,actor.userId);
  assert.equal(f.rows.assignments[0].accessLevel,'FULL');
});
test('project creator assignment failure rolls back profile transaction',async()=>{
  const f=projectFixture({failAssignment:true});await assert.rejects(f.action(f.form()),/assignment failure/);
  assert.equal(f.rows.projects.length,0);assert.equal(f.rows.assignments.length,0);
});
for(const opts of [{grant:false},{session:null}])test('project creation requires session and create grant '+JSON.stringify(opts),async()=>{
  const f=projectFixture(opts);assert.ok((await f.action(f.form())).error);assert.equal(f.rows.projects.length,0);
});
for(const [key,value] of [['name','ab'],['sector','UNKNOWN'],['description','x'.repeat(2001)]])test('project rejects invalid '+key,async()=>{
  const f=projectFixture();const form=f.form();form.set(key,value);assert.ok((await f.action(form)).error);assert.equal(f.rows.projects.length,0);
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
  const scan=load('src/lib/uboq/intake/security-guard.ts',{'node:crypto':crypto,'node:path':require('node:path'),xlsx:require('xlsx')}).scanUploadedDocumentSecurity;
  assert.throws(()=>scan('empty.csv',Buffer.alloc(0)),/EMPTY/);
  assert.throws(()=>scan('large.csv',Buffer.alloc(25*1024*1024+1)),/SIZE_EXCEEDED/);
  assert.throws(()=>scan('fake.csv',Buffer.from('%PDF-1.4 fixture'),'text/csv'),/MISMATCH/);
  assert.throws(()=>scan('valid.csv',Buffer.from('a,b\n1,2'),'application/pdf'),/MIME_MISMATCH/);
  const result=scan('valid.csv',Buffer.from('a,b\n1,2'),'text/csv');assert.equal(result.safe,true);
  for(const mime of [undefined,'','application/octet-stream','application/csv','application/vnd.ms-excel','text/csv; charset=utf-8']) {
    assert.equal(scan('valid.csv',Buffer.from('a,b\n1,2'),mime).safe,true);
  }
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
