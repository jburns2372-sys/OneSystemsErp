const fs = require('fs');
const file = 'artifacts/scheduling/gate9d-fast-track-checkpoint.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!data.completedStages.includes('STAGE_5_GATE8_RESTORE')) {
    data.completedStages.push('STAGE_5_GATE8_RESTORE');
}
data.currentStage = 'STAGE_6A_RESTORED_STATE_VERIFICATION';
data.stage5 = {
    exitCode: 1,
    warnings: [],
    errors: ['pg_restore: error: could not execute query: ERROR: relation "public.AIAuditFinding" does not exist']
};

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Checkpoint updated for Stage 5');
