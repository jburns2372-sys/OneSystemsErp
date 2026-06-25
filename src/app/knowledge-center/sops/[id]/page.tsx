import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Printer, Download } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

function SimpleMarkdownParser({ text }: { text: string }) {
  const html = text
    .replace(/^### (.*$)/gim, '<h3 style="color: #06b6d4; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(6, 182, 212, 0.3); padding-bottom: 10px;">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 style="color: #fff; font-size: 1.2rem; margin-top: 20px; margin-bottom: 10px;">$1</h4>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 8px; line-height: 1.6;">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #fff;">$1</strong>')
    .replace(/\n/gim, '<br />')
    .replace(/(<br \/>){2,}/gim, '<br /><br />')
    .replace(/<\/li><br \/>/gim, '</li>');

  return (
    <div 
      style={{ color: '#e2e8f0', fontSize: '1.05rem', lineHeight: '1.7' }}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

export default async function SOPReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const record = await prisma.knowledgeRecord.findUnique({
    where: { id }
  });

  if (!record || record.documentType !== 'SOP') {
    notFound();
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
      <Link href="/knowledge-center/sops" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to SOP Directory
      </Link>

      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Header Ribbon */}
        <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(0,0,0,0.8) 100%)', padding: '40px', borderBottom: '1px solid rgba(6, 182, 212, 0.4)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '10px' }}>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Printer size={16} /> Print
            </button>
            <button style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.5)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Download size={16} /> Export PDF
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <BookOpen size={40} color="#06b6d4" />
            </div>
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {record.relatedModule}
                </span>
                <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {record.status}
                </span>
              </div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', color: '#fff' }}>{record.title}</h1>
              <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span><strong>Doc ID:</strong> {record.knowledgeId.substring(0, 8).toUpperCase()}</span>
                <span><strong>Version:</strong> {record.version}</span>
                <span><strong>Date Enacted:</strong> {new Date(record.dateCreated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '40px' }}>
          {record.description ? (
            <SimpleMarkdownParser text={record.description} />
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No extensive procedure details encoded.</p>
          )}
        </div>
        
        {/* Footer Signatures */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px 40px', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Prepared By</div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{record.preparedBy}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(record.dateCreated).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Reviewed By</div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{record.reviewedBy}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Electronic Signature</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Approved By</div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{record.approvedBy}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Electronic Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
