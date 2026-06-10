'use client';

import { useTransition } from 'react';
import { updatePOStatus } from '@/app/actions/poUpdates';

interface Props {
  poId: string;
  status: string;
  currentUser: { id: string; name: string | null; role: string } | null;
}

export default function POWorkflowButtons({ poId, status, currentUser }: Props) {
  const [isPending, startTransition] = useTransition();
  const role = currentUser?.role || '';

  function handleStatusUpdate(newStatus: string) {
    if (!currentUser?.id) return;
    startTransition(async () => {
      await updatePOStatus(poId, newStatus);
    });
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        
        {/* Approval Phase - Project Director */}
        {status === 'FOR_REVIEW' && (
          <>
            <button onClick={() => handleStatusUpdate('ISSUED')} disabled={isPending || role !== 'PROJECT_DIRECTOR'} style={{ backgroundColor: '#00ffa3', color: '#000', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isPending || role !== 'PROJECT_DIRECTOR' ? 0.5 : 1 }} title="Requires Project Director Role">
              {isPending ? 'Approving...' : '✅ Approve PO (Project Director)'}
            </button>
            <button onClick={() => handleStatusUpdate('DRAFT')} disabled={isPending || role !== 'PROJECT_DIRECTOR'} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isPending || role !== 'PROJECT_DIRECTOR' ? 0.5 : 1 }} title="Requires Project Director Role">
              {isPending ? 'Rejecting...' : '❌ Reject PO'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
