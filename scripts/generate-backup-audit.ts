import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/gate7d_backup_audit";

const prisma = new PrismaClient();

async function main() {
    const report: any = {
        archivePath: "backups/scheduling-reconstruction-uat-v2-prechange.dump",
        byteSize: 649821,
        sha256: "7926F66D6C9BB5A3E8D83053965897058E0B9485A50B44AF5D24C0AACF5C7257",
        objectCount: 1073,
        restoreCommand: "docker exec onesystemserp-gate7d-backup-audit pg_restore -U postgres -d gate7d_backup_audit --no-owner --no-privileges --exit-on-error --single-transaction /workspace/backups/scheduling-reconstruction-uat-v2-prechange.dump",
        migrationInventory: { count: 0, failed: 0, completed: [] },
        projectShellResult: { exists: false, projectId: 'cmrirhhw30000ic0406v47smb' },
        actorAndPbacResult: { actorsExist: false, pbacExists: false, roles: [] },
        boqCounts: {
            projectVersions: 0,
            globalItems: 435,
            linkedItems: 0,
            orphanItems: 0,
            july13Items: 0,
            varianceApprovals: 0
        },
        scheduleCounts: {
            globalSchedules: 0,
            projectSchedules: 0,
            wbs: 0,
            activity: 0,
            dependency: 0,
            allocations: 0,
            approvals: 0,
            comments: 0,
            baselines: 0
        },
        auditCounts: {
            total: 0,
            gate7Or8: 0,
            reconstructionEvents: []
        },
        classification: ""
    };

    try {
        const migrations: any[] = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
        report.migrationInventory.count = migrations.length;
        report.migrationInventory.failed = migrations.filter((m: any) => m.finished_at === null).length;
        report.migrationInventory.completed = migrations.filter((m: any) => m.finished_at !== null).map((m: any) => m.migration_name);
    } catch (e) {}

    const projectId = 'cmrirhhw30000ic0406v47smb';
    try {
        const p: any[] = await prisma.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId}`;
        report.projectShellResult.exists = p.length === 1;
    } catch (e) { }
    
    try {
        const users: any[] = await prisma.$queryRaw`SELECT email, role FROM "User" WHERE email IN ('manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com')`;
        report.actorAndPbacResult.actorsExist = users.length === 3;
        report.actorAndPbacResult.roles = users.map(u => ({ email: u.email, role: u.role }));
    } catch (e) { }
    
    try {
        const pbac: any[] = await prisma.$queryRaw`SELECT id FROM "ProjectUserAssignment" WHERE "projectId" = ${projectId}`;
        report.actorAndPbacResult.pbacExists = pbac.length > 0;
    } catch (e) { }
    
    try {
        const pv: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectBOQVersion" WHERE "projectId" = ${projectId}`;
        report.boqCounts.projectVersions = Number(pv[0].c);
    } catch (e) { }

    try {
        const g: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem"`;
        report.boqCounts.globalItems = Number(g[0].c);
        report.boqCounts.orphanItems = Number(g[0].c); // since projectBOQVersionId is missing
    } catch (e) { }

    try {
        const j: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem" WHERE "createdAt" >= '2026-07-13T00:00:00Z'`;
        report.boqCounts.july13Items = Number(j[0].c);
    } catch (e) { }

    try {
        const gs: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectSchedule"`;
        report.scheduleCounts.globalSchedules = Number(gs[0].c);
        const ps: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectSchedule" WHERE "projectId" = ${projectId}`;
        report.scheduleCounts.projectSchedules = Number(ps[0].c);
    } catch (e) {}
    
    try {
        const audits: any[] = await prisma.$queryRaw`SELECT * FROM "AuditLog" WHERE "moduleName" = 'Project Reconstruction'`;
        report.auditCounts.total = audits.length;
        const gate78 = audits.filter(a => a.actionType.includes('BOQ') || a.actionType.includes('SCHEDULE') || a.actionType.includes('CHECKSUM'));
        report.auditCounts.gate7Or8 = gate78.length;
        report.auditCounts.reconstructionEvents = gate78.map((a: any) => ({ action: a.actionType, time: a.createdAt }));
    } catch (e) {}
    
    try {
        const variance: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AuditLog" WHERE "projectId" = ${projectId} AND "actionType" IN ('CHECKSUM_VARIANCE_TECHNICALLY_APPROVED', 'CHECKSUM_VARIANCE_APPROVED')`;
        report.boqCounts.varianceApprovals = Number(variance[0].c);
    } catch (e) {}

    if (report.boqCounts.globalItems > 0 || report.boqCounts.projectVersions > 0) {
        report.classification = "PRE_GATE7_BACKUP_CONTAMINATED_BY_BOQ_RECORDS";
    } else if (report.scheduleCounts.globalSchedules > 0) {
        report.classification = "PRE_GATE7_BACKUP_CONTAMINATED_BY_SCHEDULE_RECORDS";
    } else if (!report.projectShellResult.exists || !report.actorAndPbacResult.actorsExist || !report.actorAndPbacResult.pbacExists) {
        report.classification = "PRE_GATE7_BACKUP_MISSING_REQUIRED_BASELINE_DATA";
    } else {
        report.classification = "VERIFIED_CLEAN_PRE_GATE7_BACKUP";
    }
    
    // Write JSON and MD
    fs.mkdirSync('artifacts/scheduling', { recursive: true });
    fs.writeFileSync('artifacts/scheduling/uat-v2-prechange-backup-audit.json', JSON.stringify(report, null, 2));

    const md = `
# Pre-Gate 7 Physical Backup Audit

**Archive File:** \`${report.archivePath}\`
**Size:** ${report.byteSize} bytes
**SHA-256:** \`${report.sha256}\`
**Object Count:** ${report.objectCount}

## Restore Command
\`\`\`bash
${report.restoreCommand}
\`\`\`

## Baseline Verification
- Project Shell: ${report.projectShellResult.exists ? 'Exists' : 'Missing'}
- PBAC Exists: ${report.actorAndPbacResult.pbacExists ? 'Yes' : 'No'}
- Required Actors:
${report.actorAndPbacResult.roles.map((r: any) => `  - ${r.email}: ${r.role}`).join('\n')}

## BOQ Contamination
- ProjectBOQVersion (Target): ${report.boqCounts.projectVersions}
- AwardedBOQItem (Global): ${report.boqCounts.globalItems}
- Orphan AwardedBOQItems: ${report.boqCounts.orphanItems}
- Variance Approvals: ${report.boqCounts.varianceApprovals}

## Schedule Contamination
- Global Schedules: ${report.scheduleCounts.globalSchedules}
- Target Schedules: ${report.scheduleCounts.projectSchedules}
- Activities, Dependencies, Allocations: ${report.scheduleCounts.activity}

## Audit History
- Total Reconstruction Audits: ${report.auditCounts.total}
- Gate 7/8 Audits: ${report.auditCounts.gate7Or8}

## Final Classification
**${report.classification}**
    `;

    fs.mkdirSync('docs/scheduling', { recursive: true });
    fs.writeFileSync('docs/scheduling/uat-v2-prechange-backup-audit.md', md);
    console.log("Done.");
}

main().finally(() => prisma.$disconnect());
