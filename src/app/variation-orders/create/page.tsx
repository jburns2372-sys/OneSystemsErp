'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createVariationOrder } from '@/app/actions/variationOrderActions';
import { ArrowLeft, Save, Bot } from 'lucide-react';
import styles from '../variation.module.css';

export default function CreateVariationOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId,
    variationType: 'Change Order',
    variationCategory: '',
    sourceOfVariation: '',
    reasonForVariation: '',
    detailedDescription: '',
    affectedLocation: '',
    timeImpact: 'TO_BE_EVALUATED',
    additionalCalendarDaysRequested: 0,
    technicalJustification: '',
  });

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
            <label>Variation Type</label>
            <select 
              className={styles.input}
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
            <label>Reason for Variation</label>
            <input 
              required
              className={styles.input} 
              placeholder="Brief reason (e.g., Design change per RFI-021)"
              value={formData.reasonForVariation}
              onChange={e => setFormData({...formData, reasonForVariation: e.target.value})}
            />
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
            <button type="submit" disabled={loading} className={styles.createButton}>
              {loading ? 'Creating...' : <><Save size={16}/> Save Draft & Proceed to BOQ</>}
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
