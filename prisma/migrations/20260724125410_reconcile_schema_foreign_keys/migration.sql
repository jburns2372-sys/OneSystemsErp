-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ScheduleWorkflowTransition_scheduleId_action_idempotencyKeyHash" RENAME TO "ScheduleWorkflowTransition_scheduleId_action_idempotencyKey_key";
