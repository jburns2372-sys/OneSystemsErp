import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership } from '@/lib/uboq/project-ownership';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import { SYSTEM_TEMPLATE_PRESETS } from '@/lib/uboq/template-builder';

export const dynamic = 'force-dynamic';

export default async function ProjectUboqWorkbenchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const actor = await verifyOperationalSession();
  if (!actor) {
    redirect('/login');
  }

  try {
    await assertProjectGraphOwnership(prisma, {
      userId: actor.userId,
      userRole: actor.role,
      projectId,
    });
  } catch {
    return (
      <div style={{ padding: '32px', color: '#ef4444' }}>
        <h2>Access Denied</h2>
        <p>You do not have an active PBAC assignment for this project.</p>
        <Link href="/projects" style={{ color: '#38bdf8' }}>&larr; Back to Projects</Link>
      </div>
    );
  }

  const [project, contract, snapshots, phaseLines, consolidatedGroups, resourceAccounts, exceptions] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, contractNumber: true, contractAmount: true, uboqGovernanceEnabled: true },
      }),
      prisma.uboqContractAuthority.findFirst({
        where: { projectId },
        include: { taxProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.uboqOperationalSnapshot.findMany({
        where: { projectId },
        orderBy: { versionNumber: 'desc' },
      }),
      prisma.uboqAwardedPhaseLine.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.uboqConsolidationGroup.findMany({
        where: { projectId },
        orderBy: { groupCode: 'asc' },
      }),
      prisma.uboqCanonicalResourceAccount.findMany({
        where: { projectId },
        include: { activeApprovedPr: true },
        orderBy: { resourceCode: 'asc' },
      }),
      prisma.uboqValidationException.findMany({
        where: { projectId, status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  if (!project) {
    return <div style={{ padding: '32px', color: '#ef4444' }}>Project not found.</div>;
  }

  const safeAccounts = redactUboqPayloadForRole(
    resourceAccounts.map((a) => ({
      id: a.id,
      resourceCode: a.resourceCode,
      resourceDescription: a.resourceDescription,
      resourceSpec: a.resourceSpec,
      resourceUomNormalized: a.resourceUomNormalized,
      activeApprovedQty: Number(a.activeApprovedQty),
      allocatedUsableStockQty: Number(a.allocatedUsableStockQty),
      openMrReservedQty: Number(a.openMrReservedQty),
      openCommittedPoQty: Number(a.openCommittedPoQty),
      deliveredReceivedQty: Number(a.deliveredReceivedQty),
      consumedIssuedQty: Number(a.consumedIssuedQty),
      damagedReturnedQty: Number(a.damagedReturnedQty),
      availablePhysicalStockQty: Number(a.availablePhysicalStockQty),
      remainingProcurementQty: Number(a.remainingProcurementQty),
      targetResourceUnitCost: Number(a.targetResourceUnitCost),
    })),
    actor.role
  );

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary, #f8fafc)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href={`/projects/${project.id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem' }}>
            &larr; Back to Project Overview
          </Link>
          <h1 style={{ margin: '8px 0 4px' }}>Universal BOQ &amp; Document Intelligence Workbench</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            {project.name} ({project.contractNumber || project.id}) &bull; Governance:{' '}
            <strong>{project.uboqGovernanceEnabled ? 'UBOQ RESOURCE-GOVERNED' : 'LEGACY COMPATIBLE'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.values(SYSTEM_TEMPLATE_PRESETS)
            .slice(0, 5)
            .map((preset) => (
              <a
                key={preset.templateCode}
                href={`/api/uboq/export?projectId=${encodeURIComponent(project.id)}&templateCode=${encodeURIComponent(preset.templateCode)}&format=xlsx`}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Export {preset.templateCode} (.xlsx)
              </a>
            ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sector &amp; Tax Profile</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px' }}>
            {contract ? `${contract.sectorType} (${contract.taxProfile?.profileCode ?? 'Default'})` : 'Not Initialized'}
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Operational Snapshots</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px' }}>
            {snapshots.length} Version(s) &bull; Latest: {snapshots[0]?.status ?? 'NONE'}
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Phase Lines &rarr; Consolidated Groups</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px' }}>
            {phaseLines.length} Phase Lines &rarr; {consolidatedGroups.length} Consolidated
          </div>
        </div>
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Open Validation Exceptions</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px', color: exceptions.length > 0 ? '#f59e0b' : '#10b981' }}>
            {exceptions.length} Open
          </div>
        </div>
      </div>

      {/* Canonical Resource Accounts & Stock Balance */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>
          Canonical Resource Accounts &amp; Procurement / Stock Balance
        </h2>
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#38bdf8', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Resource Code</th>
                <th style={{ padding: '10px' }}>Resource &amp; Spec</th>
                <th style={{ padding: '10px' }}>UOM</th>
                <th style={{ padding: '10px' }}>Approved PRR</th>
                <th style={{ padding: '10px' }}>Opening Stock</th>
                <th style={{ padding: '10px' }}>Open MRF</th>
                <th style={{ padding: '10px' }}>Open PO</th>
                <th style={{ padding: '10px' }}>Delivered</th>
                <th style={{ padding: '10px' }}>Issued</th>
                <th style={{ padding: '10px' }}>Available Stock</th>
                <th style={{ padding: '10px' }}>Remaining To Procure</th>
              </tr>
            </thead>
            <tbody>
              {safeAccounts.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '16px', color: '#94a3b8', textAlign: 'center' }}>
                    No canonical resource accounts initialized for this project yet.
                  </td>
                </tr>
              ) : (
                safeAccounts.map((a: any) => (
                  <tr key={a.id} style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{a.resourceCode}</td>
                    <td style={{ padding: '10px' }}>
                      <div>{a.resourceDescription}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.resourceSpec}</div>
                    </td>
                    <td style={{ padding: '10px' }}>{a.resourceUomNormalized}</td>
                    <td style={{ padding: '10px' }}>{a.activeApprovedQty.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{a.allocatedUsableStockQty.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{a.openMrReservedQty.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{a.openCommittedPoQty.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{a.deliveredReceivedQty.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{a.consumedIssuedQty.toLocaleString()}</td>
                    <td style={{ padding: '10px', color: '#10b981', fontWeight: 600 }}>
                      {a.availablePhysicalStockQty.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 700 }}>
                      {a.remainingProcurementQty.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
