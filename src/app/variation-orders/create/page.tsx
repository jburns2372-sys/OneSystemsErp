'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  createVariationOrder, 
  getProjectAwardedBOQItems, 
  addVariationOrderItem 
} from '@/app/actions/variationOrderActions';
import { getGlobalProjectsAndContext } from '@/app/actions/executiveContextActions';
import { getSubcontractPackages } from '@/app/actions/subcontractingActions';
import { ArrowLeft, Save, Search, Plus, Trash2 } from 'lucide-react';
import styles from '../variation.module.css';

export default function CreateVariationOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const categoryParam = searchParams.get('category') || '';
  
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    projectId: initialProjectId,
    subcontractPackageId: '',
    variationType: 'Change Order',
    variationCategory: categoryParam,
    sourceOfVariation: '',
    reasonForVariation: '', // Removed from UI, kept for backend compat
    detailedDescription: '',
    affectedLocation: '',
    timeImpact: 'TO_BE_EVALUATED',
    additionalCalendarDaysRequested: 0,
    technicalJustification: '',
  });

  // Items State
  const [classification, setClassification] = useState('BOQ_ADJUSTMENT');
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [fetchingBoq, setFetchingBoq] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [additionalItems, setAdditionalItems] = useState<any[]>([{
    id: Date.now(),
    voItemNumber: '',
    description: '',
    unit: '',
    proposedQuantity: '',
    proposedUnitCost: ''
  }]);

  useEffect(() => {
    getGlobalProjectsAndContext().then(res => {
      setProjects(res.projects);
      if (!initialProjectId && res.currentProjectId !== 'ALL' && res.currentProjectId) {
        setFormData(prev => ({ ...prev, projectId: res.currentProjectId }));
      }
    });
  }, [initialProjectId]);

  useEffect(() => {
    if (formData.variationCategory === 'SUBCONTRACTOR' && formData.projectId) {
      setPackagesLoading(true);
      getSubcontractPackages(formData.projectId).then(res => {
        setPackages(res);
        setPackagesLoading(false);
      });
    }
  }, [formData.projectId, formData.variationCategory]);

  useEffect(() => {
    if (formData.projectId && formData.variationCategory !== 'SUBCONTRACTOR') {
      setFetchingBoq(true);
      getProjectAwardedBOQItems(formData.projectId)
        .then(res => setBoqItems(res))
        .catch(() => toast.error('Failed to load BOQ items'))
        .finally(() => setFetchingBoq(false));
    }
  }, [formData.projectId, formData.variationCategory]);

  const handleAdjustmentChange = (itemId: string, value: string) => {
    const numValue = parseFloat(value);
    setAdjustments(prev => ({
      ...prev,
      [itemId]: isNaN(numValue) ? 0 : numValue
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error('Project ID is required.');
      return;
    }
    
    // Validation
    const itemsToAdjust = Object.keys(adjustments).filter(id => adjustments[id] !== 0);
    const validAdditionalItems = additionalItems.filter(i => 
      i.voItemNumber && i.description && i.unit && Number(i.proposedQuantity) > 0
    );

    if (itemsToAdjust.length === 0 && validAdditionalItems.length === 0) {
      toast.error('Please enter at least one BOQ adjustment or new additional work item.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Variation Order Header
      const vo = await createVariationOrder(formData);

      // 2. Submit BOQ Adjustments
      for (const itemId of itemsToAdjust) {
        const item = boqItems.find(i => i.id === itemId);
        if (!item) continue;

        const qtyAdj = adjustments[itemId];
        const originalUnitCost = item.combinedUnitCost || item.totalCost / item.quantity || 0;
        const totalCost = Math.abs(qtyAdj * originalUnitCost);
        const subClass = qtyAdj < 0 ? 'DEDUCTIVE' : 'ADDITIVE';

        await addVariationOrderItem(vo.id, {
          voItemNumber: item.itemCode,
          itemClassification: subClass,
          description: item.description,
          unit: item.unit,
          originalQuantity: item.quantity,
          currentProposedQuantity: Math.abs(qtyAdj),
          revisedQuantity: item.quantity + qtyAdj,
          originalUnitCost,
          proposedUnitCost: originalUnitCost,
          approvedUnitCost: originalUnitCost,
          originalAmount: item.quantity * originalUnitCost,
          additionalAmount: subClass === 'ADDITIVE' ? totalCost : 0,
          deductiveAmount: subClass === 'DEDUCTIVE' ? totalCost : 0,
          netAmount: subClass === 'ADDITIVE' ? totalCost : -totalCost,
          originalBoqItemId: item.id
        });
      }

      // 3. Submit Additional Works
      for (const item of validAdditionalItems) {
        const pQty = Number(item.proposedQuantity) || 0;
        const proposedUnitCost = Number(item.proposedUnitCost) || 0;
        const totalCost = pQty * proposedUnitCost;

        await addVariationOrderItem(vo.id, {
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
        });
      }

      toast.success('Variation Order & Items Saved Successfully!');
      router.push(`/variation-orders/${vo.id}`);
    } catch (error: any) {
      toast.error('Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoq = boqItems.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.itemCode && i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <header className={styles.header} style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title} style={{ fontSize: '1.4rem' }}>Create Variation Request</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        {/* COMPRESSED HEADER FORM */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', 
          background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)',
          marginBottom: '1rem'
        }}>
          
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Project *</label>
            <select 
              required
              className={styles.input}
              style={{ padding: '6px', fontSize: '0.9rem' }}
              value={formData.projectId}
              onChange={e => setFormData({...formData, projectId: e.target.value})}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Variation Type</label>
            <select 
              className={styles.input}
              style={{ padding: '6px', fontSize: '0.9rem' }}
              value={formData.variationType}
              onChange={e => setFormData({...formData, variationType: e.target.value})}
            >
              <option>Change Order</option>
              <option>Extra Work Order</option>
              <option>Additive Variation</option>
              <option>Deductive Variation</option>
              <option>Reclassification</option>
              <option>Emergency Variation</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Source</label>
            <select 
              className={styles.input}
              style={{ padding: '6px', fontSize: '0.9rem' }}
              value={formData.sourceOfVariation}
              onChange={e => setFormData({...formData, sourceOfVariation: e.target.value})}
            >
              <option value="">Select Source...</option>
              <option>Client-Initiated</option>
              <option>Consultant-Initiated</option>
              <option>Contractor-Requested</option>
              <option>Internal Cost Adjustment</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Time Impact</label>
            <select 
              className={styles.input}
              style={{ padding: '6px', fontSize: '0.9rem' }}
              value={formData.timeImpact}
              onChange={e => setFormData({...formData, timeImpact: e.target.value})}
            >
              <option value="TO_BE_EVALUATED">To Be Evaluated</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / 3', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Detailed Description</label>
            <input 
              required
              className={styles.input} 
              style={{ padding: '6px', fontSize: '0.9rem' }}
              placeholder="Provide complete details..."
              value={formData.detailedDescription}
              onChange={e => setFormData({...formData, detailedDescription: e.target.value})}
            />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '3 / 5', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Affected Location</label>
            <input 
              className={styles.input} 
              style={{ padding: '6px', fontSize: '0.9rem' }}
              placeholder="e.g., Tower 1, Level 5"
              value={formData.affectedLocation}
              onChange={e => setFormData({...formData, affectedLocation: e.target.value})}
            />
          </div>

          {formData.variationCategory === 'SUBCONTRACTOR' && (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Subcontract Package *</label>
              {packagesLoading ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading packages...</div>
              ) : (
                <select 
                  required
                  className={styles.input}
                  style={{ padding: '6px', fontSize: '0.9rem' }}
                  value={formData.subcontractPackageId}
                  onChange={e => setFormData({...formData, subcontractPackageId: e.target.value})}
                >
                  <option value="">Select Package</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.packageNumber} - {pkg.scopeOfWork}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* ITEMS BUILDER */}
        <div style={{ background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '55vh' }}>
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <button 
              type="button"
              onClick={() => setClassification('BOQ_ADJUSTMENT')}
              style={{ 
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px',
                background: classification === 'BOQ_ADJUSTMENT' ? 'var(--primary-dark)' : 'transparent',
                color: classification === 'BOQ_ADJUSTMENT' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Modify Existing BOQ (Additive / Deductive)
            </button>
            <button 
              type="button"
              onClick={() => setClassification('ADDITIONAL_WORKS')}
              style={{ 
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderTopRightRadius: '8px',
                background: classification === 'ADDITIONAL_WORKS' ? 'var(--primary-dark)' : 'transparent',
                color: classification === 'ADDITIONAL_WORKS' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              New Work Items
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {classification === 'BOQ_ADJUSTMENT' && (
              <>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-secondary)' }} />
                  <input 
                    placeholder="Search existing BOQ items..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Item No.</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Description</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Unit</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Quantity</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Unit Cost</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '120px' }}>Qty Adj (+/-)</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Net Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchingBoq ? (
                      <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading BOQ...</td></tr>
                    ) : filteredBoq.map(item => {
                      const originalUnitCost = item.combinedUnitCost || item.totalCost / item.quantity || 0;
                      const adj = adjustments[item.id] || 0;
                      const impact = adj * originalUnitCost;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: adj !== 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.category || item.itemCode}</td>
                          <td style={{ padding: '8px' }}>{item.description}</td>
                          <td style={{ padding: '8px' }}>{item.unit}</td>
                          <td style={{ padding: '8px' }}>{item.quantity}</td>
                          <td style={{ padding: '8px' }}>{originalUnitCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0"
                              value={adjustments[item.id] === 0 ? '' : adjustments[item.id] || ''}
                              onChange={e => handleAdjustmentChange(item.id, e.target.value)}
                              style={{ width: '100%', padding: '4px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: impact > 0 ? 'var(--success-color)' : impact < 0 ? 'var(--danger-color)' : 'inherit' }}>
                            {impact !== 0 ? (impact > 0 ? '+ ' : '- ') + '₱ ' + Math.abs(impact).toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {classification === 'ADDITIONAL_WORKS' && (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '15%' }}>Item No.</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '30%' }}>Description</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '10%' }}>Unit</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '15%' }}>Quantity</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)', width: '15%' }}>Unit Cost</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>Impact</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalItems.map((item) => {
                      const proposedUnitCost = Number(item.proposedUnitCost) || 0;
                      const pQty = Number(item.proposedQuantity) || 0;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px' }}>
                            <input value={item.voItemNumber || ''} onChange={e => handleAdditionalItemChange(item.id, 'voItemNumber', e.target.value)} placeholder="e.g. EX-01" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input value={item.description || ''} onChange={e => handleAdditionalItemChange(item.id, 'description', e.target.value)} placeholder="Description" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input value={item.unit || ''} onChange={e => handleAdditionalItemChange(item.id, 'unit', e.target.value)} placeholder="Unit" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="number" min="0.01" step="0.01" value={item.proposedQuantity === undefined ? '' : item.proposedQuantity} onChange={e => handleAdditionalItemChange(item.id, 'proposedQuantity', parseFloat(e.target.value) || '')} placeholder="Qty" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="number" min="0" step="0.01" value={item.proposedUnitCost === undefined ? '' : item.proposedUnitCost} onChange={e => handleAdditionalItemChange(item.id, 'proposedUnitCost', parseFloat(e.target.value) || '')} placeholder="Cost" style={{ width: '100%', padding: '6px', background: 'var(--bg-color)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                            + ₱ {(pQty * proposedUnitCost).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
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
                <div style={{ marginTop: '12px' }}>
                  <button type="button" onClick={addAdditionalRow} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Add Row
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className={styles.createButton} 
            disabled={loading || (formData.variationCategory === 'SUBCONTRACTOR' && packages.length === 0)}
            style={{ padding: '12px 32px', fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            {loading ? 'Processing Transaction...' : <><Save size={20}/> Submit Variation Request & Items</>}
          </button>
        </div>
      </form>
    </div>
  );
}
