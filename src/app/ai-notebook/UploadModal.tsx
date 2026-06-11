'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { uploadReferenceFile } from '../actions/notebookActions';

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const mandatoryFlag = (form.elements.namedItem('mandatoryFlag') as HTMLInputElement).checked;
    formData.append('isMandatory', mandatoryFlag.toString());
    
    const result = await uploadReferenceFile(formData);
    
    setIsUploading(false);
    if (result.success) {
      onClose();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Upload Reference File</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Title</label>
            <input type="text" name="title" className={styles.input} required placeholder="e.g. Master Procurement Policy v2" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>File</label>
            <input type="file" name="file" className={styles.input} required accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reference Category</label>
            <select name="category" className={styles.select} required>
              <option value="">Select a category</option>
              <option value="Awarded BOQ Reference">Awarded BOQ Reference</option>
              <option value="Procurement Policy">Procurement Policy</option>
              <option value="Materials Request Policy">Materials Request Policy</option>
              <option value="Payroll Policy">Payroll Policy</option>
              <option value="Expense Classification Policy">Expense Classification Policy</option>
              <option value="Company Policy">Company Policy</option>
              <option value="Approval Matrix">Approval Matrix</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Target Module (Optional)</label>
            <select name="targetModule" className={styles.select}>
              <option value="">All Modules / General</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Material Request">Material Request</option>
              <option value="Payroll">Payroll</option>
              <option value="Expense Ledger">Expense Ledger</option>
              <option value="Progress Billing">Progress Billing</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <input type="checkbox" id="mandatoryFlag" />
            <label htmlFor="mandatoryFlag" className={styles.label}>
              Mark as Mandatory Reference (AI will strictly enforce this)
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isUploading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
