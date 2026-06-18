import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CanvassClientTabs from './CanvassClientTabs';

export default async function CanvassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const canvass = await prisma.canvassForm.findUnique({
    where: { id },
    include: {
      mr: true,
      project: true,
      items: {
        include: { consolidatedBoqItem: true }
      },
      quotations: {
        include: {
          supplier: true,
          items: true
        }
      }
    }
  });

  if (!canvass) return <div>Canvass not found</div>;

  const suppliers = await prisma.supplier.findMany();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <Link href="/procurement/canvassing" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Canvassing Dashboard
          </Link>
          <h1 style={{ color: 'var(--accent-color)', margin: '10px 0 0 0', textShadow: '0 0 10px var(--accent-glow)' }}>
            Canvass #{canvass.canvassNumber}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
            Based on MRF: {canvass.mr.mrNumber} | Project: {canvass.project?.name}
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: '12px',
          backgroundColor: canvass.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
          color: canvass.status === 'COMPLETED' ? '#4ade80' : '#facc15',
          fontWeight: 'bold'
        }}>
          {canvass.status}
        </div>
      </div>

      <CanvassClientTabs canvass={canvass as any} suppliers={suppliers} />
    </div>
  );
}
