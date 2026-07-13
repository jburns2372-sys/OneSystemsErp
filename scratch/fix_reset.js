const fs = require('fs');
const backendPath = 'apps/aws-backend/src/routes/systemResetActions.ts';
const frontendPath = 'src/app/actions/systemResetActions.ts';

const backendCode = fs.readFileSync(backendPath, 'utf8');
let frontendCode = fs.readFileSync(frontendPath, 'utf8');

const startIdx = backendCode.indexOf('await prisma.$transaction(async (tx) => {');
const endIdx = backendCode.indexOf('timeout: 60000', startIdx);
const endStr = backendCode.substring(endIdx, backendCode.indexOf('});', endIdx) + 3);

const transactionCode = backendCode.substring(startIdx, endIdx) + endStr;

// Find start and end strictly!
const fetchStartStr = '    const response = await fetchWithAuth(';
const fetchStartIdx = frontendCode.indexOf(fetchStartStr);
if (fetchStartIdx === -1) throw new Error("fetchStartIdx not found");

const fetchEndStr = "Failed to reset transaction data');";
const fetchEndIdx = frontendCode.indexOf(fetchEndStr, fetchStartIdx);
if (fetchEndIdx === -1) throw new Error("fetchEndIdx not found");

// include the closing bracket
const closingBracketIdx = frontendCode.indexOf('}', fetchEndIdx);

const codeToReplace = frontendCode.substring(fetchStartIdx, closingBracketIdx + 1);

const replacementCode = `    if (!sessionId) throw new Error('Unauthorized');
    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    const userCount = await prisma.user.count();
    if (userCount > 0 && currentUser?.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized Action: Only SUPER_ADMIN can perform a master reset.');
    }
    
    ${transactionCode.replace(/currentUser\.id/g, 'currentUser ? currentUser.id : "system"')}`;

frontendCode = frontendCode.replace(codeToReplace, replacementCode);

fs.writeFileSync(frontendPath, frontendCode);
console.log('Successfully injected!');
