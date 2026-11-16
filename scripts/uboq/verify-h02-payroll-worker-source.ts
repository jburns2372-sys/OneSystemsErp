import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
// Focused route fixture; actual signed SQL/HTTP evidence is recorded separately.
const require=createRequire(import.meta.url),Module=require('node:module'),original=Module._load;
let denied=false,context:any={userId:'actor',sessionVersion:7,projectId:'P1'},observed:any,entries:any[]=[];
const workers=[{id:'w1',projectId:'P1',payrollCategory:'Monthly',employmentType:'REGULAR',dailyRate:10},{id:'weekly',projectId:'P1',payrollCategory:'Weekly Salaried',employmentType:'REGULAR',dailyRate:20},{id:'peer',projectId:'P2',payrollCategory:'Monthly',employmentType:'REGULAR',dailyRate:30}];
const tx={
 $queryRaw:async(_strings:any,project:string,category:string)=>{observed={project,category};return [{workers:workers.filter(w=>w.projectId===project&&(category==='*'||w.payrollCategory===category))}];},
 payrollPeriod:{findFirst:async()=>null,create:async({data}:any)=>({id:'fixture-period',...data})},
 payroll:{createMany:async({data}:any)=>{entries.push(...data);}},auditLog:{create:async()=>({})}
};
Module._load=function(request:string,...args:any[]){
 if(request.endsWith('/prismaRls'))return {backendPrisma:{$transaction:async(fn:any)=>fn(tx)},backendRlsStorage:{getStore:()=>context}};
 if(request.endsWith('/permissions'))return {requirePermission:async(actor:string,module:string,operation:string)=>{assert.equal(actor,'actor');assert.equal(module,'PAYROLL');assert.equal(operation,'canCreate');if(denied)throw Error('permission denied');}};
 if(request.endsWith('/lib/aiValidation'))return {validateTransactionWithAI:async()=>({validationStatus:'PASS'})};
 if(request.endsWith('/lib/workflow'))return {logAudit:async()=>{}};
 if(request==='@prisma/client')return {PrismaClient:class {worker={findMany:()=>{throw Error('UNSCOPED_WORKER_READ');}}}};
 return original.call(this,request,...args);
};
let router:any;try{router=require('../../apps/aws-backend/src/routes/payroll').default;}finally{Module._load=original;}
const handler=router.stack.find((x:any)=>x.route?.path==='/period/create').route.stack[0].handle;
async function create(projectId='P1',calendarRule='MONTHLY',actor:any={id:'actor',role:'SUPER_ADMIN',sessionVersion:7}){let status=200,payload:any;await handler({user:actor,headers:{'x-user-session':'actor'},body:{projectId,calendarRule,periodType:'SYNTHETIC',month:11,year:2026,startDate:'2026-11-01',endDate:'2026-11-30',payrollDate:'2026-11-30'}},{status(n:number){status=n;return this;},json(v:any){payload=v;}});return {status,payload};}
(async()=>{
 assert.equal((await create()).status,200);assert.deepEqual(observed,{project:'P1',category:'Monthly'});assert.deepEqual(entries.map(e=>e.workerId),['w1']);
 entries=[];assert.equal((await create('P1','CUSTOM')).status,200);assert.deepEqual(entries.map(e=>e.workerId),['w1','weekly']);
 entries=[];context={...context,projectId:'P2'};assert.equal((await create('P2')).status,200);assert.deepEqual(entries.map(e=>e.workerId),['peer']);
 const before=observed;assert.equal((await create('P1')).status,403);assert.equal(observed,before);
 assert.equal((await create('P2','MONTHLY',null)).status,403);assert.equal((await create('P2','MONTHLY',{id:'actor',sessionVersion:6})).status,403);
 denied=true;assert.equal((await create('P2')).status,500);assert.equal(observed,before);denied=false;
 assert.equal((await create('')).status,403);
 console.log('PASS: route fixture covers signed actor/context consistency, P1/P2/category/custom selection, permission denial and company NULL route rejection; no direct Worker read. Runtime authority verified in separate SQL/HTTP reports.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
