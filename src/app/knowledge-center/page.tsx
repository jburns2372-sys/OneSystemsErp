import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function KnowledgeCenterPage() {
  const totalRecords = await prisma.knowledgeRecord.count();
  const approvedRecords = await prisma.knowledgeRecord.count({ where: { status: 'Approved' } });
  const reviewRecords = await prisma.knowledgeRecord.count({ where: { status: 'For Review' } });

  return (
    <div>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Knowledge Center</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>
          Manage Gemini Notebook links, Business Rules, SOPs, and AI Validation configuration.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total Knowledge Records</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>{totalRecords}</p>
        </div>
        <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2ecc71' }}>Approved Rules & SOPs</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#2ecc71' }}>{approvedRecords}</p>
        </div>
        <div style={{ background: 'rgba(241, 196, 15, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(241, 196, 15, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f1c40f' }}>Pending Review</h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#f1c40f' }}>{reviewRecords}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ margin: '0 0 15px 0' }}>Gemini Notebooks</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Link Gemini NotebookLM workspaces to act as the knowledge base for specific ERP modules.
          </p>
          <Link href="/knowledge-center/notebooks" style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Manage Notebooks
          </Link>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ margin: '0 0 15px 0' }}>Business Rules</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Define rigid business rules that the AI Rule Checker will enforce across the ERP.
          </p>
          <Link href="/knowledge-center/business-rules" style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Manage Rules
          </Link>
        </div>
      </div>
    </div>
  );
}
