import styles from '../../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import LogDeliveryForm from './LogDeliveryForm';

export const dynamic = 'force-dynamic';

export default async function NewDeliveryPage() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { status: { not: 'DRAFT' } },
    include: {
      supplier: true,
      mr: { include: { project: true } },
      items: {
        include: {
          consolidatedBoqItem: true
        }
      }
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Receive Delivery</h1>
          <p>Encode incoming deliveries for Project Accountant approval.</p>
        </div>
      </header>

      <LogDeliveryForm purchaseOrders={purchaseOrders} />
    </div>
  );
}
