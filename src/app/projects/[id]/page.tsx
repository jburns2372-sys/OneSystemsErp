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
  let hasBOQ = false;
  try {
    const match = project.description?.match(/BOQ File Uploaded: (.*)/);
    if (match && match[1]) {
      hasBOQ = true;
      const fileName = match[1].trim();
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'boq', fileName);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to array of arrays, removing entirely blank rows
        const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, blankrows: false });
        
        // Find which columns actually have data
        const colHasData: boolean[] = [];
        for (const row of rows) {
          if (Array.isArray(row)) {
            for (let i = 0; i < row.length; i++) {
              if (row[i] !== undefined && row[i] !== null && String(row[i]).trim() !== '') {
                colHasData[i] = true;
              }
            }
          }
        }
        
        let customHtml = '<table><tbody>';
        for (const row of rows) {
          if (!Array.isArray(row)) continue;
          
          let rowHasData = false;
          let trHtml = '<tr>';
          for (let i = 0; i < colHasData.length; i++) {
            if (colHasData[i]) {
              const cellVal = row[i] !== undefined && row[i] !== null ? row[i] : '';
              if (String(cellVal).trim() !== '') rowHasData = true;
              
              // Format numbers nicely if they seem like costs/quantities
              let displayVal = cellVal;
              if (typeof cellVal === 'number' && !Number.isInteger(cellVal)) {
                 displayVal = cellVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
              
              trHtml += `<td>${displayVal}</td>`;
            }
          }
          trHtml += '</tr>';
          
          if (rowHasData) {
            customHtml += trHtml;
          }
        }
        customHtml += '</tbody></table>';
        htmlTable = customHtml;
      }
    }
  } catch (e) {
    console.error('Error reading Excel file:', e);
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Link href="/projects" style={{ color: 'var(--accent-color)', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Projects</Link>
          <h1>{project.name}</h1>
          <p style={{ whiteSpace: 'pre-wrap' }}>{project.description?.replace(/BOQ File Uploaded: .*/, '') || 'No description provided.'}</p>
          
          {hasBOQ && (
            <div style={{ marginTop: '15px' }}>
              <a 
                href={`/uploads/boq/${project.description?.split('BOQ File Uploaded: ')[1].trim()}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  backgroundColor: 'var(--accent-color)', 
                  color: '#fff', 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  textDecoration: 'none', 
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Download Original BOQ File
              </a>
            </div>
          )}
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
