'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveDelivery } from '@/app/actions/deliveryActions';
import styles from '../../projects/page.module.css';
import PermissionGuard from '@/components/PermissionGuard';

export default function DeliveryWorkflowButtons({ 
  deliveryId, 
  status, 
  permissions 
}: { 
  deliveryId: string; 
  status: string; 
  permissions: Record<string, any>; 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleApprove = () => {
    if (!confirm('Are you sure you want to approve this delivery? This will officially record the delivered quantities.')) return;
    
    setError('');
    startTransition(async () => {
      try {
        const res = await approveDelivery(deliveryId);
        if (res.success) {
          router.refresh();
        } else {
          setError(res.error || 'Failed to approve delivery.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve delivery.');
      }
    });
  };

  if (status !== 'FOR_ACCOUNTANT_APPROVAL') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      <PermissionGuard permissions={permissions} moduleName="DELIVERY_RECEIVING" action="canApprove">
        <button 
          onClick={handleApprove}
          disabled={isPending}
          className={styles.primaryButton}
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            opacity: isPending ? 0.7 : 1 
          }}
        >
          {isPending ? 'Approving...' : '✓ Approve Delivery'}
        </button>
      </PermissionGuard>
      {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}
    </div>
  );
}
