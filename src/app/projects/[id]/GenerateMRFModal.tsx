'use client';

import React, { useState, useTransition } from 'react';
import { generateMRFFromConsolidated } from '@/app/actions/mutations';
import { useRouter } from 'next/navigation';

interface ConsolidatedItem {
  id: string;
  itemCode: string;
  category: string | null;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  deliveredQty: number;
}

interface Props {
  projectId: string;
  items: ConsolidatedItem[];
  users: { id: string; name: string | null }[];
  onClose: () => void;
  defaultToBalance?: boolean;
}

export default function GenerateMRFModal({ projectId, items, users, onClose, defaultToBalance = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    items.forEach(item => {
      q[item.id] = defaultToBalance ? Math.max(0, item.quantity - item.deliveredQty) : 0;
    });
    return q;
  });
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [locationOfUse, setLocationOfUse] = useState('');
  const [dateNeeded, setDateNeeded] = useState('');
  const [remarks, setRemarks] = useState('');
  const [requesterId, setRequesterId] = useState(users[0]?.id || '');
  const [error, setError] = useState('');
  const [breakdowns, setBreakdowns] = useState<Record<string, Array<{ description: string, quantity: number, unit: string, unitPrice: number, supplierName: string, isVat: boolean }>>>({});

  function handleQuantityChange(itemId: string, value: string) {
    const num = parseFloat(value) || 0;
    setQuantities(prev => ({ ...prev, [itemId]: num }));
  }

  function handleSubmit() {
    setError('');
    
    const validItems = items
      .filter(item => quantities[item.id] > 0 || (item.unit.toLowerCase().includes('lot') && (breakdowns[item.id]?.length || 0) > 0))
      .map(item => ({
        consolidatedBoqItemId: item.id,
        quantity: quantities[item.id] || 1, // default to 1 lot if broken down
        breakdownData: breakdowns[item.id] || null
      }));

    if (validItems.length === 0) {
      setError('Please enter quantity for at least one item.');
      return;
    }

    if (!requesterId) {
      setError('Please select a requester.');
      return;
    }

    startTransition(async () => {
      try {
        const mrId = await generateMRFFromConsolidated({
          projectId,
          requesterId,
          purpose,
          priority,
          locationOfUse,
          dateNeeded,
          remarks,
          items: validItems,
        });
        router.push(`/material-requests/${mrId}`);
      } catch (err: any) {
        setError(err.message || 'Failed to generate MRF.');
      }
    });
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-dark, #1a1a2e)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        width: '90vw',
        maxWidth: '1100px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          background: 'linear-gradient(135deg, rgba(0,255,163,0.08), transparent)',
        }}>
          <h2 style={{ margin: 0, color: 'var(--accent-color, #00ffa3)', fontSize: '1.3rem' }}>
            📋 Generate Material Request Form
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary, #aaa)', fontSize: '0.9rem' }}>
            {items.length} item{items.length !== 1 ? 's' : ''} selected from Consolidated BOQ
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 30px', overflowY: 'auto', flex: 1 }}>
          {/* MRF Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Requested By *
              </label>
              <select
                value={requesterId}
                onChange={e => setRequesterId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                }}
              >
                <option value="">-- Select --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                }}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Date Needed
              </label>
              <input
                type="date"
                value={dateNeeded}
                onChange={e => setDateNeeded(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Location of Use
              </label>
              <input
                type="text"
                value={locationOfUse}
                onChange={e => setLocationOfUse(e.target.value)}
                placeholder="e.g., 3rd Floor OR, Central Block"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g., Installation of VRF units..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary, #16213e)',
                  color: 'var(--text-primary, #fff)', fontSize: '0.9rem', resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Items Table */}
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>
            Material Items — Enter Requested Quantities
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,255,163,0.08)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Item Code</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Unit</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>BOQ Qty</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Delivered</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Balance</th>
                  <th style={{ padding: '10px', textAlign: 'right', color: 'var(--accent-color)', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold' }}>Request Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const balance = Math.max(0, item.quantity - item.deliveredQty);
                  const isOverRequest = quantities[item.id] > balance;
                  const isLot = item.unit.toLowerCase().includes('lot');
                  const itemBreakdowns = breakdowns[item.id] || [];
                  
                  return (
                    <React.Fragment key={item.id}>
                    <tr style={{ borderBottom: isLot ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{item.itemCode}</td>
                      <td style={{ padding: '10px', color: 'var(--text-primary)', maxWidth: '300px' }}>{item.description}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.unit}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {item.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {item.deliveredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: balance > 0 ? '#4ade80' : '#ef4444', fontWeight: 'bold' }}>
                        {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {!isLot ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={quantities[item.id] || ''}
                            onChange={e => handleQuantityChange(item.id, e.target.value)}
                            style={{
                              width: '100px', padding: '6px 8px', borderRadius: '6px', textAlign: 'right',
                              border: isOverRequest ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                              backgroundColor: 'var(--bg-secondary, #16213e)',
                              color: isOverRequest ? '#ef4444' : 'var(--text-primary, #fff)',
                              fontSize: '0.9rem', fontWeight: 'bold',
                            }}
                          />
                        ) : (
                          <button 
                            onClick={() => {
                              setBreakdowns(prev => ({
                                ...prev, 
                                [item.id]: [...(prev[item.id] || []), { description: '', quantity: 1, unit: 'pcs', unitPrice: 0, supplierName: '', isVat: true }]
                              }));
                            }}
                            style={{ padding: '6px 12px', background: 'rgba(0, 255, 163, 0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            + Add Breakdown
                          </button>
                        )}
                      </td>
                    </tr>
                    {isLot && itemBreakdowns.length > 0 && (
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td colSpan={7} style={{ padding: '10px 20px 20px 40px', background: 'rgba(0,0,0,0.2)' }}>
                          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-color)', fontSize: '0.9rem' }}>Detailed Breakdown for {item.itemCode}</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                              <thead>
                                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                  <th style={{ padding: '5px' }}>Description</th>
                                  <th style={{ padding: '5px' }}>Qty</th>
                                  <th style={{ padding: '5px' }}>Unit</th>
                                  <th style={{ padding: '5px' }}>Unit Price (₱)</th>
                                  <th style={{ padding: '5px' }}>Supplier / Vendor</th>
                                  <th style={{ padding: '5px', textAlign: 'center' }}>VAT?</th>
                                  <th style={{ padding: '5px' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {itemBreakdowns.map((bd, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '5px' }}>
                                      <input type="text" value={bd.description} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].description = e.target.value;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ width: '100%', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px' }} placeholder="e.g. Copper Coupler 1/2" />
                                    </td>
                                    <td style={{ padding: '5px', width: '60px' }}>
                                      <input type="number" value={bd.quantity} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].quantity = parseFloat(e.target.value) || 0;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ width: '100%', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px' }} />
                                    </td>
                                    <td style={{ padding: '5px', width: '60px' }}>
                                      <input type="text" value={bd.unit} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].unit = e.target.value;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ width: '100%', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px' }} />
                                    </td>
                                    <td style={{ padding: '5px', width: '100px' }}>
                                      <input type="number" step="0.01" value={bd.unitPrice} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].unitPrice = parseFloat(e.target.value) || 0;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ width: '100%', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px' }} />
                                    </td>
                                    <td style={{ padding: '5px', width: '150px' }}>
                                      <input type="text" value={bd.supplierName} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].supplierName = e.target.value;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ width: '100%', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px' }} placeholder="Supplier" />
                                    </td>
                                    <td style={{ padding: '5px', textAlign: 'center', width: '40px' }}>
                                      <input type="checkbox" checked={bd.isVat} onChange={e => {
                                        const newBds = [...itemBreakdowns]; newBds[idx].isVat = e.target.checked;
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} />
                                    </td>
                                    <td style={{ padding: '5px', textAlign: 'center', width: '40px' }}>
                                      <button onClick={() => {
                                        const newBds = itemBreakdowns.filter((_, i) => i !== idx);
                                        setBreakdowns(prev => ({...prev, [item.id]: newBds}));
                                      }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <div style={{
              marginTop: '16px', padding: '12px', borderRadius: '8px',
              backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 30px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)',
              backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            style={{
              padding: '10px 28px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #00ffa3, #00cc82)',
              color: '#000', cursor: isPending ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontWeight: 'bold',
              opacity: isPending ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(0,255,163,0.3)',
            }}
          >
            {isPending ? 'Generating MRF...' : '📋 Generate Material Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
