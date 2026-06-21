'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  width?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px', width = '90%' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div 
        ref={modalRef}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          width: width,
          maxWidth: maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', textShadow: '0 0 10px rgba(0,240,255,0.3)' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .modal-form label {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 5px;
          display: block;
        }
        .modal-form input, .modal-form select, .modal-form textarea {
          width: 100%;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .modal-form input:focus, .modal-form select:focus, .modal-form textarea:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
