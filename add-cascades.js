const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const lines = content.split('\n');
const newLines = lines.map(line => {
  if (line.includes('references: [id]') && line.includes('fields: [projectId]')) {
    if (!line.includes('onDelete: Cascade')) {
      // Find the position of 'references: [id]'
      const refIdx = line.indexOf('references: [id]');
      const endIdx = refIdx + 'references: [id]'.length;
      return line.slice(0, endIdx) + ', onDelete: Cascade' + line.slice(endIdx);
    }
  }
  return line;
});

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
console.log('Done!');
