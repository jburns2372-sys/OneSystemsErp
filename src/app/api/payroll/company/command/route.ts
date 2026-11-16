import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';

export const dynamic = 'force-dynamic';

const COMPANY_PAYROLL_OPERATIONS = [
  'VIEW',
  'CREATE_PERIOD',
  'EDIT_DRAFT',
  'COMPUTE_DRAFT',
  'IMPORT_DTR',
  'DELETE_DRAFT',
] as const;

type CompanyPayrollOperation = (typeof COMPANY_PAYROLL_OPERATIONS)[number];

let cachedCompanyPayrollClient: PrismaClient | undefined;

function getCompanyPayrollClient(): PrismaClient {
  const url = process.env.COMPANY_PAYROLL_DATABASE_URL;
  if (!url) {
    throw new Error('COMPANY_PAYROLL_DATABASE_URL_REQUIRED');
  }
  if (!cachedCompanyPayrollClient) {
    cachedCompanyPayrollClient = new PrismaClient({ datasources: { db: { url } } });
  }
  return cachedCompanyPayrollClient;
}

function mintCompanyPayrollProof(input: {
  employerId: string;
  userId: string;
  sessionVersion: number;
  operation: CompanyPayrollOperation;
  targetId: string;
  payloadHash: string;
  simulatedRole?: string;
}) {
  const secret = process.env.COMPANY_PAYROLL_CONTEXT_SECRET;
  if (!secret || !/^[0-9a-f]{64}$/.test(secret)) {
    throw new Error('COMPANY_PAYROLL_SIGNING_KEY_REQUIRED');
  }
  for (const text of [input.employerId, input.userId, input.targetId, input.simulatedRole ?? '']) {
    if (/[|\r\n\u0000]/.test(text)) {
      throw new Error('COMPANY_PAYROLL_INVALID_ID');
    }
  }
  const issued = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomBytes(16).toString('hex');
  const value = [
    'OSERP_COMPANY_PAYROLL_V1',
    input.employerId,
    input.userId,
    String(input.sessionVersion),
    input.operation,
    input.targetId,
    input.payloadHash,
    issued,
    nonce,
    input.simulatedRole ?? '',
  ].join('|');
  const signature = crypto
    .createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(value)
    .digest('hex');
  return { issued, nonce, signature };
}

async function assertPayrollModulePermission(
  userId: string,
  userRole: string,
  action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'
) {
  const isGuest =
    userRole === 'GUEST_USER' ||
    userRole === 'GUEST USER' ||
    Boolean(
      await prisma.userRole.findFirst({
        where: {
          userId,
          role: { OR: [{ roleCode: 'GUEST_USER' }, { roleName: 'GUEST USER' }] },
        },
        select: { id: true },
      })
    );
  if (isGuest) {
    throw new Error('COMPANY_PAYROLL_GUEST_DENIED');
  }
  if (userRole === 'SUPER_ADMIN' || userRole === 'SYSTEM_ADMIN') {
    return;
  }
  throw new Error(`COMPANY_PAYROLL_PERMISSION_DENIED:${action}`);
}

interface CompanyWorkerProjection {
  id: string;
  firstName: string;
  lastName: string;
  projectId: string | null;
  payrollCategory: string | null;
  employmentType: string | null;
  rateType: string | null;
  basicMonthlySalary: number | null;
  dailyRate: number | null;
  hourlyRate: number | null;
  pieceRate: number | null;
  contractAmount: number | null;
  retentionPercentage: number | null;
  professionalFee: number | null;
  standardWorkHours: number | null;
  subjectToPayrollCutoff: boolean | null;
  sssDeductionEnabled: boolean | null;
  philHealthDeductionEnabled: boolean | null;
  pagibigDeductionEnabled: boolean | null;
  withholdingTaxEnabled: boolean | null;
  withholdingTaxType: string | null;
  withholdingTaxRate: number | null;
  allowedPaymentMethod: string | null;
  gcashNumber: string | null;
  gcashVerificationStatus: string | null;
  bankAccountNumber: string | null;
  bankVerificationStatus: string | null;
}

async function fetchCompanyWorkers(tx: Prisma.TransactionClient): Promise<CompanyWorkerProjection[]> {
  const rows = await tx.$queryRaw<Array<{ worker: CompanyWorkerProjection }>>`
    SELECT public.company_payroll_workers() AS worker
  `;
  return rows.map((r) => r.worker);
}

async function computeCompanyDraftPayroll(
  tx: Prisma.TransactionClient,
  payrollPeriodId: string,
  workers: CompanyWorkerProjection[]
) {
  const period = await tx.payrollPeriod.findUnique({
    where: { id: payrollPeriodId },
    include: { dtrs: true, payrolls: true },
  });
  if (!period) throw new Error('Payroll period not found');

  const workerById = new Map(workers.map((w) => [w.id, w]));
  const settingsRow = await tx.$queryRaw<
    Array<{ settings: { phEmployeeRate?: number; pagibigEmployeeRate?: number; deductionSchedule?: string } | null }>
  >`SELECT public.company_payroll_settings() AS settings`;
  const govSettings = settingsRow[0]?.settings || {
    phEmployeeRate: 2.5,
    pagibigEmployeeRate: 2.0,
    deductionSchedule: 'SPLIT',
  };

  const grouped = new Map<
    string,
    { worker: CompanyWorkerProjection; totalRegularHours: number; totalOvertimeHours: number; daysWorked: number }
  >();
  for (const dtr of period.dtrs) {
    const worker = workerById.get(dtr.workerId);
    if (!worker) throw new Error('COMPANY_PAYROLL_WORKER_DENIED');
    if (!worker.subjectToPayrollCutoff) continue;
    const cur = grouped.get(dtr.workerId) || {
      worker,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      daysWorked: 0,
    };
    cur.totalRegularHours += dtr.regularHours;
    cur.totalOvertimeHours += dtr.overtimeHours;
    if (dtr.regularHours > 0) cur.daysWorked += 1;
    grouped.set(dtr.workerId, cur);
  }

  let computedCount = 0;
  for (const [workerId, item] of grouped.entries()) {
    const w = item.worker;
    let basicPay = 0;
    let overtimePay = 0;
    const stdHrs = w.standardWorkHours || 8;
    if (w.rateType === 'MONTHLY_SALARY') {
      basicPay = (w.basicMonthlySalary || 0) / 2;
      overtimePay = item.totalOvertimeHours * (((w.basicMonthlySalary || 0) / 22) / stdHrs) * 1.25;
    } else if (w.rateType === 'DAILY_RATE' || ((w.dailyRate || 0) > 0 && item.daysWorked > 0)) {
      basicPay = (w.dailyRate || 0) * item.daysWorked;
      overtimePay = item.totalOvertimeHours * ((w.dailyRate || 0) / stdHrs) * 1.25;
    } else if (w.rateType === 'HOURLY_RATE') {
      basicPay = (w.hourlyRate || 0) * item.totalRegularHours;
      overtimePay = item.totalOvertimeHours * (w.hourlyRate || 0) * 1.25;
    }
    const grossPay = basicPay + overtimePay;
    let sssDeduction = w.sssDeductionEnabled ? grossPay * 0.045 : 0;
    let philHealthDeduction = w.philHealthDeductionEnabled
      ? grossPay * ((govSettings.phEmployeeRate ?? 2.5) / 100)
      : 0;
    let pagIbigDeduction = w.pagibigDeductionEnabled
      ? Math.min(grossPay * ((govSettings.pagibigEmployeeRate ?? 2.0) / 100), 200)
      : 0;
    if (govSettings.deductionSchedule === 'SPLIT') {
      sssDeduction /= 2;
      philHealthDeduction /= 2;
      pagIbigDeduction /= 2;
    }
    const ledgerRows = await tx.$queryRaw<
      Array<{ ledger: { status: string; deductionPerPayroll: number; balance: number; type: string } }>
    >`SELECT public.company_payroll_ledgers(${w.id}::text) AS ledger`;
    let cashAdvance = 0;
    let loanDeduction = 0;
    for (const lr of ledgerRows) {
      if (lr.ledger.status !== 'ACTIVE') continue;
      const amt = Math.min(lr.ledger.deductionPerPayroll, lr.ledger.balance);
      if (lr.ledger.type === 'CASH_ADVANCE') cashAdvance += amt;
      if (lr.ledger.type === 'LOAN') loanDeduction += amt;
    }
    const totalDeductions = sssDeduction + philHealthDeduction + pagIbigDeduction + cashAdvance + loanDeduction;
    const netPay = grossPay - totalDeductions;

    const existing = period.payrolls.find((p) => p.workerId === workerId);
    const data = {
      payrollPeriodId: period.id,
      workerId: w.id,
      daysWorked: item.daysWorked,
      regularHours: item.totalRegularHours,
      overtimeHours: item.totalOvertimeHours,
      basicPay,
      overtimePay,
      grossPay,
      taxableCompensation: Math.max(0, grossPay - (sssDeduction + philHealthDeduction + pagIbigDeduction)),
      sssDeduction,
      philhealthDeduction: philHealthDeduction,
      pagibigDeduction: pagIbigDeduction,
      withholdingTax: 0,
      finalWithholdingTax: 0,
      cashAdvance,
      loanDeduction,
      totalDeductions,
      netPay,
      paymentMethod: w.allowedPaymentMethod,
      paymentStatus: 'PENDING',
    };
    if (existing) {
      await tx.payroll.update({ where: { id: existing.id }, data });
    } else {
      await tx.payroll.create({ data });
    }
    computedCount += 1;
  }

  await tx.payroll.deleteMany({
    where: {
      payrollPeriodId: period.id,
      workerId: { notIn: Array.from(grouped.keys()) },
    },
  });
  return { success: true, count: computedCount };
}

export async function POST(request: NextRequest) {
  let actorId: string | undefined;
  let opForLog: string | undefined;
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ success: false, error: 'COMPANY_PAYROLL_REAL_ACTOR_REQUIRED' }, { status: 403 });
    }
    actorId = actor.userId;

    const cookieStore = await cookies();
    const simulatedCookie = cookieStore.get('simulatedRole')?.value || undefined;
    const simulatedHeader = request.headers.get('x-simulated-role') || undefined;
    const simulation = simulatedHeader || simulatedCookie;

    if (
      !['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(actor.role) ||
      !Number.isSafeInteger(actor.sessionVersion) ||
      actor.sessionVersion < 0 ||
      (simulation && simulation !== actor.role)
    ) {
      throw new Error('COMPANY_PAYROLL_REAL_ACTOR_REQUIRED');
    }

    const body = await request.json();
    const { employerId, operation, periodId, data = {} } = body || {};
    opForLog = operation;

    if (!COMPANY_PAYROLL_OPERATIONS.includes(operation)) {
      throw new Error('COMPANY_PAYROLL_OPERATION_REQUIRED');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || 'projectId' in data) {
      throw new Error('COMPANY_PAYROLL_DATA_REQUIRED');
    }
    if (typeof employerId !== 'string' || !employerId.trim() || employerId === 'ALL') {
      throw new Error('COMPANY_PAYROLL_OPERATION_REQUIRED');
    }

    const targetId =
      operation === 'CREATE_PERIOD'
        ? crypto.randomUUID()
        : operation === 'VIEW' && !periodId
          ? '*'
          : String(periodId || '');
    if (!targetId || (targetId === '*' && operation !== 'VIEW')) {
      throw new Error('COMPANY_PAYROLL_OPERATION_REQUIRED');
    }

    const permAction =
      operation === 'VIEW'
        ? 'canView'
        : operation === 'CREATE_PERIOD'
          ? 'canCreate'
          : operation === 'DELETE_DRAFT'
            ? 'canDelete'
            : 'canEdit';
    await assertPayrollModulePermission(actor.userId, actor.role, permAction);

    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const proof = mintCompanyPayrollProof({
      employerId,
      userId: actor.userId,
      sessionVersion: actor.sessionVersion,
      operation: operation as CompanyPayrollOperation,
      targetId,
      payloadHash,
      simulatedRole: simulation,
    });

    const result = await getCompanyPayrollClient().$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT
          set_config('app.company_employer_id', ${employerId}, true),
          set_config('app.company_user_id', ${actor.userId}, true),
          set_config('app.company_session_version', ${String(actor.sessionVersion)}, true),
          set_config('app.company_operation', ${operation}, true),
          set_config('app.company_target_id', ${targetId}, true),
          set_config('app.company_payload_hash', ${payloadHash}, true),
          set_config('app.company_issued', ${proof.issued}, true),
          set_config('app.company_nonce', ${proof.nonce}, true),
          set_config('app.company_simulated_role', ${simulation ?? ''}, true),
          set_config('app.company_signature', ${proof.signature}, true)`;
        await tx.$executeRaw`SELECT public.company_payroll_begin()`;

        const workers = await fetchCompanyWorkers(tx);
        let outcome: Record<string, unknown>;

        if (operation === 'VIEW') {
          const periods = await tx.payrollPeriod.findMany({
            where: { employerId, projectId: null, ...(periodId ? { id: String(periodId) } : {}) },
            include: { payrolls: true, dtrs: true },
            orderBy: { startDate: 'desc' },
          });
          outcome = {
            periods,
            workers: workers.map((w) => ({
              id: w.id,
              firstName: w.firstName,
              lastName: w.lastName,
              projectId: w.projectId,
              payrollCategory: w.payrollCategory,
            })),
          };
        } else if (operation === 'CREATE_PERIOD') {
          const { month, year, calendarRule, periodType, startDate, endDate, payrollDate, notes } =
            data as Record<string, unknown>;
          const start = new Date(String(startDate));
          const end = new Date(String(endDate));
          const payday = new Date(String(payrollDate));
          if (
            typeof month !== 'number' ||
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            typeof year !== 'number' ||
            !Number.isInteger(year) ||
            year < 1900 ||
            year > 9999 ||
            typeof calendarRule !== 'string' ||
            !['WEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'CUSTOM', 'CONSULTANT'].includes(calendarRule) ||
            typeof periodType !== 'string' ||
            !periodType ||
            [start, end, payday].some((d) => !Number.isFinite(d.getTime())) ||
            start > end
          ) {
            throw new Error('COMPANY_PAYROLL_INVALID_PERIOD');
          }

          const dup = await tx.$queryRaw<Array<{ exists: boolean }>>`
            SELECT public.company_payroll_period_exists(${month}::integer, ${year}::integer, ${calendarRule}::text, ${periodType}::text) AS exists
          `;
          if (dup[0]?.exists) {
            throw new Error('COMPANY_PAYROLL_DUPLICATE_PERIOD');
          }

          await tx.$executeRaw`INSERT INTO public."PayrollPeriod"
            (id, "employerId", "projectId", "employerOwnershipEvidenceRef", "employerOwnershipVerifiedAt",
             "payrollBatchNumber", month, year, "calendarRule", "periodType", "startDate", "endDate", "payrollDate",
             notes, status, "createdById", "updatedAt")
            VALUES (${targetId}, ${employerId}, NULL, ${'company-command:' + proof.nonce}, now(),
             ${'PAY-' + targetId}, ${month}, ${year}, ${calendarRule}, ${periodType}, ${start}, ${end}, ${payday},
             ${typeof notes === 'string' ? notes : null}, 'DRAFT', ${actor.userId}, now())`;

          const period = await tx.payrollPeriod.findUniqueOrThrow({ where: { id: targetId } });
          const categories: Record<string, string> = {
            WEEKLY: 'Weekly Salaried',
            SEMI_MONTHLY: 'Semi-Monthly',
            MONTHLY: 'Monthly',
          };
          const selected = workers.filter(
            (w) => !categories[calendarRule] || w.payrollCategory === categories[calendarRule]
          );
          if (selected.length) {
            await tx.payroll.createMany({
              data: selected.map((w) => ({
                workerId: w.id,
                payrollPeriodId: period.id,
                projectId: null,
                compensationType:
                  w.employmentType === 'REGULAR'
                    ? 'MONTHLY'
                    : w.employmentType === 'PROJECT_BASED'
                      ? 'PROJECT_BASED'
                      : 'DAILY',
                rate: w.dailyRate || 0,
                basicPay: 0,
                netPay: 0,
              })),
            });
          }
          outcome = { period };
        } else if (operation === 'EDIT_DRAFT') {
          if (Object.keys(data).some((k) => k !== 'notes') || typeof (data as { notes?: unknown }).notes !== 'string') {
            throw new Error('COMPANY_PAYROLL_EDIT_FIELDS_DENIED');
          }
          outcome = {
            period: await tx.payrollPeriod.update({
              where: { id: targetId },
              data: { notes: String((data as { notes: string }).notes) },
            }),
          };
        } else if (operation === 'DELETE_DRAFT') {
          await tx.dailyTimeRecord.deleteMany({ where: { payrollPeriodId: targetId } });
          await tx.payroll.deleteMany({ where: { payrollPeriodId: targetId } });
          await tx.payrollPeriod.delete({ where: { id: targetId } });
          outcome = { deletedId: targetId };
        } else if (operation === 'IMPORT_DTR') {
          const entries = (data as { entries?: unknown }).entries;
          if (!Array.isArray(entries) || entries.length === 0 || entries.length > 500) {
            throw new Error('COMPANY_PAYROLL_ENTRIES_REQUIRED');
          }
          const eligible = new Set(workers.map((w) => w.id));
          for (const e of entries as Array<Record<string, unknown>>) {
            const date = new Date(String(e.date));
            const regularHours = Number(e.regularHours);
            const overtimeHours = Number(e.overtimeHours);
            if (
              !eligible.has(String(e.workerId)) ||
              !Number.isFinite(date.getTime()) ||
              !Number.isFinite(regularHours) ||
              !Number.isFinite(overtimeHours) ||
              regularHours < 0 ||
              overtimeHours < 0 ||
              regularHours + overtimeHours > 24
            ) {
              throw new Error('COMPANY_PAYROLL_INVALID_DTR');
            }
            const existing = await tx.dailyTimeRecord.findUnique({
              where: { workerId_date: { workerId: String(e.workerId), date } },
            });
            if (existing && existing.payrollPeriodId !== targetId) {
              throw new Error('COMPANY_PAYROLL_DTR_ALREADY_OWNED');
            }
            if (existing) {
              await tx.dailyTimeRecord.update({
                where: { id: existing.id },
                data: { regularHours, overtimeHours },
              });
            } else {
              await tx.dailyTimeRecord.create({
                data: {
                  workerId: String(e.workerId),
                  date,
                  regularHours,
                  overtimeHours,
                  payrollPeriodId: targetId,
                  projectId: null,
                  status: 'DRAFT',
                  encodedById: actor.userId,
                },
              });
            }
          }
          outcome = await computeCompanyDraftPayroll(tx, targetId, workers);
        } else {
          outcome = await computeCompanyDraftPayroll(tx, targetId, workers);
        }

        await tx.$executeRaw`SELECT public.company_payroll_finish()`;
        return outcome;
      },
      { maxWait: 5000, timeout: 30000, isolationLevel: 'ReadCommitted' }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'COMPANY_PAYROLL_DENIED';
    console.warn('Company payroll operation rejected', { actorId, operation: opForLog });
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
