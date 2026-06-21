const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('destinationAddress String?')) {
  schema = schema.replace(
    /notes\s+String\?/g,
    'notes              String?\n  destinationAddress String?\n  destinationLat     Float?\n  destinationLng     Float?'
  );
  fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
  console.log('Patched schema');
} else {
  console.log('Already patched');
}
