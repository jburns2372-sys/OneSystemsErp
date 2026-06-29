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
import { ArrowLeft, Save, Search, Plus, Trash2, Box, PenTool } from 'lucide-react';
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
    if (formData.projectId) {
      setFetchingBoq(true);
      getProjectAwardedBOQItems(formData.projectId)
        .then(res => setBoqItems(res))
        .catch(() => toast.error('Failed to load BOQ items'))
        .finally(() => setFetchingBoq(false));
    }
  }, [formData.projectId, formData.variationCategory]);

  const handleAdjustmentChange = (itemId: string, value: string) => {
    const numValue = parseInt(value, 10);
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
      toast.error('Project ID is required. Please scroll up and select a project.');
      return;
    }
    if (formData.variationCategory === 'SUBCONTRACTOR' && !formData.subcontractPackageId) {
      toast.error('Subcontract Package is required. Please select a package.');
      return;
    }
    
    // Validation
    const itemsToAdjust = Object.keys(adjustments).filter(id => adjustments[id] !== 0);
    const validAdditionalItems = additionalItems.filter(i => 
      Number(i.proposedQuantity) > 0 || Number(i.proposedUnitCost) > 0 || i.description
    );

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
          voItemNumber: item.voItemNumber || 'NEW',
          itemClassification: 'ADDITIONAL_WORKS',
          description: item.description || 'New Work Item',
          unit: item.unit || 'lot',
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

      toast.success('Success: Variation Request has been created and saved!');
      setTimeout(() => {
        router.refresh();
        if (formData.variationCategory === 'SUBCONTRACTOR') {
          router.push('/subcontracting/variations');
        } else {
          router.push(`/variation-orders`);
        }
      }, 800);
    } catch (error: any) {
      toast.error('Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  let filteredBoq = boqItems.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.itemCode && i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (formData.variationCategory === 'SUBCONTRACTOR' && formData.subcontractPackageId) {
    const selectedPkg = packages.find(p => p.id === formData.subcontractPackageId);
    if (selectedPkg) {
      const allowedBoqIds = new Set<string>();
      if (selectedPkg.awardedBoqItemId) allowedBoqIds.add(selectedPkg.awardedBoqItemId);
      if (selectedPkg.consolidatedBoqItemId) allowedBoqIds.add(selectedPkg.consolidatedBoqItemId);
      if (selectedPkg.masterBoqItemId) allowedBoqIds.add(selectedPkg.masterBoqItemId);
      
      if (selectedPkg.subcontractor?.subcontractorBOQItems) {
        selectedPkg.subcontractor.subcontractorBOQItems.forEach((boqItem: any) => {
           if (boqItem.awardedBoqItemId) allowedBoqIds.add(boqItem.awardedBoqItemId);
        });
      }

      filteredBoq = filteredBoq.filter(i => allowedBoqIds.has(i.id));
    } else {
      filteredBoq = []; // Hide if no package is fully matched
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', padding: '16px 32px', maxWidth: '100%', margin: '0 auto', background: 'var(--bg-primary)' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s ease' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>Create Variation Request</h1>
        </div>
        
        <button 
          type="submit"
          disabled={loading || (formData.variationCategory === 'SUBCONTRACTOR' && packages.length === 0)}
          style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--accent-color, #4caf50)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)', transition: 'transform 0.1s ease' }}
        >
          {loading ? 'Processing Transaction...' : <><Save size={18}/> Submit Variation</>}
        </button>
      </header>

      {/* COMPRESSED HEADER FORM */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px', 
        background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project *</label>
          <select 
            style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none', transition: 'border-color 0.2s ease' }}
            value={formData.projectId}
            onChange={e => setFormData({...formData, projectId: e.target.value})}
          >
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</label>
          <select 
            style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
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

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Impact</label>
          <select 
            style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            value={formData.timeImpact}
            onChange={e => setFormData({...formData, timeImpact: e.target.value})}
          >
            <option value="TO_BE_EVALUATED">To Be Evaluated</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        {formData.variationCategory === 'SUBCONTRACTOR' && (
          <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subcontract Package *</label>
            {packagesLoading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px 12px' }}>Loading packages...</div>
            ) : (
              <select 
                style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
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

        <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Affected Location</label>
          <input 
            style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            placeholder="e.g., Tower 1, Level 5"
            value={formData.affectedLocation}
            onChange={e => setFormData({...formData, affectedLocation: e.target.value})}
          />
        </div>

        <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detailed Description</label>
          <input 
            style={{ padding: '10px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            placeholder="Provide complete details..."
            value={formData.detailedDescription}
            onChange={e => setFormData({...formData, detailedDescription: e.target.value})}
          />
        </div>
      </div>

      {/* ITEMS BUILDER - FLEX TO FILL REMAINING SPACE */}
      <div style={{ flex: 1, background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            type="button"
            onClick={() => setClassification('BOQ_ADJUSTMENT')}
            style={{ 
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: classification === 'BOQ_ADJUSTMENT' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
              color: classification === 'BOQ_ADJUSTMENT' ? 'var(--accent-color, #4caf50)' : 'var(--text-secondary)',
              borderBottom: classification === 'BOQ_ADJUSTMENT' ? '2px solid var(--accent-color, #4caf50)' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <Box size={18} /> Modify Existing BOQ (Additive / Deductive)
          </button>
          <button 
            type="button"
            onClick={() => setClassification('ADDITIONAL_WORKS')}
            style={{ 
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: classification === 'ADDITIONAL_WORKS' ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
              color: classification === 'ADDITIONAL_WORKS' ? '#2196f3' : 'var(--text-secondary)',
              borderBottom: classification === 'ADDITIONAL_WORKS' ? '2px solid #2196f3' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <PenTool size={18} /> New Work Items
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column' }}>
          {classification === 'BOQ_ADJUSTMENT' && (
            <>
              <div style={{ position: 'relative', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  placeholder="Search existing BOQ items..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.4)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Item No.</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Unit</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Quantity</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Unit Cost</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '140px' }}>Qty Adj (+/-)</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Net Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchingBoq ? (
                      <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading BOQ...</td></tr>
                    ) : filteredBoq.map(item => {
                      const originalUnitCost = item.combinedUnitCost || item.totalCost / item.quantity || 0;
                      const adj = adjustments[item.id] || 0;
                      const impact = adj * originalUnitCost;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: adj !== 0 ? 'rgba(76, 175, 80, 0.05)' : 'transparent', transition: 'background 0.2s ease' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{item.category || item.itemCode}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{item.description}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.unit}</td>
                          <td style={{ padding: '12px 16px' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{originalUnitCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td style={{ padding: '8px 16px' }}>
                            <input 
                              type="number" 
                              step="1"
                              placeholder="0"
                              value={adjustments[item.id] === 0 ? '' : adjustments[item.id] || ''}
                              onChange={e => handleAdjustmentChange(item.id, e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: impact > 0 ? '#4caf50' : impact < 0 ? '#f44336' : 'inherit' }}>
                            {impact !== 0 ? (impact > 0 ? '+ ' : '- ') + '₱ ' + Math.abs(impact).toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {classification === 'ADDITIONAL_WORKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.4)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '15%' }}>Item No.</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '30%' }}>Description</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '10%' }}>Unit</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '15%' }}>Quantity</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)', width: '15%' }}>Unit Cost</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', color: 'var(--text-secondary)' }}>Impact</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalItems.map((item) => {
                      const proposedUnitCost = Number(item.proposedUnitCost) || 0;
                      const pQty = Number(item.proposedQuantity) || 0;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease', background: 'transparent' }}>
                          <td style={{ padding: '8px 16px' }}>
                            <input value={item.voItemNumber || ''} onChange={e => handleAdditionalItemChange(item.id, 'voItemNumber', e.target.value)} placeholder="e.g. EX-01" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input value={item.description || ''} onChange={e => handleAdditionalItemChange(item.id, 'description', e.target.value)} placeholder="Description" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input value={item.unit || ''} onChange={e => handleAdditionalItemChange(item.id, 'unit', e.target.value)} placeholder="Unit" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input type="number" min="0.01" step="0.01" value={item.proposedQuantity === undefined ? '' : item.proposedQuantity} onChange={e => handleAdditionalItemChange(item.id, 'proposedQuantity', parseFloat(e.target.value) || '')} placeholder="Qty" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input type="number" min="0" step="0.01" value={item.proposedUnitCost === undefined ? '' : item.proposedUnitCost} onChange={e => handleAdditionalItemChange(item.id, 'proposedUnitCost', parseFloat(e.target.value) || '')} placeholder="Cost" style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }} />
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2196f3' }}>
                            + ₱ {(pQty * proposedUnitCost).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {additionalItems.length > 1 && (
                              <button type="button" onClick={() => removeAdditionalRow(item.id)} style={{ background: 'transparent', border: 'none', color: '#f44336', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}>
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '16px', display: 'flex' }}>
                <button type="button" onClick={addAdditionalRow} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(33, 150, 243, 0.1)', border: '1px dashed rgba(33, 150, 243, 0.4)', color: '#2196f3', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
                  <Plus size={16} /> Add New Row
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
