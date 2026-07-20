const fs = require('fs');
let schema = fs.readFileSync('temp_sqlite/schema.prisma', 'utf8');
schema = schema.replace(/output\s*=\s*"[^"]*"/g, '');
schema = schema.replace(/url\s*=\s*"[^"]*"/g, 'url = "file:./dev.db"');
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully.');
