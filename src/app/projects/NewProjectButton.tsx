'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createProject } from '@/app/actions/mutations';

export default function NewProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

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
