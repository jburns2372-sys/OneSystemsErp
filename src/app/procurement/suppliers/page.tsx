import { prisma } from '@/lib/prisma';
import styles from '../../projects/page.module.css';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Vendors & Suppliers</h1>
          <p>Manage all vendor directory, contact information, and VAT settings.</p>
        </div>
        <Link href="/procurement/suppliers/new" style={{ backgroundColor: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          + Add Supplier
        </Link>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>TIN</th>
              <th>Contact Person</th>
              <th>Terms of Payment</th>
              <th>VAT Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No suppliers found.</td>
              </tr>
            ) : suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>
                  <div className={styles.projectName}>{supplier.name}</div>
                  <div className={styles.projectLocation}>{supplier.address || 'No address provided'}</div>
                </td>
                <td>{supplier.tin || 'N/A'}</td>
                <td>
                  <div>{supplier.contactPerson || 'N/A'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{supplier.contactNumber}</div>
                </td>
                <td>{supplier.paymentTerms || 'N/A'}</td>
                <td>
                  <span className={styles.badge} style={{ backgroundColor: supplier.isVatable ? '#16a34a' : '#4b5563', color: '#fff' }}>
                    {supplier.isVatable ? 'VAT' : 'NON-VAT'}
                  </span>
                </td>
                <td>
                  <Link href={`/procurement/suppliers/${supplier.id}/edit`} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
