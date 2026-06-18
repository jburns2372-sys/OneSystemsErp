'use client';
// Force HMR refresh

import React, { useState, useEffect } from 'react';
import { createAccomplishment, createBilling, approveAccomplishment, submitBillingToPM, endorseBillingToPD, approvePaymentRequest, parseAccomplishmentReport } from '@/app/actions/progressActions';

export default function JobOrderProgressHub({ jobOrderData }: { jobOrderData: any }) {
  const [activeTab, setActiveTab] = useState<'accomplishments' | 'billings' | 'payments'>('accomplishments');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Accomplishment State
  const [accDesc, setAccDesc] = useState('');
  const [currentPercent, setCurrentPercent] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [aiAnalysisDone, setAiAnalysisDone] = useState(false);

  const latestCumulative = jobOrderData.subcontractAccomplishments?.[0]?.cumulativePercent || 0;

  // Billing State
  const [billingGross, setBillingGross] = useState(0);
  const previousBilled = jobOrderData.subcontractBillings?.reduce((sum: number, b: any) => sum + (b.currentGross || 0), 0) || 0;
  
  // Strict Flow Logic: Max billeable is based ONLY on APPROVED Accomplishment %
  const approvedAccomplishments = jobOrderData.subcontractAccomplishments?.filter((a: any) => a.status === 'APPROVED') || [];
  const totalApprovedPercent = approvedAccomplishments.reduce((sum: number, a: any) => sum + a.currentPercent, 0);
  const accomplishedValue = (totalApprovedPercent / 100) * jobOrderData.contractAmount;
  const maxBilleable = accomplishedValue - previousBilled;

  // Workflow protection rule: accomplishments & billings are only enabled once approved
  const isApproved = !['DRAFT', 'FOR_REVIEW', 'FOR_FINANCIAL_REVIEW', 'FOR_TECHNICAL_REVIEW'].includes(jobOrderData.status);

  useEffect(() => {
    if (maxBilleable > 0) {
      setBillingGross(maxBilleable);
    }
  }, [maxBilleable]);

  const handleSimulateAI = async () => {
    if (!uploadedFile) {
      setError("Please upload a file first.");
      return;
    }
    
    setIsSimulatingAI(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const res = await parseAccomplishmentReport(formData);
      
      if (res.success && res.percent !== undefined) {
        const extractedPercent = res.percent;
        const newCumulative = latestCumulative + extractedPercent;
        
        if (newCumulative > 100) {
          setCurrentPercent(100 - latestCumulative);
          setSuccessMsg(`AI detected ${extractedPercent}% accomplishment, but capped at maximum allowable ${(100 - latestCumulative).toFixed(2)}% to prevent exceeding 100%.`);
        } else {
          setCurrentPercent(extractedPercent);
          setSuccessMsg(`AI evaluation complete! Successfully extracted ${extractedPercent}% accomplishment from the document.`);
        }
        setAiAnalysisDone(true);
      } else {
        setError(res.error || "Could not extract accomplishment percentage from the document.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process document.");
    } finally {
      setIsSimulatingAI(false);
    }
  };

  const handleCreateAccomplishment = async () => {
    setLoading(true); setError(''); setSuccessMsg('');
    const newCumulative = latestCumulative + currentPercent;
    if (newCumulative > 100) {
      setError('Cumulative percent cannot exceed 100%');
      setLoading(false);
      return;
    }
    
    if (currentPercent <= 0) {
      setError('Accomplishment percent must be greater than 0%');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('jobOrderId', jobOrderData.id);
    formData.append('isJobOrder', 'true');
    formData.append('workDescription', accDesc || `Progress Claim: ${currentPercent}%`);
    formData.append('prevPercent', latestCumulative.toString());
    formData.append('currentPercent', currentPercent.toString());
    formData.append('cumulativePercent', newCumulative.toString());

    if (uploadedFile) {
      formData.append('file', uploadedFile);
    }

    const res = await createAccomplishment(formData);
    if (res.success) {
      setSuccessMsg('Accomplishment report submitted successfully.');
      setCurrentPercent(0);
      setAccDesc('');
      setUploadedFile(null);
      setAiAnalysisDone(false);
    } else {
      setError(res.error || 'Failed to submit accomplishment');
    }
    setLoading(false);
  };

  const handleCreateBilling = async () => {
    setLoading(true); setError(''); setSuccessMsg('');
    if (billingGross <= 0) {
      setError('Gross amount must be greater than 0');
      setLoading(false);
      return;
    }
    const totalGross = previousBilled + billingGross;
    const remaining = jobOrderData.contractAmount - totalGross;
    
    // Auto calculate 10% retention for demo purposes
    const retention = billingGross * 0.10;
    const netPayable = billingGross - retention;

    const res = await createBilling({
      projectId: jobOrderData.projectId,
      subcontractorId: jobOrderData.subcontractorId,
      jobOrderId: jobOrderData.id,
      isJobOrder: true,
      contractAmount: jobOrderData.contractAmount,
      previousGross: previousBilled,
      currentGross: billingGross,
      totalGross: totalGross,
      remainingBalance: remaining,
      netPayable: netPayable,
      retentionDeduction: retention
    });

    if (res.success) {
      setSuccessMsg('Billing created successfully.');
      setBillingGross(0);
    } else {
      setError(res.error || 'Failed to create billing');
    }
    setLoading(false);
  };

  const handleApprovePayment = async (billingId: string) => {
    setLoading(true); setError(''); setSuccessMsg('');
    const res = await approvePaymentRequest(billingId, jobOrderData.id, true);
    if (res.success) {
      setSuccessMsg('Payment request approved successfully.');
    } else {
      setError(res.error || 'Failed to approve payment request');
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setLoading(true); setError(''); setSuccessMsg('');
    const res = await approveAccomplishment(id, jobOrderData.id, true);
    if (res.success) {
      setSuccessMsg('Accomplishment approved successfully. It is now eligible for billing.');
    } else {
      setError(res.error || 'Failed to approve accomplishment');
    }
    setLoading(false);
  };

  const handleSubmitToPM = async (id: string) => {
    setLoading(true); setError(''); setSuccessMsg('');
    const res = await submitBillingToPM(id, jobOrderData.id, true);
    if (res.success) {
      setSuccessMsg('Billing successfully submitted to Project Manager.');
    } else {
      setError(res.error || 'Failed to submit billing');
    }
    setLoading(false);
  };

  const handleEndorseToPD = async (id: string) => {
    setLoading(true); setError(''); setSuccessMsg('');
    const res = await endorseBillingToPD(id, jobOrderData.id, true);
    if (res.success) {
      setSuccessMsg('Billing successfully endorsed to Project Director.');
    } else {
      setError(res.error || 'Failed to endorse billing');
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <button 
          onClick={() => { setActiveTab('accomplishments'); setError(''); setSuccessMsg(''); }}
          style={{ flex: 1, padding: '16px', fontWeight: 'bold', fontSize: '1rem', border: 'none', backgroundColor: activeTab === 'accomplishments' ? '#fff' : 'transparent', color: activeTab === 'accomplishments' ? '#3b82f6' : '#6b7280', borderBottom: activeTab === 'accomplishments' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}
        >
          1. Accomplishments
        </button>
        <button 
          onClick={() => { setActiveTab('billings'); setError(''); setSuccessMsg(''); }}
          style={{ flex: 1, padding: '16px', fontWeight: 'bold', fontSize: '1rem', border: 'none', backgroundColor: activeTab === 'billings' ? '#fff' : 'transparent', color: activeTab === 'billings' ? '#10b981' : '#6b7280', borderBottom: activeTab === 'billings' ? '3px solid #10b981' : '3px solid transparent', cursor: 'pointer' }}
        >
          2. Billings
        </button>
        <button 
          onClick={() => { setActiveTab('payments'); setError(''); setSuccessMsg(''); }}
          style={{ flex: 1, padding: '16px', fontWeight: 'bold', fontSize: '1rem', border: 'none', backgroundColor: activeTab === 'payments' ? '#fff' : 'transparent', color: activeTab === 'payments' ? '#f59e0b' : '#6b7280', borderBottom: activeTab === 'payments' ? '3px solid #f59e0b' : '3px solid transparent', cursor: 'pointer' }}
        >
          3. Payment Requests
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
        {successMsg && <div style={{ padding: '12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '16px' }}>{successMsg}</div>}

        {/* TAB 1: ACCOMPLISHMENTS */}
        {activeTab === 'accomplishments' && (
          <div>
            <h3 style={{ marginTop: 0, color: '#111827' }}>Log New Accomplishment</h3>
            {!isApproved ? (
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '1.05rem', color: '#b45309' }}>Job Order Not Approved</strong>
                  This job order is currently in <strong style={{ color: '#b45309' }}>{jobOrderData.status}</strong> status. Accomplishments can only be recorded once the job order is APPROVED.
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>Accomplished Percentage for this Period (%)</label>
                    <input 
                      type="number" 
                      value={currentPercent}
                      onChange={(e) => setCurrentPercent(parseFloat(e.target.value) || 0)}
                      max={100 - latestCumulative}
                      min={0}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #9ca3af', backgroundColor: '#ffffff', color: '#111827' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                      Max allowable: {(100 - latestCumulative).toFixed(2)}% (Cumulative: {latestCumulative.toFixed(2)}%)
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>Supporting Document / Progress Claim (Optional)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="file" 
                        onChange={(e) => {
                          setUploadedFile(e.target.files?.[0] || null);
                          setAiAnalysisDone(false);
                        }}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px dashed #9ca3af', backgroundColor: '#ffffff', color: '#111827' }}
                      />
                      <button 
                        onClick={handleSimulateAI}
                        disabled={!uploadedFile || isSimulatingAI}
                        style={{ padding: '0 16px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: !uploadedFile || isSimulatingAI ? 'not-allowed' : 'pointer', opacity: !uploadedFile || isSimulatingAI ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {isSimulatingAI ? '⏳ Analyzing...' : '🤖 Analyze with AI'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>Download <a href="/Accomplishment_Report_Seed.pdf" download style={{ color: '#3b82f6', textDecoration: 'underline' }}>Sample Report</a> for simulation.</p>
                  </div>
                </div>

                {aiAnalysisDone && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', color: '#166534', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✨</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>AI Validation Successful</strong>
                      <span style={{ fontSize: '0.85rem' }}>The AI has reviewed the document and calculated an accomplished percentage of <strong>{currentPercent}%</strong>. The form has been automatically filled.</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>Work Description</label>
                    <input 
                      type="text" 
                      value={accDesc} 
                      onChange={(e) => setAccDesc(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#111827' }}
                      placeholder="e.g. 1st Progress Billing for June"
                    />
                  </div>
                  <div>
                    <button 
                      onClick={handleCreateAccomplishment} 
                      disabled={loading || currentPercent <= 0 || (latestCumulative + currentPercent) > 100}
                      style={{ padding: '8px 24px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: loading || currentPercent <= 0 || (latestCumulative + currentPercent) > 100 ? 'not-allowed' : 'pointer', opacity: loading || currentPercent <= 0 || (latestCumulative + currentPercent) > 100 ? 0.5 : 1 }}
                    >
                      Submit Accomplishment
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', color: '#111827' }}>Accomplishment History</h3>
            {jobOrderData.subcontractAccomplishments?.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No accomplishments recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Description</th>
                    <th style={{ padding: '12px 8px' }}>This Period</th>
                    <th style={{ padding: '12px 8px' }}>Cumulative</th>
                    <th style={{ padding: '12px 8px' }}>Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobOrderData.subcontractAccomplishments?.map((acc: any) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px', color: '#111827' }}>{new Date(acc.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 8px', color: '#111827' }}>{acc.workDescription}</td>
                      <td style={{ padding: '12px 8px', color: '#3b82f6', fontWeight: 'bold' }}>+{acc.currentPercent.toFixed(2)}%</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#111827' }}>{acc.cumulativePercent.toFixed(2)}%</td>
                      <td style={{ padding: '12px 8px' }}>
                        {acc.status === 'APPROVED' ? (
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 'bold' }}>APPROVED</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>{acc.status || 'FOR_REVIEW'}</span>
                            <button 
                              onClick={() => handleApprove(acc.id)} 
                              disabled={loading}
                              style={{ padding: '4px 12px', backgroundColor: '#10b981', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.8rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: BILLINGS */}
        {activeTab === 'billings' && (
          <div>
            <h3 style={{ marginTop: 0, color: '#111827' }}>Create New Billing</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
              Billings are generated from APPROVED accomplishments.
            </p>
            {!isApproved ? (
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '1.05rem', color: '#b45309' }}>Job Order Not Approved</strong>
                  This job order is currently in <strong style={{ color: '#b45309' }}>{jobOrderData.status}</strong> status. Billings can only be generated once the job order is APPROVED.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #d1fae5' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#065f46', marginBottom: '4px' }}>Gross Amount to Bill (₱)</label>
                  <input 
                    type="number" 
                    value={billingGross} 
                    onChange={(e) => setBillingGross(parseFloat(e.target.value) || 0)}
                    style={{ width: '200px', padding: '8px', borderRadius: '6px', border: '1px solid #a7f3d0', backgroundColor: '#ffffff', color: '#111827' }}
                    max={maxBilleable > 0 ? maxBilleable : 0}
                    disabled={maxBilleable <= 0}
                  />
                </div>
                <div style={{ flex: 1, color: '#065f46', fontSize: '0.9rem' }}>
                  <div><strong>Max Available from Progress:</strong> ₱{maxBilleable > 0 ? maxBilleable.toLocaleString() : '0'}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>(Based on {totalApprovedPercent.toFixed(2)}% APPROVED cumulative accomplishment)</div>
                </div>
                <div>
                  <button 
                    onClick={handleCreateBilling} 
                    disabled={loading || billingGross <= 0 || billingGross > maxBilleable}
                    style={{ padding: '8px 24px', backgroundColor: '#10b981', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: loading || billingGross <= 0 || billingGross > maxBilleable ? 'not-allowed' : 'pointer', opacity: loading || billingGross <= 0 || billingGross > maxBilleable ? 0.5 : 1 }}
                  >
                    Generate Billing
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', color: '#111827' }}>Billing History</h3>
            {jobOrderData.subcontractBillings?.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No billings generated yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 8px' }}>Invoice No.</th>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Gross Amount</th>
                    <th style={{ padding: '12px 8px' }}>Retention (10%)</th>
                    <th style={{ padding: '12px 8px' }}>Net Payable</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobOrderData.subcontractBillings?.map((bill: any) => (
                    <tr key={bill.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#111827' }}>{bill.billingNumber}</td>
                      <td style={{ padding: '12px 8px', color: '#111827' }}>{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 8px', color: '#111827' }}>₱{bill.currentGross?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', color: '#ef4444' }}>-₱{bill.retentionDeduction?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', color: '#059669', fontWeight: 'bold' }}>₱{bill.netPayable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {bill.status === 'APPROVED_FOR_PAYMENT' || bill.status === 'APPROVED' || bill.paymentStatus === 'PAID' ? (
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 'bold' }}>APPROVED</span>
                        ) : bill.status === 'FOR_VALIDATION' ? (
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 'bold' }}>ENDORSED TO PD</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>{bill.status || 'DRAFT'}</span>
                            {bill.status === 'DRAFT' && (
                              <button 
                                onClick={() => handleSubmitToPM(bill.id)} 
                                disabled={loading}
                                style={{ padding: '4px 12px', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.8rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                              >
                                Submit to PM
                              </button>
                            )}
                            {bill.status === 'SUBMITTED' && (
                              <button 
                                onClick={() => handleEndorseToPD(bill.id)} 
                                disabled={loading}
                                style={{ padding: '4px 12px', backgroundColor: '#10b981', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '0.8rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                              >
                                Endorse to PD
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: PAYMENTS */}
        {activeTab === 'payments' && (
          <div>
            <h3 style={{ marginTop: 0, color: '#111827' }}>Pending Payment Requests</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>Process check payment or bank transfer for endorsed billings.</p>
            
            {jobOrderData.subcontractBillings?.filter((b: any) => b.paymentStatus !== 'PAID' && (b.status === 'FOR_VALIDATION' || b.status === 'APPROVED_FOR_PAYMENT')).length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>No endorsed billings waiting for payment.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {jobOrderData.subcontractBillings?.filter((b: any) => b.paymentStatus !== 'PAID' && (b.status === 'FOR_VALIDATION' || b.status === 'APPROVED_FOR_PAYMENT')).map((bill: any) => (
                  <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #fcd34d', borderRadius: '8px', backgroundColor: '#fffbeb' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#92400e' }}>Invoice: {bill.billingNumber}</div>
                      <div style={{ color: '#b45309', fontSize: '0.9rem', marginTop: '4px' }}>Net Payable: <strong>₱{bill.netPayable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                    </div>
                    <div>
                      {bill.status === 'APPROVED_FOR_PAYMENT' ? (
                        <div style={{ textAlign: 'center' }}>
                          <button disabled style={{ padding: '10px 24px', backgroundColor: '#d1d5db', color: '#6b7280', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'not-allowed' }}>
                            Approve for Payment
                          </button>
                          <div style={{ color: '#059669', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '4px' }}>✓ Completed</div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApprovePayment(bill.id)} 
                          disabled={loading}
                          style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                          Approve for Payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: '32px', color: '#111827' }}>Payment History</h3>
            {jobOrderData.subcontractBillings?.filter((b: any) => b.paymentStatus === 'PAID').length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No completed payments.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 8px' }}>Invoice No.</th>
                    <th style={{ padding: '12px 8px' }}>Amount Paid</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobOrderData.subcontractBillings?.filter((b: any) => b.paymentStatus === 'PAID').map((bill: any) => (
                    <tr key={bill.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#111827' }}>{bill.billingNumber}</td>
                      <td style={{ padding: '12px 8px', color: '#059669', fontWeight: 'bold' }}>₱{bill.netPayable?.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#d1fae5', color: '#065f46' }}>
                          PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
