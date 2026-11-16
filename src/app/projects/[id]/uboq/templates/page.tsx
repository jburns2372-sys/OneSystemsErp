import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyOperationalSession } from '@/lib/dal/auth';
import TemplateBuilder from './TemplateBuilder';

export const dynamic = 'force-dynamic';
export default async function InitialTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await verifyOperationalSession();
  if (!actor) redirect('/login');
  const { id } = await params;
  return (
    <main style={{ maxWidth: 1200, width: '100%', minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box', margin: '0 auto', padding: 28 }}>
      <Link href={`/projects/${encodeURIComponent(id)}/uboq`}>Back to Universal BOQ</Link>
      <h1>Universal BOQ templates (T0–T12)</h1>
      <p>
        Choose an approved source, manage persistent versioned T0–T12 layouts, project half-month and quarterly cash-flow forecasts, review executive cost commitments, EAC profitability, approved Variation Order registers (T11, internal ERP governance only), and treasury cash-flow variance reconciliations (T12), or generate validated generic formal contract, awarded BOQ, procurement resource takeoff, accomplishment SWA, progress billing, and internal variation order exports. Awarded contract revenue, internal benchmark ceilings, committed obligations, and executive target margins stay strictly separated.
      </p>
      <TemplateBuilder projectId={id} />
    </main>
  );
}
