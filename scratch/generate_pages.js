const fs = require('fs');
const path = require('path');

const modules = [
  { name: 'Awarded BOQ', path: 'awarded-boq' },
  { name: 'BOQ Consolidation', path: 'boq-consolidation' },
  { name: 'AI Command Center', path: 'ai-command-center' },
  { name: 'Inventory', path: 'inventory' },
  { name: 'Material Issuance', path: 'material-issuance' },
  { name: 'Supplier Payables', path: 'supplier-payables' },
  { name: 'Subcontracting', path: 'subcontracting' },
  { name: 'Accomplishments', path: 'accomplishments' },
  { name: 'Progress Billings', path: 'progress-billings' },
  { name: 'Payroll', path: 'payroll' },
  { name: 'Equipment', path: 'equipment' },
  { name: 'Variation Orders', path: 'variation-orders' },
  { name: 'Reports', path: 'reports' },
  { name: 'Documents', path: 'documents' },
  { name: 'Users', path: 'users' },
  { name: 'Settings', path: 'settings' }
];

const basePath = path.join(process.cwd(), 'src', 'app');

modules.forEach(mod => {
  const dirPath = path.join(basePath, mod.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const filePath = path.join(dirPath, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    const content = `import styles from '../page.module.css';

export default function ${mod.name.replace(/ /g, '')}Page() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>${mod.name}</h1>
          <p>This module is currently under construction.</p>
        </div>
      </header>
    </div>
  );
}
`;
    fs.writeFileSync(filePath, content);
    console.log(`Created placeholder for ${mod.name}`);
  }
});
