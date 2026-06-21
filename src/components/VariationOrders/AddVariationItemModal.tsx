'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { getProjectAwardedBOQItems, addVariationOrderItem } from '@/app/actions/variationOrderActions';
import { toast } from 'sonner';
import { Search, Plus, Trash2 } from 'lucide-react';

interface AddVariationItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  voId: string;
  onSuccess: () => void;
}

export default function AddVariationItemModal({ isOpen, onClose, projectId, voId, onSuccess }: AddVariationItemModalProps) {
  const [classification, setClassification] = useState('BOQ_ADJUSTMENT');
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [fetchingBoq, setFetchingBoq] = useState(false);
  const [loading, setLoading] = useState(false);

  // BOQ_ADJUSTMENT State
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // ADDITIONAL_WORKS State
  const [additionalItems, setAdditionalItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      resetForms();
      fetchBoq();
    }
  }, [isOpen, projectId]);



  const fetchBoq = async () => {
    setFetchingBoq(true);
    try {
      const items = await getProjectAwardedBOQItems(projectId);
      setBoqItems(items);
    } catch (e: any) {
      toast.error('Failed to load BOQ items');
    } finally {
      setFetchingBoq(false);
    }
  };

  const resetForms = () => {
    setAdjustments({});
    setSearchTerm('');
    setAdditionalItems([{
      id: Date.now(),
      voItemNumber: '',
      description: '',
      unit: '',
      proposedQuantity: '',
      proposedUnitCost: ''
    }]);
  };

  const handleAdjustmentChange = (itemId: string, value: string) => {
    const numValue = parseFloat(value);
    setAdjustments(prev => ({
      ...prev,
      [itemId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToAdjust = Object.keys(adjustments).filter(id => adjustments[id] !== 0);
    
    if (itemsToAdjust.length === 0) {
      toast.error('No quantity adjustments have been entered.');
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const itemId of itemsToAdjust) {
        const item = boqItems.find(i => i.id === itemId);
        if (!item) continue;

        const qtyAdj = adjustments[itemId];
        const originalUnitCost = item.combinedUnitCost || item.totalCost / item.quantity || 0;
        const totalCost = Math.abs(qtyAdj * originalUnitCost);
        
        let addAmount = 0;
        let dedAmount = 0;
        let netAmt = 0;
        let revQty = item.quantity + qtyAdj;

        const subClass = qtyAdj < 0 ? 'DEDUCTIVE' : 'ADDITIVE';

        if (subClass === 'DEDUCTIVE') {
          if (Math.abs(qtyAdj) > item.quantity) {
            toast.error(`Cannot deduct more than original quantity for ${item.itemCode}`);
            continue;
          }
          dedAmount = totalCost;
          netAmt = -totalCost;
        } else {
          addAmount = totalCost;
          netAmt = totalCost;
        }

        const payload = {
          voItemNumber: item.itemCode,
          itemClassification: subClass,
          description: item.description,
          unit: item.unit,
          originalQuantity: item.quantity,
          currentProposedQuantity: Math.abs(qtyAdj),
          revisedQuantity: revQty,
          originalUnitCost,
          proposedUnitCost: originalUnitCost,
          approvedUnitCost: originalUnitCost,
          originalAmount: item.quantity * originalUnitCost,
          additionalAmount: addAmount,
          deductiveAmount: dedAmount,
          netAmount: netAmt,
          originalBoqItemId: item.id
        };

        await addVariationOrderItem(voId, payload);
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} adjustments!`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error('An error occurred during submission: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdditionalItemChange = (id: number, field: string, value: string | number) => {
    setAdditionalItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addAdditionalRow = () => {
    setAdditionalItems(prev => [
      ...prev,
      {
        id: Date.now(),
        voItemNumber: '',
        description: '',
        unit: '',
        proposedQuantity: '',
        proposedUnitCost: ''
      }
    ]);
  };

  const removeAdditionalRow = (id: number) => {
    setAdditionalItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAdditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate rows
    const validItems = additionalItems.filter(i => 
      i.voItemNumber && i.description && i.unit && Number(i.proposedQuantity) > 0
    );

    if (validItems.length === 0) {
      toast.error('Please completely fill out at least one item with a quantity > 0.');
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const item of validItems) {
        const pQty = Number(item.proposedQuantity) || 0;
        const proposedUnitCost = Number(item.proposedUnitCost) || 0;
        const totalCost = pQty * proposedUnitCost;

        const payload = {
          voItemNumber: item.voItemNumber,
          itemClassification: 'ADDITIONAL_WORKS',
          description: item.description,
          unit: item.unit,
          originalQuantity: 0,
          currentProposedQuantity: pQty,
          revisedQuantity: pQty,
          originalUnitCost: 0,
          proposedUnitCost,
          approvedUnitCost: proposedUnitCost,
          originalAmount: 0,
          additionalAmount: totalCost,
          deductiveAmount: 0,
          netAmount: totalCost,
          originalBoqItemId: null,
          otherDirectCost: proposedUnitCost,
          overhead: 0
        };

        await addVariationOrderItem(voId, payload);
        successCount++;
      }

      toast.success(`Successfully added ${successCount} new items!`);
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoq = boqItems.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Variation Order Items" maxWidth="95vw" width="95vw">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', width: 'fit-content' }}>
          <button 
            type="button"
            onClick={() => setClassification('BOQ_ADJUSTMENT')}
            style={{ 
              padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: classification === 'BOQ_ADJUSTMENT' ? 'var(--primary-dark)' : 'transparent',
              color: classification === 'BOQ_ADJUSTMENT' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Modify Existing BOQ
          </button>
          <button 
            type="button"
            onClick={() => setClassification('ADDITIONAL_WORKS')}
            style={{ 
              padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: classification === 'ADDITIONAL_WORKS' ? 'var(--primary-dark)' : 'transparent',
              color: classification === 'ADDITIONAL_WORKS' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Additional Works (New Items)
          </button>
        </div>
      </div>

      {classification === 'BOQ_ADJUSTMENT' && (
        <form onSubmit={handleBulkSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              placeholder="Search existing BOQ items..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '20%' }}>Item No.</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '25%' }}>Description</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Unit</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Quantity</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Unit Cost</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Total Cost</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '120px' }}>Qty Adj (+/-)</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Net Impact</th>
                </tr>
              </thead>
              <tbody>
                {fetchingBoq ? (
                  <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                ) : filteredBoq.map(item => {
                  const originalUnitCost = item.combinedUnitCost || item.totalCost / item.quantity || 0;
                  const adj = adjustments[item.id] || 0;
                  const impact = adj * originalUnitCost;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: adj !== 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>
                        {item.category || item.itemCode}
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '10px' }}>{item.unit}</td>
                      <td style={{ padding: '10px' }}>{item.quantity}</td>
                      <td style={{ padding: '10px' }}>{originalUnitCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ padding: '10px' }}>{(item.quantity * originalUnitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td style={{ padding: '10px' }}>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0"
                          value={adjustments[item.id] === 0 ? '' : adjustments[item.id] || ''}
                          onChange={e => handleAdjustmentChange(item.id, e.target.value)}
                          style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: impact > 0 ? 'var(--success-color)' : impact < 0 ? 'var(--danger-color)' : 'inherit' }}>
                        {impact !== 0 ? (impact > 0 ? '+ ' : '- ') + '₱ ' + Math.abs(impact).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: 'var(--accent-color)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>
              {loading ? 'Processing...' : 'Save Selected Adjustments'}
            </button>
          </div>
        </form>
      )}

      {classification === 'ADDITIONAL_WORKS' && (
        <form onSubmit={handleAdditionalSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '12%' }}>Item No.</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '22%' }}>Description</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '8%' }}>Unit</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '10%' }}>Quantity</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)', width: '15%' }}>Unit Cost</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>Net Impact</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {additionalItems.map((item, index) => {
                  const proposedUnitCost = Number(item.proposedUnitCost) || 0;
                  const pQty = Number(item.proposedQuantity) || 0;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px' }}>
                        <input required value={item.voItemNumber || ''} onChange={e => handleAdditionalItemChange(item.id, 'voItemNumber', e.target.value)} placeholder="e.g. EXTRA-01" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input required value={item.description || ''} onChange={e => handleAdditionalItemChange(item.id, 'description', e.target.value)} placeholder="Description" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input required value={item.unit || ''} onChange={e => handleAdditionalItemChange(item.id, 'unit', e.target.value)} placeholder="Unit" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input type="number" required min="0.01" step="0.01" value={item.proposedQuantity === undefined ? '' : item.proposedQuantity} onChange={e => handleAdditionalItemChange(item.id, 'proposedQuantity', parseFloat(e.target.value) || '')} placeholder="Qty" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input type="number" min="0" step="0.01" value={item.proposedUnitCost === undefined ? '' : item.proposedUnitCost} onChange={e => handleAdditionalItemChange(item.id, 'proposedUnitCost', parseFloat(e.target.value) || '')} placeholder="Unit Cost" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px' }} />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                        + ₱ {(pQty * proposedUnitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {additionalItems.length > 1 && (
                          <button type="button" onClick={() => removeAdditionalRow(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.7 }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            <div style={{ padding: '15px' }}>
              <button type="button" onClick={addAdditionalRow} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>
                <Plus size={14} /> Add Row
              </button>
            </div>
          </div>

          <div className="modal-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: 'var(--accent-color)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Save All New Items'}
              </button>
            </div>
          </div>
        </form>
      )}

    </Modal>
  );
}
