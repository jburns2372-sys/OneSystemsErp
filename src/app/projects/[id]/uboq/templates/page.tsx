import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyOperationalSession } from '@/lib/dal/auth';
import MasterBoqReportBuilderClient from './MasterBoqReportBuilderClient';
import TemplateBuilder from './TemplateBuilder';

export const dynamic = 'force-dynamic';
export default async function InitialTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await verifyOperationalSession();
  if (!actor) redirect('/login');
  const { id } = await params;
  return (
    <main style={{ maxWidth: 1280, width: '100%', minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box', margin: '0 auto', padding: 28 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <Link href={`/projects/${encodeURIComponent(id)}?tab=awarded-boq`}>&larr; Back to Project Workspace</Link>
        <Link href={`/projects/${encodeURIComponent(id)}/documents`}>Documents &amp; Intake</Link>
        <Link href={`/projects/${encodeURIComponent(id)}/uboq`}>BOQ Verification Details</Link>
      </div>
      <h1>Master BOQ Report Templates (Summaries, Accomplishment &amp; Billing)</h1>
      <p>
        Use the extracted immutable Final Awarded BOQ as ONE master source to configure, preview, save, and export reusable BOQ Summaries, Accomplishment Reports, Progress Billing Working Copies, and custom layouts—without reuploading or reapproving BOQ items.
      </p>

      <MasterBoqReportBuilderClient projectId={id} />

      <details style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(148, 163, 184, 0.25)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.96rem' }}>
          Advanced Formal Governance &amp; Round-Trip Presets (T0–T12 — Requires Approved Operational Snapshot)
        </summary>
        <div style={{ marginTop: 14 }}>
          <TemplateBuilder projectId={id} />
        </div>
      </details>
    </main>
  );
}
