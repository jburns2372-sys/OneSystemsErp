const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const lines = content.split('\n');
const newLines = lines.map(line => {
  if (line.includes('@relation') && line.includes('fields: [') && line.includes('references: [id]')) {
    // Exclude relations to User to prevent accidental user deletion side effects
    // Usually User is referenced by fields like managerId, approverId, etc.
    if (!line.includes('onDelete:') && !line.includes('fields: [approverId]') && !line.includes('fields: [managerId]') && !line.includes('fields: [loggedById]') && !line.includes('fields: [reviewerId]') && !line.includes('fields: [preparedBy]') && !line.includes('fields: [checkerId]') && !line.includes('fields: [requesterId]')) {
      const refIdx = line.indexOf('references: [id]');
      const endIdx = refIdx + 'references: [id]'.length;
      return line.slice(0, endIdx) + ', onDelete: Cascade' + line.slice(endIdx);
    }
  }
  return line;
});

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
console.log('Done adding cascades to all relations!');
