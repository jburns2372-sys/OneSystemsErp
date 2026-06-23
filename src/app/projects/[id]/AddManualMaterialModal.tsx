'use client';

import { useState } from 'react';
import { addManualConsolidatedItem } from '@/app/actions/consolidation';

interface AddManualMaterialModalProps {
  projectId: string;
  onClose: () => void;
}

export default function AddManualMaterialModal({ projectId, onClose }: AddManualMaterialModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    unit: 'lot',
    quantity: 1,
    unitCost: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unitCost' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addManualConsolidatedItem({
        projectId,
        ...formData
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add manual item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        backgroundColor: '#1e293b', padding: '30px',
        borderRadius: '12px', width: '90%', maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        border: '1px solid var(--glass-border)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#fff' }}>Add Manual Material</h2>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Item Code (Optional)</label>
            <input 
              type="text" 
              name="itemCode" 
              value={formData.itemCode} 
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. C001"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              className="form-input"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Unit</label>
              <input 
                type="text" 
                name="unit" 
                value={formData.unit} 
                onChange={handleChange}
                className="form-input"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Quantity</label>
              <input 
                type="number" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange}
                className="form-input"
                step="any"
                min="0"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#cbd5e1' }}>Unit Cost (₱)</label>
            <input 
              type="number" 
              name="unitCost" 
              value={formData.unitCost} 
              onChange={handleChange}
              className="form-input"
              step="any"
              min="0"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, var(--accent-color) 0%, #0891b2 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
