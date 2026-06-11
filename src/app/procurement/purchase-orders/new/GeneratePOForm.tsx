'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPOFromMRF } from '@/app/actions/poActions';
import { submitAIOverrideRequest } from '@/app/actions/aiOverrideActions';

export default function GeneratePOForm({ mr, suppliers }: { mr: any, suppliers: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [validationLogId, setValidationLogId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  
  const [items, setItems] = useState(
    mr.items.map((item: any) => ({
      id: item.id,
      consolidatedBoqItemId: item.consolidatedBoqItemId,
      itemCode: item.consolidatedBoqItem.itemCode,
      category: item.consolidatedBoqItem.category || 'Uncategorized',
      description: item.consolidatedBoqItem.description,
      quantity: item.quantity,
      unitCostInput: '', // Blank initially as requested
      supplierId: ''
    }))
  );

  const parseCost = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

  const handleCostChange = (id: string, val: string) => {
    if (!/^[0-9.,]*$/.test(val)) return;
    setItems(items.map((i: any) => i.id === id ? { ...i, unitCostInput: val } : i));
  };

  const handleCostBlur = (id: string, val: string) => {
    if (!val) return;
    const num = parseCost(val);
    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setItems(items.map((i: any) => i.id === id ? { ...i, unitCostInput: formatted } : i));
  };

  const handleSupplierChange = (id: string, supplierId: string) => {
    setItems(items.map((i: any) => i.id === id ? { ...i, supplierId } : i));
  };

  const totalAmount = items.reduce((acc: number, item: any) => {
    return item.supplierId ? acc + (item.quantity * parseCost(item.unitCostInput)) : acc;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToProcure = items.filter((i: any) => i.supplierId !== '');
    if (itemsToProcure.length === 0) {
      return alert('Please select a supplier for at least one item to generate a PO.');
    }

    startTransition(async () => {
      setError('');
      try {
        const res = await createPOFromMRF(mr.id, itemsToProcure.map((i: any) => ({
          consolidatedBoqItemId: i.consolidatedBoqItemId,
          quantity: i.quantity,
          unitCost: parseCost(i.unitCostInput),
          supplierId: i.supplierId
        })));
        
        if (res.success && res.createdPOIds) {
          if (res.createdPOIds.length === 1) {
            router.push(`/procurement/${res.createdPOIds[0]}`);
          } else {
            alert(`Successfully created ${res.createdPOIds.length} Purchase Orders.`);
            router.push(`/procurement/purchase-orders`);
          }
        } else {
          setError(res.error || 'Failed to generate PO');
          setValidationLogId(res.validationLogId || null);
        }
      } catch (err: any) {
        setError('Failed to generate PO: ' + err.message);
      }
    });
  };

  const handleOverride = async () => {
    if (!validationLogId || !overrideReason) return;
    const res = await submitAIOverrideRequest({
      validationLogId,
      transactionId: 'PENDING_PO_GEN',
      moduleName: 'Purchase Order Generation',
      overriddenBy: 'user-stub', // Use actual session later
      overriddenByRole: 'PURCHASING_OFFICER',
      overrideReason
    });
    
    if (res.success) {
      setOverrideSuccess(true);
      setError('Override Request Submitted! A Project Director must approve it before this PO is created.');
      setValidationLogId(null);
    } else {
      setError(res.error || 'Failed to submit override');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>Purchase Order Items</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Assign a supplier for each item. Items with different suppliers will automatically be split into separate Purchase Orders.</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(255, 107, 107, 0.3)' }}>
          <div style={{ fontWeight: 600, marginBottom: '5px' }}>{error}</div>
          
          {validationLogId && !overrideSuccess && (
            <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '10px' }}>Apply for AI Exception Override:</div>
              <textarea 
                value={overrideReason} 
                onChange={e => setOverrideReason(e.target.value)} 
                placeholder="Justification for bypassing policy (e.g. Director requested specific supplier)..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#111', color: '#fff', border: '1px solid #444', marginBottom: '10px' }}
              />
              <button 
                type="button"
                onClick={handleOverride}
                disabled={isPending || !overrideReason}
                style={{ padding: '8px 16px', background: '#ffd43b', color: '#000', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit Override to Director
              </button>
            </div>
          )}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Item Code</th>
            <th style={{ padding: '10px' }}>Description</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Qty</th>
            <th style={{ padding: '10px', width: '250px' }}>Supplier</th>
            <th style={{ padding: '10px', width: '150px' }}>Unit Cost (₱)</th>
            <th style={{ padding: '10px', textAlign: 'right' }}>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: item.supplierId ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <td style={{ padding: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>{item.itemCode}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.category}</div>
              </td>
              <td style={{ padding: '10px' }}>{item.description}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '10px' }}>
                <select 
                  value={item.supplierId} 
                  onChange={e => handleSupplierChange(item.id, e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Do Not Order Yet --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <input 
                  type="text" 
                  required={item.supplierId !== ''}
                  disabled={item.supplierId === ''}
                  value={item.unitCostInput}
                  onChange={e => handleCostChange(item.id, e.target.value)}
                  onBlur={e => handleCostBlur(item.id, e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', opacity: item.supplierId ? 1 : 0.5 }}
                />
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {item.supplierId ? `₱ ${(item.quantity * parseCost(item.unitCostInput)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱ 0.00'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>Grand Total (Selected Items):</td>
            <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: '#00ffa3' }}>
              ₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={{ textAlign: 'right' }}>
        <button 
          type="submit" 
          disabled={isPending}
          style={{
            backgroundColor: '#00ffa3', color: '#000', padding: '12px 24px', borderRadius: '8px', 
            border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1
          }}
        >
          {isPending ? 'Generating PO(s)...' : 'Generate & Submit Purchase Order(s)'}
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>This will submit the PO(s) for the Project Director's approval.</p>
      </div>
    </form>
  );
}
