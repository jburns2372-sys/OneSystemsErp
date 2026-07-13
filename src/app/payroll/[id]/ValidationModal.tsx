'use client';

import { useState, useEffect } from 'react';
import { validatePayrollPreSubmission, submitPayrollForReview } from '../../actions/payrollAiValidator';

export default function ValidationModal({ periodId, onClose, onSuccess }: { periodId: string, onClose: () => void, onSuccess: () => void }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function runValidation() {
      const res = await validatePayrollPreSubmission(periodId);
      if (res.success) {
        setValidationResult(res);
      } else {
        setError(res.error || '');
      }
      setIsValidating(false);
    }
    runValidation();
  }, [periodId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitPayrollForReview(periodId);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || '');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)', width: '90%', maxWidth: '600px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤖</span> AI Pre-Submission Validation
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {error && <div style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(231, 76, 60, 0.3)' }}>{error}</div>}

        {isValidating ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}>🔍</div>
            Analyzing payroll records, checking deductions, and looking for anomalies...
          </div>
        ) : validationResult && (
          <div>
            {!validationResult.canSubmit && (
              <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛑</span> Critical Errors Found ({validationResult.criticalErrors.length})
                </h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ffcccb' }}>You must resolve these errors before submitting the payroll to the Approver.</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#fff', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validationResult.criticalErrors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div style={{ background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> Warnings & Anomalies ({validationResult.warnings.length})
                </h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#fef5d9' }}>These issues will not block submission, but the Approver will see them.</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#fff', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {validationResult.warnings.map((warn: string, i: number) => <li key={i}>{warn}</li>)}
                </ul>
              </div>
            )}

            {validationResult.canSubmit && validationResult.warnings.length === 0 && (
              <div style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', borderRadius: '12px', padding: '30px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                <h4 style={{ margin: '0 0 5px 0', color: '#2ecc71', fontSize: '1.2rem' }}>All Clear!</h4>
                <p style={{ margin: 0, color: '#a2d9b5', fontSize: '0.9rem' }}>No anomalies or errors detected. The payroll is ready for review.</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
              <button 
                onClick={onClose} 
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={!validationResult.canSubmit || isSubmitting}
                style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: !validationResult.canSubmit ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!validationResult.canSubmit || isSubmitting) ? 0.5 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit to Approver'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
