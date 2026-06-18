import React from 'react';
import { getPackageProgressHubData } from '@/app/actions/progressActions';
import { notFound } from 'next/navigation';
import UnifiedProgressHub from './UnifiedProgressHub';
import Link from 'next/link';

export default async function ProgressHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPackageProgressHubData(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const pkg = result.data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', color: '#111827' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pkg.packageNumber} Hub
            <span style={{ 
              fontSize: '0.9rem', 
              padding: '4px 12px', 
              borderRadius: '999px', 
              backgroundColor: '#d1fae5',
              color: '#065f46',
              verticalAlign: 'middle'
            }}>
              Progress & Payments
            </span>
          </h1>
          <p style={{ color: '#9ca3af', margin: '8px 0 0 0' }}>Subcontractor: {pkg.subcontractor?.name}</p>
        </div>
        <Link href="/subcontracting/progress-hub" style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', border: '1px solid #d1d5db' }}>
          Back to List
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>CONTRACT AMOUNT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginTop: '4px' }}>
            ₱{pkg.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>TOTAL ACCOMPLISHED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669', marginTop: '4px' }}>
            {pkg.accomplishments.length > 0 ? `${(pkg.accomplishments[0].cumulativePercent || 0).toFixed(2)}%` : '0.00%'}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>TOTAL BILLED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>
            ₱{pkg.billings.reduce((sum: number, b: any) => sum + (b.currentGross || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 'bold' }}>BALANCE DUE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c', marginTop: '4px' }}>
            ₱{(pkg.contractAmount - pkg.billings.reduce((sum: number, b: any) => sum + (b.netPayable || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <UnifiedProgressHub packageData={pkg} />
    </div>
  );
}
