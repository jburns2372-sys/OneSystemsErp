'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { getDeploymentOptions, getDeployments, requestDeployment, updateDeploymentStatus } from '@/app/actions/equipmentActions';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function DeploymentsClient() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ equipment: [], projects: [], workers: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    equipmentId: '',
    projectId: '',
    driverId: '',
    targetDate: '',
    expectedReturnDate: '',
    purpose: '',
    destinationAddress: '',
    destinationLat: null as number | null,
    destinationLng: null as number | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deps, opts] = await Promise.all([
        getDeployments(),
        getDeploymentOptions()
      ]);
      setDeployments(deps);
      setOptions(opts);
    } catch (err: any) {
      setError(err.message || 'Failed to load deployments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestDeployment(formData);
      setIsModalOpen(false);
      setFormData({ equipmentId: '', projectId: '', driverId: '', targetDate: '', expectedReturnDate: '', purpose: '', destinationAddress: '', destinationLat: null, destinationLng: null });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDeploymentStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLocationSelect = React.useCallback((addr: string, lat: number, lng: number) => {
    setFormData(prev => ({...prev, destinationAddress: addr, destinationLat: lat, destinationLng: lng}));
  }, []);

  const renderColumn = (status: string, title: string, color: string) => {
    const colDeps = deployments.filter(d => d.status === status);
    
    return (
      <div style={{ flex: 1, minWidth: '250px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ color, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: '10px', borderBottom: '1px solid var(--glass-border)' }}>
          {title} <span style={{ background: 'var(--bg-primary)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>{colDeps.length}</span>
        </h3>
        
        {colDeps.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.9rem' }}>No items</div>
        ) : (
          colDeps.map(dep => (
            <div key={dep.id} style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{dep.equipment.code}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(dep.targetDate).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {dep.equipment.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '5px 8px', borderRadius: '4px' }}>
                🏗️ {dep.project.name}
              </div>
              
              <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                {status === 'REQUESTED' && (
                  <button onClick={() => handleStatusUpdate(dep.id, 'APPROVED')} style={{ flex: 1, padding: '5px', background: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Approve</button>
                )}
                {status === 'APPROVED' && (
                  <button onClick={() => handleStatusUpdate(dep.id, 'DISPATCHED')} style={{ flex: 1, padding: '5px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Dispatch</button>
                )}
                {status === 'DISPATCHED' && (
                  <button onClick={() => handleStatusUpdate(dep.id, 'RETURNED')} style={{ flex: 1, padding: '5px', background: 'var(--text-secondary)', color: '#1a1a2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Mark Returned</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Deployments & Transfers</h1>
          <p>Systematic lifecycle management for equipment deployment across all projects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Request Deployment
        </button>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading Engine...</div>
      ) : error ? (
        <div style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--error-color)', padding: '20px', borderRadius: '8px' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
          {renderColumn('REQUESTED', 'Requested', 'var(--warning-color)')}
          {renderColumn('APPROVED', 'Approved', 'var(--accent-color)')}
          {renderColumn('DISPATCHED', 'Dispatched (Active)', 'var(--success-color)')}
          {renderColumn('RETURNED', 'Returned (History)', 'var(--text-secondary)')}
        </div>
      )}

      {/* REQUEST MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>New Deployment Request</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select Equipment *</label>
                <select 
                  required
                  value={formData.equipmentId}
                  onChange={e => setFormData({...formData, equipmentId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Equipment --</option>
                  {options.equipment.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>[{eq.code}] {eq.name} ({eq.status})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target Project *</label>
                <select 
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({...formData, projectId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Project --</option>
                  {options.projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assign Driver/Operator (Optional)</label>
                <select 
                  value={formData.driverId}
                  onChange={e => setFormData({...formData, driverId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                >
                  <option value="">-- No Driver Assigned --</option>
                  {options.workers.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.firstName} {w.lastName} - {w.designation || 'No Designation'}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target Date *</label>
                  <input 
                    type="date" required
                    value={formData.targetDate}
                    onChange={e => setFormData({...formData, targetDate: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Expected Return Date</label>
                  <input 
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Destination Address / Location (Optional)</label>
                <div style={{ width: '100%', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', background: 'var(--bg-primary)' }}>
                  <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search for an address or click on the map to drop a pin:</div>
                  <MapPicker 
                    addressQuery={formData.destinationAddress}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Purpose / Notes</label>
                <textarea 
                  rows={3}
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)', resize: 'none' }}
                  placeholder="Reason for deployment..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
