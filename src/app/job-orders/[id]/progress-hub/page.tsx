import React from 'react';
import { getJobOrderProgressHubData } from '@/app/actions/progressActions';
import JobOrderProgressHub from './JobOrderProgressHub';
import Link from 'next/link';

export default async function JobOrderProgressHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getJobOrderProgressHubData(id);

  if (!res.success || !res.data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Error Loading Job Order Progress Data</h2>
        <p style={{ color: '#6b7280' }}>{res.error || 'Job Order not found'}</p>
        <Link href={`/job-orders/${id}/edit`} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
          Back to Job Order
        </Link>
      </div>
    );
  }

  const jobOrder = res.data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Job Order Progress & Payments Hub
          </h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
            Job Order No: <strong style={{ color: '#111827' }}>{jobOrder.jobNumber}</strong>
          </p>
        </div>
        <Link href={`/job-orders/${id}/edit`} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', border: '1px solid #d1d5db' }}>
          ← Back to Job Order
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* SIDEBAR SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Job Order Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: '#6b7280' }}>Subcontractor</div>
                <div style={{ fontWeight: 'bold', color: '#111827' }}>{jobOrder.subcontractor?.name || 'In-House'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280' }}>Contract Amount</div>
                <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>₱{jobOrder.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280' }}>Status</div>
                <div style={{ fontWeight: 'bold', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  {jobOrder.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN WORKFLOW AREA */}
        <div>
          <JobOrderProgressHub jobOrderData={jobOrder} />
        </div>
      </div>
    </div>
  );
}
