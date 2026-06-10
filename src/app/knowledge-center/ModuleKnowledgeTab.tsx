import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ModuleKnowledgeTab({ 
  moduleId, 
  moduleType 
}: { 
  moduleId: string; 
  moduleType: 'projectId' | 'workerId' | 'payrollPeriodId' 
}) {
  const references = await prisma.knowledgeReference.findMany({
    where: { [moduleType]: moduleId },
    include: { knowledgeRecord: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Knowledge Reference</h2>
        <Link href={`/knowledge-center`} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
          Manage Knowledge Center
        </Link>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        The following Gemini Notebooks, SOPs, and Business Rules apply to this specific record.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {references.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            No knowledge records have been linked yet. Go to the Knowledge Center to link a Notebook or Rule.
          </div>
        ) : (
          references.map(ref => {
            const rule = ref.knowledgeRecord;
            return (
              <div key={ref.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', gap: '20px' }}>
                <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ background: rule.status === 'Approved' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)', color: rule.status === 'Approved' ? '#2ecc71' : '#f1c40f', padding: '5px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '10px' }}>
                    {rule.status}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                    {rule.documentType}
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{rule.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#ccc', lineHeight: '1.5' }}>{rule.description}</p>
                  
                  {rule.notebookUrl && (
                    <a href={rule.notebookUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', marginTop: '10px', border: '1px solid rgba(52, 152, 219, 0.4)' }}>
                      Open in Gemini NotebookLM ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
