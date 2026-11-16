
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import type { Request } from 'express';
import { requirePermission } from './permissions';

export const companyPayrollOperations = ['VIEW','CREATE_PERIOD','EDIT_DRAFT','COMPUTE_DRAFT','IMPORT_DTR','DELETE_DRAFT'] as const;
export type CompanyPayrollOperation = typeof companyPayrollOperations[number];
let client: PrismaClient | undefined;
function companyClient() {
  const url = process.env.COMPANY_PAYROLL_DATABASE_URL;
  if (!url) throw new Error('COMPANY_PAYROLL_DATABASE_URL_REQUIRED');
  return client ??= new PrismaClient({ datasources: { db: { url } } });
}
export function mintCompanyPayrollProof(input: {
  employerId: string; userId: string; sessionVersion: number; operation: CompanyPayrollOperation;
  targetId: string; payloadHash: string; simulatedRole?: string;
}, secret = process.env.COMPANY_PAYROLL_CONTEXT_SECRET) {
  if (!secret || !/^[0-9a-f]{64}$/.test(secret)) throw new Error('COMPANY_PAYROLL_SIGNING_KEY_REQUIRED');
  for (const text of [input.employerId,input.userId,input.targetId,input.simulatedRole ?? '']) {
    if (/[|\r\n\u0000]/.test(text)) throw new Error('COMPANY_PAYROLL_INVALID_ID');
  }
  const issued = String(Math.floor(Date.now()/1000)), nonce = crypto.randomBytes(16).toString('hex');
  const value = ['OSERP_COMPANY_PAYROLL_V1',input.employerId,input.userId,String(input.sessionVersion),
    input.operation,input.targetId,input.payloadHash,issued,nonce,input.simulatedRole ?? ''].join('|');
  return { issued,nonce,signature:crypto.createHmac('sha256',Buffer.from(secret,'hex')).update(value).digest('hex') };
}
export async function withCompanyPayroll<T>(
  req: Request, operation: CompanyPayrollOperation, employerId: string, targetId: string,
  payload: unknown, execute: (tx: any, command: { nonce: string }) => Promise<T>
): Promise<T> {
  const actor = (req as any).user, simulation = (req as any).pbacContext?.simulatedRole;
  if (!actor?.id || !['SUPER_ADMIN','SYSTEM_ADMIN'].includes(actor.role) ||
      !Number.isSafeInteger(actor.sessionVersion) || actor.sessionVersion < 0 ||
      (simulation && simulation !== actor.role)) throw new Error('COMPANY_PAYROLL_REAL_ACTOR_REQUIRED');
  if (!companyPayrollOperations.includes(operation) || typeof employerId!=='string' || !employerId.trim() ||
      employerId==='ALL' || typeof targetId!=='string' || !targetId ||
      (targetId==='*' && operation!=='VIEW')) throw new Error('COMPANY_PAYROLL_OPERATION_REQUIRED');
  const action = operation==='VIEW' ? 'canView' : operation==='CREATE_PERIOD' ? 'canCreate' :
    operation==='DELETE_DRAFT' ? 'canDelete' : 'canEdit';
  await requirePermission(actor.id,'PAYROLL',action);
  if (simulation) await requirePermission(actor.id,'PAYROLL',action,simulation);
  const payloadHash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const proof=mintCompanyPayrollProof({employerId,userId:actor.id,sessionVersion:actor.sessionVersion,
    operation,targetId,payloadHash,simulatedRole:simulation});
  return companyClient().$transaction(async tx => {
    await tx.$executeRaw`SELECT
      set_config('app.company_employer_id',${employerId},true),
      set_config('app.company_user_id',${actor.id},true),
      set_config('app.company_session_version',${String(actor.sessionVersion)},true),
      set_config('app.company_operation',${operation},true),
      set_config('app.company_target_id',${targetId},true),
      set_config('app.company_payload_hash',${payloadHash},true),
      set_config('app.company_issued',${proof.issued},true),
      set_config('app.company_nonce',${proof.nonce},true),
      set_config('app.company_simulated_role',${simulation ?? ''},true),
      set_config('app.company_signature',${proof.signature},true)`;
    await tx.$executeRaw`SELECT public.company_payroll_begin()`;
    const result=await execute(tx,{nonce:proof.nonce});
    await tx.$executeRaw`SELECT public.company_payroll_finish()`;
    return result;
  }, { maxWait: 5000, timeout: 30000, isolationLevel: 'ReadCommitted' });
}
export async function companyWorkers(tx: any): Promise<any[]> {
  const rows = await tx.$queryRaw`SELECT public.company_payroll_workers() AS worker`;
  return rows.map((r: any) => r.worker);
}
export function companyDependencies(tx: any) {
  return {
    worker: { findMany: async () => companyWorkers(tx) },
    governmentSettings: { findFirst: async () => (await tx.$queryRaw`SELECT public.company_payroll_settings() AS settings`)[0]?.settings },
    deductionLedger: { findMany: async ({where}: any) =>
      (await tx.$queryRaw`SELECT public.company_payroll_ledgers(${where.workerId}::text) AS ledger`).map((r: any)=>r.ledger) }
  };
}
