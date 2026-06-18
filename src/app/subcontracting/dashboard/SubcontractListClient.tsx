'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { deleteSubcontractPackage } from '@/app/actions/subcontractingActions';
import { useRouter } from 'next/navigation';

export default function SubcontractListClient({ packages }: { packages: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Subcontract Package? This action cannot be undone.')) {
      setLoadingId(id);
      const res = await deleteSubcontractPackage(id);
      if (res.success) {
        router.refresh();
      } else {
        alert('Failed to delete package: ' + res.error);
      }
      setLoadingId(null);
    }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: 0 }}>Prepared Subcontracts Master List</h2>
        <Link href="/subcontracting/create" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
          + New Package
        </Link>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {packages.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No subcontract packages found. Create one to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600' }}>Package No.</th>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600' }}>Project</th>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600' }}>Subcontractor</th>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', color: '#4b5563', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const totalBilled = pkg.billings?.reduce((sum: number, b: any) => sum + (b.currentGross || 0), 0) || 0;
                const isBilled = pkg.status === 'BILLED';
                const isLocked = pkg.isLocked || isBilled || pkg.status === 'FULLY_PAID';
                
                return (
                   <tr key={pkg.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 20px', fontWeight: '500', color: '#111827' }}>{pkg.packageNumber}</td>
                    <td style={{ padding: '16px 20px', color: '#374151' }}>{pkg.project?.contractNumber || pkg.project?.name}</td>
                    <td style={{ padding: '16px 20px', color: '#374151' }}>{pkg.subcontractor?.name}</td>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#059669' }}>
                      ₱{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '999px', 
                        fontSize: '0.85rem', 
                        fontWeight: '500',
                        backgroundColor: (pkg.status === 'APPROVED' || pkg.status === 'BILLED' || pkg.status === 'FULLY_PAID') ? '#d1fae5' : '#fef3c7',
                        color: (pkg.status === 'APPROVED' || pkg.status === 'BILLED' || pkg.status === 'FULLY_PAID') ? '#065f46' : '#92400e',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {pkg.isLocked && '🔒'} {pkg.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link href={`/subcontracting/packages/${pkg.id}`} style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid #d1d5db' }}>
                          View
                        </Link>
                        {isLocked ? (
                          <button disabled style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#9ca3af', borderRadius: '4px', border: '1px solid #e5e7eb', cursor: 'not-allowed', fontSize: '0.9rem' }}>
                            Edit
                          </button>
                        ) : (
                          <Link href={`/subcontracting/packages/${pkg.id}/edit`} style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid #bfdbfe' }}>
                            Edit
                          </Link>
                        )}
                        <button 
                          onClick={() => handleDelete(pkg.id)}
                          disabled={loadingId === pkg.id || isLocked}
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: isLocked ? '#f3f4f6' : '#fef2f2', 
                            color: isLocked ? '#9ca3af' : '#b91c1c', 
                            borderRadius: '4px', 
                            border: isLocked ? '1px solid #e5e7eb' : '1px solid #fecaca', 
                            cursor: loadingId === pkg.id || isLocked ? 'not-allowed' : 'pointer', 
                            fontSize: '0.9rem' 
                          }}
                        >
                          {loadingId === pkg.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
