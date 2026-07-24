SELECT COUNT(*) as project_boq FROM "ProjectBOQVersion";
SELECT COUNT(*) as awarded_boq FROM "AwardedBOQItem";
SELECT COUNT(*) as schedules FROM "ProjectSchedule";
SELECT status, "lockedById", "checksum" FROM "ProjectBOQVersion" LIMIT 1;
