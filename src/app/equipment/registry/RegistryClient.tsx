'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEquipment } from '@/app/actions/equipmentActions';

export default function RegistryClient({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const [equipmentList, setEquipmentList] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'HEAVY',
    brand: '',
    model: '',
    plateNumber: '',
    ownershipType: 'OWNED',
    hourlyRate: 0,
    fmsDeviceId: '',
    fmsProvider: 'GEOTAB'
  });

  const handleOpenModal = () => {
    const autoCode = `EQ-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData(prev => ({ ...prev, code: autoCode }));
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEq = await createEquipment({
        ...formData,
        fmsDeviceId: formData.fmsDeviceId || null, // Convert empty string to null for unique constraint
      });
      setEquipmentList(prev => [...prev, newEq]);
      setIsModalOpen(false);
      setFormData({
        code: '', name: '', category: 'HEAVY', brand: '', model: '',
        plateNumber: '', ownershipType: 'OWNED', hourlyRate: 0, fmsDeviceId: '', fmsProvider: 'GEOTAB'
      });
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to create equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Equipment List</h2>
        <button 
          style={{
            background: 'var(--accent-color, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={handleOpenModal}
        >
          + Add Equipment
        </button>
      </div>

      {equipmentList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No equipment registered yet.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px' }}>Code</th>
              <th style={{ padding: '12px' }}>Name / Details</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>FMS ID</th>
              <th style={{ padding: '12px' }}>Engine Hrs</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map(eq => (
              <tr key={eq.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{eq.code}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{eq.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {eq.brand} {eq.model} {eq.plateNumber ? `| ${eq.plateNumber}` : ''}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {eq.category.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    color: eq.status === 'ACTIVE' ? '#22c55e' : '#f59e0b',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {eq.status}
                  </span>
                </td>
                <td style={{ padding: '12px', color: eq.fmsDeviceId ? '#3b82f6' : 'var(--text-secondary)' }}>
                  {eq.fmsDeviceId || 'Unlinked'}
                </td>
                <td style={{ padding: '12px' }}>{eq.lastEngineHours?.toFixed(1) || '0.0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Equipment Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
            padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>Register New Equipment</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Basic Details</h4>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Equipment Code (Preassigned)</label>
                <input readOnly name="code" value={formData.code} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', boxSizing: 'border-box', cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Equipment Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Excavator 20 Ton" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }}>
                  <option value="HEAVY">Heavy Equipment</option>
                  <option value="VEHICLE">Fleet Vehicle / Truck</option>
                  <option value="SERVICE_VEHICLE">Service Vehicle</option>
                  <option value="GENERATOR">Generator / Static</option>
                  <option value="TOOLS">Power Tools</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Ownership *</label>
                <select name="ownershipType" value={formData.ownershipType} onChange={handleChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }}>
                  <option value="OWNED">Owned (Company Asset)</option>
                  <option value="RENTED">Rented / Leased</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Specifications</h4>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Brand / Make</label>
                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Caterpillar" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Model</label>
                <input name="model" value={formData.model} onChange={handleChange} placeholder="e.g., 320D L" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Plate / Serial Number</label>
                <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="e.g., ABC-1234" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Internal Hourly Rate (₱)</label>
                <input type="number" step="0.01" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'white', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🛰️</span> FMS Integration (Hardware)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>FMS Provider</label>
                    <select name="fmsProvider" value={formData.fmsProvider} onChange={handleChange} 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'white', boxSizing: 'border-box' }}>
                      <option value="GEOTAB">Geotab</option>
                      <option value="SAMSARA">Samsara</option>
                      <option value="MOTIVE">Motive</option>
                      <option value="OTHER">Other FMS</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>FMS Device ID / VIN</label>
                    <input name="fmsDeviceId" value={formData.fmsDeviceId} onChange={handleChange} placeholder="Device ID for webhook sync" 
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'white', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ background: 'var(--accent-color, #3b82f6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Registering...' : 'Save Equipment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
