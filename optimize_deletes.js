const fs = require('fs');

const path = 'src/app/actions/systemResetActions.ts';
let code = fs.readFileSync(path, 'utf8');

const deleteRegex = /await tx\.([a-zA-Z0-9_]+)\.deleteMany\(\{\}\);/g;

let match;
const deletes = [];
while ((match = deleteRegex.exec(code)) !== null) {
  deletes.push(`prisma.${match[1]}.deleteMany({})`);
}

const arrayTransaction = `await prisma.$transaction([\n  ${deletes.join(',\n  ')}\n]);`;

let newCode = code.replace(deleteRegex, '');

const startIdx = newCode.indexOf('await prisma.$transaction(async (tx) => {');
if (startIdx === -1) {
    throw new Error('Interactive transaction not found');
}

newCode = newCode.substring(0, startIdx) + arrayTransaction + '\n\n    ' + newCode.substring(startIdx);

fs.writeFileSync(path, newCode);
console.log('Successfully optimized deletes into a batched transaction!');
