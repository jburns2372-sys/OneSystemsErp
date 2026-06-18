'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCanvassForm } from '@/app/actions/canvass';

export default function StartCanvassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mrId = searchParams.get('mrId');

  useEffect(() => {
    async function start() {
      if (!mrId) {
        alert('No MRF ID provided');
        router.push('/procurement/canvassing');
        return;
      }

      const res = await createCanvassForm(mrId);
      if (res.success && res.canvassId) {
        router.push(`/procurement/canvassing/${res.canvassId}`);
      } else {
        alert(res.error || 'Failed to start canvass');
        router.push('/procurement/canvassing');
      }
    }
    
    start();
  }, [mrId, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-color)', textShadow: '0 0 10px var(--accent-glow)' }}>
          Preparing Canvass Form...
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Extracting BOQ items from the approved Material Request.</p>
      </div>
    </div>
  );
}
