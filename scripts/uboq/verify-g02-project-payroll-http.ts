import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),s=require('./g02-final-local-support.cjs');
const run=s.suite('h02-project-payroll-http');let server:any;
(async()=>{
 const url=new URL('postgresql://127.0.0.1');url.hostname=s.config.host;url.port=String(s.config.port);url.pathname='/'+s.config.database;url.username=s.f.projectLogin;url.password=s.f.projectPw;
 process.env.DATABASE_URL=url.toString();process.env.DIRECT_URL=url.toString();process.env.AUTH_SECRET=s.crypto.randomBytes(32).toString('hex');process.env.UBOQ_RLS_CONTEXT_SECRET=s.f.signing;
 const express=require('express'),auth=require('../../apps/aws-backend/src/middleware/auth').requireAuth,router=require('../../apps/aws-backend/src/routes/payroll').default;
 const app=express();app.use(express.json());app.use('/api',auth);app.use('/api/payroll',router);server=await new Promise<any>(r=>{const x=app.listen(0,'127.0.0.1',()=>r(x));});
 await run.check('H02-07 real signed authorized project payroll creation succeeds with restricted project login',async()=>{
 const now=Math.floor(Date.now()/1000),payload=Buffer.from(JSON.stringify({uid:s.f.ids.a,role:'SUPER_ADMIN',sv:7,pid:s.f.ids.p1,sim:null,iat:now,exp:now+60})).toString('base64url');
 const token='v1.'+payload+'.'+s.crypto.createHmac('sha256',process.env.AUTH_SECRET).update('v1.'+payload).digest('hex');
 const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/payroll/period/create',{method:'POST',headers:{'Content-Type':'application/json','x-internal-auth':token},body:JSON.stringify({projectId:s.f.ids.p1,month:11,year:2026,calendarRule:'MONTHLY',periodType:'SYNTH-FINAL-PROJECT-WORKER-COMPAT',startDate:'2026-11-01',endDate:'2026-11-30',payrollDate:'2026-11-30'})});
 const body=await response.json() as any;run.report.observed={http_status:response.status,actor:'existing synthetic real SUPER_ADMIN with valid P1 signed session',database_role:'restricted oserp_compat_app membership',worker_permission_denial:JSON.stringify(body).includes('Worker')&&/permission|denied/i.test(JSON.stringify(body)),response_error_code:body?.code||null};
 s.assert.equal(response.status,200,'AUTHORIZED_PROJECT_PAYROLL_CREATE_REJECTED');
 });run.finish();
})().catch((e:any)=>{run.report.status='ERROR';run.report.infrastructure_error=e.message;run.save();process.exitCode=1;}).finally(async()=>{if(server)await new Promise<void>(r=>server.close(()=>r()));setTimeout(()=>process.exit(0),100).unref();});
