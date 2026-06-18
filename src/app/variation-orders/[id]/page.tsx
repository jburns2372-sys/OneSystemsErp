'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ArrowLeft, CheckSquare, Edit, DollarSign, UploadCloud, 
  Send, Bot, Settings, Briefcase, Plus, Search 
} from 'lucide-react';
import { 
  getVariationOrderById, 
  addVariationOrderItem, 
  submitVariationOrder,
  createMRFFromVO,
  createSubcontractFromVO,
  approveVariationOrderStage
} from '@/app/actions/variationOrderActions';
import { preCheckVariationOrder } from '@/app/actions/aiVariationValidationActions';
import AIValidationPanel from '@/components/VariationOrders/AIValidationPanel';
import AIVariationAssistant from '@/components/VariationOrders/AIVariationAssistant';
import styles from '../../projects/page.module.css';

export default function VariationOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const voId = params.id as string;

  const [vo, setVo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVO();
  }, [voId]);

  const fetchVO = async () => {
    try {
      const data = await getVariationOrderById(voId);
      setVo(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIPreCheck = async () => {
    setActionLoading(true);
    toast.info('AI is validating the Variation Order...');
    try {
      await preCheckVariationOrder(voId, 'SYSTEM'); // In a real app, use the actual user ID
      toast.success('AI Pre-Check Completed!');
      await fetchVO();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMRF = async () => {
    setActionLoading(true);
    try {
      const itemIds = vo.items.map((i: any) => i.id);
      await createMRFFromVO(voId, itemIds, 'USER_ID_PLACEHOLDER');
      toast.success('Material Request created successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveVariationOrderStage(voId, 'TECHNICAL_REVIEW', 'APPROVED', 'USER_ID_PLACEHOLDER', 'Looks good');
      toast.success('VO Approved!');
      await fetchVO();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!vo) return <div>Variation Order not found</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>{vo.voNumber} - {vo.variationType}</h1>
            <p className={styles.subtitle}>{vo.reasonForVariation}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={vo.currentStatus === 'APPROVED' ? styles.statusBadgeActive : styles.statusBadgePending}>
            {vo.currentStatus}
          </span>
          <span className={styles.badgeWarning} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <AlertOctagon size={14}/> Risk: {vo.aiRiskRating || 'UNRATED'}
          </span>
        </div>
      </header>

      {/* Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className={styles.metricCard}>
          <p className={styles.metricTitle}>Original Contract</p>
          <h3 className={styles.metricValue}>₱ {vo.originalContractAmount.toLocaleString()}</h3>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricTitle}>Additional Amount</p>
          <h3 className={styles.metricValue} style={{color: 'var(--success-color)'}}>+ ₱ {vo.additionalAmount.toLocaleString()}</h3>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricTitle}>Deductive Amount</p>
          <h3 className={styles.metricValue} style={{color: 'var(--danger-color)'}}>- ₱ {vo.deductiveAmount.toLocaleString()}</h3>
        </div>
        <div className={styles.metricCard} style={{ background: 'var(--primary-light)', border: '2px solid var(--primary)'}}>
          <p className={styles.metricTitle} style={{ color: 'var(--primary)'}}>Revised Contract</p>
          <h3 className={styles.metricValue} style={{ color: 'var(--primary)'}}>₱ {vo.currentRevisedContractAmount.toLocaleString()}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)'}}>{vo.percentageImpact.toFixed(2)}% Impact</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={handleRunAIPreCheck} 
          disabled={actionLoading || vo.currentStatus === 'APPROVED'}
          className={styles.secondaryButton} 
          style={{ background: '#E3F2FD', color: '#1976D2', borderColor: '#90CAF9' }}
        >
          <Bot size={16} /> Run AI Pre-Check
        </button>
        {vo.currentStatus === 'DRAFT' && (
          <button 
            onClick={async () => {
              await submitVariationOrder(voId);
              fetchVO();
            }}
            disabled={actionLoading}
            className={styles.createButton}
          >
            <Send size={16} /> Submit for Review
          </button>
        )}
        {vo.currentStatus !== 'DRAFT' && vo.currentStatus !== 'APPROVED' && (
          <button onClick={handleApprove} disabled={actionLoading} className={styles.createButton} style={{ background: 'var(--success-color)'}}>
            <CheckSquare size={16} /> Approve VO
          </button>
        )}
        {vo.approvedForProcurement && (
           <button onClick={handleCreateMRF} disabled={actionLoading} className={styles.actionBtn}>
             <Briefcase size={16} /> Create Material Request
           </button>
        )}
      </div>

      <div className={styles.dashboardSection}>
        <h2>AI Validation Results</h2>
        <AIValidationPanel validations={vo.aiValidations} />
      </div>

      <div className={styles.dashboardSection} style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>VO BOQ Table</h2>
          {vo.currentStatus === 'DRAFT' && (
            <button className={styles.secondaryButton}><Plus size={16}/> Add Item</button>
          )}
        </div>
        <table className={styles.projectTable} style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Item #</th>
              <th>Description</th>
              <th>Class</th>
              <th>Unit</th>
              <th>Orig Qty</th>
              <th>Rev Qty</th>
              <th>Unit Cost</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {vo.items.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No items added yet.</td></tr>
            ) : (
              vo.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.voItemNumber}</td>
                  <td>{item.description}</td>
                  <td>{item.itemClassification.replace(/_/g, ' ')}</td>
                  <td>{item.unit}</td>
                  <td>{item.originalQuantity}</td>
                  <td>{item.revisedQuantity}</td>
                  <td>₱ {item.approvedUnitCost.toLocaleString()}</td>
                  <td>₱ {item.netAmount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AIVariationAssistant voId={voId} />
    </div>
  );
}

// Ensure icons used but not imported above are available, e.g. AlertOctagon
import { AlertOctagon } from 'lucide-react';
