import fs from 'fs';
import path from 'path';

function findFile(dir: string, filename: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFile(fullPath, filename);
    } else if (file.toLowerCase().endsWith('.xlsx')) {
      console.log('Found:', fullPath);
    }
  }
}

findFile('.', '');
