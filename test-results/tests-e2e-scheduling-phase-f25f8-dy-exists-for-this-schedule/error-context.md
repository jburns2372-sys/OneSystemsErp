# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\scheduling\phase3d-d-recovery-b1.spec.ts >> Phase 3D-D Recovery B1: Service Hardening >> should block if authoritative activation already exists for this schedule
- Location: tests\e2e\scheduling\phase3d-d-recovery-b1.spec.ts:307:7

# Error details

```
PrismaClientValidationError: 
Invalid `prisma.baselineActivation.create()` invocation in
C:\Users\user\Documents\JD SOFTWARE PROJECTS\OneSystemsErp\PGH-PMS_saved 06-11-2026_11pm\tests\e2e\scheduling\phase3d-d-recovery-b1.spec.ts:308:37

  305 });
  306 
  307 test('should block if authoritative activation already exists for this schedule', async () => {
→ 308   await prisma.baselineActivation.create({
          data: {
            scheduleId: "cmrk57nba003dvcmgqyp812l9",
            activatedById: "cmrk55jub0000vcmgidmzvuyr",
            idempotencyKey: "existing",
            requestId: "existing",
            isAuthoritative: true,
            reviewRound: 1,
            revisionCode: "BL-001",
        +   validationSnapshot: JsonNullValueInput | Json
          }
        })

Argument `validationSnapshot` is missing.
```

# Test source

```ts
  208 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  209 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  210 |     await prisma.scheduleApproval.updateMany({
  211 |       where: { scheduleId: testSchedule.id, approvalStage: 'TECHNICAL' },
  212 |       data: { scheduleSnapshotHash: val.hash }
  213 |     });
  214 |     await prisma.projectSchedule.update({ 
  215 |       where: { id: testSchedule.id }, 
  216 |       data: { 
  217 |         rowVersion: 1,
  218 |         workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL
  219 |       } 
  220 |     });
  221 | 
  222 |     const payload = {
  223 |       operation: 'activateScheduleBaseline',
  224 |       projectId: testProject.id,
  225 |       scheduleId: testSchedule.id,
  226 |       actorId: testActor.id,
  227 |       expectedRowVersion: 1
  228 |     };
  229 |     const key = generateIdempotencyKey();
  230 |     const fp = generateFingerprint(payload);
  231 | 
  232 |     // First call
  233 |     await activateScheduleBaseline({ ...payload, idempotencyKey: key, requestFingerprint: fp });
  234 |     
  235 |     // Retry call
  236 |     const result2 = await activateScheduleBaseline({ ...payload, idempotencyKey: key, requestFingerprint: fp });
  237 | 
  238 |     expect(result2.workflowStatus).toBe(ProjectScheduleWorkflowStatus.ACTIVE_BASELINE);
  239 |     
  240 |     const activations = await prisma.baselineActivation.findMany({ where: { scheduleId: testSchedule.id } });
  241 |     expect(activations.length).toBe(1); // Still exactly one record
  242 |   });
  243 | 
  244 |   test('should block conflicting idempotency fingerprint', async () => {
  245 |     // Setup valid hash
  246 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  247 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  248 |     await prisma.scheduleApproval.updateMany({
  249 |       where: { scheduleId: testSchedule.id, approvalStage: 'TECHNICAL' },
  250 |       data: { scheduleSnapshotHash: val.hash }
  251 |     });
  252 |     await prisma.projectSchedule.update({ 
  253 |       where: { id: testSchedule.id }, 
  254 |       data: { 
  255 |         rowVersion: 1,
  256 |         workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL
  257 |       } 
  258 |     });
  259 | 
  260 |     const payload = {
  261 |       operation: 'activateScheduleBaseline',
  262 |       projectId: testProject.id,
  263 |       scheduleId: testSchedule.id,
  264 |       actorId: testActor.id,
  265 |       expectedRowVersion: 1
  266 |     };
  267 |     const key = generateIdempotencyKey();
  268 |     const fp1 = generateFingerprint(payload);
  269 |     
  270 |     // First call
  271 |     await activateScheduleBaseline({ ...payload, idempotencyKey: key, requestFingerprint: fp1 });
  272 |     
  273 |     // Retry call with different fingerprint
  274 |     const fp2 = generateFingerprint({ ...payload, expectedRowVersion: 999 });
  275 | 
  276 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: key, requestFingerprint: fp2 })).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
  277 |   });
  278 | 
  279 |   test('should block if schedule not found', async () => {
  280 |     const payload = {
  281 |       operation: 'activateScheduleBaseline',
  282 |       projectId: testProject.id,
  283 |       scheduleId: 'invalid-id',
  284 |       actorId: testActor.id,
  285 |       expectedRowVersion: 1
  286 |     };
  287 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('SCHEDULE_NOT_FOUND');
  288 |   });
  289 | 
  290 |   test('should block if already active baseline', async () => {
  291 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { workflowStatus: ProjectScheduleWorkflowStatus.ACTIVE_BASELINE } });
  292 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  293 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('SCHEDULE_ALREADY_ACTIVE');
  294 |   });
  295 | 
  296 |   test('should block if invalid workflow status', async () => {
  297 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { workflowStatus: ProjectScheduleWorkflowStatus.AI_GENERATED_DRAFT } });
  298 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  299 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('INVALID_WORKFLOW_TRANSITION');
  300 |   });
  301 | 
  302 |   test('should block if rowVersion mismatch', async () => {
  303 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 999 };
  304 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('SCHEDULE_VERSION_CONFLICT');
  305 |   });
  306 | 
  307 |   test('should block if authoritative activation already exists for this schedule', async () => {
> 308 |     await prisma.baselineActivation.create({
      |                                     ^ PrismaClientValidationError: 
  309 |       data: { scheduleId: testSchedule.id, activatedById: testActor.id, idempotencyKey: 'existing', requestId: 'existing', isAuthoritative: true, reviewRound: 1, revisionCode: 'BL-001' }
  310 |     });
  311 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  312 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('AUTHORITATIVE_ACTIVATION_ALREADY_EXISTS');
  313 |   });
  314 | 
  315 |   test('should block if validation fails (e.g. financial mismatch)', async () => {
  316 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { scheduledAmount: 500000 } });
  317 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  318 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('VALIDATION_FAILED_DURING_ACTIVATION');
  319 |   });
  320 | 
  321 |   test('should block if missing technical approval for current review round', async () => {
  322 |     await prisma.scheduleApproval.deleteMany({ where: { scheduleId: testSchedule.id } });
  323 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  324 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('MISSING_TECHNICAL_APPROVAL_FOR_CURRENT_ROUND');
  325 |   });
  326 | 
  327 |   test('should block if schedule snapshot hash mismatch', async () => {
  328 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  329 |     await expect(activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) })).rejects.toThrow('SNAPSHOT_HASH_MISMATCH');
  330 |   });
  331 | 
  332 |   test('should correctly increment rowVersion', async () => {
  333 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  334 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  335 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  336 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  337 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  338 |     const result = await activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) });
  339 |     expect(result.rowVersion).toBe(3);
  340 |   });
  341 | 
  342 |   test('should correctly generate baseline code BL-001 for first baseline', async () => {
  343 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  344 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  345 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  346 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  347 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  348 |     const result = await activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) });
  349 |     expect(result.baselineCode).toBe('BL-001');
  350 |   });
  351 | 
  352 |   test('should correctly generate baseline code BL-002 for second baseline of the project', async () => {
  353 |     // Fake existing baseline for the project
  354 |     const dummyActive = await prisma.projectSchedule.create({
  355 |       data: { projectId: testProject.id, name: 'Old Baseline', workflowStatus: ProjectScheduleWorkflowStatus.ACTIVE_BASELINE, rowVersion: 1, baselineCode: 'BL-001' }
  356 |     });
  357 |     
  358 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  359 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  360 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  361 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  362 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  363 |     const result = await activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) });
  364 |     
  365 |     expect(result.baselineCode).toBe('BL-002');
  366 |     
  367 |     await prisma.projectSchedule.delete({ where: { id: dummyActive.id } }).catch(() => {});
  368 |   });
  369 | 
  370 |   test('should correctly supersede previously active baseline of the project', async () => {
  371 |     const dummyActive = await prisma.projectSchedule.create({
  372 |       data: { projectId: testProject.id, name: 'Old Baseline', workflowStatus: ProjectScheduleWorkflowStatus.ACTIVE_BASELINE, rowVersion: 1, baselineCode: 'BL-001' }
  373 |     });
  374 |     
  375 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  376 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  377 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  378 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  379 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  380 |     await activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) });
  381 |     
  382 |     const oldActive = await prisma.projectSchedule.findUnique({ where: { id: dummyActive.id } });
  383 |     expect(oldActive?.workflowStatus).toBe(ProjectScheduleWorkflowStatus.SUPERSEDED_BASELINE);
  384 |     
  385 |     await prisma.projectSchedule.delete({ where: { id: dummyActive.id } }).catch(() => {});
  386 |   });
  387 | 
  388 |   test('should correctly set baselineStartDate and baselineFinishDate on activities', async () => {
  389 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  390 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  391 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  392 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  393 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
  394 |     await activateScheduleBaseline({ ...payload, idempotencyKey: generateIdempotencyKey(), requestFingerprint: generateFingerprint(payload) });
  395 |     
  396 |     const activities = await prisma.scheduleActivity.findMany({ where: { scheduleId: testSchedule.id } });
  397 |     expect(activities[0].baselineStartDate).not.toBeNull();
  398 |     expect(activities[0].baselineFinishDate).not.toBeNull();
  399 |   });
  400 | 
  401 | 
  402 | 
  403 |   test('should persist BaselineActivation with correct activatedById', async () => {
  404 |     const { validateScheduleForReview } = await import('@/lib/scheduling/scheduleWorkflow');
  405 |     const val = await validateScheduleForReview({ projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 });
  406 |     await prisma.scheduleApproval.updateMany({ where: { scheduleId: testSchedule.id }, data: { scheduleSnapshotHash: val.hash } });
  407 |     await prisma.projectSchedule.update({ where: { id: testSchedule.id }, data: { rowVersion: 1, workflowStatus: ProjectScheduleWorkflowStatus.PENDING_BASELINE_APPROVAL } });
  408 |     const payload = { operation: 'activateScheduleBaseline', projectId: testProject.id, scheduleId: testSchedule.id, actorId: testActor.id, expectedRowVersion: 1 };
```