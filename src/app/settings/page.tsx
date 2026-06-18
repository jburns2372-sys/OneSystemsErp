'use client';

import styles from '../projects/page.module.css';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { resetTransactionData, getCurrentUserRole } from '@/app/actions/systemResetActions';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserRole().then(role => setUserRole(role));
  }, []);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('System settings saved successfully.');
      setLoading(false);
    }, 600);
  };

  const handleReset = async () => {
    if (resetConfirmation !== 'RESET TRANSACTION DATA ONLY') {
      toast.error('Invalid confirmation text.');
      return;
    }
    
    setResetLoading(true);
    const result = await resetTransactionData(resetConfirmation);
    
    if (result.success) {
      toast.success('Transactional data has been successfully cleared. Users, roles, permissions, database structure, and system settings were preserved.', { duration: 10000 });
      setIsResetModalOpen(false);
      setResetConfirmation('');
      // Force refresh to clear any cached layout data
      setTimeout(() => window.location.reload(), 2000);
    } else {
      toast.error(result.error || 'Failed to reset transaction data.');
    }
    setResetLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>System Settings</h1>
          <p>Configure application parameters and global variables.</p>
        </div>
        <button 
          className={styles.primaryButton} 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className={styles.tableContainer} style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>General Configuration</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Company Name</label>
            <input type="text" defaultValue="JEJORS CONSTRUCTION CORPORATION" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Default Currency</label>
            <select style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="PHP">PHP (₱)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>System Theme</label>
            <select style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="dark">High-Tech Dark</option>
              <option value="light">Corporate Light (Coming Soon)</option>
            </select>
          </div>
        </div>

        {/* DANGER ZONE */}
        {userRole === 'SYSTEM_ADMIN' && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', maxWidth: '600px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span> Danger Zone
          </h2>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Master Reset</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              Safely remove seeded data and transactional records so the app starts from scratch. 
              <strong> Knowledge Center Rules, SOPs, AI Validations, and User accounts will be PROTECTED and preserved.</strong>
            </p>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Master Reset
            </button>
          </div>
        </div>
        )}
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Caution: Master Reset</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
              <strong>WARNING:</strong> This action will erase all existing data entries, including projects, POs, MRFs, payroll, expenses, and seeded data. 
              You will be starting entirely from scratch. Master data, User accounts, and Knowledge Center configurations will be protected.
            </p>
            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '600' }}>
              To confirm, please type exactly: <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>RESET TRANSACTION DATA ONLY</span>
            </p>
            
            <input 
              type="text" 
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
              placeholder="RESET TRANSACTION DATA ONLY"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '6px', 
                border: '1px solid var(--glass-border)', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                fontSize: '1rem'
              }} 
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmation('');
                }}
                disabled={resetLoading}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReset}
                disabled={resetLoading || resetConfirmation !== 'RESET TRANSACTION DATA ONLY'}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: (resetLoading || resetConfirmation !== 'RESET TRANSACTION DATA ONLY') ? 'not-allowed' : 'pointer',
                  opacity: (resetLoading || resetConfirmation !== 'RESET TRANSACTION DATA ONLY') ? 0.5 : 1
                }}
              >
                {resetLoading ? 'Clearing Data...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
