'use client';

import { useState } from 'react';
import styles from './page.module.css';
import AddUserModal from './AddUserModal';

export default function AddUserButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className={styles.primaryButton}
        onClick={() => setIsOpen(true)}
      >
        + Add User
      </button>

      {isOpen && <AddUserModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
