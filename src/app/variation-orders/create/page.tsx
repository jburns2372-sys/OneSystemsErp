'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createVariationOrder } from '@/app/actions/variationOrderActions';
import { getGlobalProjectsAndContext } from '@/app/actions/executiveContextActions';
import { getSubcontractPackages } from '@/app/actions/subcontractingActions';
import { ArrowLeft, Save, Bot } from 'lucide-react';
import styles from '../variation.module.css';

export default function CreateVariationOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const categoryParam = searchParams.get('category') || '';
  
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectId,
    subcontractPackageId: '',
    variationType: 'Change Order',
    variationCategory: categoryParam,
    sourceOfVariation: '',
    reasonForVariation: '',
    detailedDescription: '',
    affectedLocation: '',
    timeImpact: 'TO_BE_EVALUATED',
    additionalCalendarDaysRequested: 0,
    technicalJustification: '',
  });

  useEffect(() => {
    getGlobalProjectsAndContext().then(res => {
      setProjects(res.projects);
      if (!projectId && res.currentProjectId !== 'ALL' && res.currentProjectId) {
        setFormData(prev => ({ ...prev, projectId: res.currentProjectId }));
      }
    });
  }, [projectId]);

  useEffect(() => {
    if (formData.variationCategory === 'SUBCONTRACTOR' && formData.projectId) {
      setPackagesLoading(true);
      getSubcontractPackages(formData.projectId).then(res => {
        setPackages(res);
        setPackagesLoading(false);
      });
    }
  }, [formData.projectId, formData.variationCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error('Project ID is required.');
      return;
    }
    setLoading(true);
    try {
      const vo = await createVariationOrder(formData);
      toast.success('Variation Order Draft Created!');
      router.push(`/variation-orders/${vo.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>Create Variation Request</h1>
            <p className={styles.subtitle}>Start a new contract change with AI guidance</p>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.formGroup}>
            <label>Project *</label>
            <select 
              required
              className={styles.input}
              value={formData.projectId}
              onChange={e => setFormData({...formData, projectId: e.target.value})}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          {formData.variationCategory === 'SUBCONTRACTOR' && formData.projectId && (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Subcontract Package *</label>
              {packagesLoading ? (
                <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>Loading packages...</div>
              ) : packages.length === 0 ? (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid #ef4444' }}>
                  <strong>Error:</strong> No Subcontract Packages found for this project. You must create Subcontracting Works first before drafting a Subcontractor Variation Order.
                </div>
              ) : (
                <select 
                  required
                  className={styles.input}
                  value={formData.subcontractPackageId}
                  onChange={e => setFormData({...formData, subcontractPackageId: e.target.value})}
                >
                  <option value="">Select Package</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.packageNumber} - {pkg.scopeOfWork} (₱{pkg.contractAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Source of Variation</label>
            <select 
              className={styles.input}
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



          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Detailed Description</label>
            <textarea 
              required
              className={styles.textarea} 
              rows={4}
              placeholder="Provide complete details of the requested change..."
              value={formData.detailedDescription}
              onChange={e => setFormData({...formData, detailedDescription: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Affected Location</label>
            <input 
              className={styles.input} 
              placeholder="e.g., Tower 1, Level 5"
              value={formData.affectedLocation}
              onChange={e => setFormData({...formData, affectedLocation: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Time Impact</label>
            <select 
              className={styles.input}
              value={formData.timeImpact}
              onChange={e => setFormData({...formData, timeImpact: e.target.value})}
            >
              <option value="TO_BE_EVALUATED">To Be Evaluated</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Upload Plans & Documents</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-light)', padding: '1.5rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Attach plans, drawings, or evidence related to additive, deductive, or additional new work items.
              </p>
              <input 
                type="file" 
                multiple 
                className={styles.input} 
                style={{ padding: '1rem', border: 'none', background: 'transparent' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    toast.success(`${e.target.files.length} file(s) selected for upload.`);
                  }
                }}
              />
            </div>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={loading || (formData.variationCategory === 'SUBCONTRACTOR' && packages.length === 0)}
            >
              {loading ? 'Creating...' : <><Save size={18} /> Save & Open AI Pipeline</>}
            </button>
          </div>
        </form>

        {/* AI Mini Assistant Sidebar */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bot color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Guidance</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Not sure which type to select? Need help drafting the technical justification?
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className={styles.secondaryButton} onClick={() => alert('AI feature in development.')}>
              Recommend VO Type
            </button>
            <button className={styles.secondaryButton} onClick={() => alert('AI feature in development.')}>
              Generate Draft Justification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
