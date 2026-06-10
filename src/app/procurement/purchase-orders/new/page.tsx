import { prisma } from '@/lib/prisma';
import styles from '../../../projects/page.module.css';
import Link from 'next/link';
import GeneratePOForm from './GeneratePOForm';

export const dynamic = 'force-dynamic';

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ mrId?: string }> }) {
  const params = await searchParams;
  const mrId = params.mrId;

  if (!mrId) {
    return <div style={{ padding: '40px', color: '#ef4444' }}>Error: Material Request ID is required to generate a PO.</div>;
  }

  const mr = await prisma.materialRequest.findUnique({
    where: { id: mrId },
    include: {
      project: true,
      items: {
        include: {
          consolidatedBoqItem: true
        }
      }
    }
  });

  const suppliers = await prisma.supplier.findMany();

  if (!mr) {
    return <div style={{ padding: '40px', color: '#ef4444' }}>Error: Material Request not found.</div>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/procurement/purchase-orders" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold', marginRight: '20px' }}>&larr; Back</Link>
        <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>Generate Purchase Order</h1>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Based on Material Request: <strong style={{ color: 'var(--text-primary)' }}>{mr.mrNumber}</strong></h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Project: <strong style={{ color: 'var(--text-primary)' }}>{mr.project.name}</strong></p>
      </div>

      <GeneratePOForm mr={mr} suppliers={suppliers} />
    </div>
  );
}
