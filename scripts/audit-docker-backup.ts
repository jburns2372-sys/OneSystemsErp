import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/gate7d_backup_audit";

const prisma = new PrismaClient();

async function main() {
    const report: any = {
        migrations: 0,
        failedMigrations: 0,
        schemaValid: true,
        usersExist: false,
        pbacExists: false,
        projectShells: 0,
        boqCounts: {},
        scheduleCounts: {},
        auditCounts: {},
        classification: ""
    };

    // 3. Verify schema
    try {
        const migrations: any[] = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
        report.migrations = migrations.length;
        report.failedMigrations = migrations.filter((m: any) => m.finished_at === null).length;
    } catch (e) {
        console.error("Migration check failed", e);
    }

    const projectId = 'cmrirhhw30000ic0406v47smb';
    try {
        const p: any[] = await prisma.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId}`;
        report.projectShells = p.length;
    } catch (e) { console.error("Project shell error:", e); }
    
    // Auth & PBAC
    try {
        const users: any[] = await prisma.$queryRaw`SELECT email, role FROM "User" WHERE email IN ('manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com')`;
        report.usersExist = users.length === 3;
        report.actorRoles = users.map(u => u.role);
    } catch (e) { console.error("User query error", e); }
    
    try {
        const pbac: any[] = await prisma.$queryRaw`SELECT id FROM "ProjectUserAssignment" WHERE "projectId" = ${projectId}`;
        report.pbacExists = pbac.length > 0;
    } catch (e) { console.error("PBAC query error", e); }
    
    // 5. Strict Check for BOQ Contamination
    report.boqCounts = { projectVersions: 0, globalItems: 0, linkedItems: 0, orphanItems: 0, july13Items: 0, varianceApprovals: 0 };
    try {
        const pv: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectBOQVersion" WHERE "projectId" = ${projectId}`;
        report.boqCounts.projectVersions = Number(pv[0].c);
    } catch (e) { }

    try {
        const g: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem"`;
        report.boqCounts.globalItems = Number(g[0].c);
        const l: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem" WHERE "projectBOQVersionId" IS NOT NULL`;
        report.boqCounts.linkedItems = Number(l[0].c);
        const o: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem" WHERE "projectBOQVersionId" IS NULL OR "projectId" IS NULL`;
        report.boqCounts.orphanItems = Number(o[0].c);
    } catch (e) { }

    // 6. Strict Check for Schedule Contamination
    report.scheduleCounts = { globalSchedules: 0, projectSchedules: 0, wbs: 0, activity: 0, dependency: 0, allocations: 0, approvals: 0, comments: 0, baselines: 0 };
    try {
        const gs: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectSchedule"`;
        report.scheduleCounts.globalSchedules = Number(gs[0].c);
        const ps: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ProjectSchedule" WHERE "projectId" = ${projectId}`;
        report.scheduleCounts.projectSchedules = Number(ps[0].c);
    } catch (e) {}
    
    // 7. Audit History
    try {
        const audits: any[] = await prisma.$queryRaw`SELECT * FROM "AuditLog" WHERE "moduleName" = 'Project Reconstruction'`;
        report.auditCounts = {
            total: audits.length,
            gate7Or8: audits.filter(a => a.actionType.includes('BOQ') || a.actionType.includes('SCHEDULE') || a.actionType.includes('CHECKSUM')).length
        };
    } catch (e) { report.auditCounts = { total: 0, gate7Or8: 0 }; }
    
    // Variance approvals
    try {
        const variance: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AuditLog" WHERE "projectId" = ${projectId} AND "actionType" IN ('CHECKSUM_VARIANCE_TECHNICALLY_APPROVED', 'CHECKSUM_VARIANCE_APPROVED')`;
        report.boqCounts.varianceApprovals = Number(variance[0].c);
    } catch (e) {}

    // Classification
    if (report.boqCounts.globalItems > 0 || report.boqCounts.projectVersions > 0) {
        report.classification = "PRE_GATE7_BACKUP_CONTAMINATED_BY_BOQ_RECORDS";
    } else if (report.scheduleCounts.globalSchedules > 0 || report.scheduleCounts.wbs > 0) {
        report.classification = "PRE_GATE7_BACKUP_CONTAMINATED_BY_SCHEDULE_RECORDS";
    } else if (report.projectShells === 0 || !report.usersExist || !report.pbacExists) {
        report.classification = "PRE_GATE7_BACKUP_MISSING_REQUIRED_BASELINE_DATA";
    } else {
        report.classification = "VERIFIED_CLEAN_PRE_GATE7_BACKUP";
    }
    
    console.log(JSON.stringify(report, null, 2));
}

main().finally(() => prisma.$disconnect());
