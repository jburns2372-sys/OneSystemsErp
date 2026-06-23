'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { createProject } from '@/app/actions/mutations';

export default function NewProjectButton({ users }: { users?: {id: string, name: string}[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [startDate, setStartDate] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number | ''>('');

  const computedCompletionDate = useMemo(() => {
    if (!startDate || !durationDays) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + Number(durationDays));
    return date.toISOString().split('T')[0];
  }, [startDate, durationDays]);

  const openModal = () => {
    setIsOpen(true);
    setIsPending(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setIsPending(false);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createProject(formData);
      setIsOpen(false);
    } catch (error: any) {
      alert("Error: " + error.message);
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button 
        className="btn-primary" 
        onClick={openModal}
      >
        + New Project
      </button>

      <Modal isOpen={isOpen} onClose={closeModal} title="Upload Awarded BOQ">
        <form onSubmit={handleSubmit} className="modal-form" encType="multipart/form-data">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The system will automatically analyze your Excel file to extract the Project Name, Location, and compute the Total Contract Amount.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project Manager</label>
                <select name="managerId" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}>
                  <option value="">Unassigned</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project Start Date</label>
                  <input type="date" name="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Duration (Calendar Days)</label>
                  <input type="number" name="durationDays" value={durationDays} onChange={e => setDurationDays(e.target.value ? Number(e.target.value) : '')} min={1} required style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Computed Completion Date</label>
                <input type="date" value={computedCompletionDate} readOnly style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', colorScheme: 'dark' }} />
              </div>
            </div>

            <div style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '8px', 
              padding: '40px 20px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <label htmlFor="boqFile" style={{ display: 'block', fontSize: '1.2rem', marginBottom: '15px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Select Excel File (.xlsx)
              </label>
              <input 
                type="file" 
                id="boqFile" 
                name="boqFile" 
                accept=".xlsx, .xls, .csv" 
                required 
                style={{
                  display: 'block',
                  margin: '0 auto',
                  color: 'var(--text-secondary)'
                }}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Analyzing & Creating Project...' : 'Upload & Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .btn-primary {
          background-color: var(--accent-color);
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 0 10px var(--accent-glow);
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-secondary {
          background-color: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--glass-border);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
      `}</style>
    </>
  );
}
