import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    // 1. Defect comparison
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const boqs = await prisma.awardedBOQItem.findMany({ where: { projectId }, orderBy: { itemCode: 'asc' } });
    
    const manifestPath = 'artifacts/scheduling/uat-v2-authoritative-boq-preview.json';
    const lines = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const comparison = [];
    for (let i = 0; i < 326; i++) {
        const source = lines[i];
        const persisted = boqs.find(b => b.itemCode === `BOQ-${(i+1).toString().padStart(3, '0')}`);
        
        const sourceAmount = parseFloat(source.amount || '0');
        
        comparison.push({
            itemCode: persisted?.itemCode,
            description: source.description,
            sourceQuantity: source.qty,
            sourceUnitCost: source.unitCost,
            sourceAwardedAmount: sourceAmount,
            persistedDirectCost: persisted?.directCost,
            persistedCombinedUnitCost: persisted?.combinedUnitCost,
            persistedTotalCost: persisted?.totalCost,
            lineDifference: persisted ? (persisted.totalCost - sourceAmount) : null
        });
    }
    
    fs.mkdirSync('artifacts/scheduling', { recursive: true });
    fs.writeFileSync('artifacts/scheduling/uat-v4-gate7d-import-mapping.json', JSON.stringify(comparison, null, 2));
    console.log('Comparison written.');

    // 2. Earliest timestamp for V4
    const earliestAudit = await prisma.auditLog.findFirst({
        where: { moduleName: 'Project Reconstruction' },
        orderBy: { createdAt: 'asc' }
    });
    
    const earliestAssignment = await prisma.projectUserAssignment.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'asc' }
    });
    
    console.log('Earliest AuditLog:', earliestAudit?.createdAt);
    console.log('Earliest Assignment:', earliestAssignment?.createdAt);
}
main().finally(() => prisma.$disconnect());
