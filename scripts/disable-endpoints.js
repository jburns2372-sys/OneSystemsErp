const fs = require('fs');
const path = require('path');

const content = `import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Reconstruction endpoints are disabled (Gate 7C-1 Completed)' }, { status: 410 });
}
`;

const dirs = [
  'adopt-project',
  'approve-variance',
  'assign-actors',
  'import-boq',
  'lock-boq'
];

dirs.forEach(dir => {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'internal', 'reconstruction', dir, 'route.ts');
  fs.writeFileSync(filePath, content);
  console.log(`Disabled ${dir}`);
});
