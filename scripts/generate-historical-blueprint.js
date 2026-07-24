const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5434/gate7d_verify?schema=public"
        }
    }
});

const PROJECT_ID = 'cmrirhhw30000ic0406v47smb'; // The target project
const EXPECTED_CHECKSUM = '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17';

async function generate() {
    const boqItems = await prisma.awardedBOQItem.findMany({
        where: { projectId: PROJECT_ID },
        orderBy: { id: 'asc' }
    });

    if (boqItems.length !== 326) {
        throw new Error("Expected 326 BOQ items, got " + boqItems.length);
    }

    const phases = [
        { sourceKey: 'PH_1', level: 2, name: 'Mobilization and Site Prep' },
        { sourceKey: 'PH_2', level: 2, name: 'Roughing-ins (Mechanical)' },
        { sourceKey: 'PH_3', level: 2, name: 'Roughing-ins (Electrical)' },
        { sourceKey: 'PH_4', level: 2, name: 'Equipment Installation (Mechanical)' },
        { sourceKey: 'PH_5', level: 2, name: 'Equipment Installation (Electrical)' },
        { sourceKey: 'PH_6', level: 2, name: 'Piping and Ducting Works' },
        { sourceKey: 'PH_7', level: 2, name: 'Wiring and Cabling Works' },
        { sourceKey: 'PH_8', level: 2, name: 'Fixtures and Devices (Mechanical)' },
        { sourceKey: 'PH_9', level: 2, name: 'Fixtures and Devices (Electrical)' },
        { sourceKey: 'PH_10', level: 2, name: 'Finishes and Trims' },
        { sourceKey: 'PH_11', level: 2, name: 'Testing and Commissioning' },
        { sourceKey: 'PH_12', level: 2, name: 'Project Acceptance and Demobilization' }
    ];

    const activities = [
        { sourceKey: 'ACT_1', phaseKey: 'PH_1', name: 'Mobilization and Site Prep', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_2', phaseKey: 'PH_2', name: 'Roughing-ins (Mechanical)', duration: 21, type: 'DRIVING' },
        { sourceKey: 'ACT_3', phaseKey: 'PH_3', name: 'Roughing-ins (Electrical)', duration: 21, type: 'DRIVING' },
        { sourceKey: 'ACT_4', phaseKey: 'PH_4', name: 'Equipment Installation (Mechanical)', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_5', phaseKey: 'PH_5', name: 'Equipment Installation (Electrical)', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_6', phaseKey: 'PH_6', name: 'Piping and Ducting Works', duration: 30, type: 'DRIVING' },
        { sourceKey: 'ACT_7', phaseKey: 'PH_7', name: 'Wiring and Cabling Works', duration: 30, type: 'DRIVING' },
        { sourceKey: 'ACT_8', phaseKey: 'PH_8', name: 'Fixtures and Devices (Mechanical)', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_9', phaseKey: 'PH_9', name: 'Fixtures and Devices (Electrical)', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_10', phaseKey: 'PH_10', name: 'Finishes and Trims', duration: 30, type: 'LOE' },
        { sourceKey: 'ACT_11', phaseKey: 'PH_11', name: 'Testing and Commissioning', duration: 21, type: 'DRIVING' },
        { sourceKey: 'ACT_12', phaseKey: 'PH_12', name: 'Project Acceptance and Demobilization', duration: 14, type: 'DRIVING' },
        { sourceKey: 'ACT_13', phaseKey: 'PH_1', name: 'Project Management & Supervision', duration: 128, type: 'LOE' },
        { sourceKey: 'ACT_14', phaseKey: 'PH_11', name: 'Punchlisting', duration: 21, type: 'DRIVING' }
    ];

    const dependencies = [
        { sourceKey: 'DEP_1', predecessorKey: 'ACT_1', successorKey: 'ACT_2', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_2', predecessorKey: 'ACT_1', successorKey: 'ACT_3', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_3', predecessorKey: 'ACT_2', successorKey: 'ACT_4', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_4', predecessorKey: 'ACT_3', successorKey: 'ACT_5', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_5', predecessorKey: 'ACT_4', successorKey: 'ACT_6', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_6', predecessorKey: 'ACT_5', successorKey: 'ACT_7', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_7', predecessorKey: 'ACT_6', successorKey: 'ACT_8', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_8', predecessorKey: 'ACT_7', successorKey: 'ACT_9', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_9', predecessorKey: 'ACT_8', successorKey: 'ACT_11', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_10', predecessorKey: 'ACT_9', successorKey: 'ACT_11', type: 'FS', lag: 0 },
        { sourceKey: 'DEP_11', predecessorKey: 'ACT_11', successorKey: 'ACT_12', type: 'FS', lag: 0 }
    ];

    const allocations = boqItems.map(item => {
        let targetActivity = '';
        const fullText = ((item.itemCode || '') + ' ' + (item.description || '')).toLowerCase();

        if (fullText.includes('mobilization') || fullText.includes('demobilization') || fullText.includes('bonds') || fullText.includes('insurance') || fullText.includes('temporary') || fullText.includes('project management') || fullText.includes('admin support') || fullText.includes('quality management') || fullText.includes('engineering management') || fullText.includes('site office') || fullText.includes('warehouse') || fullText.includes('barracks') || fullText.includes('safety officer') || fullText.includes('security guards') || fullText.includes('manpower service') || fullText.includes('engineer transportation') || fullText.includes('rugby') || fullText.includes('white tape') || fullText.includes('freon') || fullText.includes('nitrogen') || fullText.includes('mapp gas') || fullText.includes('silver rod') || fullText.includes('water consumption') || fullText.includes('electric consumption') || fullText.includes('permits') || fullText.includes('general requirements') || fullText.includes('health and safety') || fullText.includes('miscellaneous') || fullText.includes('miscelleneuos')) {
          targetActivity = fullText.includes('demobilization') ? 'Project Acceptance and Demobilization' : (fullText.includes('miscellaneous') || fullText.includes('miscelleneuos') ? 'Finishes and Trims' : 'Mobilization and Site Prep');
        } else if (fullText.includes('shopdrawings') || fullText.includes('as-built')) {
          targetActivity = 'Project Acceptance and Demobilization';
        } else if (fullText.includes('roughing-in') || fullText.includes('roughing in') || fullText.includes('conduit') || fullText.includes('chipping & restoration')) {
          if (fullText.includes('electrical') || fullText.includes('metallic flexible conduit') || fullText.includes('wire') || fullText.includes('panel')) {
            targetActivity = 'Roughing-ins (Electrical)';
          } else {
            targetActivity = 'Roughing-ins (Mechanical)';
          }
        } else if (fullText.includes('equipment') || fullText.includes('chiller') || fullText.includes('pump') || fullText.includes('generator') || fullText.includes('transformer') || fullText.includes('panel') || fullText.includes('accu-') || fullText.includes('fcu-') || fullText.includes('concrete pad') || fullText.includes('ecb')) {
          if (fullText.includes('electrical') || fullText.includes('transformer') || fullText.includes('panel') || fullText.includes('ecb')) {
            targetActivity = 'Equipment Installation (Electrical)';
          } else {
            targetActivity = 'Equipment Installation (Mechanical)';
          }
        } else if (fullText.includes('pipe') || fullText.includes('piping') || fullText.includes('duct') || fullText.includes('insulation') || fullText.includes('valve') || fullText.includes('refnet') || fullText.includes('cladding') || fullText.includes('fitting') || fullText.includes('hanger') || fullText.includes('vibration isolator') || fullText.includes('angle bar') || fullText.includes('threaded rod') || fullText.includes('nuts and washer') || fullText.includes('grip anchor') || fullText.includes('copper') || fullText.includes('1/4"') || fullText.includes('3/8"') || fullText.includes('1/2"') || fullText.includes('5/8"') || fullText.includes('3/4"') || fullText.includes('7/8"') || fullText.includes('1-1/8"') || fullText.includes('1-3/8"') || fullText.includes('1-5/8"') || fullText.includes('pvc') || fullText.includes('wye') || fullText.includes('tee') || fullText.includes('elbow') || fullText.includes('cleanout')) {
          targetActivity = 'Piping and Ducting Works';
        } else if (fullText.includes('wire') || fullText.includes('wiring') || fullText.includes('cable') || fullText.includes('cabling') || fullText.includes('tray') || fullText.includes('electrical') || fullText.includes('pullbox') || fullText.includes('thhn') || fullText.includes('imc') || fullText.includes('junction box') || fullText.includes('dp-main') || fullText.includes('pp-')) {
          targetActivity = 'Wiring and Cabling Works';
        } else if (fullText.includes('fixture') || fullText.includes('device') || fullText.includes('grille') || fullText.includes('diffuser') || fullText.includes('fan')) {
          if (fullText.includes('electrical') || fullText.includes('lighting') || fullText.includes('outlet')) {
            targetActivity = 'Fixtures and Devices (Electrical)';
          } else {
            targetActivity = 'Fixtures and Devices (Mechanical)';
          }
        } else if (fullText.includes('finish') || fullText.includes('trim') || fullText.includes('paint')) {
          targetActivity = 'Finishes and Trims';
        } else if (fullText.includes('test') || fullText.includes('commissioning')) {
          targetActivity = 'Testing and Commissioning';
        }

        const act = activities.find(a => a.name === targetActivity);
        if (!act) {
            throw new Error(`Failed to match activity for ${item.itemCode}`);
        }

        return {
            boqItemId: item.id,
            activitySourceKey: act.sourceKey,
            amount: Number(item.totalCost),
        };
    });

    const blueprint = {
        version: "HISTORICAL_VALIDATED_V1",
        provenance: "SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA",
        expectations: {
            scheduleWBSCount: 13,
            scheduleActivityCount: 14,
            scheduleDependencyCount: 11,
            scheduleBOQAllocationCount: 326,
            cpmFinishDate: "2026-10-18",
            allocationTotal: 43106674.89,
            boqChecksum: EXPECTED_CHECKSUM
        },
        wbs: [
            { sourceKey: 'ROOT', level: 1, name: 'Construction Phase' },
            ...phases
        ],
        activities,
        dependencies,
        allocations
    };

    const outPath = path.join(process.cwd(), 'src/lib/scheduling/blueprints/historical-validated-v1.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(blueprint, null, 2));

    console.log("Historical Blueprint Generated.");
}

generate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
