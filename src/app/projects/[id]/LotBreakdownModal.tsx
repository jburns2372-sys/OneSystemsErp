'use client';

import { useState, useEffect, useTransition } from 'react';
import { getLotBreakdowns, saveLotBreakdown, deleteLotBreakdown } from '@/app/actions/mutations';

export default function LotBreakdownModal({ boqItem, projectId, onClose }: { boqItem: any; projectId: string; onClose: () => void }) {
  const [breakdowns, setBreakdowns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MATERIAL');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('lot');
  const [estimatedUnitCost, setEstimatedUnitCost] = useState(0);
  const [supplierQuotation, setSupplierQuotation] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await getLotBreakdowns(boqItem.id);
      setBreakdowns(data);
      setIsLoading(false);
    }
    loadData();
  }, [boqItem.id]);

  const totalBreakdownAmount = breakdowns.reduce((sum, b) => sum + (b.estimatedAmount || 0), 0);
  const remainingBudget = boqItem.totalCost - totalBreakdownAmount;

  const handleAdd = () => {
    if (!description) return alert("Description is required");
    
    startTransition(async () => {
      const estimatedAmount = quantity * estimatedUnitCost;
      const newBreakdown = await saveLotBreakdown({
        boqItemId: boqItem.id,
        description,
        category,
        quantity,
        unit,
        estimatedUnitCost,
        estimatedAmount,
        supplierQuotation,
        remarks
      });
      setBreakdowns([...breakdowns, newBreakdown]);
      
      // Reset form
      setDescription('');
      setQuantity(1);
      setEstimatedUnitCost(0);
      setSupplierQuotation('');
      setRemarks('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteLotBreakdown(id);
      setBreakdowns(breakdowns.filter(b => b.id !== id));
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '900px',
        maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>1-Lot Breakdown</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong>Item:</strong> {boqItem.itemCode} - {boqItem.description} <br/>
              <strong>Parent BOQ Budget:</strong> <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>₱ {boqItem.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Form */}
          <div style={{ width: '350px', padding: '20px', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', backgroundColor: 'var(--bg-dark)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>Add Breakdown Item</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                  <option value="MATERIAL">Material</option>
                  <option value="LABOR">Labor</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="SUBCONTRACT">Subcontract</option>
                  <option value="MISC">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Concrete mix..." style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Qty</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Unit</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Est. Unit Cost (₱)</label>
                <input type="number" value={estimatedUnitCost} onChange={e => setEstimatedUnitCost(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
              </div>

              <div style={{ padding: '10px', backgroundColor: 'rgba(0, 255, 163, 0.1)', borderRadius: '4px', textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Item Amount:</span><br/>
                <strong style={{ color: 'var(--accent-color)' }}>₱ {(quantity * estimatedUnitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Supplier Quotation (Ref / URL)</label>
                <input type="text" value={supplierQuotation} onChange={e => setSupplierQuotation(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', resize: 'none' }} />
              </div>

              <button 
                onClick={handleAdd}
                disabled={isPending}
                style={{
                  marginTop: '10px', background: 'var(--accent-color)', color: '#000', border: 'none',
                  padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {isPending ? 'Adding...' : '+ Add to Breakdown'}
              </button>

            </div>
          </div>

          {/* Right Table */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Breakdown Budget</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₱ {totalBreakdownAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Remaining Internal Balance</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: remainingBudget < 0 ? '#ef4444' : '#4ade80' }}>₱ {remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading breakdowns...</div>
            ) : breakdowns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-dark)', borderRadius: '8px' }}>
                No breakdown items yet. Add one from the left panel.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Cost</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {breakdowns.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{b.category || 'MISC'}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{b.description}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{b.quantity || 1} {b.unit || 'lot'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{(b.estimatedUnitCost || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(b.estimatedAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => handleDelete(b.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
