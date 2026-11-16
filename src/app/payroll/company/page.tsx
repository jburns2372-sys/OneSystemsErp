
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import PayrollSubNav from '@/components/PayrollSubNav';

type Worker = { id: string; firstName: string; lastName: string };
type Period = { id: string; payrollBatchNumber: string; status: string; isLocked: boolean;
  payrolls: { netPay: number }[]; startDate: string; endDate: string };
async function send(employerId: string, operation: string, data: object = {}, periodId?: string) {
  const response = await fetchAuthenticatedBackend('/api/payroll/company/command', {
    method: 'POST', cache: 'no-store', body: JSON.stringify({ employerId, operation, data, periodId }),
  });
  return { ok: response.ok, body: await response.json() };
}
export default async function CompanyPayrollPage({ searchParams }: {
  searchParams: Promise<{ employer?: string; result?: string }>
}) {
  const actor = await verifySession();
  if (!actor) redirect('/login');
  const query = await searchParams;
  const employerId = query.employer?.trim() || '';
  const view = employerId ? await send(employerId, 'VIEW') : null;
  const periods: Period[] = view?.ok ? view.body.periods : [];
  const workers: Worker[] = view?.ok ? view.body.workers : [];
  async function command(form: FormData) {
    'use server';
    // The backend re-authenticates this request and verifies the exact employer
    // operation at the DB boundary. Hidden inputs are never authorization.
    const operation = String(form.get('operation') || '');
    const periodId = String(form.get('periodId') || '') || undefined;
    let data: object = {};
    if (operation === 'CREATE_PERIOD') data = {
      month: Number(form.get('month')), year: Number(form.get('year')),
      calendarRule: String(form.get('calendarRule')), periodType: String(form.get('periodType')),
      startDate: String(form.get('startDate')), endDate: String(form.get('endDate')),
      payrollDate: String(form.get('payrollDate')), notes: String(form.get('notes') || ''),
    };
    if (operation === 'IMPORT_DTR') data = { entries: [{
      workerId: String(form.get('workerId')), date: String(form.get('date')),
      regularHours: Number(form.get('regularHours')), overtimeHours: Number(form.get('overtimeHours')),
    }] };
    let ok = false;
    try { ok = (await send(employerId, operation, data, periodId)).ok; } catch { ok = false; }
    revalidatePath('/payroll/company');
    redirect('/payroll/company?employer=' + encodeURIComponent(employerId) + '&result=' + (ok ? 'saved' : 'denied'));
  }
  return <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
    <PayrollSubNav />
    <h1>Company payroll</h1>
    <form action="/payroll/company" method="get">
      <label>Verified employer ID <input name="employer" defaultValue={employerId} required /></label>{' '}
      <button type="submit">Open payroll</button>
    </form>
    {query.result === 'saved' && <p role="status">Payroll updated.</p>}
    {query.result === 'denied' && <p role="alert">The operation was denied. Check your employer permission and the period status.</p>}
    {view && !view.ok && <p role="alert">Verified payroll access is required for this employer.</p>}
    {view?.ok && <>
      <h2>Create a payroll period</h2>
      <form action={command} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input type="hidden" name="operation" value="CREATE_PERIOD" />
        <label>Month <input name="month" type="number" min="1" max="12" required /></label>
        <label>Year <input name="year" type="number" min="1900" max="9999" required /></label>
        <label>Calendar <select name="calendarRule">
          <option value="MONTHLY">Monthly</option><option value="SEMI_MONTHLY">Semi-monthly</option>
          <option value="WEEKLY">Weekly</option><option value="CUSTOM">Custom</option><option value="CONSULTANT">Consultant</option>
        </select></label>
        <label>Period <select name="periodType"><option value="FULL_MONTH">Full month</option>
          <option value="FIRST_HALF">First half</option><option value="SECOND_HALF">Second half</option>
          <option value="CUSTOM">Custom cutoff</option></select></label>
        <label>Start <input name="startDate" type="date" required /></label>
        <label>End <input name="endDate" type="date" required /></label>
        <label>Pay date <input name="payrollDate" type="date" required /></label>
        <label>Notes <input name="notes" /></label><button type="submit">Create draft</button>
      </form>
      <h2>Payroll periods</h2>
      {periods.length === 0 && <p>No verified company payroll periods.</p>}
      {periods.map(period => <section key={period.id} style={{ borderTop: '1px solid #777', padding: '16px 0' }}>
        <h3>{period.payrollBatchNumber}</h3>
        <p>{period.startDate.slice(0,10)} to {period.endDate.slice(0,10)} · {period.status}{period.isLocked ? ' · Locked' : ''}</p>
        <p>Net payroll: {period.payrolls.reduce((sum,row)=>sum+row.netPay,0).toLocaleString('en-PH',{minimumFractionDigits:2})}</p>
        {period.status === 'DRAFT' && !period.isLocked && <>
          <form action={command} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input type="hidden" name="operation" value="IMPORT_DTR" /><input type="hidden" name="periodId" value={period.id} />
            <label>Worker <select name="workerId" required>{workers.map(w=><option key={w.id} value={w.id}>{w.lastName}, {w.firstName}</option>)}</select></label>
            <label>Date <input type="date" name="date" min={period.startDate.slice(0,10)} max={period.endDate.slice(0,10)} required /></label>
            <label>Regular hours <input type="number" name="regularHours" min="0" max="24" step="0.25" defaultValue="8" required /></label>
            <label>Overtime hours <input type="number" name="overtimeHours" min="0" max="24" step="0.25" defaultValue="0" required /></label>
            <button type="submit" disabled={workers.length===0}>Save attendance and compute</button>
          </form>
          <form action={command}><input type="hidden" name="operation" value="COMPUTE_DRAFT" /><input type="hidden" name="periodId" value={period.id} /><button type="submit">Recompute draft</button></form>
          <form action={command}><input type="hidden" name="operation" value="DELETE_DRAFT" /><input type="hidden" name="periodId" value={period.id} /><button type="submit">Delete unpaid draft</button></form>
        </>}
      </section>)}
    </>}
  </main>;
}
