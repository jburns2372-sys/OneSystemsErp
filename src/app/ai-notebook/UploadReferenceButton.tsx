'use client';

import { useState } from 'react';
import styles from './page.module.css';
import UploadModal from './UploadModal';

export default function UploadReferenceButton() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <>
      <button 
        className={styles.uploadButton}
        onClick={() => setIsUploadModalOpen(true)}
      >
        <span style={{ fontSize: '1.2rem' }}>+</span> Upload Reference File
      </button>

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </>
  );
}
