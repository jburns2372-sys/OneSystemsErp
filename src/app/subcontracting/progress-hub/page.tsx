import React from 'react';
import Link from 'next/link';
import { getSubcontractPackages } from '@/app/actions/subcontractingActions';
import styles from '../../page.module.css';

export default async function ProgressHubMasterListPage() {
  const packages = await getSubcontractPackages();

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1200px' }}>
      <header className={styles.header} style={{ marginBottom: '30px' }}>
        <div className={styles.headerTitle}>
          <h1>Progress & Payments Hub</h1>
          <p>Select a Subcontract Package to manage its accomplishments, billings, and payments.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/subcontracting/dashboard" className={styles.actionButton} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px', color: '#374151', fontWeight: 'bold' }}>Package Number</th>
              <th style={{ padding: '16px', color: '#374151', fontWeight: 'bold' }}>Subcontractor</th>
              <th style={{ padding: '16px', color: '#374151', fontWeight: 'bold' }}>Contract Amount</th>
              <th style={{ padding: '16px', color: '#374151', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'right', color: '#374151', fontWeight: 'bold' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No Subcontract Packages found. Create one first in the Create Subcontract Hub.
                </td>
              </tr>
            ) : (
              packages.map((pkg: any) => (
                <tr key={pkg.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '16px', fontWeight: '500', color: '#111827' }}>{pkg.packageNumber}</td>
                  <td style={{ padding: '16px', color: '#4b5563' }}>{pkg.subcontractor?.name || 'N/A'}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#059669' }}>
                    ₱{pkg.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      backgroundColor: pkg.status === 'APPROVED' ? '#d1fae5' : '#fef3c7',
                      color: pkg.status === 'APPROVED' ? '#065f46' : '#92400e'
                    }}>
                      {pkg.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link 
                      href={`/subcontracting/progress-hub/${pkg.id}`}
                      style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}
                    >
                      Manage Hub ➔
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
