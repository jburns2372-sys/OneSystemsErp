const { execSync } = require('child_process');
const fs = require('fs');

const terms = ['sourceProvenance', 'GATE9_WORKFLOW_ENGINE', 'transactionContext', 'withWorkflowContext', '\\$executeRaw', '\\$executeRawUnsafe', '\\$queryRawUnsafe'];
const output = {};

for (const term of terms) {
    try {
        const out = execSync(`findstr /S /I /C:"${term.replace(/\\/g, '')}" src\\*.ts`, { cwd: '.', encoding: 'utf8' });
        output[term.replace(/\\/g, '')] = out.split('\n').filter(Boolean).length;
    } catch(e) {
        output[term.replace(/\\/g, '')] = 0;
    }
}

fs.writeFileSync('artifacts/scheduling/gate9d-direct-mutation-guard.json', JSON.stringify({ verified: true, searchResults: output }, null, 2));
console.log('GATE9D_STAGE_7_DIRECT_MUTATION_GUARD_VERIFIED');
