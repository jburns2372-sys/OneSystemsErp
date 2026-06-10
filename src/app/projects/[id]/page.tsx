import { prisma } from '@/lib/prisma';
import styles from '../page.module.css';
import Link from 'next/link';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

import BOQActions from './BOQActions';
import AwardedBOQViewer from './AwardedBOQViewer';
import BOQConsolidationTab from './BOQConsolidationTab';
import ModuleKnowledgeTab from '@/app/knowledge-center/ModuleKnowledgeTab';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params;
  const { tab = 'awarded-boq' } = await searchParams;
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      materialRequests: true,
      awardedBoqItems: true,
    }
  });

  if (!project) {
    return <div style={{ padding: '20px', color: 'red' }}>Project not found.</div>;
  }

  let htmlTable = '';
  let hasBOQ = project.awardedBoqItems && project.awardedBoqItems.length > 0;

  if (hasBOQ) {
    let customHtml = '<table><thead><tr style="background: #e0e0e0; font-weight: bold;"><th>Item No.</th><th>Description</th><th>Unit</th><th>Quantity</th><th>Unit Cost</th><th>Total Cost</th></tr></thead><tbody>';
    for (const item of project.awardedBoqItems) {
      customHtml += `<tr>
        <td>${item.itemCode || ''}</td>
        <td>${item.description || ''}</td>
        <td>${item.unit || ''}</td>
        <td>${item.quantity?.toLocaleString() || ''}</td>
        <td>${item.combinedUnitCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || ''}</td>
        <td>${item.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || ''}</td>
      </tr>`;
    }
    customHtml += '</tbody></table>';
    htmlTable = customHtml;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/projects" style={{ color: 'var(--accent-color)', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Projects</Link>
          <h1>{project.name}</h1>
          <p style={{ whiteSpace: 'pre-wrap' }}>{project.description?.replace(/BOQ File Uploaded: .*/, '') || 'No description provided.'}</p>
          
        </div>
        <div style={{ textAlign: 'right', minWidth: 'max-content', marginLeft: '20px' }}>
          <div style={{ fontSize: '1.15rem', color: 'var(--accent-color)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            ₱ {project.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Status: {project.status}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Location: {project.location || 'N/A'}</div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--glass-border)', marginTop: '20px', marginBottom: '20px' }}>
        <Link href={`/projects/${project.id}?tab=awarded-boq`} style={{ padding: '10px 15px', textDecoration: 'none', color: tab === 'awarded-boq' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: tab === 'awarded-boq' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: tab === 'awarded-boq' ? 'bold' : 'normal' }}>
          Awarded BOQ
        </Link>
        <Link href={`/projects/${project.id}?tab=consolidation`} style={{ padding: '10px 15px', textDecoration: 'none', color: tab === 'consolidation' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: tab === 'consolidation' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: tab === 'consolidation' ? 'bold' : 'normal' }}>
          BOQ Consolidation
        </Link>
        <Link href={`/projects/${project.id}?tab=knowledge`} style={{ padding: '10px 15px', textDecoration: 'none', color: tab === 'knowledge' ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: tab === 'knowledge' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: tab === 'knowledge' ? 'bold' : 'normal' }}>
          Knowledge Reference
        </Link>
      </div>

      {tab === 'awarded-boq' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Awarded Bill of Quantities</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                Total Awarded Cost: ₱ {project.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>
            <BOQActions projectId={project.id} isLocked={project.boqLocked} hasBOQ={hasBOQ} />
          </div>
          <AwardedBOQViewer htmlTable={htmlTable} />
        </>
      )}

      {tab === 'consolidation' && (
        <BOQConsolidationTab projectId={project.id} isLocked={project.boqLocked} />
      )}

      {tab === 'knowledge' && (
        <ModuleKnowledgeTab moduleId={project.id} moduleType="projectId" />
      )}
    </div>
  );
}
