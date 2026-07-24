const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5434/gate7d_verify?schema=public"
        }
    }
});

const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';

async function check() {
    const boqItems = await prisma.awardedBOQItem.findMany({
        where: { projectId: PROJECT_ID },
        orderBy: { id: 'asc' }
    });

    for (const item of boqItems) {
        let targetActivity = '';
        const fullText = ((item.itemCode || '') + ' ' + (item.description || '')).toLowerCase();

        if (fullText.includes('mobilization') || fullText.includes('demobilization') || fullText.includes('bonds') || fullText.includes('insurance') || fullText.includes('temporary') || fullText.includes('project management') || fullText.includes('admin support') || fullText.includes('quality management') || fullText.includes('engineering management') || fullText.includes('site office') || fullText.includes('warehouse') || fullText.includes('barracks') || fullText.includes('safety officer') || fullText.includes('security guards') || fullText.includes('manpower service') || fullText.includes('engineer transportation') || fullText.includes('rugby') || fullText.includes('white tape') || fullText.includes('freon') || fullText.includes('nitrogen') || fullText.includes('mapp gas') || fullText.includes('silver rod') || fullText.includes('water consumption') || fullText.includes('electric consumption') || fullText.includes('permits') || fullText.includes('general requirements') || fullText.includes('health and safety') || fullText.includes('miscellaneous') || fullText.includes('miscelleneuos')) {
          targetActivity = 'Found';
        } else if (fullText.includes('shopdrawings') || fullText.includes('as-built')) {
          targetActivity = 'Found';
        } else if (fullText.includes('roughing-in') || fullText.includes('roughing in') || fullText.includes('conduit') || fullText.includes('chipping & restoration')) {
          targetActivity = 'Found';
        } else if (fullText.includes('equipment') || fullText.includes('chiller') || fullText.includes('pump') || fullText.includes('generator') || fullText.includes('transformer') || fullText.includes('panel') || fullText.includes('accu-') || fullText.includes('fcu-') || fullText.includes('concrete pad') || fullText.includes('ecb')) {
          targetActivity = 'Found';
        } else if (fullText.includes('pipe') || fullText.includes('piping') || fullText.includes('duct') || fullText.includes('insulation') || fullText.includes('valve') || fullText.includes('refnet') || fullText.includes('cladding') || fullText.includes('fitting') || fullText.includes('hanger') || fullText.includes('vibration isolator') || fullText.includes('angle bar') || fullText.includes('threaded rod') || fullText.includes('nuts and washer') || fullText.includes('grip anchor') || fullText.includes('copper')) {
          targetActivity = 'Found';
        } else if (fullText.includes('wire') || fullText.includes('wiring') || fullText.includes('cable') || fullText.includes('cabling') || fullText.includes('tray') || fullText.includes('electrical') || fullText.includes('pullbox')) {
          targetActivity = 'Found';
        } else if (fullText.includes('fixture') || fullText.includes('device') || fullText.includes('grille') || fullText.includes('diffuser') || fullText.includes('fan')) {
          targetActivity = 'Found';
        } else if (fullText.includes('finish') || fullText.includes('trim') || fullText.includes('paint')) {
          targetActivity = 'Found';
        } else if (fullText.includes('test') || fullText.includes('commissioning')) {
          targetActivity = 'Found';
        }

        if (targetActivity === '') {
            console.log("Unclassified:", item.itemCode, item.description);
        }
    }
}
check().finally(() => prisma.$disconnect());
