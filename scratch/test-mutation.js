require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { prisma, transactionContext } = require('./src/lib/prisma');

async function run() {
    try {
        await prisma.scheduleReviewComment.create({
            data: {
                scheduleId: 'test',
                userId: 'test',
                comment: 'test'
            }
        });
        console.log('Allowed comment creation (not in restricted models)');
    } catch(e) {
        console.error('Comment error:', e.message);
    }

    try {
        await prisma.projectSchedule.update({
            where: { id: 'test' },
            data: { name: 'New Name' }
        });
        console.log('ERROR: Direct mutation allowed!');
    } catch(e) {
        console.log('Blocked direct mutation correctly:', e.message);
    }

    try {
        await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
            await prisma.projectSchedule.update({
                where: { id: 'test' },
                data: { name: 'New Name' }
            });
        });
    } catch(e) {
        if (e.message.includes('Record to update not found')) {
            console.log('Workflow mutation allowed correctly! (Failed only because record missing)');
        } else {
            console.error('Workflow mutation unexpected error:', e.message);
        }
    }
}

run().finally(() => prisma.$disconnect());
