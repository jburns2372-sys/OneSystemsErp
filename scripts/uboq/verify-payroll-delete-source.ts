import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const Module=require('node:module');
const original=Module._load;
let status='DRAFT', locked=false, fail=false, denied=false, committed:string[]=[],calls=0;
const scoped={async $transaction(fn:any){calls++;let pending:string[]=[];const tx={
 $queryRaw:async(parts:TemplateStringsArray)=>{assert.match(parts.join(''),/FOR UPDATE/);return [{id:'period',status,isLocked:locked}];},
 dailyTimeRecord:{deleteMany:async()=>{pending.push('dtr');}},
 payroll:{deleteMany:async()=>{pending.push('payroll');}},
 payrollPeriod:{delete:async()=>{if(fail)throw Error('injected final delete failure');pending.push('period');}},
};const result=await fn(tx);committed.push(...pending);return result;}};
Module._load=function(request:string,...args:any[]){
 if(request.endsWith('/lib/prismaRls') || request==='./prismaRls')return {backendPrisma:scoped,backendRlsStorage:{getStore:()=>({userId:'actor',projectId:'P1',sessionVersion:7})}};
 if(request.endsWith('/lib/permissions') || request==='./permissions')return {requirePermission:async(_u:string,module:string,operation:string)=>{assert.equal(module,'PAYROLL');assert.equal(operation,'canDelete');if(denied)throw Error('unauthorized');}};
 if(request==='@prisma/client'){const real=original.call(this,request,...args);return {...real,PrismaClient:class {constructor(){return new Proxy({}, {get(){throw Error('UNEXPECTED_DATABASE_ACCESS');}});}}};}
 return original.call(this,request,...args);
};
const router=require('../../apps/aws-backend/src/routes/payroll').default;
Module._load=original;
const handler=router.stack.find((x:any)=>x.route?.path==='/period/:id'&&x.route.methods.delete).route.stack[0].handle;
async function run(){let code=200;let payload:any;const response={status(n:number){code=n;return this;},json(v:any){payload=v;return this;}};await handler({params:{id:'period'},headers:{'x-user-session':'actor'},user:{id:'actor',role:'SUPER_ADMIN',sessionVersion:7},pbacContext:{}},response);return {code,payload};}
(async()=>{
 assert.equal((await run()).code,200);assert.deepEqual(committed,['dtr','payroll','period']);assert.equal(calls,1);
 committed=[];fail=true;assert.equal((await run()).code,500);assert.deepEqual(committed,[]);
 fail=false;status='APPROVED';assert.equal((await run()).code,500);assert.deepEqual(committed,[]);
 status='DRAFT';locked=true;assert.equal((await run()).code,500);assert.deepEqual(committed,[]);
 locked=false;denied=true;const before=calls;assert.equal((await run()).code,500);assert.equal(calls,before);
 console.log('PASS: actual payroll route uses one transaction; draft success, final-delete failure rollback, approved/locked rejection, unauthorized rejection before transaction. In-memory transaction fixture; SQL/RLS execution remains unverified.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
