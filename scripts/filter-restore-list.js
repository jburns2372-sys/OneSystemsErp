const fs = require('fs');

const lines = fs.readFileSync('artifacts/scheduling/uat-v4-r6-gate7-restore-list-full.txt', 'utf16le')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.length > 0 && !l.startsWith(';'));

console.log('Total objects (excluding comments):', lines.length);

const exclusions = [];
const filteredList = [];

for (const line of lines) {
  if (line.includes(' neon_auth ') || line.includes(' neon_auth_')) {
    exclusions.push({ object: line, reason: 'neon_auth internal schema/data', compatibility: 'N/A', dependencies: 'none' });
    continue;
  }
  
  if (line.includes(' _prisma_migrations ')) {
    exclusions.push({ object: line, reason: '_prisma_migrations omitted to preserve history reconciliation', compatibility: 'N/A', dependencies: 'none' });
    continue;
  }

  if (line.includes(' ScheduleBOQMapping ')) {
    exclusions.push({ object: line, reason: 'ScheduleBOQMapping is retired in V4 schema', compatibility: 'Incompatible', dependencies: 'none' });
    continue;
  }
  
  if (line.includes(' TABLE DATA ') || line.includes(' SEQUENCE SET ')) {
    filteredList.push(line);
  } else {
    exclusions.push({ object: line, reason: 'Schema definition, constraint, index, or privilege object. Restore is data-only.', compatibility: 'V4 Schema Preserved', dependencies: 'none' });
  }
}

// Write the filtered list using ascii/utf8 so pg_restore can read it.
fs.writeFileSync('artifacts/scheduling/uat-v4-r6-gate7-restore-list.txt', filteredList.join('\n'), 'utf8');
fs.writeFileSync('artifacts/scheduling/uat-v4-r6-gate7-restore-exclusions.json', JSON.stringify(exclusions, null, 2), 'utf8');

console.log('Filtered data objects:', filteredList.length);
console.log('Excluded objects:', exclusions.length);
