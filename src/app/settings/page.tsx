'use client';

import styles from '../projects/page.module.css';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('System settings saved successfully.');
      setLoading(false);
    }, 600);
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
      </div>
    </div>
  );
}
