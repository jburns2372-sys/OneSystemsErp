'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createMaterialRequest } from '@/app/actions/mutations';

interface Props {
  projects: { id: string; name: string }[];
  users: { id: string; name: string }[];
}

export default function NewMRButton({ projects, users }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    await createMaterialRequest(formData);
    setIsPending(false);
    setIsOpen(false);
  }

  return (
    <>
      <button 
        className="btn-primary" 
        onClick={() => setIsOpen(true)}
      >
        + New Request
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Material Request">
        <form onSubmit={handleSubmit} className="modal-form">
          <div>
            <label htmlFor="projectId">Project</label>
            <select id="projectId" name="projectId" required>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="requestedById">Requested By</label>
            <select id="requestedById" name="requestedById" required>
              <option value="">-- Select Requester --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="description">Remarks / Description</label>
            <textarea id="description" name="description" rows={3} placeholder="What materials are needed?..." required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : 'Create MR'}
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
