# Pre-Phase 3 Drift Inventory

## Added Tables
- BOQExtractedItem
- BOQExtractedSection
- OnlyOfficeSession
- ProjectBOQVersion
- SecuritySimulationArchive
- SecuritySimulationCampaign
- SecuritySimulationRun
- SecuritySimulationScenario
- UploadedWorkbookFile
- WorkbookExtractionAudit
- WorkbookFormulaValidation
- WorkbookTemplateValidation
- WorkbookVersion

## Changed Tables & Added Columns/Constraints
### BOQExtractedItem
- Added foreign key (projectId)
- Added foreign key (sectionId)
- Added foreign key (uploadedWorkbookFileId)

### BOQExtractedSection
- Added foreign key (projectId)
- Added foreign key (uploadedWorkbookFileId)

### BOQMapping
- Added column `procurementBenchmarkItemId`
- Altered column `awardedBoqItemId` (changed from Required to Nullable)
- Added foreign key (procurementBenchmarkItemId)

### CountermeasureLog
- Added column `actualResult`
- Added column `expectedResult`
- Added column `passed`
- Added column `responseTimeMs`

### OnlyOfficeSession
- Added unique index (documentKey)
- Added foreign key (uploadedWorkbookFileId)
- Added foreign key (workbookVersionId)

### SecurityEvent
- Added column `actualResponse`
- Added column `expectedResponse`
- Added column `simulationPassed`
- Added column `simulationRunId`
- Added foreign key (simulationRunId)

### SecurityIncident
- Added column `evidenceJson`
- Added column `linkedSimulationRunId`
- Added column `timelineJson`
- Added foreign key (linkedSimulationRunId)

### SecuritySimulationRun
- Added foreign key (campaignId)
- Added foreign key (scenarioId)

### UploadedWorkbookFile
- Added foreign key (projectId)

### WorkbookExtractionAudit
- Added foreign key (projectId)
- Added foreign key (uploadedWorkbookFileId)

### WorkbookFormulaValidation
- Added foreign key (uploadedWorkbookFileId)

### WorkbookTemplateValidation
- Added foreign key (uploadedWorkbookFileId)

### WorkbookVersion
- Added foreign key (uploadedWorkbookFileId)
