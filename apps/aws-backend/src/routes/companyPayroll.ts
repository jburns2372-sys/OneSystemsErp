
import crypto from 'node:crypto';
import { Router } from 'express';
import { companyPayrollOperations, type CompanyPayrollOperation, withCompanyPayroll, companyWorkers, companyDependencies } from '../lib/employerPayrollAuthorization';
import { computePayrollForPeriod } from './payroll';
const router=Router();
router.post('/command',async(req,res)=>{
 try {
  const {employerId,operation,periodId,data={}}=req.body;
  if (!companyPayrollOperations.includes(operation)) throw new Error('COMPANY_PAYROLL_OPERATION_REQUIRED');
  if (!data || typeof data!=='object' || Array.isArray(data) || data.projectId) throw new Error('COMPANY_PAYROLL_DATA_REQUIRED');
  const target=operation==='CREATE_PERIOD'?crypto.randomUUID():(operation==='VIEW'&&!periodId?'*':periodId);
  const result=await withCompanyPayroll(req,operation as CompanyPayrollOperation,employerId,target,req.body,async(tx,command)=>{
   const workers=await companyWorkers(tx);
   if(operation==='VIEW') {
    const periods=await tx.payrollPeriod.findMany({where:{employerId,projectId:null,...(periodId?{id:periodId}:{})},
      include:{payrolls:true,dtrs:true},orderBy:{startDate:'desc'}});
    return {periods,workers:workers.map(w=>({id:w.id,firstName:w.firstName,lastName:w.lastName,
      projectId:w.projectId,payrollCategory:w.payrollCategory}))};
   }
   if(operation==='CREATE_PERIOD') {
    const {month,year,calendarRule,periodType,startDate,endDate,payrollDate,notes}=data;
    const start=new Date(startDate),end=new Date(endDate),payday=new Date(payrollDate);
    if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<1900||year>9999||
       !['WEEKLY','SEMI_MONTHLY','MONTHLY','CUSTOM','CONSULTANT'].includes(calendarRule)||
       typeof periodType!=='string'||!periodType||[start,end,payday].some(d=>!Number.isFinite(d.getTime()))||start>end)
      throw new Error('COMPANY_PAYROLL_INVALID_PERIOD');
    // Employer lock in begin serializes duplicate detection and creation.
    if((await tx.$queryRaw`SELECT public.company_payroll_period_exists(${month}::integer,${year}::integer,${calendarRule}::text,${periodType}::text) AS exists`)[0]?.exists)
      throw new Error('COMPANY_PAYROLL_DUPLICATE_PERIOD');
    // INSERT without RETURNING: CREATE SELECT only sees rows after insertion.
    // Read the just-created target in the same signed transaction afterward.
    await tx.$executeRaw`INSERT INTO public."PayrollPeriod"
      (id,"employerId","projectId","employerOwnershipEvidenceRef","employerOwnershipVerifiedAt",
       "payrollBatchNumber",month,year,"calendarRule","periodType","startDate","endDate","payrollDate",
       notes,status,"createdById","updatedAt")
      VALUES (${target},${employerId},NULL,${'company-command:'+command.nonce},now(),
       ${'PAY-'+target},${month},${year},${calendarRule},${periodType},${start},${end},${payday},
       ${typeof notes==='string'?notes:null},'DRAFT',${(req as any).user.id},now())`;
    const period=await tx.payrollPeriod.findUniqueOrThrow({where:{id:target}});
    const categories:Record<string,string>={WEEKLY:'Weekly Salaried',SEMI_MONTHLY:'Semi-Monthly',MONTHLY:'Monthly'};
    const selected=workers.filter(w=>!categories[calendarRule]||w.payrollCategory===categories[calendarRule]);
    if(selected.length) await tx.payroll.createMany({data:selected.map(w=>({workerId:w.id,payrollPeriodId:period.id,
      projectId:null,compensationType:w.employmentType==='REGULAR'?'MONTHLY':w.employmentType==='PROJECT_BASED'?'PROJECT_BASED':'DAILY',
      rate:w.dailyRate||0,basicPay:0,netPay:0}))});
    return {period};
   }
   if(operation==='EDIT_DRAFT') {
    if(Object.keys(data).some(k=>k!=='notes')||typeof data.notes!=='string')throw new Error('COMPANY_PAYROLL_EDIT_FIELDS_DENIED');
    return {period:await tx.payrollPeriod.update({where:{id:target},data:{notes:data.notes}})};
   }
   if(operation==='DELETE_DRAFT') {
    await tx.dailyTimeRecord.deleteMany({where:{payrollPeriodId:target}});
    await tx.payroll.deleteMany({where:{payrollPeriodId:target}});
    await tx.payrollPeriod.delete({where:{id:target}});
    return {deletedId:target};
   }
   if(operation==='IMPORT_DTR') {
    if(!Array.isArray(data.entries)||!data.entries.length||data.entries.length>500)throw new Error('COMPANY_PAYROLL_ENTRIES_REQUIRED');
    const eligible=new Set(workers.map(w=>w.id));
    for(const e of data.entries) {
     const date=new Date(e.date);
     if(!eligible.has(e.workerId)||!Number.isFinite(date.getTime())||
       !Number.isFinite(e.regularHours)||!Number.isFinite(e.overtimeHours)||
       e.regularHours<0||e.overtimeHours<0||e.regularHours+e.overtimeHours>24)
       throw new Error('COMPANY_PAYROLL_INVALID_DTR');
     const existing=await tx.dailyTimeRecord.findUnique({where:{workerId_date:{workerId:e.workerId,date}}});
     if(existing && existing.payrollPeriodId!==target)throw new Error('COMPANY_PAYROLL_DTR_ALREADY_OWNED');
     const values={regularHours:e.regularHours,overtimeHours:e.overtimeHours};
     if(existing)await tx.dailyTimeRecord.update({where:{id:existing.id},data:values});
     else await tx.dailyTimeRecord.create({data:{...values,workerId:e.workerId,date,payrollPeriodId:target,projectId:null,
       status:'DRAFT',encodedById:(req as any).user.id}});
    }
   }
   return computePayrollForPeriod(target,{payrollDb:tx,dependencyDb:companyDependencies(tx)});
  });
  res.json({success:true,...result});
 } catch(error) {const message=error instanceof Error?error.message:'COMPANY_PAYROLL_DENIED';
  console.warn('Company payroll operation rejected',{actorId:(req as any).user?.id,operation:req.body?.operation});
  res.status(403).json({success:false,error:message});
 }
});
export default router;
