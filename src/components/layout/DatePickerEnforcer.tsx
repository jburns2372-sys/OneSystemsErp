'use client';

import { useEffect } from 'react';

export default function DatePickerEnforcer() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT' && target.type === 'date') {
        try {
          if ('showPicker' in target) {
            target.showPicker();
          }
        } catch (err) {
          // Ignore error (e.g., if called without user gesture somehow, though it's bound to click)
        }
      }
    };

    // Use capturing phase so we catch the click before any stopPropagation might occur
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}
