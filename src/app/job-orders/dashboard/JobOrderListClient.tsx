'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { deleteJobOrder } from '@/app/actions/jobOrderActions';
import { useRouter } from 'next/navigation';

export default function JobOrderListClient({ jobOrders }: { jobOrders: any[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Job Order? This action cannot be undone.")) {
      setDeletingId(id);
      const res = await deleteJobOrder(id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Failed to delete Job Order: " + res.error);
      }
      setDeletingId(null);
    }
  };

  return (
    <div style={{ marginTop: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>Job Order Master List</h2>
        <Link href="/job-orders/create">
          <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Create New JO
          </button>
        </Link>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#374151' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 20px', fontWeight: '600' }}>JO Number</th>
              <th style={{ padding: '12px 20px', fontWeight: '600' }}>Project</th>
              <th style={{ padding: '12px 20px', fontWeight: '600' }}>Subcontractor</th>
              <th style={{ padding: '12px 20px', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '12px 20px', fontWeight: '600' }}>Dates</th>
              <th style={{ padding: '12px 20px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No Job Orders found.
                </td>
              </tr>
            ) : (
              jobOrders.map((jo) => (
                <tr key={jo.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '500', color: '#111827' }}>{jo.jobNumber}</td>
                  <td style={{ padding: '16px 20px' }}>{jo.project?.contractNumber}</td>
                  <td style={{ padding: '16px 20px' }}>{jo.subcontractor?.name}</td>
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: '#059669' }}>
                    ₱{jo.contractAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>
                    <div><strong style={{ color: '#6b7280' }}>Start:</strong> {new Date(jo.startDate).toLocaleDateString()}</div>
                    <div><strong style={{ color: '#6b7280' }}>End:</strong> {new Date(jo.completionDate).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link href={`/job-orders/${jo.id}`}>
                        <button style={{ padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>View</button>
                      </Link>
                      <Link href={`/job-orders/${jo.id}/edit`}>
                        <button style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                      </Link>
                      <Link href={`/job-orders/${jo.id}/progress-hub`}>
                        <button style={{ padding: '6px 12px', backgroundColor: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Progress</button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(jo.id)} 
                        disabled={deletingId === jo.id}
                        style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: deletingId === jo.id ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: deletingId === jo.id ? 0.5 : 1 }}
                      >
                        {deletingId === jo.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
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
