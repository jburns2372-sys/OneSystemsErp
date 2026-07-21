import fs from 'fs';
import path from 'path';

function findFiles(dir: string, pattern: RegExp): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

const apiRoutes = findFiles(path.join(process.cwd(), 'src', 'app', 'api'), /route\.tsx?$/);
const serverActions = findFiles(path.join(process.cwd(), 'src', 'app'), /actions\.tsx?$/);
const libActions = findFiles(path.join(process.cwd(), 'src', 'lib', 'actions'), /\.tsx?$/);

console.log('--- GATE 2 INVENTORY ---');
console.log(`Discovered API Routes: ${apiRoutes.length}`);
console.log(`Discovered App Actions: ${serverActions.length}`);
console.log(`Discovered Lib Actions: ${libActions.length}`);

let totalEndpoints = apiRoutes.length + serverActions.length + libActions.length;
console.log(`Total Handlers: ${totalEndpoints}`);

const mdReport = `
# GATE 2 INVENTORY REPORT

Total API Routes: ${apiRoutes.length}
Total Action Files: ${serverActions.length + libActions.length}

## API Routes
${apiRoutes.map(p => `- ${p.replace(process.cwd(), '')}`).join('\n')}

## Server Actions
${serverActions.concat(libActions).map(p => `- ${p.replace(process.cwd(), '')}`).join('\n')}
`;

fs.writeFileSync('gate2-inventory-report.md', mdReport);
console.log('Saved to gate2-inventory-report.md');
