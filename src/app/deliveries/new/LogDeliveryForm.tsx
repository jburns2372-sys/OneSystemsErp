'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { encodeDelivery } from '@/app/actions/deliveryActions';
import styles from '../../projects/page.module.css';

export default function LogDeliveryForm({ purchaseOrders }: { purchaseOrders: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPoId, setSelectedPoId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  
  const [drQuantities, setDrQuantities] = useState<Record<string, number>>({});
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  
  const [error, setError] = useState('');

  const selectedPo = purchaseOrders.find(po => po.id === selectedPoId);

  const handleDrQtyChange = (itemId: string, val: string) => {
    setDrQuantities(prev => ({ ...prev, [itemId]: parseFloat(val) || 0 }));
  };

  const handleActualQtyChange = (itemId: string, val: string) => {
    setActualQuantities(prev => ({ ...prev, [itemId]: parseFloat(val) || 0 }));
  };

  const handleRemarksChange = (itemId: string, val: string) => {
    setRemarks(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return setError('Please select a Purchase Order.');
    if (!receiptNumber) return setError('Please enter the Delivery Receipt number.');

    const itemsToDeliver: any[] = [];
    let hasValidationError = false;

    Object.entries(drQuantities).forEach(([id, drQty]) => {
      const actualQty = actualQuantities[id] || 0;
      const remark = remarks[id] || '';

      if (drQty > 0 || actualQty > 0) {
        if (drQty !== actualQty && !remark.trim()) {
          setError('Please provide a remark for items where DR Qty does not match Actual Qty.');
          hasValidationError = true;
          return;
        }
        itemsToDeliver.push({
          consolidatedBoqItemId: id,
          drQuantity: drQty,
          quantity: actualQty,
          remarks: remark
        });
      }
    });

    if (hasValidationError) return;

    if (itemsToDeliver.length === 0) {
      return setError('Please enter quantity for at least one item.');
    }

    setError('');
    startTransition(async () => {
      try {
        const res = await encodeDelivery({
          poId: selectedPoId,
          receiptNumber,
          items: itemsToDeliver
        });
        if (res.success) {
          router.push(`/deliveries/${res.deliveryId}`);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while logging the delivery.');
      }
    });
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Purchase Order</label>
            <select 
              value={selectedPoId} 
              onChange={e => { 
                setSelectedPoId(e.target.value); 
                setDrQuantities({}); 
                setActualQuantities({});
                setRemarks({});
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
              required
            >
              <option value="">-- Select PO --</option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>{po.poNumber} ({po.supplier.name}) - {po.mr.project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Delivery Receipt (DR) Number</label>
            <input 
              type="text" 
              value={receiptNumber} 
              onChange={e => setReceiptNumber(e.target.value)}
              placeholder="e.g. DR-2026-001"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
              required
            />
          </div>
        </div>

        {selectedPo && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Items in this PO</h3>
            <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Item Description</th>
                    <th>Ordered Qty</th>
                    <th>Remaining</th>
                    <th>DR Qty</th>
                    <th>Actual Qty</th>
                    <th>Remarks (If lacking)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPo.items.map((item: any) => {
                    const ordered = item.quantity;
                    const deliveredSoFar = item.consolidatedBoqItem.deliveredQty || 0;
                    const remaining = Math.max(0, ordered - deliveredSoFar);
                    const isDone = remaining === 0;

                    const drQty = drQuantities[item.consolidatedBoqItem.id] || 0;
                    const actualQty = actualQuantities[item.consolidatedBoqItem.id] || 0;
                    const mismatch = drQty !== actualQty;

                    return (
                      <tr key={item.consolidatedBoqItem.id}>
                        <td>{item.consolidatedBoqItem.category}</td>
                        <td>{item.consolidatedBoqItem.description}</td>
                        <td>{ordered}</td>
                        <td>
                          {isDone ? <span style={{ color: 'var(--accent-color)' }}>Fully Delivered</span> : remaining}
                        </td>
                        <td>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            disabled={isDone}
                            value={drQuantities[item.consolidatedBoqItem.id] || ''}
                            onChange={e => handleDrQtyChange(item.consolidatedBoqItem.id, e.target.value)}
                            placeholder="On DR"
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            disabled={isDone}
                            value={actualQuantities[item.consolidatedBoqItem.id] || ''}
                            onChange={e => handleActualQtyChange(item.consolidatedBoqItem.id, e.target.value)}
                            placeholder="Actual"
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: mismatch ? '1px solid #ef4444' : '1px solid var(--glass-border)', background: mismatch ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-dark)', color: 'white' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text"
                            disabled={isDone}
                            value={remarks[item.consolidatedBoqItem.id] || ''}
                            onChange={e => handleRemarksChange(item.consolidatedBoqItem.id, e.target.value)}
                            placeholder={mismatch ? "Required: reason for lacking qty" : "Optional remarks"}
                            style={{ width: '100%', minWidth: '150px', padding: '8px', borderRadius: '4px', border: mismatch && !remarks[item.consolidatedBoqItem.id] ? '1px solid #ef4444' : '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div style={{ color: '#ef4444', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={() => router.back()}
            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'white', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isPending || !selectedPoId}
            className={styles.primaryButton}
            style={{ opacity: (isPending || !selectedPoId) ? 0.7 : 1 }}
          >
            {isPending ? 'Submitting...' : 'Receive Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
}
