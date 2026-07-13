'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScheduleSetupWizard({ 
  project, 
  awardedBoq, 
  onScheduleCreated 
}: { 
  project: any; 
  awardedBoq: any[]; 
  onScheduleCreated: (schedule: any) => void;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consolidateBoq, setConsolidateBoq] = useState(true);

  // Form State
  const [name, setName] = useState(`${project.name} Master Schedule`);
  const [workDays, setWorkDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  const toggleWorkDay = (day: string) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter(d => d !== day));
    } else {
      setWorkDays([...workDays, day]);
    }
  };

  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    'Initializing Schedule Engine...',
    '1/14: Loading Project Context...',
    '2/14: Analyzing Locked Awarded BOQ...',
    '3/14: Classifying Project Type...',
    '4/14: Determining Discipline Constraints...',
    '5/14: Selecting Phase Templates...',
    '6/14: Generating Dynamic WBS...',
    '7/14: Grouping BOQ Items into Activities...',
    '8/14: Estimating Durations via Productivity Rates...',
    '9/14: Generating Logic & Dependencies...',
    '10/14: Running CPM (Forward & Backward Pass)...',
    '11/14: Clamping to Project Boundaries...',
    '12/14: Executing Financial Reconciliation...',
    '13/14: Validating Differences (= 0.00)...',
    '14/14: Finalizing Baseline Draft...'
  ];

  const handleCreateSchedule = async () => {
    setLoading(true);
    setLoadingStep(0);
    setError('');
    
    // Simulate progression for the UI since it happens in one backend call
    const timer = setInterval(() => {
      setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const res = await fetch(`/api/projects/${project.id}/scheduling/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: project.description || '',
          calendarDays: project.originalContractDuration || 0,
          workDaysConfig: JSON.stringify(workDays),
          importBoq: true,
          consolidateBoq: consolidateBoq
        })
      });

      const data = await res.json();
      clearInterval(timer);
      
      if (!res.ok || !data.success) {
        if (data.stage && data.message) {
          throw new Error(`Failed Stage: [${data.stage}]\nReason: ${data.message} ${data.errorCode ? `(${data.errorCode})` : ''}`);
        }
        throw new Error(data.error || data.message || 'Failed to create schedule');
      }

      onScheduleCreated(data.schedule || data); // pass refresh trigger
    } catch (err: any) {
      clearInterval(timer);
      setError(err.message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '30px' }} className="glass-panel">
      <h2 style={{ color: 'var(--accent-color)', textAlign: 'center', marginBottom: '10px' }}>Schedule Setup Wizard</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Step {step} of 2: Configure Project Schedule Baseline
      </p>

      {error && (
        <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
          <strong>Generation Error</strong>
          <br/><br/>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Schedule Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Working Days Calendar</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <button
                  key={day}
                  onClick={() => toggleWorkDay(day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: workDays.includes(day) ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                    backgroundColor: workDays.includes(day) ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                    color: workDays.includes(day) ? 'var(--accent-color)' : 'var(--text-secondary)'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              onClick={() => setStep(2)}
              style={{ padding: '10px 24px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Next Step: Import BOQ →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Contract BOQ Synchronization</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
              We found <strong>{awardedBoq?.length || 0}</strong> items in the Awarded Bill of Quantities for this project.
            </p>

            <div style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="consolidateBoq" 
                checked={consolidateBoq} 
                onChange={(e) => setConsolidateBoq(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              <label htmlFor="consolidateBoq" style={{ color: 'var(--text-primary)', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>⚡ Consolidate Identical BOQ Items (Recommended)</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Automatically group repetitive contract items into a single Gantt activity (e.g., combining 10 instances of 'Copper Piping' into one master activity). This makes your schedule much cleaner while still tracking 100% of the contract scope.
                </span>
              </label>
            </div>

            {(!awardedBoq || awardedBoq.length === 0) && (
              <div style={{ color: '#ef4444', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', marginTop: '10px' }}>
                Warning: No Awarded BOQ items found. You will need to create activities manually or import them later.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button 
              onClick={() => setStep(1)}
              style={{ padding: '10px 24px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}
            >
              ← Back
            </button>
            <button 
              onClick={handleCreateSchedule}
              disabled={loading}
              style={{ padding: '10px 24px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '250px', justifyContent: 'center' }}
            >
              {loading && <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>}
              {loading 
                ? loadingMessages[loadingStep]
                : 'Create Project Schedule'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
