import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

function findSheet(dir: string, sheetName: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findSheet(fullPath, sheetName);
    } else if (file.toLowerCase().endsWith('.xlsx')) {
      try {
        const wb = xlsx.readFile(fullPath);
        if (wb.SheetNames.includes(sheetName)) {
          console.log(`Found sheet in: ${fullPath}`);
        }
      } catch(e) {}
    }
  }
}

findSheet('.', 'BOQ_Master');
