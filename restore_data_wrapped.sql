SET session_replication_role = replica;
--
-- PostgreSQL database dump
--

\restrict kWLTqUmFfgSzzzdC294k9ck7QcNahzzVR803ndTCYzIKkXN1Ny7ZqQeT0UZE9dq

-- Dumped from database version 17.10 (986efc8)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: AIAuditFinding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIAuditFinding" (id, "transactionId", "moduleName", "findingType", description, "riskLevel", "detectedAt") FROM stdin;
\.


--
-- Data for Name: AIConfiguration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIConfiguration" (id, "primaryPlanningModel", "secondaryClassificationModel", "fallbackModel", "reasoningEffort", "maxOutputTokens", "timeoutMs", "retryLimit", "promptVersion", "jsonSchemaVersion", "schedulingRulesVersion", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIDuplicatePhotoCheck; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIDuplicatePhotoCheck" (id, "currentFileId", "matchedFileId", "projectId", "similarityScore", "matchType", "previousBillingId", "previousAccomplishmentId", result, "createdAt") FROM stdin;
\.


--
-- Data for Name: AIExecutiveQuery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIExecutiveQuery" (id, "userId", "userRole", "queryText", "scopeType", "projectId", "dateRangeStart", "dateRangeEnd", "aiResponse", "sourceReferences", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIGeneratedReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIGeneratedReport" (id, "reportCode", "reportType", title, "scopeType", "projectId", "departmentId", "dateRangeStart", "dateRangeEnd", "generatedById", "reviewedById", "approvedById", status, "aiSummary", "aiFindings", "aiRecommendations", "sourceReferences", "filePdfUrl", "fileExcelUrl", "fileDocxUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIGeneratedReportVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIGeneratedReportVersion" (id, "reportId", "versionNumber", "editedById", "aiSummary", "aiFindings", "aiRecommendations", "managementRemarks", "sourceReferences", "filePdfUrl", "fileExcelUrl", "fileDocxUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIHumanReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIHumanReview" (id, "reviewerId", "reviewerRole", decision, remarks, "overrideReason", "aiValidationRunId", "reviewedAt") FROM stdin;
\.


--
-- Data for Name: AIModulePrompt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIModulePrompt" (id, category, "moduleName", "promptTemplate", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AINotebookReference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AINotebookReference" (id, "fileName", "fileType", "fileUrl", "uploadedBy", "uploadedByRole", "projectAssignment", "moduleAssignment", "referenceCategory", "effectiveDate", "expiryDate", "versionNumber", status, "isMandatory", "supersededById", "approvedBy", "approvedDate", "isLocked", "aiIndexingStatus", "aiSummary", keywords, "validationUseCase", "fileHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AINotification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AINotification" (id, "userId", "userRole", message, "moduleName", "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIQuerySecurityLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIQuerySecurityLog" (id, "userId", role, "projectScope", query, "normalizedQuery", "detectedThreat", blocked, "retrievedDocumentIds", "blockedDocumentIds", "dataClassificationUsed", "responseStatus", "tokenUsage", "costEstimate", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIReferenceUsageLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIReferenceUsageLog" (id, "referenceId", "transactionId", "moduleName", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIRiskScore; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIRiskScore" (id, "transactionId", "moduleName", "riskLevel", score, reasons, "createdAt") FROM stdin;
\.


--
-- Data for Name: AISearchLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AISearchLog" (id, "userId", "userRole", "searchQuery", "moduleScope", "createdAt") FROM stdin;
\.


--
-- Data for Name: AITransactionValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AITransactionValidation" (id, "moduleName", "transactionId", "userId", "userRole", "validationType", "referenceId", "referenceVersionId", "validationStatus", "riskLevel", "aiFindings", "aiRecommendation", "blockingFlag", "overrideAllowed", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationEvidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationEvidence" (id, "evidenceType", "fileUrl", "fileName", source, "capturedFromLiveCamera", "cameraId", latitude, longitude, "timestamp", "metadataStatus", "aiValidationRunId", "evidenceFileId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationFinding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationFinding" (id, "findingCategory", "findingTitle", "findingDescription", severity, "confidenceScore", "relatedFileId", "relatedBoqItemId", "recommendedAction", "aiValidationRunId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationLog" (id, "moduleName", "transactionId", "userId", "userRole", "validationType", "validationResult", "riskLevel", "aiFindings", "aiRecommendation", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationOverride; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationOverride" (id, "validationResultId", "transactionId", "moduleName", "overriddenBy", "overriddenByRole", "overrideReason", "supportingAttachment", "approvedBy", "approvedByRole", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationRecord" (id, "projectId", "moduleSource", "relatedDocumentId", "relatedBillingId", "relatedBoqItemId", "evidenceType", "evidenceFileUrl", "aiFindings", "aiConfidenceScore", "riskLevel", recommendation, status, "createdById", "reviewedById", "reviewedAt", "approvalAction", "overrideReason", "auditTrailRef", "findingsData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationResult" (id, type, status, score, details, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationRule" (id, "ruleCode", description, "moduleName", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIValidationRun" (id, "validationType", status, "overallScore", "visualScore", "locationScore", "dateScore", "boqMatchScore", "planMatchScore", "duplicateRiskScore", recommendation, "summaryFindings", "createdById", "completedAt", "projectId", "accomplishmentId", "billingId", "boqItemId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIVariationOrderValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIVariationOrderValidation" (id, "validationType", result, "confidenceLevel", "riskLevel", findings, "missingRequirements", "duplicateWarnings", "recommendedAction", "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIWorkerValidationResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIWorkerValidationResult" (id, "workerId", category, severity, message, "fieldRef", status, "ignoreReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Accomplishment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Accomplishment" (id, "billingPeriod", "accomplishmentDate", remarks, "preparedById", status, "approvedAmount", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AccomplishmentItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AccomplishmentItem" (id, "workCategory", "descriptionOfWork", "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "remainingQuantity", "unitCost", "currentAccomplishmentAmount", "totalAccomplishmentAmount", "percentageAccomplished", "aiValidationStatus", "inspectionStatus", "approvalStatus", remarks, "accomplishmentId", "boqItemId") FROM stdin;
\.


--
-- Data for Name: AccomplishmentRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AccomplishmentRecord" (id, "jobOrderId", description, "quantityCompleted", "completedAt", photos, videos, "aiValidationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AccountsPayable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AccountsPayable" (id, amount, "dueDate", status, "paymentMethod", "paymentRef", "paidAt", "paidAmount", "netAmount", "vatAmount", "deliveryId", "poId", "supplierId", "createdAt", "updatedAt", "voucherNumber") FROM stdin;
\.


--
-- Data for Name: AiAccessAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiAccessAuditLog" (id, "userId", "userRole", "projectId", question, "answerStatus", "denialReason", "sourcesRetrieved", "sourcesDenied", "tokensUsed", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiChatMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiChatMessage" (id, "sessionId", "userId", role, message, "authorizedContextUsed", "citedSources", "projectId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiChatSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiChatSession" (id, "userId", "projectId", "moduleName", "sessionTitle", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiComparisonMap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiComparisonMap" (id, "comparisonName", "userQuestionPattern", "primaryModule", "primaryTable", "primaryField", "relatedModules", "relatedTables", "relatedFields", "comparisonLogic", "calculationFormula", "requiredPermission", "projectScoped", confidential, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiIndexingJob; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiIndexingJob" (id, "jobType", status, "sourceCount", "chunkCount", "errorMessage", "startedAt", "completedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiKnowledgeChunk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiKnowledgeChunk" (id, "sourceId", "chunkIndex", "chunkText", "chunkSummary", "moduleName", "projectId", "allowedRoles", "visibilityScope", "confidentialityLevel", "vectorEmbedding", "tokenCount", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiKnowledgeMap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiKnowledgeMap" (id, "sourceType", "sourceName", "moduleName", "tableName", "fieldName", "fieldLabel", "normalizedName", "businessMeaning", "detectedKeywords", "generatedAliases", "generatedSynonyms", abbreviations, "relatedTerms", "relatedModules", "relatedTables", "relatedFields", "relationshipType", "sampleQuestions", "accessLevel", "requiredRole", "requiredPermission", "projectScoped", confidential, searchable, filterable, comparable, aggregatable, "sourcePriority", "lastScannedAt", "isActive", "createdAt", "updatedAt") FROM stdin;
cmr1pf54602levc90mczni70w	database_schema	User	\N	User	\N	\N	user	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	["Account","User Profile","User Record"]	["Account Holder","System User","Member"]	\N	\N	["User Management"]	\N	\N	\N	["Who are the users in the system?","What access rights do users have?","How can I modify a user's profile?","How do I add a new user?","What information is stored in the User table?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:38:16.225	t	2026-07-01 06:38:16.229	2026-07-01 06:38:16.229
cmr1pffbp02lmvc90c2rg0rvi	database_schema	Project	\N	Project	\N	\N	project	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	["Projects","Project List","Project Records"]	["Project details","Project information","Project data"]	\N	\N	["Project Management"]	\N	\N	\N	["What are the active projects?","How do I add a new project?","Can I view the budget for each project?","What is the status of my projects?","How do I track project progress?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:38:29.458	t	2026-07-01 06:38:29.461	2026-07-01 06:38:29.461
cmr1pfohb02luvc90sfbwfhot	database_schema	Supplier	\N	Supplier	\N	\N	supplier	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	["Vendor","Supplier Master","Supplier Information"]	["supplier details","vendor info","provider","commercial partner"]	\N	\N	["Procurement"]	\N	\N	\N	["Who are our current suppliers?","How do I add a new supplier?","What is the contact information for supplier X?","Where can I find the payment terms for our suppliers?","How do I update supplier details?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:38:41.098	t	2026-07-01 06:38:41.101	2026-07-01 06:38:41.101
cmr1pfyw702m3vc904b946lep	database_schema	PurchaseOrder	\N	PurchaseOrder	\N	\N	purchaseorder	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	["PO","Purchase Order","Order"]	["buy order","procurement order","order request"]	\N	\N	["Procurement"]	\N	\N	\N	["What items are listed on the Purchase Order?","How can I track the status of a Purchase Order?","What are the payment terms for Purchase Orders?","How do I create a new Purchase Order in the system?","Can I modify an existing Purchase Order?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:38:54.821	t	2026-07-01 06:38:54.823	2026-07-01 06:38:54.823
cmr1pg8oc02mbvc907vtsbqx9	database_schema	Expense	\N	Expense	\N	\N	expense	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	["Expenses","Cost Records","Expense Reports"]	["spending","costs","financial outlay","expenditures"]	\N	\N	["Finance"]	\N	\N	\N	["What are the total expenses for the month?","How can I categorize my expenses?","What is the breakdown of project expenses?","Can I view expenses by department?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:39:07.498	t	2026-07-01 06:39:07.5	2026-07-01 06:39:07.5
cmr1pginm02mkvc90a7je2hiy	database_schema	DailyTimeRecord	\N	DailyTimeRecord	\N	\N	dailytimerecord	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	["Time Entry","Attendance Record","Employee Time Log"]	["time tracking","attendance","work hours","employee attendance"]	\N	\N	["HR"]	\N	\N	\N	["How do I view employee attendance records?","What are the daily hours logged for each employee?","Can I generate a report of time entries for my team?","How is overtime calculated in the Daily Time Record?","Where can I export the Daily Time Record data?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:39:20.431	t	2026-07-01 06:39:20.434	2026-07-01 06:39:20.434
cmr1pgu3o02mtvc909f9hcqph	database_schema	PayrollPeriod	\N	PayrollPeriod	\N	\N	payrollperiod	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	["Pay Period","Payroll Cycle","Salary Period"]	["payroll interval","wage period","compensation period"]	\N	\N	["HR"]	\N	\N	\N	["What are the current payroll periods?","How do I set up a new payroll period?","What is the duration of each payroll period?","Can I view past payroll periods?","What is included in the payroll period for calculations?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:39:35.265	t	2026-07-01 06:39:35.267	2026-07-01 06:39:35.267
cmr1ph66302n1vc90mqopsufm	database_schema	MaterialIssuance	\N	MaterialIssuance	\N	\N	materialissuance	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	["Material Dispatch","Material Release","Material Withdrawal"]	["Material Allocation","Material Distribution","Inventory Outflow"]	\N	\N	["Inventory Management"]	\N	\N	\N	["How do I view material issuances for a specific project?","What are the total materials issued this month?","Can I see a history of all material withdrawals?","How is material issuance tracked in the system?","What reports can be generated from the MaterialIssuance data?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:39:50.683	t	2026-07-01 06:39:50.685	2026-07-01 06:39:50.685
cmr1phg9902n9vc900frcl3kj	database_schema	SubcontractPackage	\N	SubcontractPackage	\N	\N	subcontractpackage	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	["Subcontractor Package","Subcontract Agreement","Subcontract Module"]	["subcontract","sub-package","outsourcing","third-party contract"]	\N	\N	["Project Management"]	\N	\N	\N	["What are the details for the subcontract packages?","How do I update subcontractor information?","Can I see the list of all subcontract agreements?","What is included in a subcontract package?"]	PUBLIC	\N	\N	f	f	f	f	f	f	1	2026-07-01 06:40:03.979	t	2026-07-01 06:40:03.982	2026-07-01 06:40:03.982
\.


--
-- Data for Name: AiKnowledgeSource; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiKnowledgeSource" (id, "sourceType", title, description, "moduleName", "projectId", "filePath", "storageUrl", "originalFilename", "mimeType", "uploadedById", "visibilityScope", "allowedRoles", "allowedProjects", "confidentialityLevel", status, "indexedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagEmbedding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiRagEmbedding" (id, "sourceType", "sourceModule", "sourceRecordId", "sourceTitle", "sourceTextChunk", "embeddingVector", "metadataJson", "accessLevel", "projectId", "modulePermissionRequired", "confidentialityLevel", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagKeywordRegistry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiRagKeywordRegistry" (id, keyword, "normalizedKeyword", "keywordType", "moduleName", "relatedModule", "databaseTable", "databaseField", "businessMeaning", synonyms, aliases, abbreviations, "relatedTerms", "exampleUserQuestions", "requiredRoleAccess", "requiredModulePermission", "confidentialityLevel", "projectScoped", "documentScoped", "sourceType", "sourcePriority", "isActive", "mergedIntoId", "mergedAt", "cleanupNotes", "sourceOrigin", "generatedBy", "adminApproved", "createdAt", "updatedAt") FROM stdin;
cmr1oorgo0000vct0uwlsiicg	system	system	module	\N	\N	\N	\N	\N	\N	ERP, OneSystemsERP, app, application, platform, software, system application, business system	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgo0001vct0cgu9pv01	dashboard	dashboard	module	\N	\N	\N	\N	\N	\N	summary screen, management view, overview, main screen, home page, control panel, command center	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgo0002vct0tg1dwoub	module	module	business_term	\N	\N	\N	\N	\N	\N	feature, function, menu, screen, page, section, component, app section	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgo0003vct03y637o43	workflow	workflow	workflow	\N	\N	\N	\N	\N	\N	process, procedure, flow, approval flow, transaction flow, operating process, business process	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0004vct0yhlf8oo8	transaction	transaction	business_term	\N	\N	\N	\N	\N	\N	record, entry, form, submitted record, encoded transaction, system entry	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0005vct0y7x0stum	settings	settings	module	\N	\N	\N	\N	\N	\N	configuration, setup, preferences, system settings, admin settings	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0006vct0dzbth7fy	backup	backup	module	\N	\N	\N	\N	\N	\N	data backup, restore point, system copy, database backup, file backup	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0007vct0nbuwww5y	restore	restore	module	\N	\N	\N	\N	\N	\N	recover, recovery, rollback, reload backup, restore data	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0008vct0bp6pvaef	import	import	workflow	\N	\N	\N	\N	\N	\N	upload, load file, bring in data, Excel upload, CSV upload, batch upload	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp0009vct09vcr399c	export	export	workflow	\N	\N	\N	\N	\N	\N	download, generate file, save as Excel, save as PDF, print report	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000avct0qmao25r8	notification	notification	workflow	\N	\N	Notification	\N	\N	\N	alert, reminder, system message, warning, pending notice	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000bvct0msyc2lrt	user	user	database_table	\N	\N	User	\N	\N	\N	account, profile, login account, system user, employee account, staff account	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000cvct0m19qat0y	rbac	rbac	access_control	\N	\N	RolePermission	\N	\N	\N	role access, permission control, user rights, role-based access control, access rights, privileges	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000dvct0h5ei481v	role	role	access_control	\N	\N	Role	\N	\N	\N	user role, position role, system role, designation, access group	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000evct08765p31t	permission	permission	access_control	\N	\N	RolePermission	\N	\N	\N	access, privilege, rights, allowed action, authorization, module permission	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000fvct0k05z2ncz	access rights	access_rights	access_control	\N	\N	RolePermission	\N	\N	\N	permissions, privileges, allowed modules, user access, role permissions	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgp000gvct0pmt14z4t	project-based access	project_based_access	access_control	\N	\N	UserProjectAccess	\N	\N	\N	project access, assigned project, project restriction, project scope, project visibility	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000hvct062rg2012	view only	view_only	access_control	\N	\N	RolePermission	\N	\N	\N	read only, display only, cannot edit, no edit access, guest access	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000ivct0ws2in43v	super admin	super_admin	user_role	\N	\N	User	\N	\N	\N	system owner, full access admin, highest admin, master admin	\N	\N	\N	\N	\N	SUPER_ADMIN_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000jvct0arutskxt	system admin	system_admin	user_role	\N	\N	User	\N	\N	\N	administrator, admin, system administrator, app admin	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000kvct09x4p3lex	executive	executive	user_role	\N	\N	User	\N	\N	\N	CEO, top management, management, owner, board user, executive user	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000lvct0127ngnut	project director	project_director	user_role	\N	\N	User	\N	\N	\N	director, PD, project head, project executive	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000mvct0m7m7m8tu	project manager	project_manager	user_role	\N	\N	User	\N	\N	\N	PM, project in charge, project lead, site manager	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000nvct0lwerhza7	project accountant	project_accountant	user_role	\N	\N	User	\N	\N	\N	accountant, project accounting, site accountant, accounting staff	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000ovct08b0pb3du	purchasing officer	purchasing_officer	user_role	\N	\N	User	\N	\N	\N	procurement officer, buyer, purchasing staff, canvasser	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000pvct0ttk4v4t6	finance officer	finance_officer	user_role	\N	\N	User	\N	\N	\N	finance, accounting officer, disbursement officer, cashier	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000qvct0pso3f7se	payroll officer	payroll_officer	user_role	\N	\N	User	\N	\N	\N	payroll staff, compensation officer, payroll admin	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000rvct03gjm3u0g	materials engineer	materials_engineer	user_role	\N	\N	User	\N	\N	\N	materials staff, warehouse checker, material controller, inventory controller	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000svct07f6r8kp9	site admin	site_admin	user_role	\N	\N	User	\N	\N	\N	site accounting, site encoder, admin staff, field admin	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000tvct0zkpvqfcz	guest user	guest_user	user_role	\N	\N	User	\N	\N	\N	guest, viewer, view only user, read only user	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgq000uvct09hsgwqa9	project	project	database_table	\N	\N	Project	\N	\N	\N	contract, awarded project, live project, site, job site, construction project, project site	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr000vvct02qdqzzr3	project code	project_code	database_field	\N	\N	Project	\N	\N	\N	code, project number, contract code, job code, site code	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr000wvct0dbw0b732	project name	project_name	database_field	\N	\N	Project	\N	\N	\N	contract name, site name, project title, job name	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr000xvct0h75lg8rq	project status	project_status	project_metric	\N	\N	Project	\N	\N	\N	status, current status, project condition, project standing, active status	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr000yvct018er8dkw	project cost	project_cost	project_metric	\N	\N	Project	\N	\N	\N	contract amount, awarded amount, total project value, contract value, project value, contract price	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr000zvct01ibdne36	contract amount	contract_amount	project_metric	\N	\N	Project	\N	\N	\N	awarded amount, project cost, contract value, original contract amount, awarded contract price	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0010vct0fd8ugite	project location	project_location	database_field	\N	\N	Project	\N	\N	\N	site location, address, project address, construction site	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0011vct03av2nt4s	start date	start_date	database_field	\N	\N	Project	\N	\N	\N	commencement date, project start, beginning date, notice to proceed date, NTP date	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0012vct0lviiozah	completion date	completion_date	database_field	\N	\N	Project	\N	\N	\N	target completion, finish date, end date, project deadline, contract completion	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0013vct046i87afu	duration	duration	project_metric	\N	\N	Project	\N	\N	\N	calendar days, working days, project duration, contract duration, number of days	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0014vct0fzc4fzh6	project progress	project_progress	project_metric	\N	\N	ProjectAccomplishment	\N	\N	\N	accomplishment, percentage completion, physical progress, actual progress, work progress	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0015vct0c8mmfnoa	milestone	milestone	project_metric	\N	\N	ProjectSchedule	\N	\N	\N	target milestone, project stage, major activity, key activity, deliverable	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0016vct0ubpc6yza	delay	delay	project_metric	\N	\N	ProjectSchedule	\N	\N	\N	slippage, overdue, behind schedule, late, delayed activity, schedule variance	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0017vct0lj6ayr42	project health	project_health	project_metric	\N	\N	Project	\N	\N	\N	risk status, overall condition, health score, project KPI, project standing	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgr0018vct0npr7zbpl	boq	boq	business_term	\N	\N	AwardedBOQItem	\N	\N	\N	bill of quantity, bill of quantities, awarded BOQ, procurement BOQ, quantity list, scope quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs0019vct0ann3k9tx	awarded boq	awarded_boq	database_table	\N	\N	AwardedBOQItem	\N	\N	\N	contract BOQ, billing BOQ, approved BOQ, original BOQ, awarded bill of quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001avct0fqv9xnz9	procurement boq	procurement_boq	database_table	\N	\N	ProcurementBenchmarkBOQItem	\N	\N	\N	benchmark BOQ, forecast BOQ, internal BOQ, procurement benchmark, material BOQ	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001bvct04oh20pog	forecast boq	forecast_boq	database_table	\N	\N	ProcurementBenchmarkBOQItem	\N	\N	\N	procurement BOQ, benchmark BOQ, estimated procurement quantity, internal forecast BOQ	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001cvct0a4fs8ne5	consolidated boq	consolidated_boq	database_table	\N	\N	ConsolidatedBOQItem	\N	\N	\N	grouped BOQ, combined BOQ, merged BOQ, procurement master BOQ	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001dvct0wujhr6xz	boq item	boq_item	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	line item, scope item, work item, item description, quantity item	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001evct0bobyj3v6	item description	item_description	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	scope description, work description, BOQ description, item particulars	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001fvct0ttyo0ioh	quantity	quantity	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	qty, volume, amount of work, item quantity, required quantity	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001gvct0k2fa4kay	awarded quantity	awarded_quantity	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	contract quantity, BOQ quantity, approved quantity, original quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001hvct0o3h2ifp6	benchmark quantity	benchmark_quantity	database_field	\N	\N	ProcurementBenchmarkBOQItem	\N	\N	\N	forecast quantity, procurement quantity, internal quantity, material quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001ivct0kz6rbw1l	unit	unit	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	unit of measure, UOM, measurement unit, item unit	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001jvct06nw5vt13	unit cost	unit_cost	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	unit price, rate, price per unit, cost per unit	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001kvct0qxe1g5k9	total cost	total_cost	database_field	\N	\N	AwardedBOQItem	\N	\N	\N	amount, line total, extended amount, total amount, item amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001lvct0e2sr7ghr	direct cost	direct_cost	finance_metric	\N	\N	AwardedBOQItem	\N	\N	\N	material cost, labor cost, equipment cost, direct work cost	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgs001mvct0607gfgt2	indirect cost	indirect_cost	finance_metric	\N	\N	AwardedBOQItem	\N	\N	\N	overhead, general requirements, indirect expense, preliminaries	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001nvct0fzsk0gug	material savings	material_savings	computed_metric	\N	\N	BOQVariance	\N	\N	\N	quantity savings, cost savings, unused quantity, procurement savings, variance savings	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001ovct08ud3dkjq	remaining quantity	remaining_quantity	computed_metric	\N	\N	BOQVariance	\N	\N	\N	balance quantity, unserved quantity, remaining balance, available quantity	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001pvct0tyyiu09g	installed quantity	installed_quantity	database_field	\N	\N	ProjectAccomplishment	\N	\N	\N	accomplished quantity, completed quantity, actual installed, approved installed quantity	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001qvct0ksyj0yts	billed quantity	billed_quantity	database_field	\N	\N	BillingItem	\N	\N	\N	quantity billed, claimed quantity, billing quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001rvct0vuchc9q8	quantity variance	quantity_variance	computed_metric	\N	\N	BOQVariance	\N	\N	\N	difference in quantity, BOQ variance, excess quantity, shortage quantity	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001svct042egrlmj	procurement	procurement	module	\N	\N	PurchaseRequest	\N	\N	\N	purchasing, buying, sourcing, procurement process, purchase management	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001tvct0ltfedkoh	material request	material_request	database_table	\N	\N	MaterialRequest	\N	\N	\N	MRF, material request form, materials request, request for materials	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001uvct06quh2rwn	purchase request	purchase_request	database_table	\N	\N	PurchaseRequest	\N	\N	\N	PR, request to purchase, purchasing request, procurement request	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001vvct074jol4ug	canvass	canvass	workflow	\N	\N	SupplierQuotation	\N	\N	\N	canvassing, supplier comparison, quotation comparison, price canvass, RFQ comparison	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001wvct05z24y5f9	rfq	rfq	workflow	\N	\N	RFQ	\N	\N	\N	request for quotation, quotation request, supplier quote request, price request	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001xvct0rzzvic1g	quotation	quotation	database_table	\N	\N	SupplierQuotation	\N	\N	\N	quote, supplier quotation, vendor quotation, price offer, proposal	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001yvct0n6up74qr	supplier	supplier	database_table	\N	\N	Supplier	\N	\N	\N	vendor, dealer, provider, seller, supplier company, material supplier	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgt001zvct0vwjf1i6r	supplier rating	supplier_rating	procurement_metric	\N	\N	SupplierEvaluation	\N	\N	\N	vendor rating, supplier evaluation, supplier score, vendor performance	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0020vct0rzxdq2km	purchase order	purchase_order	database_table	\N	\N	PurchaseOrder	\N	\N	\N	PO, order, approved order, supplier order, procurement order	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0021vct0mfhjqv5y	po status	po_status	procurement_metric	\N	\N	PurchaseOrder	\N	\N	\N	purchase order status, order status, procurement status, PO standing	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0022vct0lh67nhc2	pending purchase order	pending_purchase_order	procurement_metric	\N	\N	PurchaseOrder	\N	\N	\N	pending PO, unapproved PO, PO for approval, waiting approval order	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0023vct0jegex2hi	undelivered purchase order	undelivered_purchase_order	procurement_metric	\N	\N	PurchaseOrder	\N	\N	\N	undelivered PO, pending delivery, PO balance, items not delivered	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0024vct0rpifvshf	partial delivery	partial_delivery	procurement_metric	\N	\N	DeliveryReceipt	\N	\N	\N	incomplete delivery, partially delivered, partial received, balance delivery	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0025vct04y3n4qy8	complete delivery	complete_delivery	procurement_metric	\N	\N	DeliveryReceipt	\N	\N	\N	fully delivered, completed delivery, received in full, complete DR	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0026vct07r9wxalb	supplier payable	supplier_payable	finance_metric	\N	\N	AccountsPayable	\N	\N	\N	supplier AP, vendor payable, unpaid supplier, supplier balance	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0027vct0ekaa6d6t	procurement cost	procurement_cost	procurement_metric	\N	\N	PurchaseOrder	\N	\N	\N	purchase cost, material cost, PO total, actual procurement amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0028vct00m49300u	committed cost	committed_cost	finance_metric	\N	\N	PurchaseOrder	\N	\N	\N	approved PO amount, obligation, committed expense, future payable	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu0029vct0i1ryfgr4	delivery	delivery	database_table	\N	\N	DeliveryReceipt	\N	\N	\N	received delivery, supplier delivery, material delivery, item delivery	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu002avct0nnfe6jcs	delivery receipt	delivery_receipt	database_table	\N	\N	DeliveryReceipt	\N	\N	\N	DR, receiving report, goods receipt, delivery document, received item report	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu002bvct0ozqaancc	receiving	receiving	workflow	\N	\N	DeliveryReceipt	\N	\N	\N	item receiving, material receiving, goods receipt, acceptance, warehouse receiving	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu002cvct0ux12z7xi	inspection	inspection	workflow	\N	\N	InspectionReport	\N	\N	\N	checking, material inspection, quality check, receiving inspection, acceptance inspection	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu002dvct046f0cqkq	invoice	invoice	database_table	\N	\N	SupplierInvoice	\N	\N	\N	billing invoice, sales invoice, supplier invoice, SI, charge invoice	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgu002evct0fkjcxfki	inventory	inventory	module	\N	\N	InventoryItem	\N	\N	\N	materials, stock, warehouse, stockroom, material inventory, stocks on hand	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002fvct0dtbngh18	stock balance	stock_balance	inventory_metric	\N	\N	InventoryBalance	\N	\N	\N	inventory balance, available stock, stock on hand, remaining stock, material balance	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002gvct0nkxefn8e	warehouse	warehouse	module	\N	\N	Warehouse	\N	\N	\N	storage, stockroom, material storage, warehouse location, inventory area	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002hvct0q3h8pxkl	material issuance	material_issuance	database_table	\N	\N	MaterialIssuance	\N	\N	\N	MIS, issuance slip, material issuance slip, materials issued, release of materials	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002ivct0nexjp6an	issued materials	issued_materials	inventory_metric	\N	\N	MaterialIssuance	\N	\N	\N	released materials, withdrawn materials, used materials, materials consumed	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002jvct0dm6on9io	consumed materials	consumed_materials	inventory_metric	\N	\N	MaterialConsumption	\N	\N	\N	material usage, actual usage, material consumption, utilized materials	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002kvct0mgjqadli	returned materials	returned_materials	inventory_metric	\N	\N	MaterialReturn	\N	\N	\N	material return, returned stock, unused returned item, return to warehouse	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002lvct05sz7j0r7	damaged materials	damaged_materials	inventory_metric	\N	\N	DamagedMaterial	\N	\N	\N	defective materials, waste, scrap, rejected materials, damaged stock	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002mvct04xw5x9q4	reorder point	reorder_point	inventory_metric	\N	\N	InventoryItem	\N	\N	\N	minimum stock, reorder level, stock alert level, low stock threshold	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002nvct0w43w3ubp	shortage	shortage	inventory_metric	\N	\N	InventoryBalance	\N	\N	\N	lacking materials, insufficient stock, stock shortage, material deficit	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002ovct0znpqg3eg	excess materials	excess_materials	inventory_metric	\N	\N	InventoryBalance	\N	\N	\N	overstock, surplus materials, excess stock, unused materials	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002pvct0zelw8lyt	subcontractor	subcontractor	database_table	\N	\N	Subcontractor	\N	\N	\N	subcon, subcontract company, trade contractor, specialty contractor	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002qvct0ig1ydgnn	subcontract package	subcontract_package	database_table	\N	\N	SubcontractPackage	\N	\N	\N	subcontract, subcontract agreement, subcontract scope, subcontract contract	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgv002rvct01d9ng9fj	subcontract agreement	subcontract_agreement	document	\N	\N	SubcontractPackage	\N	\N	\N	subcontract contract, subcontract package, subcontract terms, subcontract document	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002svct04znkjv4s	subcontract boq	subcontract_boq	database_table	\N	\N	SubcontractBOQItem	\N	\N	\N	subcontract quantity, subcon BOQ, subcontract scope items, subcontract line items	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002tvct00b8jue5w	subcontract billing	subcontract_billing	billing_metric	\N	\N	SubcontractBilling	\N	\N	\N	subcon billing, subcontractor billing, subcontract progress billing, subcontract claim	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002uvct0jonlsu2d	subcontract accomplishment	subcontract_accomplishment	subcontract_metric	\N	\N	SubcontractAccomplishment	\N	\N	\N	subcon progress, subcontractor progress, subcontract completed work	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002vvct0fa7ihesa	subcontract retention	subcontract_retention	finance_metric	\N	\N	SubcontractBilling	\N	\N	\N	retention, holdback, retained amount, subcontract holdback	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002wvct0uhl156zq	subcontract payment	subcontract_payment	finance_metric	\N	\N	SubcontractPayment	\N	\N	\N	subcon payment, subcontractor payable, subcontract disbursement	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002xvct0nsb4obhq	job order	job_order	database_table	\N	\N	JobOrder	\N	\N	\N	JO, work order, service order, short subcontract, minor works order	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002yvct0geo190ru	labor-only job order	labor_only_job_order	subcontract_metric	\N	\N	JobOrder	\N	\N	\N	labor only, manpower job order, labor work order, labor subcontract	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw002zvct0mqjvvmrm	painting job order	painting_job_order	subcontract_metric	\N	\N	JobOrder	\N	\N	\N	painting JO, painting works, paint subcontract, paint work order	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0030vct0o6fw1r2c	masonry job order	masonry_job_order	subcontract_metric	\N	\N	JobOrder	\N	\N	\N	masonry JO, masonry works, block works, concrete works job order	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0031vct0u6c5ewo5	drywall job order	drywall_job_order	subcontract_metric	\N	\N	JobOrder	\N	\N	\N	drywall JO, gypsum works, partition works, ceiling works	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0032vct00g69fywa	waterproofing job order	waterproofing_job_order	subcontract_metric	\N	\N	JobOrder	\N	\N	\N	waterproofing JO, waterproofing works, leak repair works	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0033vct090yp2cl8	billing	billing	module	\N	\N	Billing	\N	\N	\N	progress billing, project billing, client billing, owner billing, payment claim	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0034vct02jq7nwn1	accomplishment	accomplishment	database_table	\N	\N	ProjectAccomplishment	\N	\N	\N	progress, completed work, work accomplished, physical accomplishment, project accomplishment	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgw0035vct0n1uaey9k	accomplishment report	accomplishment_report	report	\N	\N	AccomplishmentReport	\N	\N	\N	progress report, work accomplishment report, SWA, statement of work accomplished	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx0036vct07a747d6e	statement of work accomplished	statement_of_work_accomplished	report	\N	\N	AccomplishmentReport	\N	\N	\N	SWA, accomplishment statement, progress statement, completed work statement	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx0037vct0y3r7e7d1	progress billing	progress_billing	billing_metric	\N	\N	Billing	\N	\N	\N	billing claim, payment claim, project billing, billing statement	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx0038vct02cf5phol	previous billing	previous_billing	billing_metric	\N	\N	Billing	\N	\N	\N	prior billing, previous claim, earlier billing, past billing	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx0039vct0zruit7jp	current billing	current_billing	billing_metric	\N	\N	Billing	\N	\N	\N	latest billing, present billing, current claim, billing this period	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003avct0jshooylz	cumulative billing	cumulative_billing	billing_metric	\N	\N	Billing	\N	\N	\N	total billing, accumulated billing, billing to date, total claimed amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003bvct0ma671bso	retention	retention	finance_metric	\N	\N	Billing	\N	\N	\N	holdback, retained amount, retention money, withheld amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003cvct0qhbb08de	collection	collection	finance_metric	\N	\N	Collection	\N	\N	\N	payment received, collected amount, client payment, receipt, receivable collection	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003dvct088f65o81	accounts receivable	accounts_receivable	finance_metric	\N	\N	AccountsReceivable	\N	\N	\N	AR, receivable, collectible, unpaid client billing, client balance	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003evct0lmpu3iv4	billing status	billing_status	billing_metric	\N	\N	Billing	\N	\N	\N	payment claim status, project billing status, submitted billing, approved billing	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003fvct0sxawfqpz	final billing	final_billing	billing_metric	\N	\N	Billing	\N	\N	\N	final claim, last billing, completion billing, closeout billing	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003gvct0ok836j1p	variation order	variation_order	database_table	\N	\N	VariationOrder	\N	\N	\N	VO, change order, project variation, contract variation, scope change	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003hvct0cp8y8yfa	additional works	additional_works	variation_metric	\N	\N	VariationOrder	\N	\N	\N	additive variation, extra works, added scope, additional scope	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003ivct0ct2jn2te	deductive works	deductive_works	variation_metric	\N	\N	VariationOrder	\N	\N	\N	deductive variation, omitted works, reduced scope, deletion works	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgx003jvct0io66t77k	change order	change_order	variation_metric	\N	\N	VariationOrder	\N	\N	\N	variation order, scope change, contract change, project change	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003kvct0cnpgg0ro	extension of time	extension_of_time	schedule_metric	\N	\N	VariationOrder	\N	\N	\N	EOT, time extension, additional time, extended completion date	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003lvct0tfbf4o9i	revised contract amount	revised_contract_amount	computed_metric	\N	\N	VariationOrder	\N	\N	\N	adjusted contract amount, updated project cost, contract after variation	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003mvct019zm8rsw	variation billing	variation_billing	billing_metric	\N	\N	VariationBilling	\N	\N	\N	VO billing, change order billing, additional works billing	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003nvct0ls54trud	payroll	payroll	module	\N	\N	PayrollPeriod	\N	\N	\N	salary, wage, workers pay, compensation, payroll computation	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003ovct08oiibti8	worker	worker	database_table	\N	\N	Worker	\N	\N	\N	laborer, employee, manpower, personnel, staff, construction worker	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003pvct0akxih7je	worker database	worker_database	database_table	\N	\N	Worker	\N	\N	\N	manpower list, employee list, labor database, worker master list	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003qvct0gt2nvww5	dtr	dtr	database_table	\N	\N	DailyTimeRecord	\N	\N	\N	daily time record, attendance, biometrics, time record, attendance sheet	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003rvct0v765vn4g	attendance	attendance	payroll_metric	\N	\N	DailyTimeRecord	\N	\N	\N	presence, time record, work attendance, biometric record	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003svct023co3pur	time in	time_in	payroll_metric	\N	\N	DailyTimeRecord	\N	\N	\N	clock in, login time, entry time, start work time	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003tvct0bo3798bs	time out	time_out	payroll_metric	\N	\N	DailyTimeRecord	\N	\N	\N	clock out, logout time, exit time, end work time	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003uvct05egj6izn	overtime	overtime	payroll_metric	\N	\N	PayrollDetail	\N	\N	\N	OT, extra hours, overtime hours, extended work	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003vvct0axcoi9fd	undertime	undertime	payroll_metric	\N	\N	PayrollDetail	\N	\N	\N	short time, lacking hours, early out, under hours	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003wvct0ukb2vae3	late	late	payroll_metric	\N	\N	DailyTimeRecord	\N	\N	\N	tardy, lateness, late arrival, delayed time in	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgy003xvct0lixjsj6q	absence	absence	payroll_metric	\N	\N	DailyTimeRecord	\N	\N	\N	absent, no attendance, missed work, non-attendance	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz003yvct05njufpdk	daily rate	daily_rate	payroll_metric	\N	\N	Worker	\N	\N	\N	wage rate, daily wage, daily salary, rate per day	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz003zvct05iqri1st	gross pay	gross_pay	payroll_metric	\N	\N	PayrollDetail	\N	\N	\N	gross salary, total earnings, salary before deductions	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0040vct0br71fvey	net pay	net_pay	payroll_metric	\N	\N	PayrollDetail	\N	\N	\N	take home pay, salary after deductions, payable salary	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0041vct0xu5bfa32	deduction	deduction	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	salary deduction, payroll deduction, less amount, withheld amount	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0042vct0vre8fqok	cash advance	cash_advance	payroll_metric	\N	\N	CashAdvance	\N	\N	\N	CA, salary advance, worker advance, advance payment	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0043vct09wey5ihf	sss	sss	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	social security, SSS contribution, government deduction	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0044vct0q5hx2eps	philhealth	philhealth	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	health contribution, PhilHealth contribution, government deduction	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0045vct0sshfehhe	pagibig	pagibig	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	Pag-IBIG, HDMF, housing contribution, government deduction	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0046vct0rwbvytl3	withholding tax	withholding_tax	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	BIR tax, income tax, tax deduction, withheld tax	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0047vct0oaim0fif	13th month	13th_month	payroll_metric	\N	\N	PayrollPeriod	\N	\N	\N	thirteenth month, 13th month pay, annual bonus	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0048vct02swekxj7	gcash payment	gcash_payment	payroll_metric	\N	\N	PayrollPayment	\N	\N	\N	GCash salary, mobile wallet payment, worker GCash payment	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz0049vct0dc8crh5k	bank payment	bank_payment	payroll_metric	\N	\N	PayrollPayment	\N	\N	\N	salary bank transfer, bank payroll, payroll deposit	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorgz004avct0cffp06l7	finance	finance	module	\N	\N	\N	\N	\N	\N	accounting, financials, money, project financials, financial management	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004bvct0oraygfls	accounting	accounting	module	\N	\N	\N	\N	\N	\N	books, bookkeeping, ledger, financial records, accounting system	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004cvct0y2u3dwra	chart of accounts	chart_of_accounts	database_table	\N	\N	ChartOfAccount	\N	\N	\N	COA, account list, account codes, accounting codes	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004dvct0o6p7i1wy	journal entry	journal_entry	database_table	\N	\N	JournalEntry	\N	\N	\N	JE, accounting entry, debit credit entry, book entry	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004evct0nbz545ei	general ledger	general_ledger	database_table	\N	\N	GeneralLedger	\N	\N	\N	GL, ledger, account ledger, books of accounts	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004fvct0kri77fll	trial balance	trial_balance	report	\N	\N	TrialBalance	\N	\N	\N	TB, account balance report, trial balance report	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004gvct05rz5i9es	balance sheet	balance_sheet	report	\N	\N	BalanceSheet	\N	\N	\N	statement of financial position, financial position, assets liabilities equity report	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004hvct0o7itrdyc	income statement	income_statement	report	\N	\N	IncomeStatement	\N	\N	\N	profit and loss, P&L, statement of operations, earnings report	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004ivct0dz1m6ije	cash flow	cash_flow	report	\N	\N	CashFlow	\N	\N	\N	cashflow, cash movement, cash inflow outflow, cash report	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004jvct0guqfzkev	accounts payable	accounts_payable	finance_metric	\N	\N	AccountsPayable	\N	\N	\N	AP, payable, unpaid supplier, unpaid obligation, outstanding payable	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004kvct0ot5pf4x4	receivable	receivable	finance_metric	\N	\N	AccountsReceivable	\N	\N	\N	collectible, client balance, amount to collect, unpaid billing	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh0004lvct0kot851j7	disbursement	disbursement	finance_metric	\N	\N	Disbursement	\N	\N	\N	payment, cash out, money released, expense payment	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004mvct0t169yhgu	voucher	voucher	database_table	\N	\N	Voucher	\N	\N	\N	check voucher, cash voucher, payment voucher, disbursement voucher	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004nvct0r3auz6pf	official receipt	official_receipt	database_table	\N	\N	OfficialReceipt	\N	\N	\N	OR, receipt, collection receipt, payment receipt	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004ovct0nr64ybye	vat	vat	finance_metric	\N	\N	TaxRecord	\N	\N	\N	value added tax, input VAT, output VAT, tax	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004pvct0jlp89xlw	ewt	ewt	finance_metric	\N	\N	TaxRecord	\N	\N	\N	expanded withholding tax, withholding tax, tax withheld	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004qvct0gesv8l67	profitability	profitability	computed_metric	\N	\N	ProjectProfitability	\N	\N	\N	profit, margin, project profit, gross profit, net profit, gain, loss	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004rvct060n71x0l	gross profit	gross_profit	computed_metric	\N	\N	ProjectProfitability	\N	\N	\N	gross margin, revenue less direct cost, project gross profit	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004svct073u96u6z	net profit	net_profit	computed_metric	\N	\N	ProjectProfitability	\N	\N	\N	net income, bottom line, final profit, profit after expenses	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004tvct0f8n7r2w7	cost to complete	cost_to_complete	computed_metric	\N	\N	ProjectProfitability	\N	\N	\N	remaining cost, forecast completion cost, estimated cost to finish	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004uvct06qxuwtzd	actual cost	actual_cost	finance_metric	\N	\N	Expense	\N	\N	\N	actual expense, cost incurred, expenses incurred, actual spending	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004vvct03zzaihln	budget variance	budget_variance	computed_metric	\N	\N	BudgetVariance	\N	\N	\N	actual vs budget, variance, over budget, under budget	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004wvct0416d4eto	expense	expense	database_table	\N	\N	Expense	\N	\N	\N	opex, capex, project expense, cost, spending, expenditure	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004xvct0obzyrgm1	expense ledger	expense_ledger	database_table	\N	\N	ExpenseLedger	\N	\N	\N	expense record, project expense ledger, cost ledger, expense log	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004yvct0x9fxg278	petty cash	petty_cash	database_table	\N	\N	PettyCash	\N	\N	\N	cash fund, small cash, petty cash fund, site cash	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh1004zvct0x0buajcx	petty cash replenishment	petty_cash_replenishment	workflow	\N	\N	PettyCashReplenishment	\N	\N	\N	replenishment, cash replenishment, petty cash refill, fund replenishment	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20050vct0fo9er1e3	liquidation	liquidation	workflow	\N	\N	Liquidation	\N	\N	\N	expense liquidation, cash liquidation, petty cash liquidation, reimbursement report	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20051vct0dvhcwvb5	unliquidated expense	unliquidated_expense	finance_metric	\N	\N	Liquidation	\N	\N	\N	unliquidated cash, pending liquidation, unreported expense, unsettled cash	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20052vct0gf5m36ue	reimbursement	reimbursement	finance_metric	\N	\N	Reimbursement	\N	\N	\N	refund, reimbursable expense, expense refund, paid back expense	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20053vct0yysrctg0	schedule	schedule	module	\N	\N	ProjectSchedule	\N	\N	\N	project schedule, construction schedule, timeline, work schedule, activity schedule	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20054vct08itjdwft	gantt chart	gantt_chart	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	Gantt, timeline chart, bar chart schedule, project timeline	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20055vct0u3wrat8x	pert	pert	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	PERT diagram, network diagram, task network, project network	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20056vct0pe7pfymq	cpm	cpm	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	critical path method, critical path, CPM analysis, schedule critical path	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20057vct0t4bc8wi4	critical path	critical_path	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	CPM, longest path, critical activities, no-float activities	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20058vct0fo04ggoi	task	task	database_field	\N	\N	ProjectSchedule	\N	\N	\N	activity, work activity, schedule activity, project task	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh20059vct09dflj47p	dependency	dependency	schedule_metric	\N	\N	ProjectScheduleDependency	\N	\N	\N	predecessor, successor, linked task, task relationship	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh2005avct073k88jz2	predecessor	predecessor	schedule_metric	\N	\N	ProjectScheduleDependency	\N	\N	\N	previous task, prior activity, dependency before	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh2005bvct0wl1j1n75	successor	successor	schedule_metric	\N	\N	ProjectScheduleDependency	\N	\N	\N	next task, following activity, dependency after	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh2005cvct0onm3jau1	float	float	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	slack, allowable delay, free float, total float	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh2005dvct01oim41kp	planned progress	planned_progress	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	planned accomplishment, target progress, scheduled progress	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh2005evct0benndlqx	actual progress	actual_progress	schedule_metric	\N	\N	ProjectAccomplishment	\N	\N	\N	actual accomplishment, real progress, reported progress	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005fvct0f72da141	recovery plan	recovery_plan	schedule_metric	\N	\N	RecoveryPlan	\N	\N	\N	catch-up plan, acceleration plan, delay mitigation, corrective schedule	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005gvct0bzqht4x7	executive dashboard	executive_dashboard	module	\N	\N	ExecutiveDashboard	\N	\N	\N	command center, management dashboard, CEO dashboard, top management view	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005hvct0qa368kjg	kpi	kpi	report	\N	\N	KPIReport	\N	\N	\N	key performance indicator, performance metric, management metric, dashboard indicator	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005ivct09ukyzf6c	executive summary	executive_summary	report	\N	\N	ExecutiveReport	\N	\N	\N	management summary, CEO summary, board report, project summary	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005jvct0l7wi08mj	project portfolio	project_portfolio	report	\N	\N	ProjectPortfolio	\N	\N	\N	all projects, multi-project dashboard, portfolio summary, project list summary	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005kvct0c6iyqlzz	risk	risk	project_metric	\N	\N	RiskRegister	\N	\N	\N	issue, warning, alert, concern, project risk, critical item	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005lvct0bqfm96ue	high-risk project	high_risk_project	project_metric	\N	\N	RiskRegister	\N	\N	\N	critical project, troubled project, red flag project, risky project	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005mvct0rwvdjia6	delayed project	delayed_project	project_metric	\N	\N	ProjectSchedule	\N	\N	\N	behind schedule project, late project, project with slippage	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005nvct0zc6vxd82	cost alert	cost_alert	finance_metric	\N	\N	Alert	\N	\N	\N	over budget alert, cost warning, expense alert, budget warning	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005ovct05lwar5fx	procurement alert	procurement_alert	procurement_metric	\N	\N	Alert	\N	\N	\N	purchasing warning, undelivered PO alert, procurement risk	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005pvct0d9j8qac2	billing alert	billing_alert	billing_metric	\N	\N	Alert	\N	\N	\N	collection warning, unpaid billing alert, billing delay alert	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005qvct0s7gzthn3	ai validation	ai_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	validation, AI checking, automated validation, intelligent validation	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh3005rvct005vj5wy1	photo validation	photo_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	image validation, site photo checking, photo evidence validation	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005svct0g3iyrrdc	satellite validation	satellite_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	satellite check, satellite image validation, remote sensing validation	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005tvct0dhg47zdd	drone validation	drone_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	drone inspection, aerial validation, drone image validation	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005uvct0meaghpt5	cctv validation	cctv_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	camera validation, live camera checking, video validation	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005vvct0civ20bqa	plan validation	plan_validation	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	drawing validation, submitted plan validation, blueprint validation, construction plan check	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005wvct0yffxhoah	geotag	geotag	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	GPS, coordinates, location tag, photo location, EXIF location	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005xvct0e0fdvqfp	timestamp	timestamp	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	date taken, time taken, photo time, evidence date	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005yvct0vhwcgxyv	duplicate photo	duplicate_photo	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	repeated photo, reused photo, same image, duplicate image evidence	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh4005zvct0htp1s4rh	manipulated photo	manipulated_photo	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	edited photo, fake photo, altered image, suspicious image	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40060vct02djrze9w	validation score	validation_score	ai_validation_term	\N	\N	AIValidationResult	\N	\N	\N	confidence score, AI score, evidence score, validation rating	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40061vct0e9cbl1nq	report	report	report	\N	\N	Report	\N	\N	\N	summary, generated report, printed report, PDF report, Excel report	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40062vct02nqwqpre	procurement report	procurement_report	report	\N	\N	ProcurementReport	\N	\N	\N	purchasing report, PO report, supplier report, procurement summary	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40063vct0ac2tl6ka	inventory report	inventory_report	report	\N	\N	InventoryReport	\N	\N	\N	stock report, material report, warehouse report, inventory summary	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40064vct0u4kz90aq	billing report	billing_report	report	\N	\N	BillingReport	\N	\N	\N	progress billing report, client billing report, collection report	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh40065vct0uipo3962	payroll report	payroll_report	report	\N	\N	PayrollReport	\N	\N	\N	salary report, payroll summary, payroll register, worker payroll report	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh50066vct05dwufgkh	finance report	finance_report	report	\N	\N	FinanceReport	\N	\N	\N	financial report, accounting report, management financial report	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh50067vct0xbz2s5zs	cost variance report	cost_variance_report	report	\N	\N	CostVarianceReport	\N	\N	\N	budget variance report, actual vs budget report, cost comparison report	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh50068vct0orimi7vh	profitability report	profitability_report	report	\N	\N	ProfitabilityReport	\N	\N	\N	margin report, project profit report, profit and loss report	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh50069vct05ecvos5c	delay report	delay_report	report	\N	\N	DelayReport	\N	\N	\N	slippage report, schedule variance report, delayed activities report	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006avct0on8utzes	manual	manual	SOP	\N	\N	KnowledgeBaseDocument	\N	\N	\N	operating manual, user guide, training guide, system manual	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006bvct0pk814x8b	sop	sop	SOP	\N	\N	KnowledgeBaseDocument	\N	\N	\N	standard operating procedure, procedure, operating procedure, work instruction	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006cvct0mjdx3kmw	checklist	checklist	SOP	\N	\N	KnowledgeBaseDocument	\N	\N	\N	task list, process checklist, operating checklist, compliance checklist	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006dvct0ci1kkekh	knowledge base	knowledge_base	document	\N	\N	KnowledgeBaseDocument	\N	\N	\N	document library, reference library, AI knowledge center, help center	\N	\N	\N	\N	\N	PUBLIC	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006evct0o1awxin2	notebook	notebook	document	\N	\N	KnowledgeBaseDocument	\N	\N	\N	AI notebook, Gemini notebook, reference notebook, knowledge notebook	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006fvct0f4s7nrjm	approval	approval	workflow	\N	\N	Approval	\N	\N	\N	pending, approve, reject, approval process, approval workflow, approval status	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006gvct02qnaaavc	pending approval	pending_approval	approval_metric	\N	\N	Approval	\N	\N	\N	for approval, waiting approval, pending review, approval queue	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006hvct0xedjfirh	approved	approved	approval_metric	\N	\N	Approval	\N	\N	\N	accepted, authorized, cleared, approved transaction	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006ivct0jpwdja1l	rejected	rejected	approval_metric	\N	\N	Approval	\N	\N	\N	denied, disapproved, returned, not approved	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006jvct0u6qrf3zg	reviewer	reviewer	workflow	\N	\N	Approval	\N	\N	\N	checker, verifier, reviewing officer, review approver	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh5006kvct02iuxniqd	approver	approver	workflow	\N	\N	Approval	\N	\N	\N	approving officer, final approver, authorized approver	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006lvct0vdv0x4uo	audit trail	audit_trail	audit_term	\N	\N	AuditLog	\N	\N	\N	logs, activity log, history, transaction history, change history	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006mvct0b2s7t8qu	user log	user_log	audit_term	\N	\N	AuditLog	\N	\N	\N	login history, user activity, access log, account log	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006nvct0aqslf1f7	edit history	edit_history	audit_term	\N	\N	AuditLog	\N	\N	\N	change history, update log, modification history, revised record	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006ovct0dixgmgik	deleted record	deleted_record	audit_term	\N	\N	AuditLog	\N	\N	\N	removed record, deleted transaction, trash record, archived deletion	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006pvct06799dzu4	unauthorized access	unauthorized_access	audit_term	\N	\N	SecurityLog	\N	\N	\N	access denied, restricted access, permission denied, blocked access	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006qvct0bkjjrplh	confidential	confidential	access_control	\N	\N	\N	\N	\N	\N	private, restricted, sensitive, protected information	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006rvct0buhpogw9	document	document	document	\N	\N	Document	\N	\N	\N	file, attachment, uploaded file, record file, supporting document	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006svct0310y0ry9	attachment	attachment	document	\N	\N	Attachment	\N	\N	\N	attached file, supporting file, uploaded attachment, proof document	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006tvct0veg7730f	pdf	pdf	document	\N	\N	Document	\N	\N	\N	PDF file, printable document, scanned document	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006uvct0lt1wqhi6	excel	excel	document	\N	\N	Document	\N	\N	\N	spreadsheet, XLSX, Excel file, workbook, BOQ file	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006vvct074sf2ibh	csv	csv	document	\N	\N	Document	\N	\N	\N	CSV file, comma separated file, import file, data file	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006wvct0l6tcg8ja	image	image	document	\N	\N	Attachment	\N	\N	\N	photo, picture, site image, uploaded image, proof photo	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh6006xvct04mct9isr	video	video	document	\N	\N	Attachment	\N	\N	\N	mp4, cctv clip, drone footage	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh7006yvct0qlkkzkt1	MRF	mrf	database_table	\N	\N	MaterialRequest	\N	\N	\N	material request, material request form, materials request, request for materials	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh7006zvct0qpurjgu1	PR	pr	database_table	\N	\N	PurchaseRequest	\N	\N	\N	purchase request, procurement request, request to purchase	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70070vct0awk5el8y	PO	po	database_table	\N	\N	PurchaseOrder	\N	\N	\N	purchase order, procurement order, supplier order	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70072vct0qk2wx5gz	DR	dr	database_table	\N	\N	DeliveryReceipt	\N	\N	\N	delivery receipt, receiving report, goods receipt	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70073vct0nfam6ly1	MIS	mis	database_table	\N	\N	MaterialIssuance	\N	\N	\N	material issuance, material issuance slip, issuance slip	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70074vct0gw781bao	SWA	swa	report	\N	\N	AccomplishmentReport	\N	\N	\N	statement of work accomplished, accomplishment report, progress report	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70075vct0r017ycpk	VO	vo	database_table	\N	\N	VariationOrder	\N	\N	\N	variation order, change order, project variation, contract variation	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70076vct0uovyibvc	EOT	eot	schedule_metric	\N	\N	VariationOrder	\N	\N	\N	extension of time, time extension, additional time	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70077vct0towru4ih	JO	jo	database_table	\N	\N	JobOrder	\N	\N	\N	job order, work order, service order, short subcontract	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70078vct0avfbkz2i	AP	ap	finance_metric	\N	\N	AccountsPayable	\N	\N	\N	accounts payable, payable, unpaid supplier, outstanding payable	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh70079vct04rkr7elv	AR	ar	finance_metric	\N	\N	AccountsReceivable	\N	\N	\N	accounts receivable, receivable, collectible, client balance	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh7007avct0ivnrxhtp	GL	gl	database_table	\N	\N	GeneralLedger	\N	\N	\N	general ledger, ledger, account ledger	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh7007bvct0mb4mxuti	COA	coa	database_table	\N	\N	ChartOfAccount	\N	\N	\N	chart of accounts, account codes, account list	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007cvct0lngaz4jh	JE	je	database_table	\N	\N	JournalEntry	\N	\N	\N	journal entry, accounting entry, debit credit entry	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007dvct0qr8fro80	CV	cv	database_table	\N	\N	Voucher	\N	\N	\N	check voucher, cash voucher, payment voucher, disbursement voucher	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007evct0hy6t0t3x	OR	or	database_table	\N	\N	OfficialReceipt	\N	\N	\N	official receipt, receipt, collection receipt, payment receipt	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007fvct0q0y1uq0v	OT	ot	payroll_metric	\N	\N	PayrollDetail	\N	\N	\N	overtime, extra hours, extended work	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007gvct06nbb8m47	CA	ca	payroll_metric	\N	\N	CashAdvance	\N	\N	\N	cash advance, salary advance, worker advance	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007hvct0c3afvcqe	HDMF	hdmf	payroll_metric	\N	\N	PayrollDeduction	\N	\N	\N	Pag-IBIG, Pagibig, housing contribution	\N	\N	\N	\N	\N	CONFIDENTIAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007ivct00fdxkcxk	status	status	database_field	\N	\N	\N	\N	\N	\N	state, condition, current status, progress state, transaction status	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007jvct08rsgmt6r	approval status	approval_status	database_field	\N	\N	Approval	\N	\N	\N	approval state, approved status, pending status, review status	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007kvct0nbjz37lo	date	date	database_field	\N	\N	\N	\N	\N	\N	transaction date, record date, document date, encoded date	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007lvct0ivmce5pb	created date	created_date	database_field	\N	\N	\N	\N	\N	\N	created at, encoded date, date created, record creation date	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007mvct08guuqaa7	updated date	updated_date	database_field	\N	\N	\N	\N	\N	\N	updated at, modified date, last update, last modified	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007nvct0exi7f0jo	prepared by	prepared_by	database_field	\N	\N	\N	\N	\N	\N	encoded by, created by, prepared person, maker	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh8007ovct04ak9tjay	reviewed by	reviewed_by	database_field	\N	\N	\N	\N	\N	\N	checked by, verified by, reviewer, reviewed person	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007pvct0jiiujmmz	approved by	approved_by	database_field	\N	\N	\N	\N	\N	\N	approver, authorized by, approved person, final approver	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007qvct0dv9wy791	rejected by	rejected_by	database_field	\N	\N	\N	\N	\N	\N	disapproved by, denied by, returned by	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007rvct0tptl0yld	amount	amount	database_field	\N	\N	\N	\N	\N	\N	total amount, value, cost, price, peso amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007svct03oio8sle	total amount	total_amount	database_field	\N	\N	\N	\N	\N	\N	grand total, total cost, total value, total price	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007tvct08i0et9k5	balance	balance	database_field	\N	\N	\N	\N	\N	\N	remaining balance, unpaid balance, unserved balance, outstanding balance	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007uvct0ftbdx411	remarks	remarks	database_field	\N	\N	\N	\N	\N	\N	comment, notes, explanation, reason, annotation	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007vvct0z7cgf3mv	project id	project_id	database_field	\N	\N	\N	\N	\N	\N	project reference, assigned project, project link	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007wvct0yvcv9wdp	supplier id	supplier_id	database_field	\N	\N	\N	\N	\N	\N	supplier reference, vendor reference, supplier link	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007xvct06mio0qqe	user id	user_id	database_field	\N	\N	\N	\N	\N	\N	user reference, account reference, actor id	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007yvct024y2q4sq	actual vs awarded	actual_vs_awarded	comparison_term	\N	\N	ProjectProfitability	\N	\N	\N	actual against contract, actual cost vs awarded cost, actual versus awarded, actual vs contract	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh9007zvct071wpivzi	actual vs budget	actual_vs_budget	comparison_term	\N	\N	BudgetVariance	\N	\N	\N	budget variance, actual expense vs budget, over budget, under budget	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh90080vct0isyae5fc	awarded vs procurement boq	awarded_vs_procurement_boq	comparison_term	\N	\N	BOQVariance	\N	\N	\N	awarded BOQ vs procurement BOQ, contract BOQ vs benchmark BOQ, awarded BOQ versus forecast BOQ	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorh90081vct00719lbs4	requested vs purchased	requested_vs_purchased	comparison_term	\N	\N	ProcurementVariance	\N	\N	\N	MRF vs PO, material request vs purchase order, requested quantity versus ordered quantity	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0082vct0euaqei66	purchased vs delivered	purchased_vs_delivered	comparison_term	\N	\N	ProcurementVariance	\N	\N	\N	PO vs DR, ordered versus delivered, purchase order balance	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0083vct06elxfcpi	delivered vs issued	delivered_vs_issued	comparison_term	\N	\N	InventoryVariance	\N	\N	\N	DR vs MIS, delivered materials versus issued materials, warehouse balance	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0084vct0cnud2014	issued vs installed	issued_vs_installed	comparison_term	\N	\N	MaterialUsageVariance	\N	\N	\N	MIS vs accomplishment, issued materials versus installed quantity, material issued vs work accomplished	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0085vct0pz1g8vhn	installed vs billed	installed_vs_billed	comparison_term	\N	\N	BillingVariance	\N	\N	\N	accomplishment vs billing, installed quantity versus billed quantity, completed works vs claimed works	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0086vct0b5c1qw63	billed vs collected	billed_vs_collected	comparison_term	\N	\N	BillingCollectionVariance	\N	\N	\N	billing versus collection, claims versus payments, receivables balance	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0087vct0rhfgupwm	planned vs actual	planned_vs_actual	comparison_term	\N	\N	ScheduleVariance	\N	\N	\N	target versus actual, schedule variance, planned progress versus actual progress	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0088vct033h2e32h	how much have we spent	how_much_have_we_spent	computed_metric	\N	\N	ProjectCostSummary	\N	\N	\N	total spent, amount spent, expenses to date, actual expenses, cost incurred, spending so far	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha0089vct0e4xa3jh5	what is our profit	what_is_our_profit	computed_metric	\N	\N	ProjectProfitability	\N	\N	\N	profitability, profit, margin, net profit, gross profit, project gain, project loss	\N	\N	\N	\N	\N	EXECUTIVE_ONLY	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008avct0j0qc0uyh	what is pending	what_is_pending	approval_metric	\N	\N	Approval	\N	\N	\N	pending items, pending approvals, waiting action, pending transactions	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008bvct0i0o2yy7l	what is delayed	what_is_delayed	schedule_metric	\N	\N	ProjectSchedule	\N	\N	\N	delayed items, late activities, behind schedule, overdue tasks	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008cvct0mkcggb3s	what is unpaid	what_is_unpaid	finance_metric	\N	\N	AccountsPayable	\N	\N	\N	unpaid suppliers, unpaid subcontractors, unpaid invoices, outstanding payables	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008dvct0qvr1lz6v	what is uncollected	what_is_uncollected	finance_metric	\N	\N	AccountsReceivable	\N	\N	\N	unpaid billings, client balance, receivables, uncollected amount	\N	\N	\N	\N	\N	RESTRICTED	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008evct0hc1vs3ri	who approved	who_approved	audit_term	\N	\N	Approval	\N	\N	\N	approved by, approving person, approval history, approval trail	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1oorha008fvct0ti1tdmy4	who prepared	who_prepared	audit_term	\N	\N	AuditLog	\N	\N	\N	prepared by, encoded by, created by, maker	\N	\N	\N	\N	\N	INTERNAL	f	f	SEEDED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:17:45.473	2026-07-01 06:17:45.473
cmr1pf60b02lfvc90ptza07sv	user	user	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:17.387	2026-07-01 06:38:17.387
cmr1pf6w902lgvc9051y5yic2	account	account	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:18.537	2026-07-01 06:38:18.537
cmr1pf7ri02lhvc90es4qxgn9	user profile	user profile	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:19.663	2026-07-01 06:38:19.663
cmr1pf8mc02livc903tq1tw92	user record	user record	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:20.773	2026-07-01 06:38:20.773
cmr1pf9hb02ljvc90v9ejxivh	account holder	account holder	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:21.887	2026-07-01 06:38:21.887
cmr1pfaii02lkvc90as2spl71	system user	system user	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:23.003	2026-07-01 06:38:23.003
cmr1pfbdk02llvc90wp24o6sb	member	member	auto_generated_alias	User Management	\N	User	\N	The 'User' table represents the individuals who interact with the ERP system, including employees, administrators, and other stakeholders. It stores user profiles and access rights necessary for system operation.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:24.344	2026-07-01 06:38:24.344
cmr1pfg6k02lnvc905ci7ksyy	project	project	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:30.572	2026-07-01 06:38:30.572
cmr1pfh1m02lovc90az3nlrcb	projects	projects	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:31.69	2026-07-01 06:38:31.69
cmr1pfhwn02lpvc90f7bakdjw	project list	project list	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:32.807	2026-07-01 06:38:32.807
cmr1pfiri02lqvc90ea0t4k1x	project records	project records	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:33.919	2026-07-01 06:38:33.919
cmr1pfjme02lrvc90e4zkvl8y	project details	project details	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:35.031	2026-07-01 06:38:35.031
cmr1pfkhj02lsvc90hog5kja3	project information	project information	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:36.151	2026-07-01 06:38:36.151
cmr1pflcq02ltvc90quuqsjte	project data	project data	auto_generated_alias	Project Management	\N	Project	\N	The 'Project' table in an ERP system represents specific projects that are being managed within the organization, including details such as project name, description, start and end dates, budget, and associated resources.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:37.274	2026-07-01 06:38:37.274
cmr1pfpcb02lvvc90mkg0wq5j	supplier	supplier	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:42.444	2026-07-01 06:38:42.444
cmr1pfq7602lwvc909ixa9pd6	vendor	vendor	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:43.554	2026-07-01 06:38:43.554
cmr1pfr2502lxvc902gretlui	supplier master	supplier master	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:44.669	2026-07-01 06:38:44.669
cmr1pfrx302lyvc90tx7oihg0	supplier information	supplier information	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:45.783	2026-07-01 06:38:45.783
cmr1pfsrx02lzvc903y80erm7	supplier details	supplier details	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:46.894	2026-07-01 06:38:46.894
cmr1pftms02m0vc90bu0hivjm	vendor info	vendor info	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:48.005	2026-07-01 06:38:48.005
cmr1pfuhm02m1vc90okiwyf35	provider	provider	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:49.114	2026-07-01 06:38:49.114
cmr1pfvch02m2vc90vgihv6ji	commercial partner	commercial partner	auto_generated_alias	Procurement	\N	Supplier	\N	The 'Supplier' table represents entities that provide goods or services to a company within the ERP system. It holds critical information regarding vendor details necessary for procurement and supply chain management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:50.226	2026-07-01 06:38:50.226
cmr1pfzr502m4vc904myw7dx7	purchaseorder	purchaseorder	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:55.937	2026-07-01 06:38:55.937
cmr1pg0sm02m5vc90czzm0s5v	po	po	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:57.065	2026-07-01 06:38:57.065
cmr1pg1nq02m6vc90nvy9kt9m	purchase order	purchase order	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:58.406	2026-07-01 06:38:58.406
cmr1pg2iz02m7vc90jcycsqe0	order	order	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:38:59.531	2026-07-01 06:38:59.531
cmr1pg3e002m8vc908xasdte8	buy order	buy order	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:00.649	2026-07-01 06:39:00.649
cmr1pg48v02m9vc903r5v1bwl	procurement order	procurement order	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:01.759	2026-07-01 06:39:01.759
cmr1pg53y02mavc9083umg975	order request	order request	auto_generated_alias	Procurement	\N	PurchaseOrder	\N	The 'PurchaseOrder' table represents an agreement between a buyer and a seller, outlining the details of goods or services to be provided, including quantities, prices, and terms as part of the procurement process.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:02.879	2026-07-01 06:39:02.879
cmr1pg9jl02mcvc90viy77yfu	expense	expense	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:08.625	2026-07-01 06:39:08.625
cmr1pgaeh02mdvc90vhw4dibw	expenses	expenses	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:09.737	2026-07-01 06:39:09.737
cmr1pgb9g02mevc903gqfhhw0	cost records	cost records	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:10.852	2026-07-01 06:39:10.852
cmr1pgc4f02mfvc90uy6rym7q	expense reports	expense reports	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:11.967	2026-07-01 06:39:11.967
cmr1pgd6302mgvc903sdkgc12	spending	spending	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:13.094	2026-07-01 06:39:13.094
cmr1pge1902mhvc905eac1i9t	costs	costs	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:14.446	2026-07-01 06:39:14.446
cmr1pgewg02mivc90a3ufj9sq	financial outlay	financial outlay	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:15.568	2026-07-01 06:39:15.568
cmr1pgfri02mjvc90pa49t94u	expenditures	expenditures	auto_generated_alias	Finance	\N	Expense	\N	The 'Expense' table tracks all spending activities within an organization, including operational costs and project expenditures, ensuring accurate financial reports and budget management.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:16.686	2026-07-01 06:39:16.686
cmr1pgjiq02mlvc90teb93657	dailytimerecord	dailytimerecord	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:21.554	2026-07-01 06:39:21.554
cmr1pgkdo02mmvc901xh25s0y	time entry	time entry	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:22.669	2026-07-01 06:39:22.669
cmr1pgl8k02mnvc9036h0vjac	attendance record	attendance record	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:23.781	2026-07-01 06:39:23.781
cmr1pgm4n02movc90eoz8yf21	employee time log	employee time log	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:24.935	2026-07-01 06:39:24.935
cmr1pgmzm02mpvc90li6b0t1j	time tracking	time tracking	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:26.05	2026-07-01 06:39:26.05
cmr1pgnuv02mqvc90zp92q7dd	attendance	attendance	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:27.175	2026-07-01 06:39:27.175
cmr1pgopz02mrvc90n70wkvkh	work hours	work hours	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:28.296	2026-07-01 06:39:28.296
cmr1pgpr002msvc90ziz57ra3	employee attendance	employee attendance	auto_generated_alias	HR	\N	DailyTimeRecord	\N	The Daily Time Record table captures employee attendance and working hours, essential for payroll, project management, and compliance tracking in an ERP system.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:29.408	2026-07-01 06:39:29.408
cmr1pguyt02muvc90lcgmk7vy	payrollperiod	payrollperiod	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:36.39	2026-07-01 06:39:36.39
cmr1pgvu302mvvc9093pp9om6	pay period	pay period	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:37.515	2026-07-01 06:39:37.515
cmr1pgwp702mwvc90glhag7lq	payroll cycle	payroll cycle	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:38.635	2026-07-01 06:39:38.635
cmr1pgxk402mxvc90zl3vq366	salary period	salary period	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:39.749	2026-07-01 06:39:39.749
cmr1pgyez02myvc90flemvnf4	payroll interval	payroll interval	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:40.859	2026-07-01 06:39:40.859
cmr1pgz9x02mzvc900kth5r31	wage period	wage period	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:41.973	2026-07-01 06:39:41.973
cmr1ph05602n0vc90uz02ip8b	compensation period	compensation period	auto_generated_alias	HR	\N	PayrollPeriod	\N	The 'PayrollPeriod' table represents the time frames for which employee wages are calculated and processed in the payroll system of an ERP. It defines the duration (e.g., weekly, bi-weekly, monthly) during which employees earn their salary or wages.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:43.098	2026-07-01 06:39:43.098
cmr1ph71702n2vc90fq22jumv	materialissuance	materialissuance	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:52.028	2026-07-01 06:39:52.028
cmr1ph7wk02n3vc904ahai7n1	material dispatch	material dispatch	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:53.156	2026-07-01 06:39:53.156
cmr1ph8s502n4vc90zugx7bdq	material release	material release	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:54.293	2026-07-01 06:39:54.293
cmr1ph9n402n5vc90kish61b8	material withdrawal	material withdrawal	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:55.408	2026-07-01 06:39:55.408
cmr1phaib02n6vc90d3vg7jyd	material allocation	material allocation	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:56.532	2026-07-01 06:39:56.532
cmr1phbdb02n7vc9091l7f24v	material distribution	material distribution	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:57.647	2026-07-01 06:39:57.647
cmr1phc8e02n8vc90b7bu7l95	inventory outflow	inventory outflow	auto_generated_alias	Inventory Management	\N	MaterialIssuance	\N	The 'MaterialIssuance' table represents transactions where materials or resources are issued from inventory for use in production, projects, or other operational needs, tracking consumption and allocation of stocks.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:39:58.767	2026-07-01 06:39:58.767
cmr1phh4402navc902at9034o	subcontractpackage	subcontractpackage	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:05.092	2026-07-01 06:40:05.092
cmr1phi5d02nbvc90ukrpk68u	subcontractor package	subcontractor package	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:06.213	2026-07-01 06:40:06.213
cmr1phj0j02ncvc90sji0aeys	subcontract agreement	subcontract agreement	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:07.555	2026-07-01 06:40:07.555
cmr1phjvj02ndvc9078yv1wlz	subcontract module	subcontract module	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:08.672	2026-07-01 06:40:08.672
cmr1phkqi02nevc90tbms3fey	subcontract	subcontract	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:09.787	2026-07-01 06:40:09.787
cmr1phllb02nfvc908xuwgtgv	sub-package	sub-package	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:10.895	2026-07-01 06:40:10.895
cmr1phmgi02ngvc90scltkdp2	outsourcing	outsourcing	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:12.018	2026-07-01 06:40:12.018
cmr1phnbp02nhvc90wsqhg718	third-party contract	third-party contract	auto_generated_alias	Project Management	\N	SubcontractPackage	\N	The SubcontractPackage table represents specific tasks or portions of a project that are delegated to subcontractors, detailing aspects like scope, timelines, and deliverables.	\N	\N	\N	\N	\N	\N	\N	PUBLIC	f	f	AUTO_GENERATED	1	t	\N	\N	\N	\N	\N	f	2026-07-01 06:40:13.141	2026-07-01 06:40:13.141
\.


--
-- Data for Name: AiRagNoiseExclusion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiRagNoiseExclusion" (id, "noiseTerm", "normalizedTerm", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagSchemaMap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiRagSchemaMap" (id, "moduleName", "tableName", "fieldName", "fieldAlias", "fieldDescription", "dataType", "relationshipTable", "relationshipField", searchable, filterable, comparable, aggregatable, confidential, "requiredAccessRole", "requiredPermission", "projectScoped", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRegistryCleanupReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiRegistryCleanupReport" (id, "runBy", "runAt", "totalRowsScanned", "duplicateGroupsFound", "rowsMerged", "aliasesMerged", "schemaFieldsMoved", "uiLabelsMoved", "noiseTermsExcluded", "acronymsFixed", "activeRowsRemaining", "rollbackSupported", "rolledBackAt", "rolledBackBy") FROM stdin;
\.


--
-- Data for Name: AiSystemEnumRegistry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiSystemEnumRegistry" (id, "enumValue", "normalizedValue", "enumCategory", "businessMeaning", aliases, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiUiActionRegistry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AiUiActionRegistry" (id, "uiLabel", "normalizedLabel", "componentOrPage", "actionType", aliases, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Allowance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Allowance" (id, "workerId", type, amount, "isTaxable", frequency, "effectiveDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "userId", "userRole", "moduleName", "transactionId", "actionType", "oldValue", "newValue", remarks, "ipAddress", "deviceInfo", "createdAt") FROM stdin;
cmrirfspj000aif04kgitnz75	cmqiy15bq0000vc1cq1f3zg6j	\N	SYSTEM_SETTINGS	\N	DELETE	\N	\N	MASTER RESET: All transactional and master data wiped. Only Users, System Roles, Access Matrix, and Knowledge Base preserved.	\N	\N	2026-07-13 05:06:51.032
cmrn6d3o90007vcx8ejxprsmc	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:15:44.213
cmrn7cv2j0009vcx89tkkzq8r	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:43:32.683
cmrn7fgtw0001vc6c0m45wm07	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:45:34.193
cmrn7ifj60003vc6cr47qxwge	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user manager@onesystemserp.com	\N	\N	2026-07-16 07:47:52.483
cmrn7ifvl0005vc6cmwc9mh5c	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user manager@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:47:52.929
cmrn7igz20007vc6cf4lq96zq	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user director@onesystemserp.com	\N	\N	2026-07-16 07:47:54.351
cmrn7ih5b0009vc6cv2fgfh3g	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user director@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:47:54.575
cmrn7imv2000bvc6c49agbe5e	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:48:01.983
cmrn7kmo2000dvc6cacay3471	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user manager@onesystemserp.com	\N	\N	2026-07-16 07:49:35.043
cmrn7kn0g000fvc6c9r2rq9gk	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user manager@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:49:35.489
cmrn7kofl000hvc6co7akfuwn	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user director@onesystemserp.com	\N	\N	2026-07-16 07:49:37.33
cmrn7kols000jvc6c3ibvybqz	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user director@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:49:37.552
cmrn7kuvr000lvc6cj27k562s	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:49:45.687
cmrn7l0id000nvc6c6vyg9q4s	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	EXISTING_PROJECT_SHELL_ADOPTED_FOR_RECONSTRUCTION	\N	\N	{"rationale":"Project shell verified against authoritative reconstruction manifest","manifest":"uat-v2-reconstruction-manifest.json"}	127.0.0.1	\N	2026-07-16 07:49:52.981
cmrn7l475009svc6cex18v0q7	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_TECHNICALLY_APPROVED	\N	\N	{"comment":"Technical review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17","lines":326,"totals":43106674.89,"zeroDifference":true}	127.0.0.1	\N	2026-07-16 07:49:57.761
cmrn7lekq009uvc6cuo7iu7js	cmrinikue0017vchcnxm8wqzn	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_APPROVED	\N	\N	{"comment":"Final review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17"}	127.0.0.1	\N	2026-07-16 07:50:11.21
cmrn7lfyx009wvc6cu21i713e	cmrinikue0017vchcnxm8wqzn	\N	Project Reconstruction	\N	LOCKED_BOQ_IMMUTABILITY_PASSED	\N	\N	{"locked":true,"checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17"}	127.0.0.1	\N	2026-07-16 07:50:13.017
cmrn7np1n009yvc6cis6bas9o	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user manager@onesystemserp.com	\N	\N	2026-07-16 07:51:58.091
cmrn7np7y00a0vc6cf64tiql7	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user manager@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:51:58.318
cmrn7nqtn00a2vc6c1i54cgiz	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user director@onesystemserp.com	\N	\N	2026-07-16 07:52:00.174
cmrn7nr0100a4vc6c79uz22ob	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user director@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:52:00.625
cmrn7nxbh00a6vc6cn5o9gbel	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:52:08.813
cmrn7o2x700a8vc6czg2gpni6	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	EXISTING_PROJECT_SHELL_ADOPTED_FOR_RECONSTRUCTION	\N	\N	{"rationale":"Project shell verified against authoritative reconstruction manifest","manifest":"uat-v2-reconstruction-manifest.json"}	127.0.0.1	\N	2026-07-16 07:52:16.076
cmrn7o42l00aavc6cnhmj9r6q	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_TECHNICALLY_APPROVED	\N	\N	{"comment":"Technical review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17","lines":326,"totals":43106674.89,"zeroDifference":true}	127.0.0.1	\N	2026-07-16 07:52:17.566
cmrn7oa9c00acvc6cl5sqmxtu	cmrinikue0017vchcnxm8wqzn	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_APPROVED	\N	\N	{"comment":"Final review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17"}	127.0.0.1	\N	2026-07-16 07:52:25.584
cmrn7s55k00aevc6cmzegw3l8	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user manager@onesystemserp.com	\N	\N	2026-07-16 07:55:25.591
cmrn7s5i800agvc6cm2zwk2yt	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user manager@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:55:26.048
cmrn7s6yf00aivc6c9lbpb5e6	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user director@onesystemserp.com	\N	\N	2026-07-16 07:55:27.928
cmrn7s74s00akvc6cazwy86kf	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user director@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:55:28.156
cmrn7sd5f00amvc6cgu9ilwlq	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:55:35.955
cmrn7skhv00aovc6c1r3ht2e8	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	EXISTING_PROJECT_SHELL_ADOPTED_FOR_RECONSTRUCTION	\N	\N	{"rationale":"Project shell verified against authoritative reconstruction manifest","manifest":"uat-v2-reconstruction-manifest.json"}	127.0.0.1	\N	2026-07-16 07:55:45.475
cmrn7smbx00aqvc6cgxfo6460	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_TECHNICALLY_APPROVED	\N	\N	{"comment":"Technical review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17","lines":326,"totals":43106674.89,"zeroDifference":true}	127.0.0.1	\N	2026-07-16 07:55:47.853
cmrn7stdx00asvc6cz1tiy3ef	cmrinikue0017vchcnxm8wqzn	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_APPROVED	\N	\N	{"comment":"Final review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17"}	127.0.0.1	\N	2026-07-16 07:55:56.997
cmrn7upfz00auvc6c750rv7vr	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user manager@onesystemserp.com	\N	\N	2026-07-16 07:57:25.2
cmrn7upma00awvc6cqe12lpeq	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user manager@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:57:25.427
cmrn7uqvm00ayvc6cpgdgpf6v	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	PASSWORD_RESET_COMPLETED	\N	\N	Password reset initiated and completed for user director@onesystemserp.com	\N	\N	2026-07-16 07:57:27.058
cmrn7ur1v00b0vc6c7qpdy6gc	cmqiy15bq0000vc1cq1f3zg6j	SUPER_ADMIN	USER_MANAGEMENT	\N	USER_SESSIONS_REVOKED	\N	\N	Sessions revoked for user director@onesystemserp.com via sessionVersion increment	\N	\N	2026-07-16 07:57:27.284
cmrn7uxba00b2vc6cj10nuxnj	cmqiy15bq0000vc1cq1f3zg6j	\N	Project Reconstruction	\N	RECONSTRUCTION_ACTORS_ASSIGNED	\N	\N	{"actors":["manager@onesystemserp.com","director@onesystemserp.com","engineer@onesystemserp.com"]}	127.0.0.1	\N	2026-07-16 07:57:35.398
cmrn7v2hb00b4vc6cspdjuoeo	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	EXISTING_PROJECT_SHELL_ADOPTED_FOR_RECONSTRUCTION	\N	\N	{"rationale":"Project shell verified against authoritative reconstruction manifest","manifest":"uat-v2-reconstruction-manifest.json"}	127.0.0.1	\N	2026-07-16 07:57:42.096
cmrn7v3af00b6vc6cvilerm37	cmrinimix001avchckwzmfxsu	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_TECHNICALLY_APPROVED	\N	\N	{"comment":"Technical review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17","lines":326,"totals":43106674.89,"zeroDifference":true}	127.0.0.1	\N	2026-07-16 07:57:43.143
cmrn7v8pl00b8vc6c007sygk7	cmrinikue0017vchcnxm8wqzn	\N	Project Reconstruction	\N	CHECKSUM_VARIANCE_APPROVED	\N	\N	{"comment":"Final review passed with 0 variance","checksum":"514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17"}	127.0.0.1	\N	2026-07-16 07:57:50.169
\.


--
-- Data for Name: AwardedBOQItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AwardedBOQItem" (id, "itemCode", category, description, unit, quantity, "directCost", "indirectCost", "combinedUnitCost", "totalCost", "previousQuantityAccomplished", "currentQuantityAccomplished", "totalQuantityAccomplished", "remainingQuantity", "percentageAccomplished", "amountAccomplished", "balanceAmount", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", "previousBilledQuantity", "currentBillingQuantity", "totalBilledQuantity", "revenueRecognized", "actualOrderedQuantity", "actualDeliveredQuantity", "actualInstalledQuantity", "finalApprovedInstalledQuantity", "materialSavingsQuantity", "materialSavingsAmount", "wastageQuantity", "actualCost", "costVariance", "aiValidationRequired", "requiredEvidenceType", status, "processingType", "projectId", "createdAt", "updatedAt") FROM stdin;
cmrn7l1nh000pvc6c3ndi4j41	BOQ-001	General Requirements	Mobilization and Demobilization	lot	1	103229	0	103229	103229	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nh000qvc6cn66c9cvn	BOQ-002	General Requirements	a. Project Management	lot	1	0	0	0	678976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000rvc6ce1vh80g0	BOQ-003	General Requirements	b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	0	0	0	279580	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000svc6cxp1a8iyb	BOQ-004	General Requirements	c.Quality Management	lot	1	0	0	0	279580	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000tvc6cvez6zlmy	BOQ-005	General Requirements	d. Engineering Management\r\n - Clarifications & Drawings	lot	1	0	0	0	319519	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000uvc6caexw6ij3	BOQ-006	General Requirements	a. Site Office	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000vvc6c0dxtd08x	BOQ-007	General Requirements	b. Warehouse	lot	1	0	0	0	51615	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000wvc6cuqanf0dq	BOQ-008	General Requirements	b. Site Office Materials & Communication	lot	1	0	0	0	14747	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ni000xvc6cij9du1gf	BOQ-009	General Requirements	c. Temporary Tools & Cleaning Materials	lot	1	0	0	0	7374	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj000yvc6c6kracpap	BOQ-010	General Requirements	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	0	0	0	184338	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj000zvc6ctifx86ce	BOQ-011	General Requirements	a. On-Site Water Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0010vc6cgbu91wgl	BOQ-012	General Requirements	b. On-Site Electric Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0011vc6c7h81scwt	BOQ-013	General Requirements	a. Safety Officer	lot	1	0	0	0	331807	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0012vc6c0j8mo8lc	BOQ-014	General Requirements	b. Personal Protective Equipment (PPE's)	lot	1	0	0	0	73735	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0013vc6cpbxzvlvv	BOQ-015	General Requirements	b. Security Guards	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0014vc6cp14gbwpx	BOQ-016	General Requirements	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	0	0	0	117976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0015vc6cky3o9fer	BOQ-017	General Requirements	b. Material Testing	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nj0016vc6cthr1zz4k	BOQ-018	General Requirements	a. Manpower Service	lot	1	0	0	0	147470	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk0017vc6cbfjw5g5i	BOQ-019	General Requirements	b. Engineer Transportation	lot	1	0	0	0	110603	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk0018vc6cnpn3z5vz	BOQ-020	Mechanical Works	ACCU- 18HP Model: RXQ18BYM	units	3	1259369.789999997	0	1259369.789999997	3778109.37	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk0019vc6cagohoa3u	BOQ-021	Mechanical Works	FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	6	0	0	0	330524.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk001avc6cf55htofo	BOQ-022	Mechanical Works	FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	0	0	0	168668.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk001bvc6c8d0pj2ey	BOQ-023	Mechanical Works	FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk001cvc6czpi9u8ax	BOQ-024	Mechanical Works	Navigation Wired Controller Model: BRC1E63	units	11	0	0	0	129367.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk001dvc6cyyb9wcgw	BOQ-025	Mechanical Works	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nk001evc6cp7j5gjba	BOQ-026	Mechanical Works	Refnet Joints Model: KHRP26A22T	units	2	0	0	0	8702.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001fvc6c5zx372k4	BOQ-027	Mechanical Works	Refnet Joints Model: KHRP26A33T	units	2	0	0	0	9879.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001gvc6cxrjnjkax	BOQ-028	Mechanical Works	Refnet Joints Model: KHRP26A732T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001hvc6csi19u85q	BOQ-029	Mechanical Works	Refnet Joints Model: KHRP26A733T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001ivc6cqltir1iz	BOQ-030	Mechanical Works	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001jvc6cerfmt2p8	BOQ-031	Mechanical Works	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001kvc6c67x8wm6k	BOQ-032	Mechanical Works	1/4"	length/s	10	0	0	0	21203.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001lvc6c950vt5nu	BOQ-033	Mechanical Works	3/8"	length/s	13	0	0	0	38380.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001mvc6cxu6fkmmz	BOQ-034	Mechanical Works	1/2"	length/s	14	0	0	0	65756.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nl001nvc6c018fcuhz	BOQ-035	Mechanical Works	5/8"	length/s	9	0	0	0	60983.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001ovc6cayesx0oy	BOQ-036	Mechanical Works	3/4"	length/s	9	0	0	0	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001pvc6cmmqw8zjp	BOQ-037	Mechanical Works	7/8"	length/s	2	0	0	0	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001qvc6ch7wiykpe	BOQ-038	Mechanical Works	1-1/8"	length/s	8	0	0	0	124535.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001rvc6ct71erhgm	BOQ-039	Mechanical Works	1-3/8"	length/s	5	0	0	0	105076.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001svc6c8eyu4kfp	BOQ-040	Mechanical Works	1-5/8"	length/s	4	0	0	0	84061.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001tvc6cn10aw46r	BOQ-041	Mechanical Works	1/4"	length/s	19	0	0	0	8237.83	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001uvc6cnm32th8u	BOQ-042	Mechanical Works	3/8"	length/s	26	0	0	0	11487.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nm001vvc6cvja9uvcp	BOQ-043	Mechanical Works	1/2"	length/s	27	0	0	0	13936.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn001wvc6c5l5r83x7	BOQ-044	Mechanical Works	5/8"	length/s	18	0	0	0	11334.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn001xvc6cm5mih1tr	BOQ-045	Mechanical Works	3/4"	length/s	17	0	0	0	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn001yvc6cj6jxqh5e	BOQ-046	Mechanical Works	7/8"	length/s	4	0	0	0	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn001zvc6cv9lcu2uo	BOQ-047	Mechanical Works	1-1/8"	length/s	15	0	0	0	12697.35	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn0020vc6cw0eo1wbv	BOQ-048	Mechanical Works	1-3/8"	length/s	10	0	0	0	8960.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn0021vc6czt3ctedi	BOQ-049	Mechanical Works	1-5/8"	length/s	8	0	0	0	7168.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn0022vc6czrc1kmf8	BOQ-050	Mechanical Works	Copper Pipe Fittings	lot	1	0	0	0	57975.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn0023vc6c9su257s0	BOQ-051	Mechanical Works	Isolation Ball Valves	pc/s	22	0	0	0	70564.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nn0024vc6c6vuznlr1	BOQ-052	Mechanical Works	PVC Cladding Works	lot	1	0	0	0	22281.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no0025vc6cddyi28nd	BOQ-053	Mechanical Works	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no0026vc6c40mi1qye	BOQ-054	Mechanical Works	32mm dia. uPVC blue pipe PNS 65	length/s	39	0	0	0	15761.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no0027vc6ctp3lqo7t	BOQ-055	Mechanical Works	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	22	0	0	0	14120.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no0028vc6c8aygbw4z	BOQ-056	Mechanical Works	3/4'' thick for 32mm pvc	length/s	77	0	0	0	32930.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no0029vc6cfhnwcdqo	BOQ-057	Mechanical Works	3/4'' thick for 50mm pvc	length/s	43	0	0	0	34940.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no002avc6ci11idtgy	BOQ-058	Mechanical Works	(5.0m pump Lift) Model: BDU513A450VE	pcs	9	0	0	0	274258.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no002bvc6cdgqghbg9	BOQ-059	Mechanical Works	Wye Reducer 50 x 32	pcs	11	0	0	0	2117.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1no002cvc6cgcmnlou5	BOQ-060	Mechanical Works	Tee 32mm	pcs	2	0	0	0	106.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002dvc6ckwi1df09	BOQ-061	Mechanical Works	Tee Reducer 50 x 32	pcs	2	0	0	0	406.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002evc6ccpu5aj1t	BOQ-062	Mechanical Works	Elbow 32mm	pcs	6	0	0	0	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002fvc6c7l3ora1r	BOQ-063	Mechanical Works	Cleanout 50mm	pcs	4	0	0	0	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002gvc6cdyjfhpwv	BOQ-064	Mechanical Works	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002hvc6c1z5p6p94	BOQ-065	Mechanical Works	Metallic Flexible Conduit 20mm	m	586	0	0	0	38599.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002ivc6c5522ik1n	BOQ-066	Mechanical Works	Metallic Flexible Conduit Connector 20mm	pcs	29	0	0	0	930.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002jvc6cthgsxrn3	BOQ-067	Mechanical Works	Communication wire (PD Royal Cord 0.75mm/2C)	m	419	0	0	0	33871.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002kvc6c0eo7vqg6	BOQ-068	Mechanical Works	Wire 3.5mm² THHN (5 meters per Unit)	m	71	0	0	0	5572.08	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1np002lvc6cw2yqx29f	BOQ-069	Mechanical Works	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002mvc6ci2dcubb2	BOQ-070	Mechanical Works	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46629.47	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002nvc6cb7ghjczb	BOQ-071	Mechanical Works	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	72	0	0	0	5650.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002ovc6c7zd4jk5n	BOQ-072	Mechanical Works	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002pvc6c2tabl1dx	BOQ-073	Mechanical Works	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002qvc6ce970i5j2	BOQ-074	Mechanical Works	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002rvc6co74k2vns	BOQ-075	Mechanical Works	Rugby	bottle	21	0	0	0	5837.79	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002svc6cnriwyu3b	BOQ-076	Mechanical Works	White Tape	rolls	42	0	0	0	15717.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002tvc6c8rzqjjgy	BOQ-077	Mechanical Works	Threaded rod 3/8 (6 meters)	length/s	94	0	0	0	16080.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nq002uvc6c6kpdw0am	BOQ-078	Mechanical Works	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr002vvc6cw9tdk7rm	BOQ-079	Mechanical Works	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr002wvc6c6jzq9m14	BOQ-080	Mechanical Works	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr002xvc6ch4gq94d5	BOQ-081	Mechanical Works	Loop Hangers	pcs	351	0	0	0	15015.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr002yvc6ch4mrg1op	BOQ-082	Mechanical Works	Freon	tank	6	0	0	0	86986.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr002zvc6cz2ibrl6o	BOQ-083	Mechanical Works	Nitrogen	tank	3	0	0	0	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr0030vc6c3ab9tblh	BOQ-084	Mechanical Works	Mapp Gas	tank	11	0	0	0	9408.63	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr0031vc6cak750lcn	BOQ-085	Mechanical Works	Silver Rod	pcs	141	0	0	0	7539.27	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nr0032vc6cisx6o3p1	BOQ-086	Mechanical Works	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0033vc6c8emnl55c	BOQ-087	Mechanical Works	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0034vc6cg58xjpf2	BOQ-088	Mechanical Works	MISCELLANEOUS	lot	1	0	0	0	5684.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0035vc6cye2u8qst	BOQ-089	Mechanical Works	TESTING & COMMISSIONING	lot	1	0	0	0	41291.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0036vc6cygwubfbg	BOQ-090	Mechanical Works	ACCU-  Model: RXQ18BYM	units	3	0	0	0	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0037vc6cz4seapwh	BOQ-091	Mechanical Works	FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	0	0	0	112445.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0038vc6c3r4ht9h5	BOQ-092	Mechanical Works	FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	0	0	0	87530.69	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns0039vc6c4x9kk80t	BOQ-093	Mechanical Works	Wired Remote Controller Model: BRC1E63	units	13	0	0	0	152889.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ns003avc6cn3dfobs8	BOQ-094	Mechanical Works	Standard panel(Fresh white) Model: BYCQ125EAF	units	1	0	0	0	22345.37	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003bvc6c58gtxzbx	BOQ-095	Mechanical Works	Refnet Joints Model: KHRP26A22T	units	6	0	0	0	26108.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003cvc6c0urlet3e	BOQ-096	Mechanical Works	Refnet Joints Model: KHRP26A33T	units	1	0	0	0	4939.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003dvc6cifvs09bu	BOQ-097	Mechanical Works	Refnet Joints Model: KHRP26A72T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003evc6cd1hwy7x6	BOQ-098	Mechanical Works	Refnet Joints Model: KHRP26A73T	units	2	0	0	0	28225.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003fvc6cjznglzuk	BOQ-099	Mechanical Works	Pipe Size Reducer Model: KHRP26M73TP	units	2	0	0	0	11995.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003gvc6cc86zvkct	BOQ-100	Mechanical Works	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003hvc6cjtlg7l4o	BOQ-101	Mechanical Works	1/4"	length/s	14	0	0	0	29684.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003ivc6c189ekb1y	BOQ-102	Mechanical Works	3/8"	length/s	11	0	0	0	32475.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nt003jvc6c77ei7ptu	BOQ-103	Mechanical Works	1/2"	length/s	15	0	0	0	70453.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003kvc6cyhdpafca	BOQ-104	Mechanical Works	5/8"	length/s	12	0	0	0	81311.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003lvc6ctbjx2ofe	BOQ-105	Mechanical Works	3/4"	length/s	13	0	0	0	112350.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003mvc6c289zgvn6	BOQ-106	Mechanical Works	7/8"	length/s	1	0	0	0	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003nvc6chij3ot48	BOQ-107	Mechanical Works	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003ovc6cyojmzyyk	BOQ-108	Mechanical Works	1-3/8"	length/s	1	0	0	0	27039.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003pvc6cvs53dtss	BOQ-109	Mechanical Works	1-5/8"	length/s	12	0	0	0	324477.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nu003qvc6c2zrjfawy	BOQ-110	Mechanical Works	1/4"	length/s	27	0	0	0	11706.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003rvc6c77faqekq	BOQ-111	Mechanical Works	3/8"	length/s	21	0	0	0	9278.43	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003svc6c2kki3wrr	BOQ-112	Mechanical Works	1/2"	length/s	30	0	0	0	15484.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003tvc6cappctmkl	BOQ-113	Mechanical Works	5/8"	length/s	24	0	0	0	15113.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003uvc6cmyohlrip	BOQ-114	Mechanical Works	3/4"	length/s	26	0	0	0	18412.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003vvc6cx8fzo5sp	BOQ-115	Mechanical Works	7/8"	length/s	2	0	0	0	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003wvc6cv3o08j03	BOQ-116	Mechanical Works	1-1/8"	length/s	9	0	0	0	7618.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003xvc6c4ejrqpch	BOQ-117	Mechanical Works	1-3/8"	length/s	2	0	0	0	2023.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003yvc6cuw742rmi	BOQ-118	Mechanical Works	1-5/8"	length/s	24	0	0	0	24279.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nv003zvc6cxb2gbcgr	BOQ-119	Mechanical Works	Copper Pipe Fittings	lot	1	0	0	0	87733.46	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0040vc6cfnx2otgo	BOQ-120	Mechanical Works	Isolation Ball Valves	pc/s	26	0	0	0	83394.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0041vc6cqiqfoedo	BOQ-121	Mechanical Works	PVC Cladding Works	lot	1	0	0	0	8234.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0042vc6cwcz3qqnr	BOQ-122	Mechanical Works	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0043vc6c5opjdoya	BOQ-123	Mechanical Works	32mm dia. uPVC blue pipe PNS 65	length/s	37	0	0	0	14953.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0044vc6ckm0dazjv	BOQ-124	Mechanical Works	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	24	0	0	0	15403.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0045vc6c2xjq9oo3	BOQ-125	Mechanical Works	3/4'' thick for 32mm pvc	length/s	74	0	0	0	31647.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0046vc6c2vqvr9az	BOQ-126	Mechanical Works	3/4'' thick for 50mm pvc	length/s	48	0	0	0	39003.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nw0047vc6csp0vt5f9	BOQ-127	Mechanical Works	(5.0m pump Lift) Model: BDU513A450VE	pcs	12	0	0	0	365677.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx0048vc6ccr9n0uwy	BOQ-128	Mechanical Works	Wye 50mm	pcs	3	0	0	0	641.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx0049vc6cuol30xxl	BOQ-129	Mechanical Works	Wye Reducer 50 x 32	pcs	13	0	0	0	2501.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004avc6cvz37inst	BOQ-130	Mechanical Works	Tee 32mm	pcs	3	0	0	0	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004bvc6cgmedtw7r	BOQ-131	Mechanical Works	Elbow 32mm	pcs	6	0	0	0	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004cvc6cd4xa22p8	BOQ-132	Mechanical Works	Cleanout 50mm	pcs	4	0	0	0	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004dvc6cb9z66ndx	BOQ-133	Mechanical Works	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004evc6c3bh5dmg7	BOQ-134	Mechanical Works	Metallic Flexible Conduit	m	673	0	0	0	44330.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nx004fvc6cds3e17dd	BOQ-135	Mechanical Works	Metallic Flexible Conduit Connector 20mm	pcs	34	0	0	0	1091.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004gvc6c554i1p94	BOQ-136	Mechanical Works	Communication wire (PD Royal Cord 0.75mm/2C)	m	482	0	0	0	38964.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004hvc6cdjo8zy1n	BOQ-137	Mechanical Works	Wire 3.5mm² THHN (5 meters per Unit)	m	94	0	0	0	7377.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004ivc6c1mi2qcfk	BOQ-138	Mechanical Works	Wire 5.5mm² THHN (5 meters per Unit)	m	13	0	0	0	1505.79	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004jvc6cer8vnytg	BOQ-139	Mechanical Works	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004kvc6c52ofat6p	BOQ-140	Mechanical Works	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	85	0	0	0	6670.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004lvc6c79abuuj2	BOQ-141	Mechanical Works	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004mvc6cdutpddh9	BOQ-142	Mechanical Works	Vibration Isolator	pcs	16	0	0	0	22238.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ny004nvc6c4r1zr62b	BOQ-143	Mechanical Works	Angle Bar, 2x2x 1/4 (6 meters)	length/s	6	0	0	0	15139.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004ovc6cv0csmuod	BOQ-144	Mechanical Works	Rugby	bottle	25	0	0	0	6949.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004pvc6cordvsydx	BOQ-145	Mechanical Works	White Tape	rolls	49	0	0	0	18336.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004qvc6cxtckyjb2	BOQ-146	Mechanical Works	Threaded rod 3/8 (6 meters)	length/s	107	0	0	0	18304.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004rvc6c751jpbfy	BOQ-147	Mechanical Works	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004svc6c8h4z9tna	BOQ-148	Mechanical Works	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004tvc6cx3sjeych	BOQ-149	Mechanical Works	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004uvc6cwfe9zv9c	BOQ-150	Mechanical Works	Loop Hangers	pcs	402	0	0	0	17197.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1nz004vvc6c25pv091x	BOQ-151	Mechanical Works	Freon	tank	7	0	0	0	101484.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o0004wvc6cbjws3voo	BOQ-152	Mechanical Works	Nitrogen	tank	4	0	0	0	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o0004xvc6cbj24x7e8	BOQ-153	Mechanical Works	Mapp Gas	tank	12	0	0	0	10263.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o0004yvc6c6c6vf49s	BOQ-154	Mechanical Works	Silver Rod	pcs	160	0	0	0	8555.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o0004zvc6cy4oa9iie	BOQ-155	Mechanical Works	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o00050vc6c3awjofy0	BOQ-156	Mechanical Works	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o00051vc6cemtm0ofk	BOQ-157	Mechanical Works	MISCELLANEOUS	lot	1	0	0	0	6640.71	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o00052vc6cusfvgg5l	BOQ-158	Mechanical Works	TESTING & COMMISIONING	lot	1	0	0	0	47190.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o00053vc6cwyfm8byq	BOQ-159	Mechanical Works	ACCU- Model: RXQ18BYM	units	3	0	0	0	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o00054vc6c7246wws3	BOQ-160	Mechanical Works	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o10055vc6c16zdd3qd	BOQ-161	Mechanical Works	Wired Remote Controller Model: BRC1E63	units	10	0	0	0	117607.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o10056vc6ch565vnja	BOQ-162	Mechanical Works	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o10057vc6cvy41qyay	BOQ-163	Mechanical Works	Refnet Joints Model: KHRP26A33T	units	2	0	0	0	9879.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o10058vc6cusi3jcix	BOQ-164	Mechanical Works	Refnet Joints Model: KHRP26A72T	units	4	0	0	0	32930.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o10059vc6cmv3ya69n	BOQ-165	Mechanical Works	Refnet Joints Model: KHRP26A73T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o1005avc6cjl046jpn	BOQ-166	Mechanical Works	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o1005bvc6cod3gcnnf	BOQ-167	Mechanical Works	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005cvc6cary7mkh8	BOQ-168	Mechanical Works	1/4"	length/s	1	0	0	0	2120.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005dvc6c21yi7e08	BOQ-169	Mechanical Works	3/8"	length/s	11	0	0	0	32475.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005evc6c3skgkxug	BOQ-170	Mechanical Works	1/2"	length/s	2	0	0	0	9393.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005fvc6c22y17x1v	BOQ-171	Mechanical Works	5/8"	length/s	14	0	0	0	94863.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005gvc6cvq8p5dip	BOQ-172	Mechanical Works	3/4"	length/s	9	0	0	0	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005hvc6cu0y9rs0v	BOQ-173	Mechanical Works	7/8"	length/s	1	0	0	0	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005ivc6cj79lyy2v	BOQ-174	Mechanical Works	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005jvc6cstwlhl84	BOQ-175	Mechanical Works	1-3/8"	length/s	3	0	0	0	63045.99	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o2005kvc6cjc3c3yb9	BOQ-176	Mechanical Works	1-5/8"	length/s	7	0	0	0	189278.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005lvc6cd4nzor52	BOQ-177	Mechanical Works	1/4"	length/s	2	0	0	0	867.14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005mvc6cvgzm8byd	BOQ-178	Mechanical Works	3/8"	length/s	21	0	0	0	9278.43	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005nvc6cgnrd0tat	BOQ-179	Mechanical Works	1/2"	length/s	4	0	0	0	2064.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005ovc6cd1g4ojje	BOQ-180	Mechanical Works	5/8"	length/s	27	0	0	0	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005pvc6cml8u1spz	BOQ-181	Mechanical Works	3/4"	length/s	17	0	0	0	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005qvc6cg3k1g5vy	BOQ-182	Mechanical Works	7/8"	length/s	2	0	0	0	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005rvc6cxzqkot2i	BOQ-183	Mechanical Works	1-1/8"	length/s	10	0	0	0	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o3005svc6cysyatzyl	BOQ-184	Mechanical Works	1-3/8"	length/s	5	0	0	0	4480.15	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005tvc6cf5wcwn0l	BOQ-185	Mechanical Works	1-5/8"	length/s	13	0	0	0	13151.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005uvc6cwqmgv6vu	BOQ-186	Mechanical Works	Copper Pipe Fittings	lot	1	0	0	0	59135.15	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005vvc6c2kcmrtua	BOQ-187	Mechanical Works	Isolation Ball Valves	pc/s	20	0	0	0	64149.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005wvc6cybr0z4ir	BOQ-188	Mechanical Works	PVC Cladding Works	lot	1	0	0	0	19711.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005xvc6cx0hnozwt	BOQ-189	Mechanical Works	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005yvc6ctwj03gjm	BOQ-190	Mechanical Works	32mm dia. uPVC blue pipe PNS 65	length/s	33	0	0	0	13336.95	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o4005zvc6ceijhrp4u	BOQ-191	Mechanical Works	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	12	0	0	0	7701.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o40060vc6c67yl9pcj	BOQ-192	Mechanical Works	3/4'' thick for 32mm pvc	length/s	66	0	0	0	28226.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o40061vc6czyf9c2hx	BOQ-193	Mechanical Works	3/4'' thick for 50mm pvc	length/s	23	0	0	0	18689.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50062vc6c6hu03riw	BOQ-194	Mechanical Works	(5.0m pump Lift) Model: BDU513A450VE	pcs	11	0	0	0	335204.76	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50063vc6ckdq5dedz	BOQ-195	Mechanical Works	Wye Reducer 50 x 32	length/s	7	0	0	0	1347.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50064vc6cvlw17znp	BOQ-196	Mechanical Works	Tee 32mm	length/s	6	0	0	0	320.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50065vc6c50rl03c6	BOQ-197	Mechanical Works	Elbow 32mm	length/s	7	0	0	0	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50066vc6c3gfv1pwq	BOQ-198	Mechanical Works	Cleanout 50mm	length/s	2	0	0	0	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50067vc6ci8flxmlj	BOQ-199	Mechanical Works	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o50068vc6co71tosqe	BOQ-200	Mechanical Works	Metallic Flexible Conduit 20mm	m	444	0	0	0	29246.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o60069vc6cd541p9yp	BOQ-201	Mechanical Works	Metallic Flexible Conduit Connector 20mm	pcs	26	0	0	0	834.34	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006avc6czei2fkt9	BOQ-202	Mechanical Works	Communication wire (PD Royal Cord 0.75mm/2C)	m	291	0	0	0	23524.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006bvc6cyutz5yfs	BOQ-203	Mechanical Works	Wire 3.5mm² THHN (5 meters per Unit)	m	63	0	0	0	4944.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006cvc6cftl1qfbt	BOQ-204	Mechanical Works	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006dvc6cfaokp7vu	BOQ-205	Mechanical Works	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006evc6cagb3twn3	BOQ-206	Mechanical Works	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	65	0	0	0	5101.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006fvc6cn8wf0usi	BOQ-207	Mechanical Works	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006gvc6cpouhf4p8	BOQ-208	Mechanical Works	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o6006hvc6cul411dnf	BOQ-209	Mechanical Works	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006ivc6c0r8uit9z	BOQ-210	Mechanical Works	Rugby	bottle	15	0	0	0	4169.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006jvc6cvs9imms0	BOQ-211	Mechanical Works	White Tape	rolls	30	0	0	0	11226.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006kvc6ctgak78os	BOQ-212	Mechanical Works	Threaded rod 3/8 (6 meters)	length/s	65	0	0	0	11119.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006lvc6chq49qv43	BOQ-213	Mechanical Works	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006mvc6c1ztbugwg	BOQ-214	Mechanical Works	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006nvc6ctka0higs	BOQ-215	Mechanical Works	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006ovc6ca097hu1v	BOQ-216	Mechanical Works	Loop Hangers	pcs	244	0	0	0	10438.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o7006pvc6cjyxckr4g	BOQ-217	Mechanical Works	Freon	tank	5	0	0	0	72488.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006qvc6cgm7etgze	BOQ-218	Mechanical Works	Nitrogen	tank	3	0	0	0	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006rvc6cc6cvoq97	BOQ-219	Mechanical Works	Mapp Gas	tank	8	0	0	0	6500.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006svc6cw5207paz	BOQ-220	Mechanical Works	Silver Rod	pcs	98	0	0	0	5240.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006tvc6cb8i9qd87	BOQ-221	Mechanical Works	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006uvc6ccyd4ntva	BOQ-222	Mechanical Works	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006vvc6ccw58qd0b	BOQ-223	Mechanical Works	MISCELLANEOUS	lot	1	0	0	0	5010.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006wvc6c54y3qplz	BOQ-224	Mechanical Works	TESTING & COMMISSIONING	lot	1	0	0	0	38342.14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006xvc6cw74q6kka	BOQ-225	Mechanical Works	ACCU- Model: RXQ20BYM	units	3	0	0	0	2367951.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o8006yvc6cwissdoxd	BOQ-226	Mechanical Works	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o9006zvc6c82e2ux1b	BOQ-227	Mechanical Works	Wired Remote Controller Model: BRC1E63	units	12	0	0	0	141128.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90070vc6c1ucqv8lc	BOQ-228	Mechanical Works	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90071vc6clpoyituf	BOQ-229	Mechanical Works	Refnet Joints Model: KHRP26A22T	units	4	0	0	0	17405.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90072vc6crpujxkeh	BOQ-230	Mechanical Works	Refnet Joints Model: KHRP26A33T	units	1	0	0	0	4939.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90073vc6cwounmbow	BOQ-231	Mechanical Works	Refnet Joints Model: KHRP26A72T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90074vc6ctg771wa4	BOQ-232	Mechanical Works	Refnet Joints Model: KHRP26A73T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90075vc6c7ppkwdqo	BOQ-233	Mechanical Works	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1o90076vc6cd2csz5k7	BOQ-234	Mechanical Works	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa0077vc6co0tfxrv3	BOQ-235	Mechanical Works	1/4"	length/s	8	0	0	0	16962.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa0078vc6cy4knl2di	BOQ-236	Mechanical Works	3/8"	length/s	12	0	0	0	35428.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa0079vc6cxc68aozc	BOQ-237	Mechanical Works	1/2"	length/s	10	0	0	0	46969.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa007avc6c0sohhxgf	BOQ-238	Mechanical Works	5/8"	length/s	14	0	0	0	94863.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa007bvc6c5lnb5j96	BOQ-239	Mechanical Works	3/4"	length/s	16	0	0	0	138277.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa007cvc6ck3vpvoye	BOQ-240	Mechanical Works	7/8"	length/s	2	0	0	0	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oa007dvc6cd23sduwg	BOQ-241	Mechanical Works	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007evc6cu3wvqsmj	BOQ-242	Mechanical Works	1-3/8"	length/s	2	0	0	0	42030.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007fvc6c6arnceal	BOQ-243	Mechanical Works	1-5/8"	length/s	14	0	0	0	378556.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007gvc6c0ff7x8ta	BOQ-244	Mechanical Works	1/4"	length/s	16	0	0	0	6937.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007hvc6c9rxksso9	BOQ-245	Mechanical Works	3/8"	length/s	24	0	0	0	10603.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007ivc6cdk1qflem	BOQ-246	Mechanical Works	1/2"	length/s	19	0	0	0	9806.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007jvc6c0cyi2k3h	BOQ-247	Mechanical Works	5/8"	length/s	27	0	0	0	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007kvc6c38v1akrf	BOQ-248	Mechanical Works	3/4"	length/s	31	0	0	0	21952.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ob007lvc6cqlry74p4	BOQ-249	Mechanical Works	7/8"	length/s	4	0	0	0	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007mvc6c8secpxu3	BOQ-250	Mechanical Works	1-1/8"	length/s	10	0	0	0	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007nvc6cmc7pkbwj	BOQ-251	Mechanical Works	1-3/8"	length/s	4	0	0	0	3584.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007ovc6cv6rxxkjf	BOQ-252	Mechanical Works	1-5/8"	length/s	27	0	0	0	27314.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007pvc6c4jbvtuqa	BOQ-253	Mechanical Works	Copper Pipe Fittings	lot	1	0	0	0	96659.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007qvc6c0qwtrhiy	BOQ-254	Mechanical Works	Isolation Ball Valves	pc/s	24	0	0	0	76979.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007rvc6cgmcu5wu8	BOQ-255	Mechanical Works	PVC Cladding Works	lot	1	0	0	0	32220	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007svc6cp0o6xi9m	BOQ-256	Mechanical Works	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007tvc6cocrfvbbw	BOQ-257	Mechanical Works	32mm dia. uPVC blue pipe PNS 65	length/s	31	0	0	0	12528.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oc007uvc6chom7nb6k	BOQ-258	Mechanical Works	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	38	0	0	0	24389.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od007vvc6cyx7rf32x	BOQ-259	Mechanical Works	3/4'' thick for 32mm pvc	length/s	61	0	0	0	26087.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od007wvc6cf23wm5dp	BOQ-260	Mechanical Works	3/4'' thick for 50mm pvc	length/s	75	0	0	0	60942.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od007xvc6crtz4r0ad	BOQ-261	Mechanical Works	(5.0m pump Lift) Model: BDU513A450VE	pcs	10	0	0	0	304731.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od007yvc6c4r3dvv3p	BOQ-262	Mechanical Works	Wye 50mm	length/s	2	0	0	0	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od007zvc6cldi1chq9	BOQ-263	Mechanical Works	Wye Reducer 50 x 32	length/s	11	0	0	0	2117.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od0080vc6c4y3ka017	BOQ-264	Mechanical Works	Tee 32mm	length/s	3	0	0	0	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od0081vc6c3deo41p2	BOQ-265	Mechanical Works	Tee Reducer 50 x 32	length/s	3	0	0	0	609.45	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1od0082vc6c8ki388so	BOQ-266	Mechanical Works	Elbow 32mm	length/s	7	0	0	0	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0083vc6cz84omc42	BOQ-267	Mechanical Works	Cleanout 50mm	length/s	6	0	0	0	1283.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0084vc6clehqxiej	BOQ-268	Mechanical Works	liquid-tight metallic flexible conduits 2"	m	78	0	0	0	59544.42	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0085vc6cne2iiavq	BOQ-269	Mechanical Works	Metallic Flexible Conduit 20mm	m	654	0	0	0	43078.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0086vc6ce8dhhgx3	BOQ-270	Mechanical Works	Metallic Flexible Conduit Connector 20mm	pcs	32	0	0	0	1026.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0087vc6cj1ugn8l6	BOQ-271	Mechanical Works	Communication wire (PD Royal Cord 0.75mm/2C)	m	472	0	0	0	38156.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0088vc6cteddpxi6	BOQ-272	Mechanical Works	Wire 3.5mm² THHN (5 meters per Unit)	m	78	0	0	0	6009.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe0089vc6cllnvmbly	BOQ-273	Mechanical Works	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oe008avc6ckz494c5o	BOQ-274	Mechanical Works	Wire 38.0mm² THHN (5 meters per Unit)	m	59	0	0	0	55353.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008bvc6cb76u0foq	BOQ-275	Mechanical Works	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	78	0	0	0	5878.08	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008cvc6c5vyt8j0u	BOQ-276	Mechanical Works	Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	6220.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008dvc6c21r99eyv	BOQ-277	Mechanical Works	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008evc6cgfs1njfo	BOQ-278	Mechanical Works	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008fvc6cruzzcqe2	BOQ-279	Mechanical Works	Rugby	bottle	24	0	0	0	6671.76	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008gvc6ctn7gz9ks	BOQ-280	Mechanical Works	White Tape	rolls	47	0	0	0	17588.34	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008hvc6cgvrfloj6	BOQ-281	Mechanical Works	Threaded rod 3/8 (6 meters)	length/s	104	0	0	0	17791.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008ivc6ctylnz1xm	BOQ-282	Mechanical Works	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1of008jvc6cz00rzr4d	BOQ-283	Mechanical Works	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008kvc6cmj1e6nhq	BOQ-284	Mechanical Works	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008lvc6cbt17siwh	BOQ-285	Mechanical Works	Loop Hangers	pcs	393	0	0	0	16812.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008mvc6cg885mmop	BOQ-286	Mechanical Works	Freon	tank	8	0	0	0	115982.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008nvc6c4m8k6fct	BOQ-287	Mechanical Works	Nitrogen	tank	4	0	0	0	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008ovc6cx8c9u2uj	BOQ-288	Mechanical Works	Mapp Gas	tank	12	0	0	0	9750.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008pvc6cr8nhzyri	BOQ-289	Mechanical Works	Silver Rod	pcs	158	0	0	0	8448.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008qvc6c3l9elurp	BOQ-290	Mechanical Works	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008rvc6cueawf473	BOQ-291	Mechanical Works	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1og008svc6cyxjvhk38	BOQ-292	Mechanical Works	MISCELLANEOUS	lot	1	0	0	0	7277.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008tvc6czvqm11km	BOQ-293	Mechanical Works	TESTING & COMMISSIONING	lot	1	0	0	0	44240.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008uvc6cyqzmugc9	BOQ-294	Electrical Works	250mm² THHN	m	726	7092.359999999999	0	7092.359999999999	5149053.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008vvc6cwm06qg08	BOQ-295	Electrical Works	200mm² THHN	m	117	0	0	0	644571.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008wvc6c5u0151mk	BOQ-296	Electrical Works	38mm² THHN	m	390	0	0	0	439327.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008xvc6ccvaux2ve	BOQ-297	Electrical Works	80mm² THHN	m	242	0	0	0	515401.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008yvc6ctpiae0ph	BOQ-298	Electrical Works	30mm² THHN	m	39	0	0	0	32123.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh008zvc6cul9ncu53	BOQ-299	Electrical Works	14mm² THHN	m	130	0	0	0	46653.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oh0090vc6c17nme2zx	BOQ-300	Electrical Works	90mm dia. IMC	length/s	94	0	0	0	874356.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0091vc6cn0n28z72	BOQ-301	Electrical Works	40mm dia. IMC	length/s	45	0	0	0	120280.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0092vc6c4mrt1e8f	BOQ-302	Electrical Works	DP-Main	Assy	1	0	0	0	772225.45	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0093vc6c00tgbtuv	BOQ-303	Electrical Works	PP-System A	Assy	1	0	0	0	125827.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0094vc6cy7v9at17	BOQ-304	Electrical Works	PP-System B	Assy	1	0	0	0	135268.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0095vc6clv727qd8	BOQ-305	Electrical Works	PP-System C	Assy	1	0	0	0	120190.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0096vc6cltdykt2a	BOQ-306	Electrical Works	PP-System D	Assy	1	0	0	0	131472.25	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0097vc6ctgh12eec	BOQ-307	Electrical Works	PP-Outdoor	Assy	1	0	0	0	473575.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oi0098vc6ckc4m9692	BOQ-308	Electrical Works	Transformer	Assy	1	0	0	0	932598.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj0099vc6ces26zpmk	BOQ-309	Electrical Works	ECB 1250AT Nema 12	pc	1	0	0	0	302047.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009avc6cnj867zsm	BOQ-310	Electrical Works	Pullbox (350mm x 350mm x 200mm)	pc	5	0	0	0	27691.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009bvc6clcnqsipa	BOQ-311	Electrical Works	Wire Gutter	lot	1	0	0	0	32074.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009cvc6cbzwge732	BOQ-312	Electrical Works	ECB 150AT, 3P, 230V, Nema3R	pc	4	0	0	0	116076.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009dvc6cpubg9j61	BOQ-313	Electrical Works	ECB 40AT, 3P, 230V, Nema3R	pc	7	0	0	0	77586.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009evc6c4gzve17p	BOQ-314	Electrical Works	ECB 40AT, 2P, 230V, Nema3R	pc	16	0	0	0	150867.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009fvc6c3vsr5gpv	BOQ-315	Electrical Works	ECB 30AT, 2P, 230V, Nema3R	pc	23	0	0	0	216872.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009gvc6c8qtp3rsi	BOQ-316	Electrical Works	40mm dia. IMC	length/s	49	0	0	0	130972.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1oj009hvc6cuxhv5p7r	BOQ-317	Electrical Works	25mm dia. IMC	length/s	1003	0	0	0	1758690.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009ivc6czo553i2r	BOQ-318	Electrical Works	Junction boxes with cover	pc/s	195	0	0	0	24540.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009jvc6c6pdkyal2	BOQ-319	Electrical Works	50mm² THHN	Lm/s	429	0	0	0	598841.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009kvc6c9z19sf4b	BOQ-320	Electrical Works	5.5mm² THHN	Lm/s	6798	0	0	0	979795.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009lvc6cnatmerve	BOQ-321	Electrical Works	14mm² THHN	Lm/s	143	0	0	0	51318.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009mvc6cru0nvpc6	BOQ-322	Electrical Works	5.5mm² THHN	Lm/s	3185	0	0	0	459054.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009nvc6ck05zhxh0	BOQ-323	Electrical Works	Chipping & Restoration Works (Rough only)	lot	1	0	0	0	145441.09	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009ovc6coxyjgo4z	BOQ-324	Electrical Works	Hangers & Supports	lot	1	0	0	0	174529.31	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ok009pvc6c7z9dt4ls	BOQ-325	Electrical Works	Miscelleneuos	lot	1	0	0	0	87264.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
cmrn7l1ol009qvc6cutmst56g	BOQ-326	Electrical Works	Testing & Commissioning	lot	1	0	0	0	884818.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-16 07:49:54.451	2026-07-16 07:49:54.451
\.


--
-- Data for Name: BIRWithholdingTaxTable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BIRWithholdingTaxTable" (id, "effectiveYear", "payrollFrequency", "bracketNo", "compensationFrom", "compensationTo", "baseTax", "taxRatePercent", "excessOver", "isActive", "isLocked", "createdBy", "updatedBy", "approvedBy", "approvedAt", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BOQExtractedItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BOQExtractedItem" (id, "uploadedWorkbookFileId", "projectId", "sectionId", "sheetName", "sourceRowNumber", "itemNumber", description, unit, quantity, "materialUnitCost", "laborUnitCost", "equipmentUnitCost", "totalDirectCost", ocm, cp, vat, "totalIndirectCost", "unitCost", amount, percentage, "formulaMapJson", "validationStatus", "validationErrorsJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BOQExtractedSection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BOQExtractedSection" (id, "uploadedWorkbookFileId", "projectId", "sheetName", "sourceRowNumber", "sectionCode", "sectionName", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BOQLotBreakdown; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BOQLotBreakdown" (id, description, "weightPercentage", "boqItemId") FROM stdin;
\.


--
-- Data for Name: BOQMapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BOQMapping" (id, "mappingType", "allocationPercentage", "allocationQuantity", remarks, "aiConfidenceScore", status, "awardedBoqItemId", "consolidatedBoqItemId", "createdAt", "updatedAt", "procurementBenchmarkItemId") FROM stdin;
cmrirp4900003i80aj0uzcwgl	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp48l0001i80a67dfbe4p	2026-07-13 05:14:05.892	2026-07-13 05:14:05.892	cmriros3u0000jc0av62u9tj9
cmrirp49h0007i80a0nfz8t75	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp49b0005i80ambbrt47t	2026-07-13 05:14:05.909	2026-07-13 05:14:05.909	cmriros3u0001jc0aodqy4p01
cmrirp49t000bi80av94v1m7t	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp49m0009i80a01oj5oly	2026-07-13 05:14:05.921	2026-07-13 05:14:05.921	cmriros3u0002jc0axw44yply
cmrirp4a2000fi80a8cpoq6oh	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp49y000di80azg7kq0sm	2026-07-13 05:14:05.931	2026-07-13 05:14:05.931	cmriros3u0003jc0aoj8h6bjl
cmrirp4ab000ji80a5etwcx8b	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4a7000hi80av1tsitgy	2026-07-13 05:14:05.939	2026-07-13 05:14:05.939	cmriros3u0004jc0ajsqoz2o5
cmrirp4ak000ni80ac1h59lc4	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ag000li80au1o6lgcx	2026-07-13 05:14:05.948	2026-07-13 05:14:05.948	cmriros3u0005jc0ausg49l86
cmrirp4at000ri80a67iadbiy	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ao000pi80a6zytpbwe	2026-07-13 05:14:05.958	2026-07-13 05:14:05.958	cmriros3u0006jc0a2r7d0xdl
cmrirp4b1000vi80a572n73s2	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ax000ti80anf1bphq2	2026-07-13 05:14:05.966	2026-07-13 05:14:05.966	cmriros3u0007jc0a21rxr5gs
cmrirp4b9000zi80au23ri9wn	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4b6000xi80a4ruj10xs	2026-07-13 05:14:05.974	2026-07-13 05:14:05.974	cmriros3u0008jc0av04dkvc0
cmrirp4bj0013i80akdfpflnz	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4bf0011i80a3gz9lum6	2026-07-13 05:14:05.984	2026-07-13 05:14:05.984	cmriros3u0009jc0aficgze2z
cmrirp4bs0017i80agjxfcwjm	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4bn0015i80apym2ss3l	2026-07-13 05:14:05.993	2026-07-13 05:14:05.993	cmriros3u000ajc0aejhcc4u4
cmrirp4c1001bi80axyikon8y	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4bx0019i80ahiyp3wyk	2026-07-13 05:14:06.002	2026-07-13 05:14:06.002	cmriros3u000bjc0an1iojv3z
cmrirp4cb001fi80as5oywb6r	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4c6001di80anuknyhud	2026-07-13 05:14:06.011	2026-07-13 05:14:06.011	cmriros3u000cjc0aafpi1rxp
cmrirp4cj001ji80avhzx8xfm	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4cf001hi80a5fbi1x8d	2026-07-13 05:14:06.019	2026-07-13 05:14:06.019	cmriros3u000djc0ah3d811ov
cmrirp4cq001ni80a4tvpgay5	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4cm001li80a8eqx37a0	2026-07-13 05:14:06.027	2026-07-13 05:14:06.027	cmriros3u000ejc0am3e0hyby
cmrirp4cy001ri80amokiwohu	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4cu001pi80akbzly6bj	2026-07-13 05:14:06.035	2026-07-13 05:14:06.035	cmriros3u000fjc0amatk067s
cmrirp4d6001vi80akjtq108u	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4d2001ti80a5yioyynv	2026-07-13 05:14:06.043	2026-07-13 05:14:06.043	cmriros3u000gjc0ab59ed5vp
cmrirp4da001xi80ajfoio94h	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4d2001ti80a5yioyynv	2026-07-13 05:14:06.046	2026-07-13 05:14:06.046	cmriros3w004cjc0am1hc0x89
cmrirp4de001zi80a0ynkgk59	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4d2001ti80a5yioyynv	2026-07-13 05:14:06.05	2026-07-13 05:14:06.05	cmriros3y0068jc0ab56byadu
cmrirp4dm0023i80a96f1n2vy	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4dh0021i80asrlxysbg	2026-07-13 05:14:06.058	2026-07-13 05:14:06.058	cmriros3u000hjc0a0cxo1kdh
cmrirp4du0027i80arhlcdqli	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4dq0025i80a5dht85dn	2026-07-13 05:14:06.066	2026-07-13 05:14:06.066	cmriros3u000ijc0a0vkpz2o2
cmrirp4e2002bi80a5aga16ez	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4dy0029i80arm94uj22	2026-07-13 05:14:06.074	2026-07-13 05:14:06.074	cmriros3u000jjc0ag2tv2o8t
cmrirp4ec002fi80ades66oxh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4e7002di80avv6bt00q	2026-07-13 05:14:06.084	2026-07-13 05:14:06.084	cmriros3u000kjc0a3610mfoy
cmrirp4eg002hi80agg772hpe	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4e7002di80avv6bt00q	2026-07-13 05:14:06.088	2026-07-13 05:14:06.088	cmriros3v002ijc0ac9vrc5qp
cmrirp4ek002ji80atcqztal7	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4e7002di80avv6bt00q	2026-07-13 05:14:06.092	2026-07-13 05:14:06.092	cmriros3w004gjc0atv6liyjv
cmrirp4eo002li80as5r4nrmq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4e7002di80avv6bt00q	2026-07-13 05:14:06.096	2026-07-13 05:14:06.096	cmriros3y006cjc0aagj7fdla
cmrirp4ew002pi80ajlngiq8g	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.105	2026-07-13 05:14:06.105	cmriros3u000ljc0atuprj16a
cmrirp4f0002ri80aewtce2c1	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.109	2026-07-13 05:14:06.109	cmriros3u000mjc0aq91d4r2v
cmrirp4f4002ti80aorn7y8c1	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.112	2026-07-13 05:14:06.112	cmriros3u000njc0arjhfs22q
cmrirp4f8002vi80as8ui9k4s	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.116	2026-07-13 05:14:06.116	cmriros3u000ojc0aa7f9mik1
cmrirp4fb002xi80aedxfkc53	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.119	2026-07-13 05:14:06.119	cmriros3v002jjc0ayubgxnz0
cmrirp4ff002zi80agfaylm9b	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.123	2026-07-13 05:14:06.123	cmriros3v002kjc0agayxy17y
cmrirp4fj0031i80awot3b9k9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.127	2026-07-13 05:14:06.127	cmriros3v002ljc0a6ril7cgm
cmrirp4fn0033i80agu8vtbhi	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.131	2026-07-13 05:14:06.131	cmriros3w002mjc0ay44q8q0x
cmrirp4fq0035i80al3mte6li	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.135	2026-07-13 05:14:06.135	cmriros3x004hjc0app45k9xa
cmrirp4fx0037i80arp7fwylw	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.139	2026-07-13 05:14:06.139	cmriros3x004ijc0aa1f50wdo
cmrirp4g10039i80aaxffbxgh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.145	2026-07-13 05:14:06.145	cmriros3x004jjc0a5k04u5nz
cmrirp4g4003bi80ac00xesyh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.149	2026-07-13 05:14:06.149	cmriros3y006djc0ach8gwejh
cmrirp4g8003di80a2ffh9woz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.153	2026-07-13 05:14:06.153	cmriros3y006ejc0aiq6ydfpy
cmrirp4gc003fi80a5i2dl3gu	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.157	2026-07-13 05:14:06.157	cmriros3y006fjc0asss6kwlv
cmrirp4gh003hi80asa5l9tk0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4es002ni80apahhk5sf	2026-07-13 05:14:06.161	2026-07-13 05:14:06.161	cmriros3y006gjc0af71guc9q
cmrirp4gp003li80a46sc4g38	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4gl003ji80a2i8ccuku	2026-07-13 05:14:06.169	2026-07-13 05:14:06.169	cmriros3u000pjc0afzp0ncf3
cmrirp4gs003ni80axhtrd39m	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4gl003ji80a2i8ccuku	2026-07-13 05:14:06.173	2026-07-13 05:14:06.173	cmriros3w002njc0arz9gp4s3
cmrirp4gw003pi80agu5pwjr3	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4gl003ji80a2i8ccuku	2026-07-13 05:14:06.176	2026-07-13 05:14:06.176	cmriros3x004kjc0af28zwfe5
cmrirp4h0003ri80am39sp855	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4gl003ji80a2i8ccuku	2026-07-13 05:14:06.181	2026-07-13 05:14:06.181	cmriros3y006hjc0ans8dh9o0
cmrirp4hb003vi80agpb9qlr9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4h4003ti80a8krhoy87	2026-07-13 05:14:06.191	2026-07-13 05:14:06.191	cmriros3u000qjc0ajtsp9dt9
cmrirp4hf003xi80au3wewfys	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4h4003ti80a8krhoy87	2026-07-13 05:14:06.195	2026-07-13 05:14:06.195	cmriros3w002ojc0acclbvr6m
cmrirp4hj003zi80a7h9elhek	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4h4003ti80a8krhoy87	2026-07-13 05:14:06.199	2026-07-13 05:14:06.199	cmriros3x004ljc0a4zqy4fnb
cmrirp4hn0041i80ag3pbb9vo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4h4003ti80a8krhoy87	2026-07-13 05:14:06.203	2026-07-13 05:14:06.203	cmriros3y006ijc0ayzqjkyld
cmrirp4hv0045i80aw8capisa	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.211	2026-07-13 05:14:06.211	cmriros3v000rjc0ahyd3rhml
cmrirp4i30047i80a1ytecgtp	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.219	2026-07-13 05:14:06.219	cmriros3v0010jc0akdmyi8gf
cmrirp4i70049i80asej6qe2x	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.223	2026-07-13 05:14:06.223	cmriros3w002pjc0aib42yhbu
cmrirp4ib004bi80atpniusd7	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.227	2026-07-13 05:14:06.227	cmriros3w002yjc0a2hump9g5
cmrirp4if004di80apouoiu1b	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.231	2026-07-13 05:14:06.231	cmriros3x004mjc0ad6an5ors
cmrirp4ij004fi80ag40fcnqe	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.235	2026-07-13 05:14:06.235	cmriros3x004vjc0aaecyghqf
cmrirp4in004hi80apj45dvix	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.239	2026-07-13 05:14:06.239	cmriros3y006jjc0a0vfs811v
cmrirp4iq004ji80akdimrso5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4hr0043i80a6f3nc5ry	2026-07-13 05:14:06.242	2026-07-13 05:14:06.242	cmriros3y006sjc0a7pbs579v
cmrirp4iy004ni80a8hsufigy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.25	2026-07-13 05:14:06.25	cmriros3v000sjc0aql10wbgm
cmrirp4j2004pi80awl7qqhjy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.254	2026-07-13 05:14:06.254	cmriros3v0011jc0aleki3nug
cmrirp4j6004ri80a4395wsbu	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.258	2026-07-13 05:14:06.258	cmriros3w002qjc0ahiykmxeq
cmrirp4j9004ti80algt542d0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.262	2026-07-13 05:14:06.262	cmriros3w002zjc0a1p8i8dvn
cmrirp4jd004vi80a3876m8ru	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.265	2026-07-13 05:14:06.265	cmriros3x004njc0a67kt24dp
cmrirp4jg004xi80an5dwx33c	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.269	2026-07-13 05:14:06.269	cmriros3x004wjc0aslwj1lpe
cmrirp4jk004zi80aac43h14s	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.272	2026-07-13 05:14:06.272	cmriros3y006kjc0a3rsmfnve
cmrirp4jo0051i80apm656e4q	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4iu004li80avuedpccd	2026-07-13 05:14:06.276	2026-07-13 05:14:06.276	cmriros3y006tjc0abvuxryjh
cmrirp4jw0055i80aepqfdxmp	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.284	2026-07-13 05:14:06.284	cmriros3v000tjc0ajtw8fiqn
cmrirp4k00057i80a019jlz13	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.288	2026-07-13 05:14:06.288	cmriros3v0012jc0a0evxz9fx
cmrirp4k30059i80a7kda7kpk	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.292	2026-07-13 05:14:06.292	cmriros3w002rjc0a32ly4ofi
cmrirp4k8005bi80ai9h43bux	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.296	2026-07-13 05:14:06.296	cmriros3w0030jc0ar9dgprgw
cmrirp4kb005di80aph3ah55s	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.3	2026-07-13 05:14:06.3	cmriros3x004ojc0axjh85t9t
cmrirp4kf005fi80ah52hq5it	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.303	2026-07-13 05:14:06.303	cmriros3x004xjc0ak1r03x58
cmrirp4ki005hi80aphzpv52k	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.307	2026-07-13 05:14:06.307	cmriros3y006ljc0akzoo9g78
cmrirp4kl005ji80afz7sq9sv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4js0053i80aibx3eff4	2026-07-13 05:14:06.31	2026-07-13 05:14:06.31	cmriros3y006ujc0az90e9k3a
cmrirp4ks005ni80ai5wy64rl	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.317	2026-07-13 05:14:06.317	cmriros3v000ujc0aibvxybef
cmrirp4kv005pi80aqr61nthq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.32	2026-07-13 05:14:06.32	cmriros3v0013jc0a4i7etwf4
cmrirp4kz005ri80ax02j81rq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.323	2026-07-13 05:14:06.323	cmriros3w002sjc0a17h1yysb
cmrirp4l2005ti80ayn0m58gk	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.326	2026-07-13 05:14:06.326	cmriros3w0031jc0amler1uf0
cmrirp4l5005vi80arbqc35va	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.33	2026-07-13 05:14:06.33	cmriros3x004pjc0az44zqggf
cmrirp4l9005xi80ar58hjqyo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.333	2026-07-13 05:14:06.333	cmriros3x004yjc0aohg63w6w
cmrirp4lc005zi80aru29r01c	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.336	2026-07-13 05:14:06.336	cmriros3y006mjc0a3alc8ynh
cmrirp4lf0061i80adp0z6tq6	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4kp005li80ad406tjvy	2026-07-13 05:14:06.34	2026-07-13 05:14:06.34	cmriros3y006vjc0amjuis03x
cmrirp4lo0065i80a4u6125az	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.348	2026-07-13 05:14:06.348	cmriros3v000vjc0asiijdgfo
cmrirp4lr0067i80a7dtt7exu	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.352	2026-07-13 05:14:06.352	cmriros3v0014jc0audwho2nl
cmrirp4lv0069i80a9q254utq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.355	2026-07-13 05:14:06.355	cmriros3w002tjc0atkctselr
cmrirp4ly006bi80ablc1buhb	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.359	2026-07-13 05:14:06.359	cmriros3w0032jc0awkqr0fqy
cmrirp4m1006di80a3fj3cznm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.362	2026-07-13 05:14:06.362	cmriros3x004qjc0as2sqbnxm
cmrirp4m5006fi80ajdmp38ca	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.365	2026-07-13 05:14:06.365	cmriros3x004zjc0a0v7lchjr
cmrirp4m9006hi80aew24sz8v	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.369	2026-07-13 05:14:06.369	cmriros3y006njc0amjsczjcs
cmrirp4mc006ji80aicrm5rk3	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4lj0063i80al9wrwmn4	2026-07-13 05:14:06.373	2026-07-13 05:14:06.373	cmriros3y006wjc0a587bqtzb
cmrirp4mm006ni80a1ifvukba	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.382	2026-07-13 05:14:06.382	cmriros3v000wjc0adh9ikfpz
cmrirp4mq006pi80adag1sclo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.386	2026-07-13 05:14:06.386	cmriros3v0015jc0adpkockbe
cmrirp4mt006ri80asu39zrh0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.39	2026-07-13 05:14:06.39	cmriros3w002ujc0aoak4dhc0
cmrirp4mx006ti80avsir2rzh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.393	2026-07-13 05:14:06.393	cmriros3w0033jc0akrc7wr0f
cmrirp4n0006vi80afagxb1ap	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.397	2026-07-13 05:14:06.397	cmriros3x004rjc0azn7gbvnb
cmrirp4n4006xi80ahc1fji5o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.401	2026-07-13 05:14:06.401	cmriros3x0050jc0akvfha61q
cmrirp4n8006zi80azj5lnma8	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.404	2026-07-13 05:14:06.404	cmriros3y006ojc0a7rimewn7
cmrirp4nb0071i80a43od77bt	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4mg006li80aqj4bherk	2026-07-13 05:14:06.408	2026-07-13 05:14:06.408	cmriros3y006xjc0a92l7qofx
cmrirp4nn0075i80ak5bkqmff	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.419	2026-07-13 05:14:06.419	cmriros3v000xjc0ax7jtuyck
cmrirp4nr0077i80a7w54hu7l	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.423	2026-07-13 05:14:06.423	cmriros3v0016jc0a8en0mt3z
cmrirp4nu0079i80ac1wuokag	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.427	2026-07-13 05:14:06.427	cmriros3w002vjc0aop4xmd7s
cmrirp4ny007bi80aiy7ifu2j	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.43	2026-07-13 05:14:06.43	cmriros3w0034jc0ajooi3tf5
cmrirp4o2007di80alhkeh6ub	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.434	2026-07-13 05:14:06.434	cmriros3x004sjc0a3k95szzz
cmrirp4o6007fi80a7wnc3ctr	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.438	2026-07-13 05:14:06.438	cmriros3x0051jc0amyb32fv4
cmrirp4oa007hi80awi0yybv0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.442	2026-07-13 05:14:06.442	cmriros3y006pjc0awdjhj1ch
cmrirp4oe007ji80akmex7y3o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ng0073i80ajdcchlwg	2026-07-13 05:14:06.446	2026-07-13 05:14:06.446	cmriros3y006yjc0abm2k78r7
cmrirp4op007ni80aaht8epsg	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.458	2026-07-13 05:14:06.458	cmriros3v000yjc0a5b1xu6ui
cmrirp4ot007pi80ar23r5tvj	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.461	2026-07-13 05:14:06.461	cmriros3v0017jc0aylaats5p
cmrirp4ox007ri80avxrizy3o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.465	2026-07-13 05:14:06.465	cmriros3w002wjc0a1xa1rwz5
cmrirp4p1007ti80a16abg3gz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.469	2026-07-13 05:14:06.469	cmriros3w0035jc0a05stauap
cmrirp4p6007vi80awhfbqe12	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.475	2026-07-13 05:14:06.475	cmriros3x004tjc0afryb0chy
cmrirp4pa007xi80ai7icdcgy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.479	2026-07-13 05:14:06.479	cmriros3x0052jc0amhph2bzz
cmrirp4pe007zi80aothq1468	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.483	2026-07-13 05:14:06.483	cmriros3y006qjc0avh471fy2
cmrirp4pi0081i80adq9defyp	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4oj007li80af9y4edub	2026-07-13 05:14:06.486	2026-07-13 05:14:06.486	cmriros3y006zjc0a2jb8uh8w
cmrirp4ps0085i80avaerz7mn	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.497	2026-07-13 05:14:06.497	cmriros3v000zjc0adqoi7ajl
cmrirp4px0087i80af8iqo09d	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.502	2026-07-13 05:14:06.502	cmriros3v0018jc0afv09rr2o
cmrirp4q20089i80axzniwqez	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.507	2026-07-13 05:14:06.507	cmriros3w002xjc0ayqm0ns8a
cmrirp4q6008bi80a5isxx0c0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.51	2026-07-13 05:14:06.51	cmriros3w0036jc0a7pk8sdst
cmrirp4qa008di80an5ouize5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.514	2026-07-13 05:14:06.514	cmriros3x004ujc0ak6v30qdg
cmrirp4qe008fi80a5ggrri6n	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.518	2026-07-13 05:14:06.518	cmriros3x0053jc0aajqjd12u
cmrirp4qk008hi80af57fn4qm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.525	2026-07-13 05:14:06.525	cmriros3y006rjc0anjctfrel
cmrirp4qo008ji80ae3iheo14	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4pn0083i80ac9vld8iw	2026-07-13 05:14:06.528	2026-07-13 05:14:06.528	cmriros3y0070jc0ali8utzte
cmrirp4qw008ni80a8576gtvg	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4qs008li80a0qreiilh	2026-07-13 05:14:06.537	2026-07-13 05:14:06.537	cmriros3v0019jc0apjfl7a7x
cmrirp4r1008pi80avpo0ma7d	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4qs008li80a0qreiilh	2026-07-13 05:14:06.541	2026-07-13 05:14:06.541	cmriros3w0037jc0a2jajkbho
cmrirp4r5008ri80a8q956ofm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4qs008li80a0qreiilh	2026-07-13 05:14:06.545	2026-07-13 05:14:06.545	cmriros3x0054jc0a8ll73y2n
cmrirp4r8008ti80aa4vuvvj7	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4qs008li80a0qreiilh	2026-07-13 05:14:06.549	2026-07-13 05:14:06.549	cmriros3y0071jc0a422ynv5g
cmrirp4rg008xi80avyoe73wx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4rc008vi80axdsbwinc	2026-07-13 05:14:06.556	2026-07-13 05:14:06.556	cmriros3v001ajc0avgvgftdd
cmrirp4rj008zi80a1d9a1zmd	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4rc008vi80axdsbwinc	2026-07-13 05:14:06.56	2026-07-13 05:14:06.56	cmriros3w0038jc0apiehpzja
cmrirp4ro0091i80alvmdtjdd	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4rc008vi80axdsbwinc	2026-07-13 05:14:06.564	2026-07-13 05:14:06.564	cmriros3x0055jc0acif1s8l4
cmrirp4rr0093i80apfhzsq6b	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4rc008vi80axdsbwinc	2026-07-13 05:14:06.567	2026-07-13 05:14:06.567	cmriros3y0072jc0abf44e238
cmrirp4ry0097i80akojez5w0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ru0095i80adku5dvro	2026-07-13 05:14:06.574	2026-07-13 05:14:06.574	cmriros3v001bjc0aefz65imw
cmrirp4s10099i80ayn4khvd8	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ru0095i80adku5dvro	2026-07-13 05:14:06.578	2026-07-13 05:14:06.578	cmriros3w0039jc0af43ct5bg
cmrirp4s5009bi80asbco1xh5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ru0095i80adku5dvro	2026-07-13 05:14:06.581	2026-07-13 05:14:06.581	cmriros3x0056jc0asz794pni
cmrirp4s9009di80aphrs3z7l	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ru0095i80adku5dvro	2026-07-13 05:14:06.585	2026-07-13 05:14:06.585	cmriros3y0073jc0ank3y32to
cmrirp4sh009hi80anjb1ttm4	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4sd009fi80aj4jnlnp4	2026-07-13 05:14:06.593	2026-07-13 05:14:06.593	cmriros3v001cjc0a3qmgv5r8
cmrirp4sk009ji80au23d53d9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4sd009fi80aj4jnlnp4	2026-07-13 05:14:06.596	2026-07-13 05:14:06.596	cmriros3w003ajc0a4t0znj15
cmrirp4sn009li80aftfu841r	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4sd009fi80aj4jnlnp4	2026-07-13 05:14:06.599	2026-07-13 05:14:06.599	cmriros3x0057jc0ag2f9gs48
cmrirp4sq009ni80afp3m6igy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4sd009fi80aj4jnlnp4	2026-07-13 05:14:06.602	2026-07-13 05:14:06.602	cmriros3y0074jc0aarj1cvfi
cmrirp4sx009ri80ankl0dabg	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4su009pi80ajqfy6o5y	2026-07-13 05:14:06.61	2026-07-13 05:14:06.61	cmriros3v001djc0aru6itu14
cmrirp4t0009ti80aw6neet7w	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4su009pi80ajqfy6o5y	2026-07-13 05:14:06.613	2026-07-13 05:14:06.613	cmriros3w003bjc0a4wyu5d6q
cmrirp4t4009vi80ae7vvorlu	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4su009pi80ajqfy6o5y	2026-07-13 05:14:06.616	2026-07-13 05:14:06.616	cmriros3x0058jc0ah12cwzrb
cmrirp4t7009xi80afrohixwa	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4su009pi80ajqfy6o5y	2026-07-13 05:14:06.619	2026-07-13 05:14:06.619	cmriros3y0075jc0arh552u87
cmrirp4te00a1i80avxpxs8ff	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ta009zi80ai3j384lh	2026-07-13 05:14:06.626	2026-07-13 05:14:06.626	cmriros3v001ejc0a1cx2htqo
cmrirp4th00a3i80azcheq5ou	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ta009zi80ai3j384lh	2026-07-13 05:14:06.63	2026-07-13 05:14:06.63	cmriros3w003cjc0a1ddefure
cmrirp4tl00a5i80aloj0cz59	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ta009zi80ai3j384lh	2026-07-13 05:14:06.633	2026-07-13 05:14:06.633	cmriros3x0059jc0atmxnr7an
cmrirp4to00a7i80anf7c6h98	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ta009zi80ai3j384lh	2026-07-13 05:14:06.636	2026-07-13 05:14:06.636	cmriros3y0076jc0aqzqjcgbp
cmrirp4tv00abi80adv3uex30	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.643	2026-07-13 05:14:06.643	cmriros3v001fjc0aihp946ea
cmrirp4ty00adi80ab7haw8la	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.646	2026-07-13 05:14:06.646	cmriros3v001gjc0avwjwkeva
cmrirp4u300afi80a29utdmsr	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.652	2026-07-13 05:14:06.652	cmriros3w003djc0a5v5xh6kv
cmrirp4u700ahi80a055zhpxk	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.655	2026-07-13 05:14:06.655	cmriros3w003ejc0a9hl3e2np
cmrirp4ua00aji80a85oyholz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.658	2026-07-13 05:14:06.658	cmriros3x005ajc0at8l6ukbb
cmrirp4ud00ali80ahtv2h6bq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.662	2026-07-13 05:14:06.662	cmriros3x005bjc0ak1ffj54m
cmrirp4uh00ani80a03psc91y	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.665	2026-07-13 05:14:06.665	cmriros3y0077jc0ai0quvjqd
cmrirp4uk00api80ay9tn1qa6	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4tr00a9i80ak23y113w	2026-07-13 05:14:06.668	2026-07-13 05:14:06.668	cmriros3y0078jc0agfsopxju
cmrirp4ur00ati80axrouueoo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4uo00ari80ah690u5jj	2026-07-13 05:14:06.676	2026-07-13 05:14:06.676	cmriros3v001hjc0ahnk31u8t
cmrirp4uv00avi80a77s2scv5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4uo00ari80ah690u5jj	2026-07-13 05:14:06.679	2026-07-13 05:14:06.679	cmriros3w003fjc0ama2xbja8
cmrirp4uy00axi80ajj623l2v	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4uo00ari80ah690u5jj	2026-07-13 05:14:06.683	2026-07-13 05:14:06.683	cmriros3x005cjc0ayiu742of
cmrirp4v100azi80a9fskgw5p	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4uo00ari80ah690u5jj	2026-07-13 05:14:06.686	2026-07-13 05:14:06.686	cmriros3y0079jc0aw7tdg1ic
cmrirp4va00b3i80a11pt1m7t	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4v500b1i80aenhu21vu	2026-07-13 05:14:06.694	2026-07-13 05:14:06.694	cmriros3v001ijc0ag7l99v66
cmrirp4ve00b5i80arpm04bcx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4v500b1i80aenhu21vu	2026-07-13 05:14:06.698	2026-07-13 05:14:06.698	cmriros3w003hjc0a25neenzb
cmrirp4vh00b7i80a0jrqwxyp	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4v500b1i80aenhu21vu	2026-07-13 05:14:06.702	2026-07-13 05:14:06.702	cmriros3x005djc0am7rqws70
cmrirp4vl00b9i80acmzzh7ve	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4v500b1i80aenhu21vu	2026-07-13 05:14:06.705	2026-07-13 05:14:06.705	cmriros3y007bjc0augiuyxil
cmrirp4vs00bdi80abrzn9ypx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4vo00bbi80acg3p9zfi	2026-07-13 05:14:06.712	2026-07-13 05:14:06.712	cmriros3v001jjc0a3i3zvh9l
cmrirp4vv00bfi80atrn40b17	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4vo00bbi80acg3p9zfi	2026-07-13 05:14:06.716	2026-07-13 05:14:06.716	cmriros3w003ijc0a4zbdykq8
cmrirp4vy00bhi80a3m9vhy7q	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4vo00bbi80acg3p9zfi	2026-07-13 05:14:06.719	2026-07-13 05:14:06.719	cmriros3x005ejc0aev9zvmql
cmrirp4w200bji80aklu1ebon	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4vo00bbi80acg3p9zfi	2026-07-13 05:14:06.722	2026-07-13 05:14:06.722	cmriros3y007cjc0ag5hiunor
cmrirp4wa00bni80a84zdnqps	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4w600bli80afmqz2dw2	2026-07-13 05:14:06.73	2026-07-13 05:14:06.73	cmriros3v001kjc0a2tc3w6zn
cmrirp4wd00bpi80ano2qzlez	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4w600bli80afmqz2dw2	2026-07-13 05:14:06.734	2026-07-13 05:14:06.734	cmriros3y007djc0aluzbfjni
cmrirp4wl00bti80acmpia6ci	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wi00bri80a5b34a8cq	2026-07-13 05:14:06.742	2026-07-13 05:14:06.742	cmriros3v001ljc0atnriom22
cmrirp4wo00bvi80an3m5lp2u	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wi00bri80a5b34a8cq	2026-07-13 05:14:06.745	2026-07-13 05:14:06.745	cmriros3w003jjc0aph2kct3a
cmrirp4wr00bxi80aqvdoo55m	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wi00bri80a5b34a8cq	2026-07-13 05:14:06.748	2026-07-13 05:14:06.748	cmriros3x005fjc0afa02nlxi
cmrirp4wv00bzi80a9by50mlk	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wi00bri80a5b34a8cq	2026-07-13 05:14:06.751	2026-07-13 05:14:06.751	cmriros3y007ejc0afs6vnvgy
cmrirp4x300c3i80avb7d6dfa	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wy00c1i80anqflgpuo	2026-07-13 05:14:06.759	2026-07-13 05:14:06.759	cmriros3v001mjc0a2t3w3bp5
cmrirp4x600c5i80a1ksx6kjk	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wy00c1i80anqflgpuo	2026-07-13 05:14:06.762	2026-07-13 05:14:06.762	cmriros3w003kjc0a15mf6q1k
cmrirp4xh00c7i80afmupyn15	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wy00c1i80anqflgpuo	2026-07-13 05:14:06.774	2026-07-13 05:14:06.774	cmriros3x005gjc0aldrzsauf
cmrirp4xl00c9i80apt7k0jr5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4wy00c1i80anqflgpuo	2026-07-13 05:14:06.778	2026-07-13 05:14:06.778	cmriros3y007fjc0a8vxakgqo
cmrirp4xt00cdi80adqhmbll9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4xq00cbi80aj096ahcr	2026-07-13 05:14:06.786	2026-07-13 05:14:06.786	cmriros3v001njc0a346oyg70
cmrirp4xx00cfi80a3cryy3g8	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4xq00cbi80aj096ahcr	2026-07-13 05:14:06.79	2026-07-13 05:14:06.79	cmriros3w003ljc0ah82n9bz3
cmrirp4y200chi80a9liimoet	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4xq00cbi80aj096ahcr	2026-07-13 05:14:06.795	2026-07-13 05:14:06.795	cmriros3x005hjc0aaqiajmlu
cmrirp4y600cji80a0v82mgcv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4xq00cbi80aj096ahcr	2026-07-13 05:14:06.798	2026-07-13 05:14:06.798	cmriros3y007gjc0aljt4isot
cmrirp4yf00cni80amtrcxh9g	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ya00cli80ay0ilweew	2026-07-13 05:14:06.807	2026-07-13 05:14:06.807	cmriros3v001ojc0ac3wmacsn
cmrirp4yi00cpi80addyn508v	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ya00cli80ay0ilweew	2026-07-13 05:14:06.811	2026-07-13 05:14:06.811	cmriros3x005ijc0azlazu3ws
cmrirp4ym00cri80ad7pz1wpv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4ya00cli80ay0ilweew	2026-07-13 05:14:06.814	2026-07-13 05:14:06.814	cmriros3y007hjc0aqrxkbolm
cmrirp4yt00cvi80a0w9hbjbz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4yq00cti80akkqp672m	2026-07-13 05:14:06.822	2026-07-13 05:14:06.822	cmriros3v001pjc0a4wsjohfn
cmrirp4yw00cxi80acn3zqmz0	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4yq00cti80akkqp672m	2026-07-13 05:14:06.825	2026-07-13 05:14:06.825	cmriros3w003njc0a026xy264
cmrirp4yz00czi80a4bb78u4t	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4yq00cti80akkqp672m	2026-07-13 05:14:06.828	2026-07-13 05:14:06.828	cmriros3x005jjc0abpgvuslu
cmrirp4z300d1i80av0q69k7x	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4yq00cti80akkqp672m	2026-07-13 05:14:06.831	2026-07-13 05:14:06.831	cmriros3z007ijc0a76hwmdah
cmrirp4zf00d5i80acmv1ky9y	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zb00d3i80aiukrc7zn	2026-07-13 05:14:06.843	2026-07-13 05:14:06.843	cmriros3v001qjc0a44yk0g9c
cmrirp4zi00d7i80aef0baf1d	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zb00d3i80aiukrc7zn	2026-07-13 05:14:06.847	2026-07-13 05:14:06.847	cmriros3w003ojc0alq7np8lt
cmrirp4zl00d9i80aedk0a1ym	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zb00d3i80aiukrc7zn	2026-07-13 05:14:06.85	2026-07-13 05:14:06.85	cmriros3x005kjc0a2tnjxhyz
cmrirp4zo00dbi80abzd917d1	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zb00d3i80aiukrc7zn	2026-07-13 05:14:06.853	2026-07-13 05:14:06.853	cmriros3z007jjc0aps6vhg03
cmrirp4zw00dfi80aseellaa1	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.861	2026-07-13 05:14:06.861	cmriros3v001rjc0ajm95edcy
cmrirp50000dhi80acpqoiydr	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.864	2026-07-13 05:14:06.864	cmriros3v001ujc0a3xlgmh01
cmrirp50300dji80aebueeotn	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.867	2026-07-13 05:14:06.867	cmriros3w003pjc0addf74p11
cmrirp50600dli80ahgj3kpke	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.87	2026-07-13 05:14:06.87	cmriros3w003sjc0ajqsxfwh3
cmrirp50900dni80abg4aqrvn	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.873	2026-07-13 05:14:06.873	cmriros3x005ljc0apjenkksi
cmrirp50c00dpi80a5glox7vz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.876	2026-07-13 05:14:06.876	cmriros3x005ojc0ao1wer5tg
cmrirp50f00dri80apella0to	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.88	2026-07-13 05:14:06.88	cmriros3z007kjc0a1jcckosi
cmrirp50j00dti80a2lbac2lh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp4zs00ddi80armlrqw4z	2026-07-13 05:14:06.883	2026-07-13 05:14:06.883	cmriros3z007njc0a3jwexzsc
cmrirp50r00dxi80av6nbh2ut	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp50n00dvi80ax8uvzrjy	2026-07-13 05:14:06.892	2026-07-13 05:14:06.892	cmriros3v001sjc0auk57sgss
cmrirp50u00dzi80a8iw42rqx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp50n00dvi80ax8uvzrjy	2026-07-13 05:14:06.895	2026-07-13 05:14:06.895	cmriros3w003qjc0asu55wmql
cmrirp50y00e1i80apkxied2d	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp50n00dvi80ax8uvzrjy	2026-07-13 05:14:06.898	2026-07-13 05:14:06.898	cmriros3x005mjc0adu12syn9
cmrirp51200e3i80a0ovzor8w	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp50n00dvi80ax8uvzrjy	2026-07-13 05:14:06.902	2026-07-13 05:14:06.902	cmriros3z007ljc0a3p9rfqwa
cmrirp51900e7i80antwwypq2	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51500e5i80a8enp08ke	2026-07-13 05:14:06.909	2026-07-13 05:14:06.909	cmriros3v001tjc0atbrtn93w
cmrirp51c00e9i80axgr4sums	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51500e5i80a8enp08ke	2026-07-13 05:14:06.913	2026-07-13 05:14:06.913	cmriros3w003rjc0armqz1zu6
cmrirp51f00ebi80ap7l33o4o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51500e5i80a8enp08ke	2026-07-13 05:14:06.916	2026-07-13 05:14:06.916	cmriros3x005njc0askpjr9np
cmrirp51p00efi80a9en9enq3	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51l00edi80ajj5luzy6	2026-07-13 05:14:06.925	2026-07-13 05:14:06.925	cmriros3v001vjc0a89blnogh
cmrirp51s00ehi80an3jkd50t	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51l00edi80ajj5luzy6	2026-07-13 05:14:06.929	2026-07-13 05:14:06.929	cmriros3w003tjc0asz7f98qn
cmrirp51v00eji80azftd02zl	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51l00edi80ajj5luzy6	2026-07-13 05:14:06.932	2026-07-13 05:14:06.932	cmriros3x005pjc0ahyjx8x76
cmrirp52300eni80av8fprvtt	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51z00eli80axd1qsbfu	2026-07-13 05:14:06.939	2026-07-13 05:14:06.939	cmriros3v001wjc0am4u1kz75
cmrirp52600epi80ai6ge31p5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51z00eli80axd1qsbfu	2026-07-13 05:14:06.942	2026-07-13 05:14:06.942	cmriros3w003ujc0aj2rkhf3i
cmrirp52900eri80acam60pbi	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51z00eli80axd1qsbfu	2026-07-13 05:14:06.946	2026-07-13 05:14:06.946	cmriros3x005qjc0a85p4ttgz
cmrirp52d00eti80awuu48oae	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp51z00eli80axd1qsbfu	2026-07-13 05:14:06.949	2026-07-13 05:14:06.949	cmriros3z007pjc0ajbav7fih
cmrirp52k00exi80axug93tfy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52g00evi80a6ap6h8bf	2026-07-13 05:14:06.956	2026-07-13 05:14:06.956	cmriros3v001xjc0a85gavz51
cmrirp52p00ezi80ankgzjhll	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52g00evi80a6ap6h8bf	2026-07-13 05:14:06.961	2026-07-13 05:14:06.961	cmriros3w003vjc0avjk3bx5l
cmrirp52s00f1i80awyj1v752	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52g00evi80a6ap6h8bf	2026-07-13 05:14:06.965	2026-07-13 05:14:06.965	cmriros3x005rjc0aqscwjnwe
cmrirp52v00f3i80aidtrkvrz	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52g00evi80a6ap6h8bf	2026-07-13 05:14:06.968	2026-07-13 05:14:06.968	cmriros3z007qjc0a8c14tot9
cmrirp53300f7i80ag0l5p41x	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52z00f5i80a5b6faz5o	2026-07-13 05:14:06.975	2026-07-13 05:14:06.975	cmriros3v001yjc0a6ffz86kh
cmrirp53600f9i80amht280kt	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52z00f5i80a5b6faz5o	2026-07-13 05:14:06.978	2026-07-13 05:14:06.978	cmriros3w003wjc0amdacf9ub
cmrirp53900fbi80a34tu61vo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52z00f5i80a5b6faz5o	2026-07-13 05:14:06.981	2026-07-13 05:14:06.981	cmriros3x005sjc0a7fiavopj
cmrirp53c00fdi80anqlhxjth	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp52z00f5i80a5b6faz5o	2026-07-13 05:14:06.984	2026-07-13 05:14:06.984	cmriros3z007rjc0at6jobasw
cmrirp53k00fhi80arbevgcvm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53g00ffi80anbf471c6	2026-07-13 05:14:06.993	2026-07-13 05:14:06.993	cmriros3v001zjc0a5ouu26ai
cmrirp53o00fji80an2rpki4l	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53g00ffi80anbf471c6	2026-07-13 05:14:06.996	2026-07-13 05:14:06.996	cmriros3w003xjc0a1gju1tfl
cmrirp53r00fli80aepc21end	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53g00ffi80anbf471c6	2026-07-13 05:14:07	2026-07-13 05:14:07	cmriros3x005tjc0aybzfxzxp
cmrirp53v00fni80az9rudw64	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53g00ffi80anbf471c6	2026-07-13 05:14:07.003	2026-07-13 05:14:07.003	cmriros3z007sjc0ajunuc1nq
cmrirp54300fri80an5lk50n7	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53z00fpi80atkxvvm0s	2026-07-13 05:14:07.011	2026-07-13 05:14:07.011	cmriros3v0020jc0a8c4ewbzz
cmrirp54600fti80agr6belnv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53z00fpi80atkxvvm0s	2026-07-13 05:14:07.014	2026-07-13 05:14:07.014	cmriros3w003yjc0agwasgcj4
cmrirp54a00fvi80an1apx7kh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53z00fpi80atkxvvm0s	2026-07-13 05:14:07.018	2026-07-13 05:14:07.018	cmriros3x005ujc0anjpws5eq
cmrirp54d00fxi80akwxgd5qa	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp53z00fpi80atkxvvm0s	2026-07-13 05:14:07.022	2026-07-13 05:14:07.022	cmriros3z007tjc0ay2yloxc4
cmrirp54l00g1i80a3row8wc8	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54h00fzi80a2gx4gu7g	2026-07-13 05:14:07.029	2026-07-13 05:14:07.029	cmriros3v0021jc0aod0mug3a
cmrirp54o00g3i80atm8xaocu	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54h00fzi80a2gx4gu7g	2026-07-13 05:14:07.033	2026-07-13 05:14:07.033	cmriros3w003zjc0atnho4zcu
cmrirp54r00g5i80ag430y3gi	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54h00fzi80a2gx4gu7g	2026-07-13 05:14:07.036	2026-07-13 05:14:07.036	cmriros3x005vjc0a4kiv9nhh
cmrirp54u00g7i80aj97bz644	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54h00fzi80a2gx4gu7g	2026-07-13 05:14:07.039	2026-07-13 05:14:07.039	cmriros3z007ujc0a2d186sil
cmrirp55100gbi80a9ddouf27	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54y00g9i80a1x4wp5g9	2026-07-13 05:14:07.045	2026-07-13 05:14:07.045	cmriros3v0022jc0apmjf2v2p
cmrirp55800gdi80akwvfbk6z	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54y00g9i80a1x4wp5g9	2026-07-13 05:14:07.052	2026-07-13 05:14:07.052	cmriros3w0040jc0ajzwug3n5
cmrirp55b00gfi80arz9anoyl	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54y00g9i80a1x4wp5g9	2026-07-13 05:14:07.055	2026-07-13 05:14:07.055	cmriros3x005wjc0abrtsl2ab
cmrirp55f00ghi80akg2ctp7o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp54y00g9i80a1x4wp5g9	2026-07-13 05:14:07.059	2026-07-13 05:14:07.059	cmriros3z007vjc0arg73eo2w
cmrirp55m00gli80af1s0f6pn	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp55i00gji80am00k58ia	2026-07-13 05:14:07.066	2026-07-13 05:14:07.066	cmriros3v0023jc0achqmxpnf
cmrirp55p00gni80ak2t346a2	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp55i00gji80am00k58ia	2026-07-13 05:14:07.069	2026-07-13 05:14:07.069	cmriros3w0041jc0ajt0o0h1g
cmrirp55s00gpi80ay4ngiuse	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp55i00gji80am00k58ia	2026-07-13 05:14:07.073	2026-07-13 05:14:07.073	cmriros3x005xjc0a3w3nxr2p
cmrirp55v00gri80a2la9o3dd	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp55i00gji80am00k58ia	2026-07-13 05:14:07.076	2026-07-13 05:14:07.076	cmriros3z007wjc0awhnccfvb
cmrirp56600gvi80a39eqlttv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56100gti80an5m1abx4	2026-07-13 05:14:07.086	2026-07-13 05:14:07.086	cmriros3v0024jc0aug1k5c8q
cmrirp56900gxi80a92e5a6aj	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56100gti80an5m1abx4	2026-07-13 05:14:07.09	2026-07-13 05:14:07.09	cmriros3w0042jc0aql8z38m4
cmrirp56c00gzi80ad8q5yi1u	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56100gti80an5m1abx4	2026-07-13 05:14:07.093	2026-07-13 05:14:07.093	cmriros3x005yjc0atede7kw6
cmrirp56f00h1i80at9juw9g5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56100gti80an5m1abx4	2026-07-13 05:14:07.096	2026-07-13 05:14:07.096	cmriros3z007xjc0a4c911i2f
cmrirp56o00h5i80ay7qochpw	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56j00h3i80avskah22e	2026-07-13 05:14:07.104	2026-07-13 05:14:07.104	cmriros3v0025jc0ajaz7zb80
cmrirp56s00h7i80a9584defn	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56j00h3i80avskah22e	2026-07-13 05:14:07.108	2026-07-13 05:14:07.108	cmriros3w0043jc0ay6xs9gq0
cmrirp56v00h9i80av8x3c6vm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56j00h3i80avskah22e	2026-07-13 05:14:07.112	2026-07-13 05:14:07.112	cmriros3x005zjc0aqw39i5m7
cmrirp56y00hbi80afydsl7za	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp56j00h3i80avskah22e	2026-07-13 05:14:07.115	2026-07-13 05:14:07.115	cmriros3z007yjc0atdbek8bh
cmrirp57500hfi80awrp8nfbv	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57200hdi80aaxg6tjy0	2026-07-13 05:14:07.122	2026-07-13 05:14:07.122	cmriros3v0026jc0a0hq7h3ur
cmrirp57900hhi80a7n63oorm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57200hdi80aaxg6tjy0	2026-07-13 05:14:07.125	2026-07-13 05:14:07.125	cmriros3w0044jc0aoyudervk
cmrirp57c00hji80a0b7f9ndb	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57200hdi80aaxg6tjy0	2026-07-13 05:14:07.129	2026-07-13 05:14:07.129	cmriros3x0060jc0a7lcizyfz
cmrirp57f00hli80att41nrgx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57200hdi80aaxg6tjy0	2026-07-13 05:14:07.132	2026-07-13 05:14:07.132	cmriros3z007zjc0a8n1m0rik
cmrirp57m00hpi80ayyfzc9ci	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57j00hni80ajtuw6hx4	2026-07-13 05:14:07.139	2026-07-13 05:14:07.139	cmriros3v0027jc0a1lqv6nwt
cmrirp57p00hri80aw9d2optx	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57j00hni80ajtuw6hx4	2026-07-13 05:14:07.142	2026-07-13 05:14:07.142	cmriros3w0045jc0amy4cp8dr
cmrirp57t00hti80aiuegmlx5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57j00hni80ajtuw6hx4	2026-07-13 05:14:07.146	2026-07-13 05:14:07.146	cmriros3x0061jc0a3f153zj7
cmrirp57x00hvi80ahltogk3z	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp57j00hni80ajtuw6hx4	2026-07-13 05:14:07.15	2026-07-13 05:14:07.15	cmriros3z0080jc0afi4nrnfo
cmrirp58400hzi80a28uqxn08	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58100hxi80am3q3jyry	2026-07-13 05:14:07.157	2026-07-13 05:14:07.157	cmriros3v0028jc0ag97a67a1
cmrirp58700i1i80aopi40nu2	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58100hxi80am3q3jyry	2026-07-13 05:14:07.16	2026-07-13 05:14:07.16	cmriros3w0046jc0ap4ucg5zd
cmrirp58a00i3i80a2m37ojd3	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58100hxi80am3q3jyry	2026-07-13 05:14:07.163	2026-07-13 05:14:07.163	cmriros3x0062jc0alswgbmww
cmrirp58d00i5i80atxju3odm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58100hxi80am3q3jyry	2026-07-13 05:14:07.166	2026-07-13 05:14:07.166	cmriros3z0081jc0aks5t5yk0
cmrirp58l00i9i80a8rfbs9p8	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58h00i7i80aigafkgfh	2026-07-13 05:14:07.173	2026-07-13 05:14:07.173	cmriros3v0029jc0athyyhhj6
cmrirp58o00ibi80ac46j6196	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58h00i7i80aigafkgfh	2026-07-13 05:14:07.176	2026-07-13 05:14:07.176	cmriros3w0047jc0axgqjxca5
cmrirp58r00idi80afzg63ak1	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58h00i7i80aigafkgfh	2026-07-13 05:14:07.18	2026-07-13 05:14:07.18	cmriros3x0063jc0aksmf6qng
cmrirp58u00ifi80axyzc7v2e	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58h00i7i80aigafkgfh	2026-07-13 05:14:07.183	2026-07-13 05:14:07.183	cmriros3z0082jc0amwfbsjn9
cmrirp59200iji80auwtwinl3	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58y00ihi80ag50cf874	2026-07-13 05:14:07.19	2026-07-13 05:14:07.19	cmriros3v002ajc0aqjge0ug4
cmrirp59500ili80ao08rp9s2	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58y00ihi80ag50cf874	2026-07-13 05:14:07.194	2026-07-13 05:14:07.194	cmriros3w0048jc0ama2rx7lm
cmrirp59f00ini80aavzsk16b	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58y00ihi80ag50cf874	2026-07-13 05:14:07.204	2026-07-13 05:14:07.204	cmriros3x0064jc0ayvs6nus7
cmrirp59j00ipi80aoscb4gn5	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp58y00ihi80ag50cf874	2026-07-13 05:14:07.208	2026-07-13 05:14:07.208	cmriros3z0083jc0a1z9a9vtk
cmrirp59r00iti80amyhfnkxm	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp59n00iri80azyq6bufb	2026-07-13 05:14:07.215	2026-07-13 05:14:07.215	cmriros3v002bjc0afg5vf1va
cmrirp59u00ivi80a085ozswg	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp59n00iri80azyq6bufb	2026-07-13 05:14:07.218	2026-07-13 05:14:07.218	cmriros3w0049jc0ayz4rd2hv
cmrirp59x00ixi80ap6es3svj	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp59n00iri80azyq6bufb	2026-07-13 05:14:07.221	2026-07-13 05:14:07.221	cmriros3x0065jc0axvclmnkm
cmrirp5a000izi80arzyhqnt9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp59n00iri80azyq6bufb	2026-07-13 05:14:07.225	2026-07-13 05:14:07.225	cmriros3z0084jc0a3vxl1i9g
cmrirp5a800j3i80a4s1ui1un	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5a400j1i80a47r3j1er	2026-07-13 05:14:07.232	2026-07-13 05:14:07.232	cmriros3v002cjc0av08n9j9d
cmrirp5ab00j5i80a2azwfxeh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5a400j1i80a47r3j1er	2026-07-13 05:14:07.235	2026-07-13 05:14:07.235	cmriros3w004ajc0a9ux9vg3f
cmrirp5ae00j7i80av1vs1bzr	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5a400j1i80a47r3j1er	2026-07-13 05:14:07.238	2026-07-13 05:14:07.238	cmriros3x0066jc0aiboi6fq4
cmrirp5ah00j9i80aysmwnu44	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5a400j1i80a47r3j1er	2026-07-13 05:14:07.241	2026-07-13 05:14:07.241	cmriros3z0085jc0aa9ab49bl
cmrirp5ak00jbi80a9h5sw9mq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5a400j1i80a47r3j1er	2026-07-13 05:14:07.244	2026-07-13 05:14:07.244	cmriros3z0092jc0a507e11ns
cmrirp5ar00jfi80ajx3u1uow	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5an00jdi80ah9sk5keu	2026-07-13 05:14:07.251	2026-07-13 05:14:07.251	cmriros3v002djc0asmhezriv
cmrirp5au00jhi80aj29sjp0m	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5an00jdi80ah9sk5keu	2026-07-13 05:14:07.254	2026-07-13 05:14:07.254	cmriros3w004bjc0akt7tc2y7
cmrirp5ax00jji80a84vsorg6	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5an00jdi80ah9sk5keu	2026-07-13 05:14:07.257	2026-07-13 05:14:07.257	cmriros3x0067jc0aw3ntwata
cmrirp5b500jni80ajyf53kj4	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5b100jli80agbp8jqok	2026-07-13 05:14:07.265	2026-07-13 05:14:07.265	cmriros3v002ejc0a9j4kc6o2
cmrirp5bc00jri80aoilkjqzj	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5b800jpi80ab0tskg75	2026-07-13 05:14:07.272	2026-07-13 05:14:07.272	cmriros3v002fjc0anw7aodn0
cmrirp5bi00jvi80ajt87zb8s	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bf00jti80ac59ewtvi	2026-07-13 05:14:07.279	2026-07-13 05:14:07.279	cmriros3v002gjc0azxzwth1n
cmrirp5bq00jzi80aboecwskq	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bm00jxi80aq5q5v7h4	2026-07-13 05:14:07.285	2026-07-13 05:14:07.285	cmriros3v002hjc0asf6xx42g
cmrirp5bt00k1i80aya47rpzo	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bm00jxi80aq5q5v7h4	2026-07-13 05:14:07.289	2026-07-13 05:14:07.289	cmriros3w004fjc0ayvaa3w0p
cmrirp5bw00k3i80aawn3ykku	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bm00jxi80aq5q5v7h4	2026-07-13 05:14:07.292	2026-07-13 05:14:07.292	cmriros3y006bjc0alzyunctr
cmrirp5c300k7i80awnge5f6c	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bz00k5i80a7j5ivj1r	2026-07-13 05:14:07.299	2026-07-13 05:14:07.299	cmriros3w003gjc0a5uhrnloj
cmrirp5c600k9i80axg358tun	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5bz00k5i80a7j5ivj1r	2026-07-13 05:14:07.302	2026-07-13 05:14:07.302	cmriros3y007ajc0a2nd801c3
cmrirp5cd00kdi80ayzkiwxyi	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ca00kbi80amqv9wpwa	2026-07-13 05:14:07.31	2026-07-13 05:14:07.31	cmriros3w003mjc0azahegvsz
cmrirp5cl00khi80abx550cqy	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ch00kfi80a61hi17be	2026-07-13 05:14:07.317	2026-07-13 05:14:07.317	cmriros3w004djc0a36d42x1a
cmrirp5co00kji80a69vpavg9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ch00kfi80a61hi17be	2026-07-13 05:14:07.321	2026-07-13 05:14:07.321	cmriros3y0069jc0agp6rdbuw
cmrirp5cw00kni80aeaob78j9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5cs00kli80aap2fgfcp	2026-07-13 05:14:07.328	2026-07-13 05:14:07.328	cmriros3w004ejc0awqdqnhos
cmrirp5cz00kpi80ab8bnkxs9	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5cs00kli80aap2fgfcp	2026-07-13 05:14:07.332	2026-07-13 05:14:07.332	cmriros3y006ajc0a2f3la1ll
cmrirp5d600kti80aj7h2qifu	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5d300kri80aztkruoqh	2026-07-13 05:14:07.339	2026-07-13 05:14:07.339	cmriros3z007mjc0a9cy1k4o7
cmrirp5de00kxi80a0n20bedu	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5da00kvi80aoj0vaezx	2026-07-13 05:14:07.346	2026-07-13 05:14:07.346	cmriros3z007ojc0a9r9g551k
cmrirp5dm00l1i80a7itamwh0	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5di00kzi80aw6qepvnh	2026-07-13 05:14:07.354	2026-07-13 05:14:07.354	cmriros3z0086jc0av7kt39ju
cmrirp5du00l5i80a8n515qx0	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5dr00l3i80aq3dj7hld	2026-07-13 05:14:07.363	2026-07-13 05:14:07.363	cmriros3z0087jc0aezyyvlwi
cmrirp5e300l9i80apapyelkn	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5dz00l7i80azakoa9sh	2026-07-13 05:14:07.372	2026-07-13 05:14:07.372	cmriros3z0088jc0aam0mydsa
cmrirp5ea00ldi80am0kcq9yr	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5e700lbi80a168gr8u3	2026-07-13 05:14:07.379	2026-07-13 05:14:07.379	cmriros3z0089jc0a4fkiz0eq
cmrirp5ei00lhi80ay8mb867i	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ee00lfi80a8kwepbtb	2026-07-13 05:14:07.386	2026-07-13 05:14:07.386	cmriros3z008ajc0agc843yii
cmrirp5ep00lli80a4twyf6cw	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5em00lji80a5kt031b8	2026-07-13 05:14:07.394	2026-07-13 05:14:07.394	cmriros3z008bjc0ammfd8xbw
cmrirp5es00lni80atra19akh	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5em00lji80a5kt031b8	2026-07-13 05:14:07.397	2026-07-13 05:14:07.397	cmriros3z008xjc0a0w3t5hvc
cmrirp5f000lri80az2px5ony	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ew00lpi80ap8ogi75n	2026-07-13 05:14:07.404	2026-07-13 05:14:07.404	cmriros3z008cjc0a61gdvjyi
cmrirp5f800lvi80ahje57oev	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5f500lti80asvs4ak2d	2026-07-13 05:14:07.413	2026-07-13 05:14:07.413	cmriros3z008djc0a5bfpdkbk
cmrirp5fb00lxi80apzu4n3xp	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5f500lti80asvs4ak2d	2026-07-13 05:14:07.416	2026-07-13 05:14:07.416	cmriros3z008sjc0awlak7e53
cmrirp5fj00m1i80as2e5o9ms	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5fg00lzi80a3w9kojgz	2026-07-13 05:14:07.424	2026-07-13 05:14:07.424	cmriros3z008ejc0ah881q6ix
cmrirp5fq00m5i80at6p6z1a0	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5fn00m3i80aamrq8h1l	2026-07-13 05:14:07.431	2026-07-13 05:14:07.431	cmriros3z008fjc0a36ugahkr
cmrirp5fy00m9i80azdev3pho	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5fu00m7i80a7c65bt3g	2026-07-13 05:14:07.439	2026-07-13 05:14:07.439	cmriros3z008gjc0afgsrssaq
cmrirp5g700mdi80ajxftdm3l	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5g200mbi80aon91h0cg	2026-07-13 05:14:07.447	2026-07-13 05:14:07.447	cmriros3z008hjc0ae0vn5k12
cmrirp5ge00mhi80adwgtemkl	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ga00mfi80ar7orn229	2026-07-13 05:14:07.454	2026-07-13 05:14:07.454	cmriros3z008ijc0a9susnkac
cmrirp5gm00mli80ak0dufxoc	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5gi00mji80adhl8rt99	2026-07-13 05:14:07.462	2026-07-13 05:14:07.462	cmriros3z008jjc0aswry0eyl
cmrirp5gv00mpi80acv62nm44	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5gq00mni80a6zeaqox9	2026-07-13 05:14:07.471	2026-07-13 05:14:07.471	cmriros3z008kjc0aw6c7y2uo
cmrirp5h200mti80awunw3seq	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5gz00mri80akzvrixgl	2026-07-13 05:14:07.479	2026-07-13 05:14:07.479	cmriros3z008ljc0asjggnnlj
cmrirp5ha00mxi80amahwulk9	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5h600mvi80awdgc5mum	2026-07-13 05:14:07.486	2026-07-13 05:14:07.486	cmriros3z008mjc0aok7qico2
cmrirp5hh00n1i80a5suveiid	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5he00mzi80ah9bqdxxi	2026-07-13 05:14:07.494	2026-07-13 05:14:07.494	cmriros3z008njc0atbmg721q
cmrirp5ho00n5i80a0r8becsz	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5hl00n3i80acznrsivy	2026-07-13 05:14:07.501	2026-07-13 05:14:07.501	cmriros3z008ojc0af75k1fza
cmrirp5hv00n9i80aioj00xfj	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5hs00n7i80apml5g8s7	2026-07-13 05:14:07.508	2026-07-13 05:14:07.508	cmriros3z008pjc0aznbhpruy
cmrirp5i500ndi80ad8730m3c	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5i200nbi80a9lpq15fl	2026-07-13 05:14:07.518	2026-07-13 05:14:07.518	cmriros3z008qjc0awufuagk9
cmrirp5if00nhi80ar0puxvqy	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5i900nfi80apeqg1795	2026-07-13 05:14:07.527	2026-07-13 05:14:07.527	cmriros3z008rjc0a9g86pkbj
cmrirp5im00nli80a65jphs2p	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ii00nji80a0hhvlehw	2026-07-13 05:14:07.534	2026-07-13 05:14:07.534	cmriros3z008tjc0acuzmmmfb
cmrirp5iu00npi80aqmt7813k	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5iq00nni80azbhdi0t3	2026-07-13 05:14:07.542	2026-07-13 05:14:07.542	cmriros3z008ujc0akc58b8oi
cmrirp5j200nti80a6bl6wnf5	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5ix00nri80asol4q5md	2026-07-13 05:14:07.55	2026-07-13 05:14:07.55	cmriros3z008vjc0a3rcohaq0
cmrirp5ja00nxi80aorn7sd7o	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5j600nvi80ayauu2ymp	2026-07-13 05:14:07.558	2026-07-13 05:14:07.558	cmriros3z008wjc0auom8v0k7
cmrirp5jd00nzi80a11nlg9ot	MANY_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5j600nvi80ayauu2ymp	2026-07-13 05:14:07.561	2026-07-13 05:14:07.561	cmriros3z008yjc0agzflyujb
cmrirp5jk00o3i80agrxa303l	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5jg00o1i80ayfc2h047	2026-07-13 05:14:07.569	2026-07-13 05:14:07.569	cmriros3z008zjc0axqv4otrz
cmrirp5js00o7i80aplf5ech9	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5jo00o5i80aq3c3rab8	2026-07-13 05:14:07.576	2026-07-13 05:14:07.576	cmriros3z0090jc0ac49u7adr
cmrirp5jz00obi80ac0icmrgn	ONE_TO_ONE	\N	\N	\N	98.5	APPROVED	\N	cmrirp5jv00o9i80axnl1kpe8	2026-07-13 05:14:07.584	2026-07-13 05:14:07.584	cmriros3z0091jc0aucsh4f3v
\.


--
-- Data for Name: BackCharge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BackCharge" (id, "backChargeNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", description, "incidentDate", "costComputation", photos, "inspectionReport", "materialRef", "manpowerRef", amount, acknowledgment, "disputeStatus", "approvalStatus", "deductionStatus", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BaselineActivation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BaselineActivation" (id, "projectId", "scheduleId", "reviewRound", "revisionCode", "previousBaselineId", "validationSnapshot", "snapshotVersion", "scheduleSnapshotHash", "lockedBOQChecksum", "activatedById", "activatedByNameSnapshot", "activatedByRoleSnapshot", "activatedAt", "createdAt", "idempotencyKey", "invalidatedAt", "invalidationReason", "isAuthoritative", "requestId") FROM stdin;
\.


--
-- Data for Name: Billing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Billing" (id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "totalPreviousBilling", "currentBillingAmount", "totalBillingToDate", "balanceContractAmount", "aiBillingRiskStatus", status, "preparedById", "checkedById", "approvedById", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BillingDeduction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BillingDeduction" (id, "grossBilling", retention, "withholdingTax", vat, "mobilizationAdvanceRecoupment", "previousOverpayment", "liquidatedDamages", "backCharges", "otherDeductions", "netAmountDue", "billingId") FROM stdin;
\.


--
-- Data for Name: BillingItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BillingItem" (id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "previousAmountBilled", "currentAmount", "totalAmountToDate", "balanceQuantity", "balanceAmount", "percentageAccomplished", "aiStatus", "aiRiskLevel", "billingId", "boqItemId") FROM stdin;
\.


--
-- Data for Name: CanvassForm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CanvassForm" (id, "canvassNumber", status, "mrId", "projectId", "preparedById", "recommendedSupplierId", "aiSummary", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CanvassItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CanvassItem" (id, "quantityRequired", "canvassFormId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ChatbotFeedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatbotFeedback" (id, "auditLogId", "userId", "feedbackType", "correctionNote", "adminAction", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ClientVariationOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ClientVariationOrder" (id, "cvoNumber", "projectId", status, description, "createdAt", "updatedAt", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: CommitmentLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CommitmentLedger" (id, "projectId", "commitmentType", "supplierName", "subcontractorName", "workerName", "approvedAmount", "deliveredAmount", "billedAmount", "paidAmount", "remainingCommitment", status, "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ConsolidatedBOQItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConsolidatedBOQItem" (id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "deliveredQty", "consumedQty", "voAdditiveQty", "voDeductiveQty", "revisedQuantity", "voAdditiveCost", "voDeductiveCost", "revisedTotalCost", "wasteAllowance", "revisedBenchmarkUnitCost", "requestedQuantity", "purchasedQuantity", "issuedQuantity", "subcontractedQuantity", "jobOrderQuantity", "subcontractorVoQuantity", "remainingBenchmarkQuantity", "actualUnitCost", "actualCost", "committedCost", "quantityVariance", "costVariance", savings, overrun, "valueEngineeringSavings", "isVariationItem", "sourceVoNumber", "createdAt", "updatedAt") FROM stdin;
cmrirp48l0001i80a67dfbe4p	C001	Mobilization and Demobilization	Mobilization and Demobilization	lot	1	169588.3284160059	169588.3284160059	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.877	2026-07-13 05:14:05.877
cmrirp49b0005i80ambbrt47t	C002	a. Project Management	a. Project Management	lot	1	678976	678976	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.903	2026-07-13 05:14:05.903
cmrirp49m0009i80a01oj5oly	C003	b. Admin Support\r\n  - Accounting, Procurement, Logistics	b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	279579.9999999999	279579.9999999999	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.914	2026-07-13 05:14:05.914
cmrirp49y000di80azg7kq0sm	C004	c.Quality Management	c.Quality Management	lot	1	279579.9999999999	279579.9999999999	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.926	2026-07-13 05:14:05.926
cmrirp4a7000hi80av1tsitgy	C005	d. Engineering Management\r\n - Clarifications & Drawings	d. Engineering Management\r\n - Clarifications & Drawings	lot	1	319519	319519	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.935	2026-07-13 05:14:05.935
cmrirp4ag000li80au1o6lgcx	C006	b. Warehouse	b. Warehouse	lot	1	51615	51615	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.944	2026-07-13 05:14:05.944
cmrirp4ao000pi80a6zytpbwe	C007	b. Site Office Materials & Communication	b. Site Office Materials & Communication	lot	1	14747	14747	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.952	2026-07-13 05:14:05.952
cmrirp4ax000ti80anf1bphq2	C008	c. Temporary Tools & Cleaning Materials	c. Temporary Tools & Cleaning Materials	lot	1	7373.999999999999	7373.999999999999	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.962	2026-07-13 05:14:05.962
cmrirp4b6000xi80a4ruj10xs	C009	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	184338	184338	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.97	2026-07-13 05:14:05.97
cmrirp4bf0011i80a3gz9lum6	C010	a. Safety Officer	a. Safety Officer	lot	1	545104.5199191085	545104.5199191085	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.978	2026-07-13 05:14:05.978
cmrirp4bn0015i80apym2ss3l	C011	b. Personal Protective Equipment (PPE's)	b. Personal Protective Equipment (PPE's)	lot	1	121134.5202971471	121134.5202971471	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.988	2026-07-13 05:14:05.988
cmrirp4bx0019i80ahiyp3wyk	C012	b. Security Guards	b. Security Guards		1	0	0	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:05.997	2026-07-13 05:14:05.997
cmrirp4c6001di80anuknyhud	C013	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	193815.2324754353	193815.2324754353	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.006	2026-07-13 05:14:06.006
cmrirp4cf001hi80a5fbi1x8d	C014	a. Manpower Service	a. Manpower Service	lot	1	242269.0405942941	242269.0405942941	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.015	2026-07-13 05:14:06.015
cmrirp4cm001li80a8eqx37a0	C015	b. Engineer Transportation	b. Engineer Transportation	lot	1	181702.6018637737	181702.6018637737	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.023	2026-07-13 05:14:06.023
cmrirp4cu001pi80akbzly6bj	C016	AIR CONDITIONING- VRV SYSTEM A	ACCU- 18HP Model: RXQ18BYM	units	3	466699.9977431683	1400099.993229505	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.031	2026-07-13 05:14:06.031
cmrirp4d2001ti80a5yioyynv	C017	AIR CONDITIONING- VRV SYSTEM A	FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	13	34692.65767935555	451004.5498316222	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.038	2026-07-13 05:14:06.038
cmrirp4dh0021i80asrlxysbg	C018	AIR CONDITIONING- VRV SYSTEM A	FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	35407.78036721927	106223.3411016578	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.054	2026-07-13 05:14:06.054
cmrirp4dq0025i80a5dht85dn	C019	AIR CONDITIONING- VRV SYSTEM A	FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	55124.6849930999	110249.3699861998	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.062	2026-07-13 05:14:06.062
cmrirp4dy0029i80arm94uj22	C020	ACU Accessories:	Navigation Wired Controller Model: BRC1E63	units	11	7406.613443719566	81472.74788091522	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.07	2026-07-13 05:14:06.07
cmrirp4e7002di80avv6bt00q	C021	ACU Accessories:	Standard panel(Fresh white) Model: BYCQ125EAF	units	7	14072.5668026182	98507.96761832737	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.079	2026-07-13 05:14:06.079
cmrirp4es002ni80apahhk5sf	C022	ACU Accessories:	Refnet Joints Model: KHRP26A22T	units	42	5159.944189880318	216717.6559749733	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	42	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.1	2026-07-13 05:14:06.1
cmrirp4gl003ji80a2i8ccuku	C023	ACU Accessories:	Pipe Size Reducer Model: KHRP26M73TP	units	11	3777.37461966841	41551.12081635251	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.165	2026-07-13 05:14:06.165
cmrirp4h4003ti80a8krhoy87	C024	ACU Accessories:	VRV Multi Con piping kit Model: BHFP22R168-7	units	4	25034.34487482518	100137.3794993007	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.185	2026-07-13 05:14:06.185
cmrirp4hr0043i80a6f3nc5ry	C025	Copper Pipes - Type L Hard Drawn Pipes 	1/4"	length/s	97	634.4460427117814	61541.2661430428	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.207	2026-07-13 05:14:06.207
cmrirp4iu004li80avuedpccd	C026	Copper Pipes - Type L Hard Drawn Pipes 	3/8"	length/s	139	812.8580930539912	112987.2749345048	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	139	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.246	2026-07-13 05:14:06.246
cmrirp4js0053i80aibx3eff4	C027	Copper Pipes - Type L Hard Drawn Pipes 	1/2"	length/s	121	1217.21407635269	147282.9032386755	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	121	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.28	2026-07-13 05:14:06.28
cmrirp4kp005li80ad406tjvy	C028	Copper Pipes - Type L Hard Drawn Pipes 	5/8"	length/s	145	1704.622973348625	247170.3311355507	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	145	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.313	2026-07-13 05:14:06.313
cmrirp4lj0063i80al9wrwmn4	C029	Copper Pipes - Type L Hard Drawn Pipes 	3/4"	length/s	138	2147.772117513292	296392.5522168343	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	138	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.343	2026-07-13 05:14:06.343
cmrirp4mg006li80aqj4bherk	C030	Copper Pipes - Type L Hard Drawn Pipes 	7/8"	length/s	18	2611.282284131881	47003.08111437385	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	18	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.377	2026-07-13 05:14:06.377
cmrirp4ng0073i80ajdcchlwg	C031	Copper Pipes - Type L Hard Drawn Pipes 	1-1/8"	length/s	67	3715.531886474161	248940.6363937688	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	67	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.412	2026-07-13 05:14:06.412
cmrirp4oj007li80af9y4edub	C032	Copper Pipes - Type L Hard Drawn Pipes 	1-3/8"	length/s	32	5042.946294868659	161374.2814357971	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.451	2026-07-13 05:14:06.451
cmrirp4pn0083i80ac9vld8iw	C033	Copper Pipes - Type L Hard Drawn Pipes 	1-5/8"	length/s	109	6056.754520832493	660186.2427707417	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	109	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.491	2026-07-13 05:14:06.491
cmrirp4qs008li80a0qreiilh	C034	Copper Pipe Fittings	Copper Pipe Fittings	lot	1	189880.150453539	189880.150453539	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.533	2026-07-13 05:14:06.533
cmrirp4rc008vi80axdsbwinc	C035	Isolation Ball Valves	Isolation Ball Valves	pc/s	92	2019.992354929088	185839.2966534761	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.553	2026-07-13 05:14:06.553
cmrirp4ru0095i80adku5dvro	C036	PVC Cladding Works	PVC Cladding Works	lot	1	51923.94542650122	51923.94542650122	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.571	2026-07-13 05:14:06.571
cmrirp4sd009fi80aj4jnlnp4	C037	Concrete Pad	Concrete Pad	pcs	12	6059.958171521946	72719.49805826336	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.589	2026-07-13 05:14:06.589
cmrirp4su009pi80ajqfy6o5y	C038	Condensate Drain Pipes	32mm dia. uPVC blue pipe PNS 65	length/s	140	254.5237726329053	35633.32816860674	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	140	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.606	2026-07-13 05:14:06.606
cmrirp4ta009zi80ai3j384lh	C039	Condensate Drain Pipes	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	96	404.2088160063778	38804.04633661227	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.623	2026-07-13 05:14:06.623
cmrirp4tr00a9i80ak23y113w	C040	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 32mm pvc	length/s	467	367.4382602580915	171593.6675405288	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	467	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.64	2026-07-13 05:14:06.64
cmrirp4uo00ari80ah690u5jj	C041	ACU PUMPS	(5.0m pump Lift) Model: BDU513A450VE	pcs	42	19191.24990039873	806032.4958167464	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	42	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.672	2026-07-13 05:14:06.672
cmrirp4v500b1i80aenhu21vu	C042	Fittings	Wye Reducer 50 x 32	pcs	42	121.2065947814647	5090.676980821516	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	42	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.69	2026-07-13 05:14:06.69
cmrirp4vo00bbi80acg3p9zfi	C043	Fittings	Tee 32mm	pcs	14	33.67409655494605	471.4373517692448	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.709	2026-07-13 05:14:06.709
cmrirp4w600bli80afmqz2dw2	C044	Fittings	Tee Reducer 50 x 32	pcs	5	127.9388949904112	639.6944749520562	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.726	2026-07-13 05:14:06.726
cmrirp4wi00bri80a5b34a8cq	C045	Fittings	Elbow 32mm	pcs	26	27.47710553005977	714.404743781554	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.738	2026-07-13 05:14:06.738
cmrirp4wy00c1i80anqflgpuo	C046	Fittings	Cleanout 50mm	pcs	16	134.6711951993578	2154.739123189725	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.754	2026-07-13 05:14:06.754
cmrirp4xq00cbi80aj096ahcr	C047	Rough-ins	liquid-tight metallic flexible conduits 1-1/2"	m	312	311.0839112452057	97058.18030850418	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	312	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.782	2026-07-13 05:14:06.782
cmrirp4ya00cli80ay0ilweew	C048	Rough-ins	Metallic Flexible Conduit 20mm	m	1684	41.4833128871198	69857.89890190975	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1684	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.802	2026-07-13 05:14:06.802
cmrirp4yq00cti80akkqp672m	C049	Rough-ins	Metallic Flexible Conduit Connector 20mm	pcs	121	20.20949613705291	2445.349032583402	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	121	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.817	2026-07-13 05:14:06.817
cmrirp4zb00d3i80aiukrc7zn	C050	Cables / Wires	Communication wire (PD Royal Cord 0.75mm/2C)	m	1664	50.91105228168765	84715.99099672826	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1664	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.839	2026-07-13 05:14:06.839
cmrirp4zs00ddi80armlrqw4z	C051	Cables / Wires	Wire 3.5mm² THHN (5 meters per Unit)	m	606	49.05728832062557	29728.7167222991	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	606	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.856	2026-07-13 05:14:06.856
cmrirp50n00dvi80ax8uvzrjy	C052	Cables / Wires	Wire 5.5mm² THHN (5 meters per Unit)	m	91	75.25727384447039	6848.411919846805	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.887	2026-07-13 05:14:06.887
cmrirp51500e5i80a8enp08ke	C053	Cables / Wires	Wire 30.0mm² THHN (5 meters per Unit)	m	177	497.3694080464873	88034.38522422824	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	177	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.905	2026-07-13 05:14:06.905
cmrirp51l00edi80ajj5luzy6	C054	Cables / Wires	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	60	118.3222229426457	7099.333376558739	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	60	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.921	2026-07-13 05:14:06.921
cmrirp51z00eli80axd1qsbfu	C055	CONSUMABLES	Vibration Isolator	pcs	53	1021.219826690341	54124.65081458809	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.936	2026-07-13 05:14:06.936
cmrirp52g00evi80a6ap6h8bf	C056	CONSUMABLES	Angle Bar, 2x2x 1/4 (6 meters)	length/s	19	1853.905858006349	35224.21130212063	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	19	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.953	2026-07-13 05:14:06.953
cmrirp52z00f5i80a5b6faz5o	C057	CONSUMABLES	Rugby	bottle	61	204.2498432428345	12459.24043781291	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.971	2026-07-13 05:14:06.971
cmrirp53g00ffi80anbf471c6	C058	CONSUMABLES	White Tape	rolls	117	274.9536901986888	32169.5817532466	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	117	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:06.988	2026-07-13 05:14:06.988
cmrirp53z00fpi80atkxvvm0s	C059	CONSUMABLES	Threaded rod 3/8 (6 meters)	length/s	260	125.6916460432091	32679.82797123436	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	260	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.007	2026-07-13 05:14:07.007
cmrirp54h00fzi80a2gx4gu7g	C060	CONSUMABLES	Nuts and washer 3/8	pcs	88	15.7160478684997	1383.012212427973	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.026	2026-07-13 05:14:07.026
cmrirp54y00g9i80a1x4wp5g9	C061	CONSUMABLES	Grip Anchor 3/8	pcs	88	7.861697624728691	691.8293909761248	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.042	2026-07-13 05:14:07.042
cmrirp55i00gji80am00k58ia	C062	CONSUMABLES	Paint (Red Oxide)	gallon	4	2521.621144679334	10086.48457871734	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.063	2026-07-13 05:14:07.063
cmrirp56100gti80an5m1abx4	C063	CONSUMABLES	Loop Hangers	pcs	973	31.43209573699939	30583.42915210041	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	973	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.082	2026-07-13 05:14:07.082
cmrirp56j00h3i80avskah22e	C064	CONSUMABLES	Freon	tank	19	10652.06392269747	202389.2145312518	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	19	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.099	2026-07-13 05:14:07.099
cmrirp57200hdi80aaxg6tjy0	C065	CONSUMABLES	Nitrogen	tank	10	13354.34981774545	133543.4981774545	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	10	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.118	2026-07-13 05:14:07.118
cmrirp57j00hni80ajtuw6hx4	C066	CONSUMABLES	Mapp Gas	tank	30	613.7820816657575	18413.46244997273	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	30	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.135	2026-07-13 05:14:07.135
cmrirp58100hxi80am3q3jyry	C067	CONSUMABLES	Silver Rod	pcs	391	39.2864459807704	15361.00037848122	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	391	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.153	2026-07-13 05:14:07.153
cmrirp58h00i7i80aigafkgfh	C068	CONSUMABLES	Paint Brush	pcs	4	157.1163943992508	628.4655775970032	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.17	2026-07-13 05:14:07.17
cmrirp58y00ihi80ag50cf874	C069	CHIPPING & RESTORATION (ROUGH-ONLY)	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	2167033.130476433	2167033.130476433	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.187	2026-07-13 05:14:07.187
cmrirp59n00iri80azyq6bufb	C070	MISCELLANEOUS	MISCELLANEOUS	lot	1	18084.23365663958	18084.23365663958	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.211	2026-07-13 05:14:07.211
cmrirp5a400j1i80a47r3j1er	C071	TESTING & COMMISSIONING	TESTING & COMMISSIONING	lot	1	775797.8762282314	775797.8762282314	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.228	2026-07-13 05:14:07.228
cmrirp5an00jdi80ah9sk5keu	C072	AIR CONDITIONING- VRV SYSTEM B	ACCU-  Model: RXQ18BYM	units	9	476830.8772968836	4291477.895671953	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.248	2026-07-13 05:14:07.248
cmrirp5b100jli80agbp8jqok	C073	AIR CONDITIONING- VRV SYSTEM B	FCU- 2 HP Wall Mounted VRF B (OR No. 1 and 3,  OR No. 1 Miyake Eye (2), OR No. 2 NSS(2), OR No. 3 Euro-open (2), OR No. 8 Ortho, NSS/ Pay, Storage Room, OR Complex Conference Room) Model: FXAQ50BVM	units	10	34692.65767935556	346926.5767935556	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	10	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.261	2026-07-13 05:14:07.261
cmrirp5b800jpi80ab0tskg75	C074	AIR CONDITIONING- VRV SYSTEM B	FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	35407.78036721927	70815.56073443854	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.268	2026-07-13 05:14:07.268
cmrirp5bf00jti80ac59ewtvi	C075	AIR CONDITIONING- VRV SYSTEM B	FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	55124.68499309988	55124.68499309988	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.275	2026-07-13 05:14:07.275
cmrirp5bm00jxi80aq5q5v7h4	C076	ACU Accessories:	Wired Remote Controller Model: BRC1E63	units	35	7406.613443719565	259231.4705301848	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	35	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.282	2026-07-13 05:14:07.282
cmrirp5bz00k5i80a7j5ivj1r	C077	Fittings	Wye 50mm	pcs	5	134.6711951993578	673.3559759967892	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.295	2026-07-13 05:14:07.295
cmrirp5ca00kbi80amqv9wpwa	C078	Rough-ins	Metallic Flexible Conduit	m	673	41.48331288711981	27918.26957303163	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	673	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.306	2026-07-13 05:14:07.306
cmrirp5ch00kfi80a61hi17be	C079	AIR CONDITIONING- VRV SYSTEM C	FCU- 2.5HP Wall Mounted VRF C (OR No. 4,  Euro- Endo (2), OR No. 7 Ortho, OR. 12 Pedia,  OR No. 10 Pay) Model: FXAQ63BVM	units	11	35407.78036721927	389485.584039412	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.313	2026-07-13 05:14:07.313
cmrirp5cs00kli80aap2fgfcp	C080	AIR CONDITIONING- VRV SYSTEM C	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	4	55124.6849930999	220498.7399723996	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.324	2026-07-13 05:14:07.324
cmrirp5d300kri80aztkruoqh	C081	Cables / Wires	Wire 38.0mm² THHN (5 meters per Unit)	m	59	590.8553841004373	34860.4676619258	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.335	2026-07-13 05:14:07.335
cmrirp5da00kvi80aoj0vaezx	C082	Cables / Wires	Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	195.8664815701098	3917.329631402196	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	20	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.342	2026-07-13 05:14:07.342
cmrirp5di00kzi80aw6qepvnh	C083	Cables / Wires	250mm² THHN	m	508	5211.027080908487	2647201.757101511	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	508	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.35	2026-07-13 05:14:07.35
cmrirp5dr00l3i80aq3dj7hld	C084	Cables / Wires	200mm² THHN	m	82	4047.789727686945	331918.7576703295	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.359	2026-07-13 05:14:07.359
cmrirp5dz00l7i80azakoa9sh	C085	Cables / Wires	38mm² THHN	m	273	827.6677701219044	225953.3012432799	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	273	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.367	2026-07-13 05:14:07.367
cmrirp5e700lbi80a168gr8u3	C086	Cables / Wires	80mm² THHN	m	169	1564.815806845063	264453.8713568157	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	169	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.375	2026-07-13 05:14:07.375
cmrirp5ee00lfi80a8kwepbtb	C087	Cables / Wires	30mm² THHN	m	27	605.1964221039977	16340.30339680794	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	27	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.382	2026-07-13 05:14:07.382
cmrirp5em00lji80a5kt031b8	C088	Cables / Wires	14mm² THHN	m	191	263.6754604286342	50362.01294186912	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	191	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.39	2026-07-13 05:14:07.39
cmrirp5ew00lpi80ap8ogi75n	C089	Roughing-ins	90mm dia. IMC	length/s	66	6834.291303271975	451063.2260159504	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.4	2026-07-13 05:14:07.4
cmrirp5f500lti80asvs4ak2d	C090	Roughing-ins	40mm dia. IMC	length/s	65	1963.881456181058	127652.2946517688	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.408	2026-07-13 05:14:07.408
cmrirp5fg00lzi80a3w9kojgz	C091	Panel Board & Pullbox	DP-Main	Assy	1	567383.4566373875	567383.4566373875	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.42	2026-07-13 05:14:07.42
cmrirp5fn00m3i80aamrq8h1l	C092	Panel Board & Pullbox	PP-System A	Assy	1	92449.9711975211	92449.9711975211	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.427	2026-07-13 05:14:07.427
cmrirp5fu00m7i80a7c65bt3g	C093	Panel Board & Pullbox	PP-System B	Assy	1	99386.64825443849	99386.64825443849	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.434	2026-07-13 05:14:07.434
cmrirp5g200mbi80aon91h0cg	C094	Panel Board & Pullbox	PP-System C	Assy	1	88308.77421571904	88308.77421571904	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.442	2026-07-13 05:14:07.442
cmrirp5ga00mfi80ar7orn229	C095	Panel Board & Pullbox	PP-System D	Assy	1	96597.67061147073	96597.67061147073	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.451	2026-07-13 05:14:07.451
cmrirp5gi00mji80adhl8rt99	C096	Panel Board & Pullbox	PP-Outdoor	Assy	1	347954.0125045361	347954.0125045361	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.458	2026-07-13 05:14:07.458
cmrirp5gq00mni80a6zeaqox9	C097	Transformer	Transformer	Assy	1	685215.8811232506	685215.8811232506	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.466	2026-07-13 05:14:07.466
cmrirp5gz00mri80akzvrixgl	C098	ECB	ECB 1250AT Nema 12	pc	1	221925.8711082267	221925.8711082267	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.475	2026-07-13 05:14:07.475
cmrirp5h600mvi80awdgc5mum	C099	Pullbox	Pullbox (350mm x 350mm x 200mm)	pc	4	4069.15591151191	16276.62364604764	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.482	2026-07-13 05:14:07.482
cmrirp5he00mzi80ah9bqdxxi	C100	Wire Gutter	Wire Gutter	lot	1	23566.4893056012	23566.4893056012	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.49	2026-07-13 05:14:07.49
cmrirp5hl00n3i80acznrsivy	C101	ECB	ECB 150AT, 3P, 230V, Nema3R	pc	3	21321.4456223122	63964.33686693661	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.497	2026-07-13 05:14:07.497
cmrirp5hs00n7i80apml5g8s7	C102	ECB	ECB 40AT, 3P, 230V, Nema3R	pc	5	8143.719495408679	40718.5974770434	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.504	2026-07-13 05:14:07.504
cmrirp5i200nbi80a9lpq15fl	C103	ECB	ECB 40AT, 2P, 230V, Nema3R	pc	11	6928.007147387317	76208.07862126049	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.511	2026-07-13 05:14:07.511
cmrirp5i900nfi80apeqg1795	C104	ECB	ECB 30AT, 2P, 230V, Nema3R	pc	16	6928.007147387312	110848.114358197	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.521	2026-07-13 05:14:07.521
cmrirp5ii00nji80a0hhvlehw	C105	Roughing-ins	25mm dia. IMC	length/s	702	1288.311819264302	904394.89712354	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	702	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.53	2026-07-13 05:14:07.53
cmrirp5iq00nni80azbhdi0t3	C106	Roughing-ins	Junction boxes with cover	pc/s	137	92.46678935253328	12667.95014129706	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	137	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.538	2026-07-13 05:14:07.538
cmrirp5ix00nri80asol4q5md	C107	Cables / Wires	50mm² THHN	Lm/s	300	1025.620907883998	307686.2723651995	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	300	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.546	2026-07-13 05:14:07.546
cmrirp5j600nvi80ayauu2ymp	C108	Cables / Wires	5.5mm² THHN	Lm/s	6989	105.8978017431912	740119.7363831636	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	6989	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.554	2026-07-13 05:14:07.554
cmrirp5jg00o1i80ayfc2h047	C109	Chipping & Restoration Works (Rough only)	Chipping & Restoration Works (Rough only)	lot	1	106861.1095131731	106861.1095131731	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.565	2026-07-13 05:14:07.565
cmrirp5jo00o5i80aq3c3rab8	C110	Hangers & Supports	Hangers & Supports	lot	1	128233.3328852839	128233.3328852839	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.572	2026-07-13 05:14:07.572
cmrirp5jv00o9i80axnl1kpe8	C111	Miscelleneuos	Miscelleneuos	lot	1	64116.67011633242	64116.67011633242	PENDING	cmrirhhw30000ic0406v47smb	0	0	0	0	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	f	\N	2026-07-13 05:14:07.579	2026-07-13 05:14:07.579
\.


--
-- Data for Name: ConsumptionItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConsumptionItem" (id, quantity, "logId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ConsumptionLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConsumptionLog" (id, date, description, "projectId", "loggedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CountermeasureLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CountermeasureLog" (id, "securityEventId", "countermeasureType", description, result, "performedBySystem", "performedByUserId", "timestamp", "createdAt", "actualResult", "expectedResult", passed, "responseTimeMs") FROM stdin;
cmrh8s80m0004jj040n7bm3n4	cmrh8s80e0003jj04y305x7qp	SIMULATED_RESPONSE	Simulated action: Action blocked, security event created, Director notified	SUCCESS	t	\N	2026-07-12 03:36:51.863	2026-07-12 03:36:51.863	Action blocked, security event created, Director notified	Action blocked, security event created, Director notified	t	20
cmrh8sez6000bjj04lf2ry3xd	cmrh8sez2000ajj04vpqnl46o	SIMULATED_RESPONSE	Simulated action: Session terminated, user forced to re-authenticate	SUCCESS	t	\N	2026-07-12 03:37:00.882	2026-07-12 03:37:00.882	Session terminated, user forced to re-authenticate	Session terminated, user forced to re-authenticate	t	42
cmrh8sjjs0004l50447ahpxmf	cmrh8sjjm0003l504wfbfn9yi	SIMULATED_RESPONSE	Simulated action: Temporary IP block and admin alert sent	SUCCESS	t	\N	2026-07-12 03:37:06.809	2026-07-12 03:37:06.809	Temporary IP block and admin alert sent	Temporary IP block and admin alert sent	t	46
cmrh8smjg000bl504zp46163s	cmrh8smjc000al504covi9ia4	SIMULATED_RESPONSE	Simulated action: Request rejected, event logged, PM notified	SUCCESS	t	\N	2026-07-12 03:37:10.684	2026-07-12 03:37:10.684	Request rejected, event logged, PM notified	Request rejected, event logged, PM notified	t	23
cmrh8sq9g0004l704yihwon3x	cmrh8sq9b0003l704mrsfnwyg	SIMULATED_RESPONSE	Simulated action: Request rejected, account flagged, admin notified	SUCCESS	t	\N	2026-07-12 03:37:15.508	2026-07-12 03:37:15.508	Request rejected, account flagged, admin notified	Request rejected, account flagged, admin notified	t	44
\.


--
-- Data for Name: DailyTimeRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DailyTimeRecord" (id, "workerId", date, "projectId", "timeIn", "timeOut", "regularHours", "overtimeHours", "nightDiffHours", "restDayHours", "holidayHours", "lateMinutes", "undertimeMinutes", "isAbsent", "absenceStatus", "sourceFile", "validationStatus", remarks, status, "encodedById", "payrollPeriodId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeductionLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeductionLedger" (id, "workerId", type, "principalAmount", "deductionPerPayroll", balance, status, remarks, "approvedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeductionLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeductionLog" (id, "ledgerId", "payrollPeriodId", "amountDeducted", "createdAt") FROM stdin;
\.


--
-- Data for Name: Delivery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Delivery" (id, "receiptNumber", date, status, "poId", "receivedById", "verifierId", "reviewerId", "approverId", "proofFileUrl", "hasProof", "isMismatch", "mismatchNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeliveryItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeliveryItem" (id, quantity, "deliveryId", "consolidatedBoqItemId", remarks, "drQuantity") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, title, category, "fileUrl", "fileType", "fileSize", "projectId", "uploaderId", "createdAt", "updatedAt") FROM stdin;
cmrirhi1o00ccic04ldfcqb1t	Awarded BOQ Template	AWARDED_BOQ_TEMPLATE		application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	1789072	cmrirhhw30000ic0406v47smb	\N	2026-07-13 05:08:10.524	2026-07-13 05:08:10.524
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DocumentTemplate" (id, "templateName", "templateType", "fileUrl", "fileName", "parsedData", "isLocked", "uploadedById", status, "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Equipment" (id, code, name, category, brand, model, "plateNumber", "ownershipType", status, "hourlyRate", "purchaseDate", "fmsDeviceId", "fmsProvider", "lastOdometer", "lastEngineHours", "createdAt", "updatedAt", "assignedDepartment", "chassisNumber", "engineNumber", "fuelType") FROM stdin;
\.


--
-- Data for Name: EquipmentAIValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EquipmentAIValidation" (id, "equipmentId", type, severity, findings, recommendations, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EquipmentDeployment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EquipmentDeployment" (id, "equipmentId", "projectId", "driverId", "targetDate", "expectedReturnDate", "dateDeployed", "dateReturned", status, purpose, notes, "requestedById", "approvedById", "createdAt", "updatedAt", "destinationAddress", "destinationLat", "destinationLng") FROM stdin;
\.


--
-- Data for Name: EquipmentMaintenance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EquipmentMaintenance" (id, "equipmentId", type, "scheduledDate", "completedDate", cost, description, status, "fmsFaultCode", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EquipmentTelemetry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EquipmentTelemetry" (id, "equipmentId", "timestamp", latitude, longitude, speed, "engineState", odometer, "engineHours", "fuelLevel", "faultCodes", "gpsAccuracy", heading, "ignitionStatus", "locationSource", "rawPayloadJson", "receivedAt", "satelliteCount") FROM stdin;
\.


--
-- Data for Name: EquipmentUtilization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EquipmentUtilization" (id, "equipmentId", "projectId", date, "hoursUsed", "fuelConsumed", "taskDescription", "loggedBy", source, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvidenceFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EvidenceFile" (id, "fileName", "fileType", "evidenceType", "fileUrl", "uploadedById", "uploadDate", "gpsLatitude", "gpsLongitude", "dateTaken", "metadataStatus", description, "versionNumber", "projectId", "boqItemId", "accomplishmentId") FROM stdin;
\.


--
-- Data for Name: ExecutiveAccessLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExecutiveAccessLog" (id, "userId", role, action, "moduleAccessed", "projectId", "transactionId", "ipAddress", "deviceInfo", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExecutiveAlertLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExecutiveAlertLog" (id, "alertType", "projectId", severity, title, description, "sourceModule", "sourceTransactionId", "financialImpact", "operationalImpact", "recommendedAction", status, "assignedTo", "dueDate", "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ExecutiveDashboardPreference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExecutiveDashboardPreference" (id, "userId", "defaultView", "defaultDateRange", "defaultProjectFilter", "visibleWidgets", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Expense" (id, amount, "totalBreakdownAmount", date, category, description, "receiptRef", "supplierName", "isAccrued", "netAmount", "vatAmount", "billingEligibility", status, "aiValidationStatus", "approvalStatus", "aiValidationRisk", "projectId", "loggedById", "costType", "awardedBoqItemId", "consolidatedBoqItemId", "createdAt", "updatedAt", "reviewerId", "approverId") FROM stdin;
\.


--
-- Data for Name: ExpenseAIValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseAIValidation" (id, "expenseId", "validationStatus", "validationScore", findings, recommendations, "duplicateWarning", "budgetWarning", "scopeAlignmentResult", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExpenseApprovalLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseApprovalLog" (id, "expenseId", action, "actionByUserId", comments, "previousStatus", "newStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExpenseBreakdownItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseBreakdownItem" (id, "expenseId", description, specification, quantity, unit, "unitCost", "totalCost", "supplierName", "purchaseReferenceNo", "receiptInvoiceNo", "purchaseDate", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExpenseProofFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseProofFile" (id, "expenseId", "breakdownItemId", "fileName", "fileType", "fileUrl", "fileHash", "uploadedById", "uploadedAt", "verifiedById", "verifiedAt", status) FROM stdin;
\.


--
-- Data for Name: FileSecurityLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FileSecurityLog" (id, "fileId", "userId", "projectId", module, action, filename, "mimeType", size, "scanStatus", "threatDetected", countermeasure, "createdAt") FROM stdin;
\.


--
-- Data for Name: FinancialDataWaiver; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialDataWaiver" (id, "projectId", "scheduleId", reason, "affectedFields", "normalizationMethod", "migrationDeadline", "requestedById", "requestedByNameSnapshot", "requestedByRoleSnapshot", "approvedById", "approvedByNameSnapshot", "approvedByRoleSnapshot", "approvedAt", "expiresAt", status, "createdAt", "revokedAt", "revocationReason") FROM stdin;
\.


--
-- Data for Name: FleetAIReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FleetAIReview" (id, "fleetEventId", "equipmentId", "driverId", "aiSummary", "aiRiskScore", "aiRecommendation", "aiValidationStatus", "reviewedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: FleetEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FleetEvent" (id, "equipmentId", "deviceId", "driverId", "eventType", "eventCategory", severity, "eventTime", "receivedAt", latitude, longitude, "speedKph", heading, title, description, status, "acknowledgedById", "acknowledgedAt", "resolvedById", "resolvedAt", "rawPayloadJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FleetTrip; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FleetTrip" (id, "equipmentId", "driverId", "deviceId", "tripStartTime", "tripEndTime", "startLatitude", "startLongitude", "endLatitude", "endLongitude", "startAddress", "endAddress", "totalDistanceKm", "maxSpeedKph", "averageSpeedKph", "idleDurationMinutes", "tripStatus", "projectId", purpose, remarks, "createdAt", "updatedAt", "subcontractPackageId") FROM stdin;
\.


--
-- Data for Name: Geofence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Geofence" (id, name, type, "polygonOrRadiusJson", address, "projectId", "alertOnEntry", "alertOnExit", status, "createdAt", "updatedAt", "subcontractPackageId") FROM stdin;
\.


--
-- Data for Name: GovernmentSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GovernmentSettings" (id, "phEmployeeRate", "phEmployerRate", "phSalaryFloor", "phSalaryCeiling", "pagibigEmployeeRate", "pagibigEmployerRate", "pagibigMaxSalary", "deductionSchedule", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HikvisionDevice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HikvisionDevice" (id, "deviceName", "deviceModel", "deviceSerialNumber", "imeiOrUniqueId", "firmwareVersion", "integrationType", "ipAddress", "domainName", port, "usernameEncrypted", "passwordEncrypted", "apiKeyReference", "rtspUrlEncrypted", "deviceGatewayId", "hikcentralResourceId", "hikconnectDeviceId", "simNumber", "simProvider", "installationDate", "installedBy", status, "lastSeenAt", "lastGpsAt", remarks, "equipmentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Inspection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Inspection" (id, "inspectionDateRequested", "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectionFindings", deficiencies, "punchlistItems", "inspectorName", "dateInspected", "approvalStatus", remarks, "accomplishmentItemId", "createdAt") FROM stdin;
\.


--
-- Data for Name: IssuanceItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."IssuanceItem" (id, "requestedQty", "releasedQty", "issuanceId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: JobOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JobOrder" (id, "jobNumber", "projectId", "subcontractorId", "packageId", description, "boqReferenceId", location, "contractAmount", "paymentBasis", "startDate", "completionDate", "requiredOutput", "materialResponsibility", "safetyRequirements", "acceptanceCriteria", attachments, "preparedBy", "reviewedBy", "approvedBy", status, remarks, "createdAt", "updatedAt", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: KnowledgeAuditTrail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeAuditTrail" (id, "knowledgeRecordId", action, "performedBy", "oldValue", "newValue", reason, "timestamp") FROM stdin;
\.


--
-- Data for Name: KnowledgeRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeRecord" (id, "knowledgeId", title, description, "notebookType", "notebookUrl", "relatedModule", "documentType", version, status, owner, "preparedBy", "reviewedBy", "approvedBy", "dateCreated", "dateReviewed", "dateApproved", tags, "uploadedFileUrl", summary, remarks, "createdAt", "updatedAt") FROM stdin;
cmr1cvbuq0000vcloaq2bu3bb	cmr1cvbuq0001vcloty6402xt	Project Data & BOQ Uploading Protocol	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Project Data & BOQ Uploading Protocol** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Project Data** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Project Data** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Project Data	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:46:56.45	\N	\N	Projects, BOQ, Initialization	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Project Data.	\N	2026-07-01 00:46:56.45	2026-07-01 00:46:56.45
cmr1cvctv0002vclo45f1axe4	cmr1cvctv0003vclo7shbdg27	Material Request Form (MRF) Submission	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Material Request Form (MRF) Submission** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Procurement** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Procurement** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Procurement	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:46:57.715	\N	\N	MRF, Materials, Requisition	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Procurement.	\N	2026-07-01 00:46:57.715	2026-07-01 00:46:57.715
cmr1cvds60004vclo5ayouuzf	cmr1cvds60005vcloaanvdbzz	Canvassing & Quotation Analysis	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Canvassing & Quotation Analysis** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Procurement** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Procurement** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Procurement	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:46:58.951	\N	\N	Canvass, Quotation, Bidding	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Procurement.	\N	2026-07-01 00:46:58.951	2026-07-01 00:46:58.951
cmr1cveqf0006vclo8vjqspvy	cmr1cveqf0007vclok40fx6wu	Purchase Order (PO) Processing & Approval	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Purchase Order (PO) Processing & Approval** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Procurement** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Procurement** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Procurement	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:00.183	\N	\N	PO, Purchasing, Approval	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Procurement.	\N	2026-07-01 00:47:00.183	2026-07-01 00:47:00.183
cmr1cvfoy0008vcloqynx6loi	cmr1cvfoy0009vcloqs3zjw40	Site Delivery & Receiving Inspection	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Site Delivery & Receiving Inspection** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Inventory** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Inventory** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Inventory	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:01.427	\N	\N	Delivery, Receiving, Warehouse	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Inventory.	\N	2026-07-01 00:47:01.427	2026-07-01 00:47:01.427
cmr1cvgo6000avclogdxva1w0	cmr1cvgo6000bvclocll6rc6n	Material Issuance & Site Returns	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Material Issuance & Site Returns** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Inventory** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Inventory** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Inventory	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:02.695	\N	\N	Issuance, Returns, Warehouse	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Inventory.	\N	2026-07-01 00:47:02.695	2026-07-01 00:47:02.695
cmr1cvhn2000cvclowvh34upv	cmr1cvhn2000dvclo2dcqikhy	Accounts Payable (AP) Vouchering	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Accounts Payable (AP) Vouchering** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Finance** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Finance** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Finance	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:03.951	\N	\N	Payables, APV, Accounting	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Finance.	\N	2026-07-01 00:47:03.951	2026-07-01 00:47:03.951
cmr1cvily000evclo6asz1pl4	cmr1cvily000fvcloknwunjvi	Payment Disbursement Protocol	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Payment Disbursement Protocol** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Finance** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Finance** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Finance	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:05.206	\N	\N	Payments, Disbursements, Checks	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Finance.	\N	2026-07-01 00:47:05.206	2026-07-01 00:47:05.206
cmr1cvjkf000gvclo7amstm74	cmr1cvjkf000hvcloy54ubrih	Expense Ledger Management	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Expense Ledger Management** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Finance** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Finance** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Finance	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:06.448	\N	\N	Expenses, Ledgers, Petty Cash	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Finance.	\N	2026-07-01 00:47:06.448	2026-07-01 00:47:06.448
cmr1cvkih000ivclo2wtbi6c5	cmr1cvkih000jvclohoi14u0n	Payroll, DTR & Geofencing Rules	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Payroll, DTR & Geofencing Rules** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Payroll** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Payroll** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Payroll	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:07.674	\N	\N	Payroll, Timekeeping, DTR	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Payroll.	\N	2026-07-01 00:47:07.674	2026-07-01 00:47:07.674
cmr1cvlhi000kvclohw3cqtob	cmr1cvlhi000lvclo0g9w8h5v	Subcontracting & Work Packages	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Subcontracting & Work Packages** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Subcontracting** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Subcontracting** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Subcontracting	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:08.934	\N	\N	Subcontractors, Packages, Awards	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Subcontracting.	\N	2026-07-01 00:47:08.934	2026-07-01 00:47:08.934
cmr1cvmgt000mvcloy97bwggb	cmr1cvmgt000nvclom2z0f8m4	Job Order Execution	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Job Order Execution** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Job Orders** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Job Orders** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Job Orders	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:10.205	\N	\N	Job Orders, Execution, Tasks	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Job Orders.	\N	2026-07-01 00:47:10.205	2026-07-01 00:47:10.205
cmr1cvnmv000ovclo3yx88jsg	cmr1cvnmw000pvclo399da9aa	Variation Orders (VO) & Change Management	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Variation Orders (VO) & Change Management** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Variation Orders** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Variation Orders** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Variation Orders	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:11.466	\N	\N	VO, Changes, Scope	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Variation Orders.	\N	2026-07-01 00:47:11.466	2026-07-01 00:47:11.466
cmr1cvom9000qvcloktk3imye	cmr1cvom9000rvclo7qye68bs	Project Scheduling & Gantt Management	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Project Scheduling & Gantt Management** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Scheduling** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Scheduling** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Scheduling	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:12.993	\N	\N	Schedule, Gantt, Timeline	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Scheduling.	\N	2026-07-01 00:47:12.993	2026-07-01 00:47:12.993
cmr1cvpkq000svclobdq375lw	cmr1cvpkq000tvclo282hcsg1	Site Accomplishments & Progress Tracking	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Site Accomplishments & Progress Tracking** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Accomplishments** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Accomplishments** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Accomplishments	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:14.234	\N	\N	Accomplishment, Progress, Tracking	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Accomplishments.	\N	2026-07-01 00:47:14.234	2026-07-01 00:47:14.234
cmr1cvqj5000uvclo3kx7er0t	cmr1cvqj5000vvclo4cb3e5qz	Client Progress Billing	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Client Progress Billing** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Billing** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Billing** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Billing	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:15.474	\N	\N	Billing, Invoicing, Receivables	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Billing.	\N	2026-07-01 00:47:15.474	2026-07-01 00:47:15.474
cmr1cvri9000wvcloqc6e3arj	cmr1cvri9000xvclovc6wnemj	System Reports & Analytics Generation	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **System Reports & Analytics Generation** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Reports** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Reports** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Reports	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:16.737	\N	\N	Reports, Analytics, BI	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Reports.	\N	2026-07-01 00:47:16.737	2026-07-01 00:47:16.737
cmr1cvsh8000yvclox11l3eso	cmr1cvsh8000zvclod65jfg9l	Document Management & Notebook Indexing	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Document Management & Notebook Indexing** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Documents** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Documents** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Documents	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:17.997	\N	\N	Documents, Plans, Indexing	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Documents.	\N	2026-07-01 00:47:17.997	2026-07-01 00:47:17.997
cmr1cvtfg0010vclow6gszvcq	cmr1cvtfg0011vclow99cqgr1	User Roles & PBAC Administration	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **User Roles & PBAC Administration** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Access Control** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Access Control** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Access Control	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:19.228	\N	\N	Users, RBAC, PBAC	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Access Control.	\N	2026-07-01 00:47:19.228	2026-07-01 00:47:19.228
cmr1cvudw0012vcloienhxkv4	cmr1cvudw0013vclotnvkrfhf	Equipment & Fleet Maintenance	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **Equipment & Fleet Maintenance** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **Equipment** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **Equipment** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	Equipment	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:20.468	\N	\N	Equipment, Maintenance, Fleet	\N	Standard operational guideline enforcing system-wide procedures and AI validations for Equipment.	\N	2026-07-01 00:47:20.468	2026-07-01 00:47:20.468
cmr1cvvc70014vclo575cas5g	cmr1cvvc70015vclom85gux2a	AI Validation Rules & Overrides	\n### 1.0 OBJECTIVE\nThis Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **AI Validation Rules & Overrides** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.\n\n### 2.0 SCOPE\nThis document applies to all active projects and affects all personnel assigned to the **AI Command Center** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.\n\n### 3.0 ROLES & RESPONSIBILITIES\n- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.\n- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.\n- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.\n- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.\n\n### 4.0 STEP-BY-STEP PROCEDURE\n\n#### 4.1 Preparation & Data Entry\n1. The Initiator logs into the ERP via the secure PBAC portal.\n2. Navigate to the **AI Command Center** Command Center dashboard.\n3. Initiate a new transaction. All mandatory fields must be completed.\n4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). \n5. Submit the transaction for System Validation.\n\n#### 4.2 System Audit & AI Validation\n1. Upon submission, the AI engine intercepts the payload.\n2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.\n3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.\n4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".\n\n#### 4.3 Review & Approval Workflow\n1. The designated Reviewer is notified via the ERP Dashboard.\n2. The Reviewer validates the technical parameters of the transaction.\n3. Once reviewed, the transaction escalates to the Final Approver.\n4. The Final Approver executes their digital signature.\n5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.\n\n### 5.0 EXCEPTIONS & OVERRIDES\nUnder specific emergency circumstances, AI blocking rules can be overridden. \n- Overrides require **Executive-level** privileges.\n- The overriding user must submit a written justification of at least 50 words.\n- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.\n\n---\n*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*\n	Standard	\N	AI Command Center	SOP	v1.0	Approved	System Admin	AI Implementation Team	Executive Committee	Board of Directors	2026-07-01 00:47:21.703	\N	\N	AI, Validations, Overrides	\N	Standard operational guideline enforcing system-wide procedures and AI validations for AI Command Center.	\N	2026-07-01 00:47:21.703	2026-07-01 00:47:21.703
cmrhvv72o0002vctwk22rg8e7	cmrhvv72o0003vctw77olwwrz	SOP: Database Master Reset Protocol	Instructions on how a master reset works and safety rules.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:23:01.776	\N	\N	reset, database, seed, mandatory	\N	\n# Database Master Reset Protocol & Safety Instructions\n\n## Overview\nA "Master Reset" is a destructive database operation that wipes all existing transactions and restores the system to a clean state.\n\n## Safe Reset Procedure\n1. Execute `npm run clear:seed` to safely purge ONLY dummy seed data (workers, suppliers, subcontractors) without dropping the schema.\n2. **Full Database Wipe**: If a total wipe is required (e.g., `npx prisma migrate reset` or `npx prisma db push --force-reset`), the system MUST automatically re-run `prisma/seed.ts`.\n3. **Crucial Protection**: This Knowledge Center seeder (`seed-knowledge-center.ts`) MUST be explicitly invoked inside `prisma/seed.ts` so that all functional rules (like this one) are instantly rebuilt.\n4. Never execute a destructive command in the Vercel production build script. All schema mutations must be manually approved or handled via explicit migrations (`prisma migrate deploy`).\n	\N	2026-07-12 14:23:01.776	2026-07-12 14:26:20.147
cmrhvv6im0000vctwp9glwdva	cmrhvv6im0001vctwfmdh0q1d	SOP: Access Rights & Role Matrix	System roles and their exact PBAC access limits.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:23:01.055	\N	\N	pbac, rbac, roles, permissions, mandatory	\N	\n# System Access Rights & Role Permissions Matrix\n\n## Project-Based Access Control (PBAC)\n1. **Project Manager (PM)**: \n   - Can approve Material Requests.\n   - Can review Progress Billings.\n   - Can approve Job Order payments.\n2. **Project Engineer / Site Engineer**:\n   - Can draft Material Requests (must select correct Benchmark BOQ item).\n   - Can log Accomplishments.\n3. **Purchasing Officer**:\n   - Can canvass suppliers.\n   - Can draft Purchase Orders (POs) and must attach the Canvass PDF.\n4. **Site Admin / Site Accountant**:\n   - Can upload Daily Time Records (DTRs).\n   - Can encode direct expenses.\n   - Can dispense Petty Cash.\n5. **Finance Officer**:\n   - Can approve direct expenses (relying on AI validation for duplicates).\n   - Can record supplier payables (upon Delivery Receipt confirmation).\n6. **Executive / Project Director**:\n   - Can view Executive Dashboard across all projects.\n   - Can approve high-value POs and Subcontracts.\n   - Has access to AI RAG Command Center.\n	\N	2026-07-12 14:23:01.055	2026-07-12 15:00:08.6
cmrhwdfwk0000vcwoxr4i7wl2	cmrhwdfwk0001vcwotkq64zd1	SOP: Database Master Reset Protocol & System Restore	Instructions for non-destructive functional restoration and hard wipes. Restricted to Superadmin.	SOP	\N	\N	Markdown	v2.0	Approved	\N	\N	\N	\N	2026-07-12 14:37:13.028	\N	\N	reset, database, seed, mandatory, superadmin, restore, antigravity	\N	\n# Database Master Reset Protocol & System Restore\n\n## ⚠️ RESTRICTED TO SUPERADMIN ONLY ⚠️\n\n### 1. Non-Destructive System Restore (Antigravity Command)\nIf functional rules, SOPs, access rights, or AI instructions go missing or get corrupted, you can trigger a **Non-Destructive Restore**.\n**Command**: Ask the AI Assistant to "Run the system_restore skill" or "Trigger master restore".\n**Action**: The AI will execute `npx tsx prisma/seeders/seed-knowledge-center.ts`.\n**Safety**: This ONLY repopulates system logic and Knowledge Records. It **DOES NOT** erase or modify any live user transaction data (e.g., job orders, accomplishments, material requests) performed on the online app.\n\n### 2. Destructive Reset (Erasing Processed Data)\nIf a total hard wipe is needed to erase all processed data (distinct from the functional rules):\n- Use `npm run clear:seed` to clear dummy data only.\n- Use `npx prisma migrate reset` to wipe everything to zero.\n**Safety**: Hard wipes should generally only be done on the local app, NOT the online production app.\n- Pushing to GitHub/Vercel will only push functional code/data and will safely preserve the online app's live database transactions.\n	\N	2026-07-12 14:37:13.028	2026-07-12 15:00:09.07
cmrhvzhfa0004vcvsy1waxz1v	cmrhvzhfa0005vcvs4pl4vn97	SOP: Subcontracting	Rules for subcontract packaging, billing, and progress evaluation.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:21.815	\N	\N	subcontracting, billing, mandatory	\N	# Subcontracting\n1. Subcontractors must be seeded into the system before packaging.\n2. Progress Billings must be matched against physical site accomplishments (photos required).\n3. Payments are routed to the Finance Officer.	\N	2026-07-12 14:26:21.815	2026-07-12 15:00:10.489
cmrhvzhsh0006vcvslrllfjeu	cmrhvzhsh0007vcvs0v5k5wki	SOP: Security Operations Center (SOC)	Rules for system security, audit logging, and RBAC.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:22.289	\N	\N	security, soc, audit, mandatory	\N	# Security Operations Center\n1. Every action is logged in the Audit Trail.\n2. Access is governed by the PBAC (Project-Based Access Control) system context headers.\n3. Drafts and simulated roles are heavily restricted.	\N	2026-07-12 14:26:22.289	2026-07-12 15:00:10.968
cmrhvzgi60000vcvsmkdj3zi1	cmrhvzgi60001vcvs0rhr9qej	SOP: Project Scheduling & AI Simulation	Rules for AI-assisted scheduling, boundary clamping, and phase summarization.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:20.622	\N	\N	scheduling, ai, simulation, mandatory	\N	# Project Scheduling Rules\n1. AI generated activities must strictly adhere to project start and end dates (Boundary Clamping).\n2. Activities must be wrapped in batch Prisma transactions to prevent timeouts.\n3. The Phase Summary view must aggregate data hierarchically.	\N	2026-07-12 14:26:20.622	2026-07-12 15:00:09.541
cmrhvzh220002vcvsz6wqxtfu	cmrhvzh220003vcvssco8oz3e	SOP: Variation Orders (VO)	Rules for processing subcontractor and client variation orders.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:21.338	\N	\N	vo, variation, orders, mandatory	\N	# Variation Orders\n1. VOs require justification from the PM.\n2. Approvals must go through the Executive Dashboard if they exceed budget thresholds.\n3. Costs are drawn from the benchmark BOQ if available.	\N	2026-07-12 14:26:21.338	2026-07-12 15:00:10.019
cmrhvzi5r0008vcvsrdtjdgow	cmrhvzi5r0009vcvswrb6w7nj	SOP: Equipment & Fleet Management	Rules for GPS webhooks, utilization tracking, and maintenance.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:22.767	\N	\N	equipment, fleet, gps, mandatory	\N	# Equipment Management\n1. Heavy equipment logs rely on incoming Hikvision/Geotab GPS webhooks.\n2. Utilization logs must tie back to specific project job orders.\n3. Maintenance schedules are calculated based on engine hours.	\N	2026-07-12 14:26:22.767	2026-07-12 15:00:11.434
cmrhvziiv000avcvsii6msthj	cmrhvziiv000bvcvspt5x9l8f	SOP: ERP Assistant (JBurns AI)	Rules for the Live Database RAG system and chatbot integration.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:23.239	\N	\N	ai, assistant, chatbot, rag, mandatory	\N	# ERP Assistant\n1. Uses a 5-step semantic pipeline (Intent -> Expansion -> PBAC/RBAC -> Multi-Search -> Compare/Summarize).\n2. Adheres to the Master Ontology for database term mapping.\n3. Automatically applies PBAC restrictions so users only query allowed projects.	\N	2026-07-12 14:26:23.239	2026-07-12 15:00:11.909
cmrhvziw3000cvcvshvbscefo	cmrhvziw3000dvcvsqzklglqe	SOP: OpenAI & Gemini Provider Settings	Rules for multi-model AI orchestration.	SOP	\N	\N	Markdown	v1.0	Approved	\N	\N	\N	\N	2026-07-12 14:26:23.715	\N	\N	openai, gemini, ai, settings, mandatory	\N	# AI Providers\n1. @google/genai is primarily used for structured JSON scheduling tasks.\n2. @ai-sdk/openai is leveraged for semantic extraction and Chat UI.\n3. Both require valid environment variables securely configured on Vercel.	\N	2026-07-12 14:26:23.715	2026-07-12 15:00:12.384
cmrhvmnah0000vc7sa6ddd08l	cmrhvmnah0001vc7s3a9awink	SOP: Master Materials List Consolidation AI Engine	Rules and functionalities for auto-consolidating BOQ items into the Master Materials List.	SOP	\N	\N	Markdown	v1.1	Approved	\N	\N	\N	\N	2026-07-12 14:16:22.888	\N	\N	boq, procurement, consolidation, ai, rules, mandatory	\N	\n# Master Materials List Consolidation SOP & Validation Rules\n\n## Overview\nThe Master Materials List is generated by consolidating all items from the **Procurement Benchmark (Forecast BOQ)**, NOT the Awarded BOQ. This ensures procurement is strictly guided by the finalized budget baseline. The AI Engine groups identical items to prevent duplicate material requests and ensure uniform procurement pricing.\n\n## Functionalities & Validation Rules\n1. **Fuzzy Name Matching**:\n   - The engine strips all non-alphanumeric characters (spaces, dashes, etc.) and compares the core string in lowercase.\n   - Example: "Portland Cement (40kg)" matches "portlandcement40kg".\n2. **Hardcoded Overrides**:\n   - Specific items like '5.0m pump Lift' or 'BDU513A450VE' must be strictly mapped and grouped under 'ACU PUMPS'.\n3. **Unit Normalization**:\n   - If one variation of the item uses "pc" or "pcs" and another uses a different variation, the master unit defaults to "pc".\n   - If the item is marked as a "lot", the consolidated master quantity is forced to 1. Otherwise, the quantities of all matching items are summed together.\n4. **Unit Cost Averaging**:\n   - The Master Unit Cost is a weighted average calculated as: `Total Cost of all mapped items / Total Summed Quantity`.\n5. **Prisma Transaction Safety**:\n   - The entire consolidation process must be wrapped in a single `$transaction` block.\n   - **Crucial Rule**: Because thousands of BOQ item mappings (`bOQMapping`) are created simultaneously, the transaction MUST have an extended timeout (e.g., `{ maxWait: 10000, timeout: 120000 }`) to prevent Prisma from timing out and throwing a `Transaction not found` error.\n6. **Project Lock Requirement**:\n   - Consolidation can ONLY happen if the Procurement Benchmark is officially locked (`procurementBenchmarkLocked: true`).\n	\N	2026-07-12 14:16:22.888	2026-07-12 15:00:07.885
\.


--
-- Data for Name: KnowledgeReference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeReference" (id, "knowledgeRecordId", "projectId", "workerId", "payrollPeriodId", "createdAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeRuleAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeRuleAuditLog" (id, "transactionId", "moduleName", "notebookName", "ruleApplied", "validationResult", "actionTaken", "userAction", "overrideRequested", "overrideApprovedBy", "overrideReason", "timestamp") FROM stdin;
\.


--
-- Data for Name: KnowledgeRuleReference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeRuleReference" (id, "notebookName", "moduleName", "ruleCategory", "ruleTitle", "ruleDescription", "affectedProcess", "validationType", severity, "isMandatory", "effectiveDate", "lastReviewedDate", "sourceLink", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LiveCameraSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LiveCameraSnapshot" (id, "fileUrl", "capturedAt", "capturedById", "cameraId") FROM stdin;
\.


--
-- Data for Name: LockedRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LockedRecord" (id, "moduleName", "transactionId", "lockedBy", "lockedAt", reason) FROM stdin;
\.


--
-- Data for Name: MaterialIssuance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialIssuance" (id, "misNumber", status, activity, "projectId", "foremanId", "warehousemanId", "accountantId", "releasedById", "releaseDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialRequest" (id, "mrNumber", status, "projectId", "requesterId", "preparerId", "checkerId", "approverId", purpose, priority, "locationOfUse", remarks, "aiValidationRisk", "aiValidationNotes", "dateNeeded", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialRequestItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialRequestItem" (id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "breakdownData") FROM stdin;
\.


--
-- Data for Name: MaterialReturn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialReturn" (id, "mrsNumber", status, remarks, "issuanceId", "projectId", "foremanId", "warehousemanId", "receiveDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Module" (id, "moduleName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	\N	t	2026-07-01 00:39:05.73	2026-07-01 00:39:05.73
cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	\N	t	2026-07-01 00:39:08.206	2026-07-01 00:39:08.206
cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	\N	t	2026-07-01 00:39:10.422	2026-07-01 00:39:10.422
cmr1cldza000yvchkl9yarbby	PROCUREMENT	\N	t	2026-07-01 00:39:12.646	2026-07-01 00:39:12.646
cmr1clfsm000zvchku418mv7u	INVENTORY	\N	t	2026-07-01 00:39:14.999	2026-07-01 00:39:14.999
cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	\N	t	2026-07-01 00:39:17.304	2026-07-01 00:39:17.304
cmr1cljcv0011vchkf6ug2iev	FINANCE	\N	t	2026-07-01 00:39:19.615	2026-07-01 00:39:19.615
cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	\N	t	2026-07-01 00:39:21.89	2026-07-01 00:39:21.89
cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	\N	t	2026-07-01 00:39:24.809	2026-07-01 00:39:24.809
cmr1clp5w0014vchkbobwfpud	PAYROLL	\N	t	2026-07-01 00:39:27.14	2026-07-01 00:39:27.14
cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	\N	t	2026-07-01 00:39:29.461	2026-07-01 00:39:29.461
cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	\N	t	2026-07-01 00:39:31.73	2026-07-01 00:39:31.73
cmr1clugj0017vchkxen01q1d	REPORTS	\N	t	2026-07-01 00:39:34.004	2026-07-01 00:39:34.004
cmr1clw7i0018vchke5in6hit	DOCUMENTS	\N	t	2026-07-01 00:39:36.271	2026-07-01 00:39:36.271
cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	\N	t	2026-07-01 00:39:38.569	2026-07-01 00:39:38.569
cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	\N	t	2026-07-01 00:39:41.136	2026-07-01 00:39:41.136
cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	\N	t	2026-07-01 00:39:43.477	2026-07-01 00:39:43.477
cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	\N	t	2026-07-01 00:39:46.004	2026-07-01 00:39:46.004
cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	\N	t	2026-07-01 00:39:48.253	2026-07-01 00:39:48.253
cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	\N	t	2026-07-01 00:39:50.517	2026-07-01 00:39:50.517
\.


--
-- Data for Name: NotebookReference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReference" (id, "referenceCode", title, description, "fileName", "fileType", "filePath", category, "moduleScope", "projectScope", "companyWide", "mandatoryFlag", status, "activeVersionId", "uploadedBy", "uploadedByRole", "approvedBy", "approvedByRole", "effectiveDate", "expiryDate", "createdAt", "updatedAt") FROM stdin;
cmr1cwsmh0014vc28w5tergev	POL-AI-DELIVERY-001	Delivery Receipt AI Validation Rules	Mandatory rules for Delivery Receiving AI verification.	Delivery_Validation_Rules.txt	text/plain	/mock-paths/Delivery_Validation_Rules.txt	PROCUREMENT	Delivery Receiving	\N	t	t	ACTIVE	\N	cmqn5zq7h0000vcvwmwp8s7th	PROJECT_DIRECTOR	cmqn5zq7h0000vcvwmwp8s7th	PROJECT_DIRECTOR	2026-07-01 00:48:04.853	\N	2026-07-01 00:48:04.842	2026-07-01 00:48:04.842
\.


--
-- Data for Name: NotebookReferenceApprovalLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceApprovalLog" (id, "referenceId", action, "actionByUserId", "actionByUserRole", comments, "previousStatus", "newStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceIndexLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceIndexLog" (id, "referenceId", status, details, "createdAt") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceModule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceModule" (id, "referenceId", "moduleName") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceProject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceProject" (id, "referenceId", "projectId") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceRole; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceRole" (id, "referenceId", "roleName") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."NotebookReferenceVersion" (id, "referenceId", "versionNumber", "fileName", "filePath", "extractedText", "aiSummary", "aiKeywords", "fileHash", status, "indexedStatus", "uploadedBy", "approvedBy", "effectiveDate", "supersededDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OnlyOfficeSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnlyOfficeSession" (id, "uploadedWorkbookFileId", "projectId", "workbookVersionId", "documentKey", mode, "userId", "userName", "permissionsJson", "configJson", status, "createdAt", "expiresAt", "lastCallbackAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "bankOrCheckNumber", "orNumber", "ewtCertificateReference", "paymentStatus", remarks, "billingId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentBatch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentBatch" (id, "batchNumber", "payrollBatchId", "payrollPeriodId", "paymentMethodType", "transferRail", "providerId", "providerBatchReference", "expectedSettlementDate", "payrollBankAccountId", status, "totalAmount", "totalWorkers", "preparedById", "reviewedById", "approvedById", "releasedById", "dateReleased", "reconciliationFileUrl", remarks, "aiRiskLevel", "aiAuditNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentBatchRow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentBatchRow" (id, "paymentBatchId", "payrollId", "workerId", amount, "transferRail", "recipientBankName", "recipientBankCode", "recipientAccountNumber", "recipientAccountName", "gcashMobileNumber", "gcashAccountName", remarks, "senderReferenceId", "idempotencyKey", "originalInstaPayReference", "unionBankTransactionReference", "providerResponseCode", "providerResponseMessage", "failureReason", "retryCount", "expectedSettlementDate", "datePaid", "rawApiResponseReference", status, "transactionReference", "exceptionReason", "reconciledAt") FROM stdin;
\.


--
-- Data for Name: PaymentException; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentException" (id, "payrollBatchId", "payrollId", "workerId", "requiredPaymentMethod", "exceptionReason", "correctiveAction", "assignedToId", status, "approvedById", "dateResolved", "reprocessedTransactionRef", remarks, "createdAt", "updatedAt", amount, "apiPaymentBatchId", "payslipNumber", "recipientBankCode", "recipientBankName", "transferRail", "unionBankResponseCode", "unionBankResponseMessage") FROM stdin;
\.


--
-- Data for Name: PaymentFallbackRecommendation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentFallbackRecommendation" (id, "payslipNumber", "workerId", amount, "originalIntendedRoute", "fallbackRoute", "fallbackReason", "originalInstaPayRef", "recommendedBy", "approvalStatus", "approvedById", "approvalDate", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentLog" (id, "transactionId", "moduleName", amount, "paymentMethod", "referenceNumber", "processedBy", "processedByRole", "createdAt") FROM stdin;
\.


--
-- Data for Name: PaymentProvider; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentProvider" (id, "providerName", "providerType", "transferRail", environment, "apiBaseUrlSandbox", "apiBaseUrlProduction", "oauthTokenUrl", "clientId", "clientSecret", "partnerId", "corporateAccountNumber", "debitAccountNumber", "debitAccountName", currency, "webhookUrl", "webhookSigningSecret", "statusCallbackUrl", "singleTransactionLimit", "dailyTransactionLimit", "monthlyTransactionLimit", "cutOffTime", "expectedSettlementTime", status, "lastConnectionTest", "createdById", "approvedById", "dateCreated", "dateActivated", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentRecord" (id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payroll" (id, "workerId", "payrollPeriodId", "projectId", "compensationType", rate, "daysWorked", "regularHours", "overtimeHours", "basicPay", "overtimePay", "nightDiffPay", "holidayPay", "restDayPay", allowances, "nonTaxableAllowances", "otherEarnings", "grossPay", "grossTaxablePay", "sssDeduction", "sssEmployerShare", "sssEcEmployerShare", "sssWispDeduction", "sssWispEmployerShare", "philhealthDeduction", "philhealthEmployerShare", "pagibigDeduction", "pagibigEmployerShare", "taxableCompensation", "birPayrollFrequency", "birEffectiveYear", "birBracketNo", "birBaseTax", "birTaxRatePercent", "birExcessOver", "withholdingTax", "manualTaxAdjustment", "finalWithholdingTax", "cashAdvance", "loanDeduction", "otherDeductions", "lateUndertimeAmount", "totalDeductions", "netPay", remarks, "paymentMethod", "paymentStatus", "paymentHoldReason", "paymentBatchId", "createdAt", "updatedAt", "transactionReference") FROM stdin;
\.


--
-- Data for Name: PayrollApproval; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollApproval" (id, "payrollPeriodId", "approvalLevel", "approverUserId", "approverRole", "approvalStatus", "approvalDate", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollAuditLog" (id, "userId", "userName", "actionType", module, "recordId", "oldValue", "newValue", "ipAddress", remarks, "timestamp") FROM stdin;
\.


--
-- Data for Name: PayrollBankAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollBankAccount" (id, "bankName", "bankBranch", "accountNumber", "accountName", currency, "beginningBalance", "currentAvailableBalance", "reservedPayrollBalance", "actualBankBalance", "lastBalanceSyncDate", "apiEnabled", "bankApiProvider", status, "createdById", "approvedById", "dateCreated", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollBankLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollBankLedger" (id, "payrollBankAccountId", "transactionDate", "transactionType", amount, "balanceAfter", "referenceId", "referenceNumber", remarks, "createdById") FROM stdin;
\.


--
-- Data for Name: PayrollCutoffSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollCutoffSetting" (id, "cutoffName", "cutoffType", "startDay", "endDay", "payrollReleaseDay", "crossesMonth", "isDefault", status, "appliesTo", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollDeduction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollDeduction" (id, "payrollId", "deductionType", amount, "recurringStatus", "governmentMandatedStatus", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollEarning; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollEarning" (id, "payrollId", "earningType", amount, "taxableStatus", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollFundingRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollFundingRequest" (id, "fundingRequestNumber", "payrollBatchId", "payrollPeriodId", "totalNetPay", "estimatedCharges", "totalRequiredFunding", "availablePayrollBalance", "fundingShortage", "fundingSourceAccount", "destinationAccountId", "fundingStatus", "preparedById", "reviewedById", "approvedById", "dateFunded", "fundingBankReferenceNumber", "proofOfTransferUrl", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollPeriod; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollPeriod" (id, "payrollBatchNumber", month, year, "calendarRule", "periodType", "startDate", "endDate", "payrollDate", status, "projectId", notes, "createdById", "approvedById", "cancelledAt", "dateApproved", "dateReleased", "isLocked", "lockedAt", "lockedById", "dummyField", "createdAt", "updatedAt", "destinationAddress", "destinationLat", "destinationLng") FROM stdin;
\.


--
-- Data for Name: PettyCashAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PettyCashAccount" (id, "accountName", department, "fundLimit", "replenishmentTrigger", "currentBalance", "projectId", "custodianId", "approverId", "reviewerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PettyCashExpense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PettyCashExpense" (id, date, payee, purpose, category, amount, "isVat", "netAmount", "vatAmount", "billingEligibility", "receiptNumber", "attachmentUrl", "isNoReceipt", remarks, status, "expenseId", "accountId", "projectId", "replenishmentId", "costType", "awardedBoqItemId", "consolidatedBoqItemId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PettyCashReplenishment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PettyCashReplenishment" (id, "requestNumber", status, "fundLimit", "beginningBalance", "totalExpenses", "cashOnHand", "amountRequested", "reviewerAction", "reviewerRemarks", "approverId", "approvalDate", "releaseDate", "releaseMode", "releaseRefNo", "receiverId", "accountId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProcurementBenchmarkItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcurementBenchmarkItem" (id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId") FROM stdin;
cmriros3u0000jc0av62u9tj9			Mobilization and Demobilization	lot	1	169588.3284160059	169588.3284160059	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0001jc0aodqy4p01			a. Project Management	lot	1	678976	678976	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0002jc0axw44yply			b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	279579.9999999999	279579.9999999999	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0003jc0aoj8h6bjl			c.Quality Management	lot	1	279579.9999999999	279579.9999999999	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0004jc0ajsqoz2o5			d. Engineering Management\r\n - Clarifications & Drawings	lot	1	319519	319519	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0005jc0ausg49l86			b. Warehouse 	lot	1	51615	51615	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0006jc0a2r7d0xdl			b. Site Office Materials & Communication	lot	1	14747	14747	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0007jc0a21rxr5gs			c. Temporary Tools & Cleaning Materials	lot	1	7373.999999999999	7373.999999999999	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0008jc0av04dkvc0			b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	184338	184338	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u0009jc0aficgze2z			a. Safety Officer	lot	1	545104.5199191085	545104.5199191085	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000ajc0aejhcc4u4			b. Personal Protective Equipment (PPE's)	lot	1	121134.5202971471	121134.5202971471	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000bjc0an1iojv3z			b. Security Guards		1	0	0	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000cjc0aafpi1rxp			a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	193815.2324754353	193815.2324754353	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000djc0ah3d811ov			a. Manpower Service	lot	1	242269.0405942941	242269.0405942941	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000ejc0am3e0hyby			b. Engineer Transportation	lot	1	181702.6018637737	181702.6018637737	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000fjc0amatk067s	AIR CONDITIONING- VRV SYSTEM A		ACCU- 18HP Model: RXQ18BYM	units	3	466699.9977431683	1400099.993229505	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000gjc0ab59ed5vp	AIR CONDITIONING- VRV SYSTEM A		FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	6	34692.65767935555	208155.9460761333	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000hjc0a0cxo1kdh	AIR CONDITIONING- VRV SYSTEM A		FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	35407.78036721927	106223.3411016578	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000ijc0a0vkpz2o2	AIR CONDITIONING- VRV SYSTEM A		FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	55124.68499309988	110249.3699861998	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000jjc0ag2tv2o8t	ACU Accessories:		Navigation Wired Controller Model: BRC1E63	units	11	7406.613443719566	81472.74788091522	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000kjc0a3610mfoy	ACU Accessories:		Standard panel(Fresh white) Model: BYCQ125EAF	units	2	14072.5668026182	28145.13360523639	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000ljc0atuprj16a	ACU Accessories:		Refnet Joints Model: KHRP26A22T	units	2	2740.449241368077	5480.898482736155	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000mjc0aq91d4r2v	ACU Accessories:		Refnet Joints Model: KHRP26A33T	units	2	3110.782432656099	6221.564865312197	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000njc0arjhfs22q	ACU Accessories:		Refnet Joints Model: KHRP26A732T	units	3	5184.63318925676	15553.89956777028	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000ojc0aa7f9mik1	ACU Accessories:		Refnet Joints Model: KHRP26A733T	units	3	8887.93991111654	26663.81973334962	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000pjc0afzp0ncf3	ACU Accessories:		Pipe Size Reducer Model: KHRP26M73TP	units	3	3777.374619668408	11332.12385900523	PENDING	cmrirhhw30000ic0406v47smb
cmriros3u000qjc0ajtsp9dt9	ACU Accessories:		VRV Multi Con piping kit Model: BHFP22R168-7	units	1	25034.34487482518	25034.34487482518	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000rjc0ahyd3rhml	Copper Pipes - Type L Hard Drawn Pipes 		1/4"	length/s	10	1335.331908515967	13353.31908515967	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000sjc0aql10wbgm	Copper Pipes - Type L Hard Drawn Pipes 		3/8"	length/s	13	1859.317728894613	24171.13047562997	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000tjc0ajtw8fiqn	Copper Pipes - Type L Hard Drawn Pipes 		1/2"	length/s	14	2958.005191525289	41412.07268135405	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000ujc0aibvxybef	Copper Pipes - Type L Hard Drawn Pipes 		5/8"	length/s	9	4267.327371451031	38405.94634305928	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000vjc0asiijdgfo	Copper Pipes - Type L Hard Drawn Pipes 		3/4"	length/s	9	5442.727789035102	48984.55010131592	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000wjc0adh9ikfpz	Copper Pipes - Type L Hard Drawn Pipes 		7/8"	length/s	2	6845.666098620331	13691.33219724066	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000xjc0ax7jtuyck	Copper Pipes - Type L Hard Drawn Pipes 		1-1/8"	length/s	8	9803.664992390513	78429.3199391241	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000yjc0a5b1xu6ui	Copper Pipes - Type L Hard Drawn Pipes 		1-3/8"	length/s	5	13234.94018242107	66174.70091210534	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v000zjc0adqoi7ajl	Copper Pipes - Type L Hard Drawn Pipes 		1-5/8"	length/s	4	13234.94018242107	52939.76072968426	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0010jc0akdmyi8gf	Copper Pipes Insulation 25mm Thick 		1/4"	length/s	19	273.0517681564982	5187.983594973466	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0011jc0aleki3nug	Copper Pipes Insulation 25mm Thick 		3/8"	length/s	26	278.2537138745429	7234.596560738117	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0012jc0a0evxz9fx	Copper Pipes Insulation 25mm Thick 		1/2"	length/s	27	325.0586298267328	8776.583005321785	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0013jc0a4i7etwf4	Copper Pipes Insulation 25mm Thick 		5/8"	length/s	18	396.5759368171887	7138.366862709396	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0014jc0audwho2nl	Copper Pipes Insulation 25mm Thick 		3/4"	length/s	17	445.9818256284008	7581.691035682814	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0015jc0adpkockbe	Copper Pipes Insulation 25mm Thick 		7/8"	length/s	4	494.0903768876552	1976.361507550621	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0016jc0a8en0mt3z	Copper Pipes Insulation 25mm Thick 		1-1/8"	length/s	15	533.0986720178845	7996.480080268268	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0017jc0aylaats5p	Copper Pipes Insulation 25mm Thick 		1-3/8"	length/s	10	564.2977508159399	5642.9775081594	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0018jc0afv09rr2o	Copper Pipes Insulation 25mm Thick 		1-5/8"	length/s	8	564.2977508159399	4514.382006527519	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0019jc0apjfl7a7x	Copper Pipe Fittings		Copper Pipe Fittings	lot	1	36511.81462393543	36511.81462393543	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ajc0avgvgftdd	Isolation Ball Valves		Isolation Ball Valves	pc/s	22	2019.992354929089	44439.83180843995	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001bjc0aefz65imw	PVC Cladding Works		PVC Cladding Works	lot	1	14032.56346218112	14032.56346218112	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001cjc0a3qmgv5r8	Concrete Pad		Concrete Pad	pcs	3	6059.958171521946	18179.87451456584	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001djc0aru6itu14	Condensate Drain Pipes		32mm dia. uPVC blue pipe PNS 65	length/s	39	254.5237726329053	9926.427132683306	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ejc0a1cx2htqo	Condensate Drain Pipes		50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	22	404.2088160063778	8892.59395214031	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001fjc0aihp946ea	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 32mm pvc	length/s	77	269.336092643609	20738.8791335579	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001gjc0avwjwkeva	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 50mm pvc	length/s	43	511.7366866963251	22004.67752794198	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001hjc0ahnk31u8t	 (5.0m pump Lift) Model: BDU513A450VE		 (5.0m pump Lift) Model: BDU513A450VE	pcs	9	19191.24990039873	172721.2491035885	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ijc0ag7l99v66	Fittings		Wye Reducer 50 x 32	pcs	11	121.2065947814647	1333.272542596111	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001jjc0a3i3zvh9l	Fittings		Tee 32mm	pcs	2	33.67409655494605	67.34819310989211	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001kjc0a2tc3w6zn	Fittings		Tee Reducer 50 x 32	pcs	2	127.9388949904112	255.8777899808225	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ljc0atnriom22	Fittings		Elbow 32mm	pcs	6	27.47710553005977	164.8626331803586	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001mjc0a2t3w3bp5	Fittings		Cleanout 50mm	pcs	4	134.6711951993578	538.6847807974314	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001njc0a346oyg70	Rough-ins		liquid-tight metallic flexible conduits 1-1/2"	m	78	254.5237726329053	19852.85426536661	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ojc0ac3wmacsn	Rough-ins		Metallic Flexible Conduit 20mm	m	586	41.48331288711981	24309.22135185221	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001pjc0a4wsjohfn	Rough-ins		Metallic Flexible Conduit Connector 20mm	pcs	29	20.20949613705291	586.0753879745342	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001qjc0a44yk0g9c	Cables / Wires		Communication wire (PD Royal Cord 0.75mm/2C)	m	419	50.91105228168766	21331.73090602713	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001rjc0ajm95edcy	Cables / Wires		Wire 3.5mm² THHN (5 meters per Unit)	m	71	49.424782076532	3509.159527433772	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001sjc0auk57sgss	Cables / Wires		Wire 5.5mm² THHN (5 meters per Unit)	m	26	75.64233658527343	1966.700751217109	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001tjc0atbrtn93w	Cables / Wires		Wire 30.0mm² THHN (5 meters per Unit)	m	59	497.7304793392652	29366.09828101665	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001ujc0a3xlgmh01	Cables / Wires		Wire 3.5mm² THHN (G) (5 meters per Unit)	m	72	49.424782076532	3558.584309510304	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001vjc0a89blnogh	Cables / Wires		Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	118.3222229426457	2366.444458852913	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001wjc0am4u1kz75	CONSUMABLES		Vibration Isolator	pcs	14	1021.219826690342	14297.07757366478	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001xjc0a85gavz51	CONSUMABLES		Angle Bar, 2x2x 1/4 (6 meters)	length/s	5	1853.905858006349	9269.529290031744	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001yjc0a6ffz86kh	CONSUMABLES		Rugby	bottle	15	204.2498432428345	3063.747648642518	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v001zjc0a5ouu26ai	CONSUMABLES		White Tape	rolls	29	274.9536901986888	7973.657015761976	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0020jc0a8c4ewbzz	CONSUMABLES		Threaded rod 3/8 (6 meters)	length/s	66	125.6916460432091	8295.648638851802	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0021jc0aod0mug3a	CONSUMABLES		Nuts and washer 3/8	pcs	22	15.71604786849969	345.7530531069933	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0022jc0apmjf2v2p	CONSUMABLES		Grip Anchor 3/8	pcs	22	7.86169762472869	172.9573477440312	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0023jc0achqmxpnf	CONSUMABLES		Paint (Red Oxide)	gallon	1	2521.621144679334	2521.621144679334	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0024jc0aug1k5c8q	CONSUMABLES		Loop Hangers	pcs	246	31.43209573699939	7732.295551301851	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0025jc0ajaz7zb80	CONSUMABLES		Freon	tank	4	10652.06392269747	42608.25569078986	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0026jc0a0hq7h3ur	CONSUMABLES		Nitrogen	tank	2	13354.34981774545	26708.6996354909	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0027jc0a1lqv6nwt	CONSUMABLES		Mapp Gas	tank	8	628.44353545413	5027.54828363304	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0028jc0ag97a67a1	CONSUMABLES		Silver Rod	pcs	99	39.2864459807704	3889.358152096269	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v0029jc0athyyhhj6	CONSUMABLES		Paint Brush	pcs	1	157.1163943992508	157.1163943992508	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002ajc0aqjge0ug4	CHIPPING & RESTORATION (ROUGH-ONLY)		CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	541758.2826191082	541758.2826191082	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002bjc0afg5vf1va	MISCELLANEOUS		MISCELLANEOUS	lot	1	4176.29542063695	4176.29542063695	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002cjc0av08n9j9d	TESTING & COMMISSIONING		TESTING & COMMISSIONING	lot	1	30338.46747097101	30338.46747097101	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002djc0asmhezriv	AIR CONDITIONING- VRV SYSTEM B		ACCU-  Model: RXQ18BYM	units	3	466699.9977431683	1400099.993229505	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002ejc0a9j4kc6o2	AIR CONDITIONING- VRV SYSTEM B		FCU- 2 HP Wall Mounted VRF B (OR No. 1 and 3,  OR No. 1 Miyake Eye (2), OR No. 2 NSS(2), OR No. 3 Euro-open (2), OR No. 8 Ortho, NSS/ Pay, Storage Room, OR Complex Conference Room) Model: FXAQ50BVM	units	10	34692.65767935556	346926.5767935556	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002fjc0anw7aodn0	AIR CONDITIONING- VRV SYSTEM B		FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	35407.78036721927	70815.56073443854	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002gjc0azxzwth1n	AIR CONDITIONING- VRV SYSTEM B		FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	55124.68499309988	55124.68499309988	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002hjc0asf6xx42g	ACU Accessories:		Wired Remote Controller Model: BRC1E63	units	13	7406.613443719565	96285.97476835435	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002ijc0ac9vrc5qp	ACU Accessories:		Standard panel(Fresh white) Model: BYCQ125EAF	units	1	14072.5668026182	14072.5668026182	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002jjc0ayubgxnz0	ACU Accessories:		Refnet Joints Model: KHRP26A22T	units	6	2740.449241368077	16442.69544820846	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002kjc0agayxy17y	ACU Accessories:		Refnet Joints Model: KHRP26A33T	units	1	3110.782432656099	3110.782432656099	PENDING	cmrirhhw30000ic0406v47smb
cmriros3v002ljc0a6ril7cgm	ACU Accessories:		Refnet Joints Model: KHRP26A72T	units	3	5184.63318925676	15553.89956777028	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002mjc0ay44q8q0x	ACU Accessories:		Refnet Joints Model: KHRP26A73T 	units	2	8887.93991111654	17775.87982223308	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002njc0arz9gp4s3	ACU Accessories:		Pipe Size Reducer Model: KHRP26M73TP	units	2	3777.374619668408	7554.749239336816	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002ojc0acclbvr6m	ACU Accessories:		VRV Multi Con piping kit Model: BHFP22R168-7	units	1	25034.34487482518	25034.34487482518	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002pjc0aib42yhbu	Copper Pipes - Type L Hard Drawn Pipes 		1/4"	length/s	14	1335.331908515967	18694.64671922354	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002qjc0ahiykmxeq	Copper Pipes - Type L Hard Drawn Pipes 		3/8"	length/s	11	1859.317728894613	20452.49501784075	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002rjc0a32ly4ofi	Copper Pipes - Type L Hard Drawn Pipes 		1/2"	length/s	15	2958.005191525289	44370.07787287933	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002sjc0a17h1yysb	Copper Pipes - Type L Hard Drawn Pipes 		5/8"	length/s	12	4267.327371451031	51207.92845741237	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002tjc0atkctselr	Copper Pipes - Type L Hard Drawn Pipes 		3/4"	length/s	13	5442.727789035102	70755.46125745632	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002ujc0aoak4dhc0	Copper Pipes - Type L Hard Drawn Pipes 		7/8"	length/s	1	6845.666098620331	6845.666098620331	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002vjc0aop4xmd7s	Copper Pipes - Type L Hard Drawn Pipes 		1-1/8"	length/s	5	9803.664992390513	49018.32496195257	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002wjc0a1xa1rwz5	Copper Pipes - Type L Hard Drawn Pipes 		1-3/8"	length/s	1	17028.98495985662	17028.98495985662	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002xjc0ayqm0ns8a	Copper Pipes - Type L Hard Drawn Pipes 		1-5/8"	length/s	12	17028.98495985662	204347.8195182795	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002yjc0a2hump9g5	Copper Pipes Insulation 25mm Thick 		1/4"	length/s	27	273.0517681564982	7372.397740225451	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w002zjc0a1p8i8dvn	Copper Pipes Insulation 25mm Thick 		3/8"	length/s	21	278.2537138745429	5843.327991365401	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0030jc0ar9dgprgw	Copper Pipes Insulation 25mm Thick 		1/2"	length/s	30	325.0586298267328	9751.758894801984	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0031jc0amler1uf0	Copper Pipes Insulation 25mm Thick 		5/8"	length/s	24	396.5759368171887	9517.822483612528	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0032jc0awkqr0fqy	Copper Pipes Insulation 25mm Thick 		3/4"	length/s	26	445.9818256284008	11595.52746633842	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0033jc0akrc7wr0f	Copper Pipes Insulation 25mm Thick 		7/8"	length/s	2	494.0903768876552	988.1807537753103	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0034jc0ajooi3tf5	Copper Pipes Insulation 25mm Thick 		1-1/8"	length/s	9	533.0986720178845	4797.88804816096	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0035jc0a05stauap	Copper Pipes Insulation 25mm Thick 		1-3/8"	length/s	2	637.1186931134603	1274.237386226921	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0036jc0a7pk8sdst	Copper Pipes Insulation 25mm Thick 		1-5/8"	length/s	24	637.1186931134603	15290.84863472305	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0037jc0a2jajkbho	Copper Pipe Fittings		Copper Pipe Fittings	lot	1	55252.38457339624	55252.38457339624	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0038jc0apiehpzja	Isolation Ball Valves		Isolation Ball Valves	pc/s	26	2019.992354929088	52519.80122815629	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0039jc0af43ct5bg	PVC Cladding Works		PVC Cladding Works	lot	1	5186.056481910849	5186.056481910849	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ajc0a4t0znj15	Concrete Pad		Concrete Pad	pcs	3	6059.958171521946	18179.87451456584	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003bjc0a4wyu5d6q	Condensate Drain Pipes		32mm dia. uPVC blue pipe PNS 65	length/s	37	254.5237726329053	9417.379587417494	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003cjc0a1ddefure	Condensate Drain Pipes		50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	24	404.2088160063778	9701.011584153068	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003djc0a5v5xh6kv	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 32mm pvc	length/s	74	269.336092643609	19930.87085562707	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ejc0a9hl3e2np	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 50mm pvc	length/s	48	511.7366866963251	24563.3609614236	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003fjc0ama2xbja8	 (5.0m pump Lift) Model: BDU513A450VE		 (5.0m pump Lift) Model: BDU513A450VE	pcs	12	19191.24990039873	230294.9988047847	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003gjc0a5uhrnloj	Fittings		Wye 50mm	pcs	3	134.6711951993578	404.0135855980735	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003hjc0a25neenzb	Fittings		Wye Reducer 50 x 32	pcs	13	121.2065947814647	1575.685732159041	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ijc0a4zbdykq8	Fittings		Tee 32mm	pcs	3	33.67409655494605	101.0222896648382	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003jjc0aph2kct3a	Fittings		Elbow 32mm	pcs	6	27.47710553005977	164.8626331803586	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003kjc0a15mf6q1k	Fittings		Cleanout 50mm	pcs	4	134.6711951993578	538.6847807974314	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ljc0ah82n9bz3	Rough-ins		liquid-tight metallic flexible conduits 1-1/2"	m	78	254.5237726329053	19852.85426536661	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003mjc0azahegvsz	Rough-ins		Metallic Flexible Conduit	m	673	41.48331288711981	27918.26957303163	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003njc0a026xy264	Rough-ins		Metallic Flexible Conduit Connector 20mm	pcs	34	20.20949613705291	687.1228686597988	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ojc0alq7np8lt	Cables / Wires		Communication wire (PD Royal Cord 0.75mm/2C)	m	482	50.91105228168765	24539.12719977344	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003pjc0addf74p11	Cables / Wires		Wire 3.5mm² THHN (5 meters per Unit)	m	94	49.424782076532	4645.929515194008	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003qjc0asu55wmql	Cables / Wires		Wire 5.5mm² THHN (5 meters per Unit)	m	13	72.94689739965217	948.3096661954783	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003rjc0armqz1zu6	Cables / Wires		Wire 30.0mm² THHN (5 meters per Unit)	m	59	497.1888724000984	29334.1434716058	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003sjc0ajqsxfwh3	Cables / Wires		Wire 3.5mm² THHN (G) (5 meters per Unit)	m	85	49.424782076532	4201.10647650522	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003tjc0asz7f98qn	Cables / Wires		Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	118.3222229426457	2366.444458852913	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003ujc0aj2rkhf3i	CONSUMABLES		Vibration Isolator	pcs	11	1021.219826690342	11233.41809359376	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003vjc0avjk3bx5l	CONSUMABLES		Angle Bar, 2x2x 1/4 (6 meters)	length/s	4	1853.905858006349	7415.623432025396	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003wjc0amdacf9ub	CONSUMABLES		Rugby	bottle	18	204.2498432428345	3676.497178371022	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003xjc0a1gju1tfl	CONSUMABLES		White Tape	rolls	34	274.9536901986888	9348.42546675542	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003yjc0agwasgcj4	CONSUMABLES		Threaded rod 3/8 (6 meters)	length/s	75	125.6916460432091	9426.873453240683	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w003zjc0atnho4zcu	CONSUMABLES		Nuts and washer 3/8	pcs	22	15.71604786849969	345.7530531069933	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0040jc0ajzwug3n5	CONSUMABLES		Grip Anchor 3/8	pcs	22	7.86169762472869	172.9573477440312	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0041jc0ajt0o0h1g	CONSUMABLES		Paint (Red Oxide)	gallon	1	2521.621144679334	2521.621144679334	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0042jc0aql8z38m4	CONSUMABLES		Loop Hangers	pcs	281	31.43209573699939	8832.418902096828	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0043jc0ay6xs9gq0	CONSUMABLES		Freon	tank	5	10652.06392269747	53260.31961348733	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0044jc0aoyudervk	CONSUMABLES		Nitrogen	tank	3	13354.34981774545	40063.04945323635	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0045jc0amy4cp8dr	CONSUMABLES		Mapp Gas	tank	8	628.44353545413	5027.54828363304	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0046jc0ap4ucg5zd	CONSUMABLES		Silver Rod	pcs	112	39.2864459807704	4400.081949846284	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0047jc0axgqjxca5	CONSUMABLES		Paint Brush	pcs	1	157.1163943992508	157.1163943992508	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0048jc0ama2rx7lm	CHIPPING & RESTORATION (ROUGH-ONLY)		CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	541758.2826191082	541758.2826191082	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w0049jc0ayz4rd2hv	MISCELLANEOUS		MISCELLANEOUS	lot	1	4879.1826199544	4879.1826199544	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004ajc0a9ux9vg3f	TESTING & COMMISIONING		TESTING & COMMISIONING	lot	1	34672.53320291245	34672.53320291245	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004bjc0akt7tc2y7	AIR CONDITIONING- VRV SYSTEM C		ACCU- Model: RXQ18BYM	units	3	466699.9977431683	1400099.993229505	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004cjc0am1hc0x89	AIR CONDITIONING- VRV SYSTEM C		FCU- 2 HP Wall Mounted VRF C (Storage Room, OR No. 8 Ortho, NSS/Pay, OR No. 9 Plastic Surgery (2) ) Model: FXAQ50BVM	units	1	34692.65767935555	34692.65767935555	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004djc0a36d42x1a	AIR CONDITIONING- VRV SYSTEM C		FCU- 2.5HP Wall Mounted VRF C (OR No. 4,  Euro- Endo (2), OR No. 7 Ortho, OR. 12 Pedia,  OR No. 10 Pay) Model: FXAQ63BVM	units	7	35407.78036721927	247854.4625705349	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004ejc0awqdqnhos	AIR CONDITIONING- VRV SYSTEM C		FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	55124.68499309988	110249.3699861998	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004fjc0ayvaa3w0p	ACU Accessories:		Wired Remote Controller Model: BRC1E63	units	10	7406.613443719565	74066.13443719565	PENDING	cmrirhhw30000ic0406v47smb
cmriros3w004gjc0atv6liyjv	ACU Accessories:		Standard panel(Fresh white) Model: BYCQ125EAF	units	2	14072.5668026182	28145.13360523639	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004hjc0app45k9xa	ACU Accessories:		Refnet Joints Model: KHRP26A33T	units	2	3110.782432656099	6221.564865312197	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004ijc0aa1f50wdo	ACU Accessories:		Refnet Joints Model: KHRP26A72T	units	4	5184.63318925676	20738.53275702704	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004jjc0a5k04u5nz	ACU Accessories:		Refnet Joints Model: KHRP26A73T 	units	3	8887.93991111654	26663.81973334962	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004kjc0af28zwfe5	ACU Accessories:		Pipe Size Reducer Model: KHRP26M73TP	units	3	3777.374619668408	11332.12385900523	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004ljc0a4zqy4fnb	ACU Accessories:		VRV Multi Con piping kit Model: BHFP22R168-7	units	1	25034.34487482518	25034.34487482518	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004mjc0ad6an5ors	Copper Pipes - Type L Hard Drawn Pipes 		1/4"	length/s	1	1335.331908515967	1335.331908515967	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004njc0a67kt24dp	Copper Pipes - Type L Hard Drawn Pipes 		3/8"	length/s	11	1859.317728894613	20452.49501784075	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004ojc0axjh85t9t	Copper Pipes - Type L Hard Drawn Pipes 		1/2"	length/s	2	2958.005191525289	5916.010383050578	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004pjc0az44zqggf	Copper Pipes - Type L Hard Drawn Pipes 		5/8"	length/s	14	4267.327371451032	59742.58320031445	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004qjc0as2sqbnxm	Copper Pipes - Type L Hard Drawn Pipes 		3/4"	length/s	9	5442.727789035102	48984.55010131592	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004rjc0azn7gbvnb	Copper Pipes - Type L Hard Drawn Pipes 		7/8"	length/s	1	6845.666098620331	6845.666098620331	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004sjc0a3k95szzz	Copper Pipes - Type L Hard Drawn Pipes 		1-1/8"	length/s	5	9803.664992390513	49018.32496195257	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004tjc0afryb0chy	Copper Pipes - Type L Hard Drawn Pipes 		1-3/8"	length/s	3	13234.94018242107	39704.8205472632	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004ujc0ak6v30qdg	Copper Pipes - Type L Hard Drawn Pipes 		1-5/8"	length/s	7	17028.98495985662	119202.8947189963	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004vjc0aaecyghqf	Copper Pipes Insulation 25mm Thick 		1/4"	length/s	2	273.0517681564982	546.1035363129963	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004wjc0aslwj1lpe	Copper Pipes Insulation 25mm Thick 		3/8"	length/s	21	278.2537138745429	5843.327991365401	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004xjc0ak1r03x58	Copper Pipes Insulation 25mm Thick 		1/2"	length/s	4	325.0586298267328	1300.234519306931	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004yjc0aohg63w6w	Copper Pipes Insulation 25mm Thick 		5/8"	length/s	27	396.5759368171886	10707.55029406409	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x004zjc0a0v7lchjr	Copper Pipes Insulation 25mm Thick 		3/4"	length/s	17	445.9818256284008	7581.691035682814	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0050jc0akvfha61q	Copper Pipes Insulation 25mm Thick 		7/8"	length/s	2	494.0903768876552	988.1807537753103	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0051jc0amyb32fv4	Copper Pipes Insulation 25mm Thick 		1-1/8"	length/s	10	533.0986720178845	5330.986720178845	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0052jc0amhph2bzz	Copper Pipes Insulation 25mm Thick 		1-3/8"	length/s	5	564.2977508159399	2821.4887540797	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0053jc0aajqjd12u	Copper Pipes Insulation 25mm Thick 		1-5/8"	length/s	13	637.1186931134603	8282.543010474983	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0054jc0a8ll73y2n	Copper Pipe Fittings		Copper Pipe Fittings	lot	1	37241.86928915686	37241.86928915686	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0055jc0acif1s8l4	Isolation Ball Valves		Isolation Ball Valves	pc/s	20	2019.992354929089	40399.84709858177	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0056jc0asz794pni	PVC Cladding Works		PVC Cladding Works	lot	1	12413.95852897066	12413.95852897066	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0057jc0ag2f9gs48	Concrete Pad		Concrete Pad	pcs	3	6059.958171521946	18179.87451456584	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0058jc0ah12cwzrb	Condensate Drain Pipes		32mm dia. uPVC blue pipe PNS 65	length/s	33	254.5237726329053	8399.284496885875	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0059jc0atmxnr7an	Condensate Drain Pipes		50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	12	404.2088160063778	4850.505792076534	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ajc0at8l6ukbb	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 32mm pvc	length/s	66	269.336092643609	17776.18211447819	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005bjc0ak1ffj54m	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 50mm pvc	length/s	23	511.7366866963251	11769.94379401548	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005cjc0ayiu742of	 (5.0m pump Lift) Model: BDU513A450VE		 (5.0m pump Lift) Model: BDU513A450VE	pcs	11	19191.24990039873	211103.748904386	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005djc0am7rqws70	Fittings		Wye Reducer 50 x 32	length/s	7	121.2065947814647	848.4461634702527	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ejc0aev9zvmql	Fittings		Tee 32mm	length/s	6	33.67409655494605	202.0445793296763	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005fjc0afa02nlxi	Fittings		Elbow 32mm	length/s	7	27.47710553005977	192.3397387104184	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005gjc0aldrzsauf	Fittings		Cleanout 50mm	length/s	2	134.6711951993578	269.3423903987157	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005hjc0aaqiajmlu	Rough-ins		liquid-tight metallic flexible conduits 1-1/2"	m	78	254.5237726329053	19852.85426536661	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ijc0azlazu3ws	Rough-ins		Metallic Flexible Conduit 20mm	m	444	41.4833128871198	18418.59092188119	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005jjc0abpgvuslu	Rough-ins		Metallic Flexible Conduit Connector 20mm	pcs	26	20.20949613705291	525.4468995633755	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005kjc0a2tnjxhyz	Cables / Wires		Communication wire (PD Royal Cord 0.75mm/2C)	m	291	50.91105228168765	14815.11621397111	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ljc0apjenkksi	Cables / Wires		Wire 3.5mm² THHN (5 meters per Unit)	m	63	49.43107983163858	3114.158029393231	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005mjc0adu12syn9	Cables / Wires		Wire 5.5mm² THHN (5 meters per Unit)	m	26	75.64233658527343	1966.700751217109	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005njc0askpjr9np	Cables / Wires		Wire 30.0mm² THHN (5 meters per Unit)	m	59	497.1888724000984	29334.1434716058	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ojc0ao1wer5tg	Cables / Wires		Wire 3.5mm² THHN (G) (5 meters per Unit)	m	65	49.43107983163858	3213.020189056508	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005pjc0ahyjx8x76	Cables / Wires		Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	118.3222229426457	2366.444458852913	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005qjc0a85p4ttgz	CONSUMABLES		Vibration Isolator	pcs	14	1021.219826690342	14297.07757366478	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005rjc0aqscwjnwe	CONSUMABLES		Angle Bar, 2x2x 1/4 (6 meters)	length/s	5	1853.905858006349	9269.529290031744	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005sjc0a7fiavopj	CONSUMABLES		Rugby	bottle	11	204.2498432428345	2246.748275671179	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005tjc0aybzfxzxp	CONSUMABLES		White Tape	rolls	21	274.9536901986888	5774.027494172466	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005ujc0anjpws5eq	CONSUMABLES		Threaded rod 3/8 (6 meters)	length/s	46	125.6916460432091	5781.815717987618	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005vjc0a4kiv9nhh	CONSUMABLES		Nuts and washer 3/8	pcs	22	15.71604786849969	345.7530531069933	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005wjc0abrtsl2ab	CONSUMABLES		Grip Anchor 3/8	pcs	22	7.86169762472869	172.9573477440312	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005xjc0a3w3nxr2p	CONSUMABLES		Paint (Red Oxide)	gallon	1	2521.621144679334	2521.621144679334	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005yjc0atede7kw6	CONSUMABLES		Loop Hangers	pcs	171	31.4320957369994	5374.888371026896	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x005zjc0aqw39i5m7	CONSUMABLES		Freon	tank	4	10652.06392269747	42608.25569078986	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0060jc0a7lcizyfz	CONSUMABLES		Nitrogen	tank	2	13354.34981774545	26708.6996354909	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0061jc0a3f153zj7	CONSUMABLES		Mapp Gas	tank	6	597.026134479046	3582.156806874276	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0062jc0alswgbmww	CONSUMABLES		Silver Rod	pcs	69	39.28644598077039	2710.764772673157	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0063jc0aksmf6qng	CONSUMABLES		Paint Brush	pcs	1	157.1163943992508	157.1163943992508	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0064jc0ayvs6nus7	CHIPPING & RESTORATION (ROUGH-ONLY)		CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	541758.2826191082	541758.2826191082	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0065jc0axvclmnkm	MISCELLANEOUS		MISCELLANEOUS	lot	1	3681.3978814698	3681.3978814698	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0066jc0aiboi6fq4	TESTING & COMMISIONING		TESTING & COMMISSIONING	lot	1	28171.43093130981	28171.43093130981	PENDING	cmrirhhw30000ic0406v47smb
cmriros3x0067jc0aw3ntwata	AIR CONDITIONING- VRV SYSTEM D		ACCU- Model: RXQ20BYM	units	3	497092.6364043145	1491277.909212943	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0068jc0ab56byadu	AIR CONDITIONING- VRV SYSTEM D		FCU- 2 HP Wall Mounted VRF C (Storage Room, OR No. 8 Ortho, NSS/Pay, OR No. 9 Plastic Surgery (2) ) Model: FXAQ50BVM	units	6	34692.65767935555	208155.9460761333	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0069jc0agp6rdbuw	AIR CONDITIONING- VRV SYSTEM D		FCU- 2.5HP Wall Mounted VRF C (OR No. 4,  Euro- Endo (2), OR No. 7 Ortho, OR. 12 Pedia,  OR No. 10 Pay) Model: FXAQ63BVM	units	4	35407.78036721927	141631.1214688771	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ajc0a2f3la1ll	AIR CONDITIONING- VRV SYSTEM D		FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	55124.68499309988	110249.3699861998	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006bjc0alzyunctr	ACU Accessories:		Wired Remote Controller Model: BRC1E63	units	12	7406.613443719565	88879.36132463478	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006cjc0aagj7fdla	ACU Accessories:		Standard panel(Fresh white) Model: BYCQ125EAF	units	2	14072.5668026182	28145.13360523639	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006djc0ach8gwejh	ACU Accessories:		Refnet Joints Model: KHRP26A22T	units	4	2740.449241368077	10961.79696547231	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ejc0aiq6ydfpy	ACU Accessories:		Refnet Joints Model: KHRP26A33T	units	1	3110.782432656099	3110.782432656099	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006fjc0asss6kwlv	ACU Accessories:		Refnet Joints Model: KHRP26A72T	units	3	5184.63318925676	15553.89956777028	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006gjc0af71guc9q	ACU Accessories:		Refnet Joints Model: KHRP26A73T 	units	3	8887.93991111654	26663.81973334962	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006hjc0ans8dh9o0	ACU Accessories:		Pipe Size Reducer Model: KHRP26M73TP	units	3	3777.374619668408	11332.12385900523	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ijc0ayzqjkyld	ACU Accessories:		VRV Multi Con piping kit Model: BHFP22R168-7	units	1	25034.34487482518	25034.34487482518	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006jjc0a0vfs811v	Copper Pipes - Type L Hard Drawn Pipes 		1/4"	length/s	8	1335.331908515967	10682.65526812774	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006kjc0a3rsmfnve	Copper Pipes - Type L Hard Drawn Pipes 		3/8"	length/s	12	1859.317728894613	22311.81274673536	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ljc0akzoo9g78	Copper Pipes - Type L Hard Drawn Pipes 		1/2"	length/s	10	2958.005191525289	29580.05191525289	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006mjc0a3alc8ynh	Copper Pipes - Type L Hard Drawn Pipes 		5/8"	length/s	14	4267.327371451032	59742.58320031445	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006njc0amjsczjcs	Copper Pipes - Type L Hard Drawn Pipes 		3/4"	length/s	16	5442.727789035102	87083.64462456162	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ojc0a7rimewn7	Copper Pipes - Type L Hard Drawn Pipes 		7/8"	length/s	2	6845.666098620331	13691.33219724066	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006pjc0awdjhj1ch	Copper Pipes - Type L Hard Drawn Pipes 		1-1/8"	length/s	5	9803.664992390513	49018.32496195257	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006qjc0avh471fy2	Copper Pipes - Type L Hard Drawn Pipes 		1-3/8"	length/s	2	13234.94018242107	26469.88036484213	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006rjc0anjctfrel	Copper Pipes - Type L Hard Drawn Pipes 		1-5/8"	length/s	14	17028.98495985662	238405.7894379926	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006sjc0a7pbs579v	Copper Pipes Insulation 25mm Thick 		1/4"	length/s	16	273.0517681564982	4368.82829050397	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006tjc0abvuxryjh	Copper Pipes Insulation 25mm Thick 		3/8"	length/s	24	278.2537138745429	6678.089132989031	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006ujc0az90e9k3a	Copper Pipes Insulation 25mm Thick 		1/2"	length/s	19	325.0586298267328	6176.113966707923	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006vjc0amjuis03x	Copper Pipes Insulation 25mm Thick 		5/8"	length/s	27	396.5759368171886	10707.55029406409	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006wjc0a587bqtzb	Copper Pipes Insulation 25mm Thick 		3/4"	length/s	31	445.9818256284008	13825.43659448042	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006xjc0a92l7qofx	Copper Pipes Insulation 25mm Thick 		7/8"	length/s	4	494.0903768876552	1976.361507550621	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006yjc0abm2k78r7	Copper Pipes Insulation 25mm Thick 		1-1/8"	length/s	10	533.0986720178845	5330.986720178845	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y006zjc0a2jb8uh8w	Copper Pipes Insulation 25mm Thick 		1-3/8"	length/s	4	564.2977508159399	2257.19100326376	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0070jc0ali8utzte	Copper Pipes Insulation 25mm Thick 		1-5/8"	length/s	27	637.1186931134603	17202.20471406343	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0071jc0a422ynv5g	Copper Pipe Fittings		Copper Pipe Fittings	lot	1	60874.08196705046	60874.08196705046	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0072jc0abf44e238	Isolation Ball Valves		Isolation Ball Valves	pc/s	24	2019.992354929088	48479.81651829812	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0073jc0ank3y32to	PVC Cladding Works		PVC Cladding Works	lot	1	20291.36695343859	20291.36695343859	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0074jc0aarj1cvfi	Concrete Pad		Concrete Pad	pcs	3	6059.958171521946	18179.87451456584	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0075jc0arh552u87	Condensate Drain Pipes		32mm dia. uPVC blue pipe PNS 65	length/s	31	254.5237726329053	7890.236951620063	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0076jc0aqzqjcgbp	Condensate Drain Pipes		50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	38	404.2088160063778	15359.93500824236	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0077jc0ai0quvjqd	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 32mm pvc	length/s	61	269.336092643609	16429.50165126015	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0078jc0agfsopxju	Condensate Drain Pipes Rubber Insulation 1.5 meters		3/4'' thick for 50mm pvc	length/s	75	511.7366866963252	38380.25150222439	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y0079jc0aw7tdg1ic	 (5.0m pump Lift) Model: BDU513A450VE		 (5.0m pump Lift) Model: BDU513A450VE	pcs	10	19191.24990039872	191912.4990039872	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007ajc0a2nd801c3	Fittings		Wye 50mm	length/s	2	134.6711951993578	269.3423903987157	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007bjc0augiuyxil	Fittings		Wye Reducer 50 x 32	length/s	11	121.2065947814647	1333.272542596111	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007cjc0ag5hiunor	Fittings		Tee 32mm	length/s	3	33.67409655494605	101.0222896648382	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007djc0aluzbfjni	Fittings		Tee Reducer 50 x 32	length/s	3	127.9388949904112	383.8166849712337	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007ejc0afs6vnvgy	Fittings		Elbow 32mm	length/s	7	27.47710553005977	192.3397387104184	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007fjc0a8vxakgqo	Fittings		Cleanout 50mm	length/s	6	134.6711951993578	808.027171196147	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007gjc0aljt4isot	Rough-ins		liquid-tight metallic flexible conduits 2"	m	78	480.764327082107	37499.61751240434	PENDING	cmrirhhw30000ic0406v47smb
cmriros3y007hjc0aqrxkbolm	Rough-ins		Metallic Flexible Conduit 20mm	m	654	41.4833128871198	27130.08662817635	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007ijc0a76hwmdah	Rough-ins		Metallic Flexible Conduit Connector 20mm	pcs	32	20.20949613705291	646.703876385693	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007jjc0aps6vhg03	Cables / Wires		Communication wire (PD Royal Cord 0.75mm/2C)	m	472	50.91105228168766	24030.01667695658	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007kjc0a1jcckosi	Cables / Wires		Wire 3.5mm² THHN (5 meters per Unit)	m	78	48.52420309628938	3784.887841510571	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007ljc0a3p9rfqwa	Cables / Wires		Wire 5.5mm² THHN (5 meters per Unit)	m	26	75.64233658527343	1966.700751217109	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007mjc0a9cy1k4o7	Cables / Wires		Wire 38.0mm² THHN (5 meters per Unit)	m	59	590.8553841004373	34860.4676619258	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007njc0a3jwexzsc	Cables / Wires		Wire 3.5mm² THHN (G) (5 meters per Unit)	m	78	47.45988248327538	3701.87083369548	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007ojc0a9r9g551k	Cables / Wires		Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	195.8664815701098	3917.329631402196	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007pjc0ajbav7fih	CONSUMABLES		Vibration Isolator	pcs	14	1021.219826690342	14297.07757366478	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007qjc0a8c14tot9	CONSUMABLES		Angle Bar, 2x2x 1/4 (6 meters)	length/s	5	1853.905858006349	9269.529290031744	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007rjc0at6jobasw	CONSUMABLES		Rugby	bottle	17	204.2498432428345	3472.247335128187	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007sjc0ajunuc1nq	CONSUMABLES		White Tape	rolls	33	274.9536901986888	9073.471776556731	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007tjc0ay2yloxc4	CONSUMABLES		Threaded rod 3/8 (6 meters)	length/s	73	125.6916460432091	9175.490161154263	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007ujc0a2d186sil	CONSUMABLES		Nuts and washer 3/8	pcs	22	15.71604786849969	345.7530531069933	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007vjc0arg73eo2w	CONSUMABLES		Grip Anchor 3/8	pcs	22	7.86169762472869	172.9573477440312	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007wjc0awhnccfvb	CONSUMABLES		Paint (Red Oxide)	gallon	1	2521.621144679334	2521.621144679334	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007xjc0a4c911i2f	CONSUMABLES		Loop Hangers	pcs	275	31.43209573699939	8643.826327674831	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007yjc0atdbek8bh	CONSUMABLES		Freon	tank	6	10652.06392269747	63912.38353618479	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z007zjc0a8n1m0rik	CONSUMABLES		Nitrogen	tank	3	13354.34981774545	40063.04945323635	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0080jc0afi4nrnfo	CONSUMABLES		Mapp Gas	tank	8	597.026134479046	4776.209075832368	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0081jc0aks5t5yk0	CONSUMABLES		Silver Rod	pcs	111	39.28644598077039	4360.795503865513	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0082jc0amwfbsjn9	CONSUMABLES		Paint Brush	pcs	1	157.1163943992508	157.1163943992508	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0083jc0a1z9a9vtk	CHIPPING & RESTORATION (ROUGH-ONLY)		CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	541758.2826191082	541758.2826191082	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0084jc0a3vxl1i9g	MISCELLANEOUS		MISCELLANEOUS	lot	1	5347.357734578429	5347.357734578429	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0085jc0aa9ab49bl	TESTING & COMMISIONING		TESTING & COMMISSIONING	lot	1	32505.5040106322	32505.5040106322	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0086jc0av7kt39ju	Cables / Wires		250mm² THHN	m	508	5211.027080908486	2647201.757101511	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0087jc0aezyyvlwi	Cables / Wires		200mm² THHN	m	82	4047.789727686946	331918.7576703295	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0088jc0aam0mydsa	Cables / Wires		38mm² THHN	m	273	827.6677701219044	225953.3012432799	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0089jc0a4fkiz0eq	Cables / Wires		80mm² THHN	m	169	1564.815806845064	264453.8713568157	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ajc0agc843yii	Cables / Wires		30mm² THHN	m	27	605.1964221039977	16340.30339680794	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008bjc0ammfd8xbw	Cables / Wires		14mm² THHN	m	91	263.6754604286342	23994.46689900571	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008cjc0a61gdvjyi	Roughing-ins		90mm dia. IMC	length/s	66	6834.291303271975	451063.2260159504	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008djc0a5bfpdkbk	Roughing-ins		40mm dia. IMC	length/s	31	1963.881456181058	60880.32514161279	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ejc0ah881q6ix	Panel Board & Pullbox		DP-Main	Assy	1	567383.4566373875	567383.4566373875	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008fjc0a36ugahkr	Panel Board & Pullbox		PP-System A	Assy	1	92449.9711975211	92449.9711975211	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008gjc0afgsrssaq	Panel Board & Pullbox		PP-System B	Assy	1	99386.64825443849	99386.64825443849	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008hjc0ae0vn5k12	Panel Board & Pullbox		PP-System C	Assy	1	88308.77421571904	88308.77421571904	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ijc0a9susnkac	Panel Board & Pullbox		PP-System D	Assy	1	96597.67061147073	96597.67061147073	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008jjc0aswry0eyl	Panel Board & Pullbox		PP-Outdoor	Assy	1	347954.0125045361	347954.0125045361	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008kjc0aw6c7y2uo			Transformer	Assy	1	685215.8811232506	685215.8811232506	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ljc0asjggnnlj	ECB		ECB 1250AT Nema 12	pc	1	221925.8711082267	221925.8711082267	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008mjc0aok7qico2	Pullbox		Pullbox (350mm x 350mm x 200mm)	pc	4	4069.155911511909	16276.62364604764	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008njc0atbmg721q	Wire Gutter		Wire Gutter	lot	1	23566.4893056012	23566.4893056012	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ojc0af75k1fza	ECB		ECB 150AT, 3P, 230V, Nema3R	pc	3	21321.4456223122	63964.33686693661	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008pjc0aznbhpruy	ECB		ECB 40AT, 3P, 230V, Nema3R	pc	5	8143.719495408679	40718.5974770434	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008qjc0awufuagk9	ECB		ECB 40AT, 2P, 230V, Nema3R	pc	11	6928.007147387317	76208.07862126049	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008rjc0a9g86pkbj	ECB		ECB 30AT, 2P, 230V, Nema3R	pc	16	6928.007147387315	110848.114358197	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008sjc0awlak7e53	Roughing-ins		40mm dia. IMC	length/s	34	1963.881456181058	66771.96951015598	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008tjc0acuzmmmfb	Roughing-ins		25mm dia. IMC	length/s	702	1288.311819264302	904394.89712354	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008ujc0akc58b8oi	Roughing-ins		Junction boxes with cover	pc/s	137	92.46678935253325	12667.95014129706	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008vjc0a3rcohaq0	Cables / Wires		50mm² THHN	Lm/s	300	1025.620907883998	307686.2723651995	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008wjc0auom8v0k7	Cables / Wires		5.5mm² THHN	Lm/s	4759	105.8978017431913	503967.6384958472	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008xjc0a0w3t5hvc	Cables / Wires		14mm² THHN	Lm/s	100	263.6754604286342	26367.54604286341	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008yjc0agzflyujb	Cables / Wires		5.5mm² THHN	Lm/s	2230	105.8978017431913	236152.0978873165	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z008zjc0axqv4otrz	Chipping & Restoration Works (Rough only)		Chipping & Restoration Works (Rough only)	lot	1	106861.1095131731	106861.1095131731	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0090jc0ac49u7adr	Hangers & Supports		Hangers & Supports	lot	1	128233.3328852839	128233.3328852839	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0091jc0aucsh4f3v	Miscelleneuos		Miscelleneuos	lot	1	64116.67011633242	64116.67011633242	PENDING	cmrirhhw30000ic0406v47smb
cmriros3z0092jc0a507e11ns	Testing & Commissioning		Testing & Commissioning	lot	1	650109.9406124059	650109.9406124059	PENDING	cmrirhhw30000ic0406v47smb
\.


--
-- Data for Name: ProgramOfWorks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProgramOfWorks" (id, "packageId", title, description, "startDate", "endDate", activities, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Project" (id, name, description, location, "startDate", "endDate", status, "contractAmountVATInclusive", "vatRate", "retentionPercentage", "withholdingTaxPercentage", "mobilizationAdvanceAmount", "advanceRecoupmentMethod", "liquidatedDamagesRate", "otherDeductions", "paymentTerms", "boqLocked", "consolidatedBOQLocked", "procurementBenchmarkLocked", "contractNumber", client, contractor, "gpsLatitude", "gpsLongitude", "acceptableGeotagRadius", "projectCategory", "fundingSource", "contractAmount", "originalContractDuration", "noticeToProceedDate", "originalCompletionDate", "revisedCompletionDate", "implementingOffice", "managerId", "createdAt", "updatedAt") FROM stdin;
cmrirhhw30000ic0406v47smb	PGH_AWARDED BILL OF QUANTITY	Automated Project Import from BOQ File: PGH_AWARDED BILL OF QUANTITY.xlsx	Unknown Location	2026-06-12 00:00:00	2026-12-09 00:00:00	ACTIVE	t	12	10	2	0	PRO_RATA	0.1	0	\N	t	t	t	\N	\N	\N	\N	\N	100	\N	\N	43106674.89000002	180	\N	2026-12-09 00:00:00	\N	\N	cmrinimix001avchckwzmfxsu	2026-07-13 05:08:10.304	2026-07-13 05:14:36.752
fake-project-id	Fake Project	\N	\N	\N	\N	PLANNING	t	12	10	2	0	PRO_RATA	0.1	0	\N	f	f	f	\N	\N	\N	\N	\N	100	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-07-16 07:21:54.001	2026-07-16 07:21:54.001
\.


--
-- Data for Name: ProjectAccomplishmentAIFinding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectAccomplishmentAIFinding" (id, "fileId", "projectId", "billingId", "findingType", "sheetName", "cellReference", description, severity, recommendation, "createdAt") FROM stdin;
\.


--
-- Data for Name: ProjectAccomplishmentFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectAccomplishmentFile" (id, "projectId", "billingId", "fileName", "originalFilePath", "workingFilePath", "fileSize", "fileType", "fileVersion", "uploadedById", status, "isLockedOriginal", remarks, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: ProjectAccomplishmentFileVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectAccomplishmentFileVersion" (id, "fileId", "versionNumber", "filePath", "savedBy", "savedAt", remarks) FROM stdin;
\.


--
-- Data for Name: ProjectBOQVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectBOQVersion" (id, "projectId", "sourceUploadedWorkbookFileId", "versionNumber", "versionLabel", status, "committedBy", "committedAt", "approvedBy", "approvedAt", "totalDirectCost", "totalIndirectCost", "totalAmount", remarks, "createdAt", "updatedAt", checksum, "checksumAlgorithm", "checksumVersion", "lockedAt", "lockedById", "sourceProvenance") FROM stdin;
cmrn7l1a2000ovc6c1eefxvka	cmrirhhw30000ic0406v47smb	\N	1	\N	LOCKED	cmrinimix001avchckwzmfxsu	2026-07-16 07:49:53.975	cmrinimix001avchckwzmfxsu	2026-07-16 07:57:42.919	\N	\N	43106674.89	\N	2026-07-16 07:49:53.978	2026-07-16 10:27:54.385	514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17	SHA-256	BOQ_CANONICAL_V1	2026-07-16 07:50:12.585	cmrinikue0017vchcnxm8wqzn	Reconstruction Manifest
\.


--
-- Data for Name: ProjectCamera; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectCamera" (id, "cameraName", "cameraLocation", "cameraType", "streamUrl", username, password, "gpsLatitude", "gpsLongitude", "installationDate", status, remarks, "projectId") FROM stdin;
\.


--
-- Data for Name: ProjectCostLedger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectCostLedger" (id, "projectId", "costDate", "costCategory", "costType", "directIndirect", "supplierName", "subcontractorName", "workerName", "referenceDocumentType", "referenceDocumentNo", quantity, "unitCost", "grossAmount", "vatAmount", "withholdingTaxAmount", "netAmount", "paidAmount", "unpaidBalance", "paymentStatus", "approvalStatus", "encodedById", "approvedById", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ProjectSchedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectSchedule" (id, "projectId", name, description, "baselineStartDate", "baselineFinishDate", "currentStartDate", "currentFinishDate", "actualStartDate", "actualFinishDate", status, "calendarDays", "workingDays", holidays, "workDaysConfig", "createdAt", "updatedAt", "activatedAt", "activatedById", "activationSnapshotHash", "approvedAt", "approvedBy", "awardedContractAmount", "baselineRevision", "differenceAmount", "feasibilityFlags", "generatedAt", "generatedBy", "generatedById", "generationRulesVersion", "lockedBOQChecksum", "lockedBOQVersionId", "openAiModelIdentifier", "parentScheduleId", "previousBaselineId", "projectCompletionDate", "projectStartDate", "promptVersion", "reviewRound", "revisionCode", "revisionNumber", "rowVersion", "scheduledAmount", "schedulingEngineVersion", "validationMetrics", "validationRulesVersion", "workflowStatus", "baselineCode") FROM stdin;
\.


--
-- Data for Name: ProjectUserAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectUserAssignment" (id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "assignedBy", "dateAssigned", "dateRemoved", remarks, "createdAt", "updatedAt") FROM stdin;
cmrirhi1400caic04pp8v1odg	cmqiy15bq0000vc1cq1f3zg6j	cmrirhhw30000ic0406v47smb	SUPER_ADMIN	READ_WRITE	active	SYSTEM	2026-07-13 05:08:10.505	\N	\N	2026-07-13 05:08:10.505	2026-07-13 05:08:10.505
cmrn6d2aa0001vcx8h2bi3rdy	cmrinimix001avchckwzmfxsu	cmrirhhw30000ic0406v47smb	PROJECT_MANAGER	READ_WRITE	active	cmqiy15bq0000vc1cq1f3zg6j	2026-07-16 07:15:42.412	\N	\N	2026-07-16 07:15:42.412	2026-07-16 07:15:42.412
cmrn6d2zb0003vcx8aq1cktxl	cmrinikue0017vchcnxm8wqzn	cmrirhhw30000ic0406v47smb	PROJECT_DIRECTOR	READ_WRITE	active	cmqiy15bq0000vc1cq1f3zg6j	2026-07-16 07:15:43.319	\N	\N	2026-07-16 07:15:43.319	2026-07-16 07:15:43.319
cmrn6d3hw0005vcx8bua0fg5d	cmriniqgy001lvchcegw8qcxv	cmrirhhw30000ic0406v47smb	SITE_ENGINEER	READ_WRITE	active	cmqiy15bq0000vc1cq1f3zg6j	2026-07-16 07:15:43.989	\N	\N	2026-07-16 07:15:43.989	2026-07-16 07:15:43.989
\.


--
-- Data for Name: ProjectValidationScore; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProjectValidationScore" (id, "projectId", "reportedProgress", "aiValidatedProgress", "billingProgress", "paidProgress", "scheduleVariance", "costVariance", "validationConfidenceScore", "riskLevel", "evidenceCompletenessScore", "executiveRecommendation", "requiredAction", "latestValidationDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseOrder" (id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "deliveryDate", "paymentTermsDays", "dueDate", "preparerId", "reviewerId", "approverId", "aiValidationRisk", "createdAt", "updatedAt", "canvassFormId") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseOrderItem" (id, quantity, "unitCost", "poId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."QuotationItem" (id, "unitCost", "quantityAvailable", "totalCost", brand, remarks, "quotationId", "canvassItemId") FROM stdin;
\.


--
-- Data for Name: ReceivingBank; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReceivingBank" (id, "bankCode", "bankName", "shortName", "instaPayEnabled", "pesonetEnabled", "lastSyncedDate", status, "rawApiReference", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReturnItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReturnItem" (id, "returnedQty", condition, "returnId", "issuanceItemId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: RevisionRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RevisionRequest" (id, "moduleName", "transactionId", "requestedBy", reason, status, "reviewedBy", "reviewedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, "roleName", "roleCode", description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmr0l3xul00pbvcd46atnnarx	ACCOUNTANT	ACCOUNTANT	ACCOUNTANT	t	2026-06-30 11:49:48.956	2026-06-30 11:49:48.956
cmr0l3zzg00pcvcd4iq9tafen	ADMINISTRATOR	ADMINISTRATOR	ADMINISTRATOR	t	2026-06-30 11:49:51.724	2026-06-30 11:49:51.724
cmr0l429c00pevcd454levwco	AUDITOR	AUDITOR	AUDITOR	t	2026-06-30 11:49:54.673	2026-06-30 11:49:54.673
cmr0l44cl00pfvcd4rffz3w4y	BILLING_ENGINEER	BILLING_ENGINEER	BILLING_ENGINEER	t	2026-06-30 11:49:57.381	2026-06-30 11:49:57.381
cmr0l46ar00pgvcd4l56nrtdq	CONTRACTS_ADMINISTRATOR	CONTRACTS_ADMINISTRATOR	CONTRACTS_ADMINISTRATOR	t	2026-06-30 11:49:59.907	2026-06-30 11:49:59.907
cmr0l489e00phvcd4uj2xx4vj	COST_OFFICER	COST_OFFICER	COST_OFFICER	t	2026-06-30 11:50:02.45	2026-06-30 11:50:02.45
cmr0l4afl00pivcd47ytdlmsa	DIRECTORS	DIRECTORS	DIRECTORS	t	2026-06-30 11:50:05.265	2026-06-30 11:50:05.265
cmr0l4cjk00pjvcd4nrbgpo28	DRIVER	DRIVER	DRIVER	t	2026-06-30 11:50:08.001	2026-06-30 11:50:08.001
cmr0l4eob00pkvcd416e7uor5	EQUIPMENT_MANAGER	EQUIPMENT_MANAGER	EQUIPMENT_MANAGER	t	2026-06-30 11:50:10.763	2026-06-30 11:50:10.763
cmr0l4gvy00plvcd4e88g3jso	FINANCE_OFFICER	FINANCE_OFFICER	FINANCE_OFFICER	t	2026-06-30 11:50:13.631	2026-06-30 11:50:13.631
cmr0l4j6i00pmvcd4gf4yrpb7	FOREMAN	FOREMAN	FOREMAN	t	2026-06-30 11:50:16.602	2026-06-30 11:50:16.602
cmr0l4llp00pnvcd41hsajz24	GUEST USER	GUEST USER	GUEST USER	t	2026-06-30 11:50:19.504	2026-06-30 11:50:19.504
cmr0l4nsb00povcd402qqyaut	GUEST_USER	GUEST_USER	GUEST_USER	t	2026-06-30 11:50:22.572	2026-06-30 11:50:22.572
cmr0l4ps10000l404rd5ojtgs	HR_MANAGER	HR_MANAGER	HR_MANAGER	t	2026-06-30 11:50:25.154	2026-06-30 11:50:25.154
cmr0l4ps70001l404xp0g5mgn	HR_OFFICER	HR_OFFICER	HR_OFFICER	t	2026-06-30 11:50:25.159	2026-06-30 11:50:25.159
cmr0l4psc0002l404esq7cviz	LIASON_OFFICER	LIASON_OFFICER	LIASON_OFFICER	t	2026-06-30 11:50:25.164	2026-06-30 11:50:25.164
cmr0l4psg0003l40441mfbft7	MATERIALS_ENGINEER	MATERIALS_ENGINEER	MATERIALS_ENGINEER	t	2026-06-30 11:50:25.169	2026-06-30 11:50:25.169
cmr0l4psk0004l404mlg07yvu	PAYROLL_MASTER	PAYROLL_MASTER	PAYROLL_MASTER	t	2026-06-30 11:50:25.173	2026-06-30 11:50:25.173
cmr0l4psp0005l404akqqsv3m	PAYROLL_OFFICER	PAYROLL_OFFICER	PAYROLL_OFFICER	t	2026-06-30 11:50:25.178	2026-06-30 11:50:25.178
cmr0l4psu0006l404ofccwo3t	PEE	PEE	PEE	t	2026-06-30 11:50:25.182	2026-06-30 11:50:25.182
cmr0l4psz0007l404ur088sb9	PME	PME	PME	t	2026-06-30 11:50:25.188	2026-06-30 11:50:25.188
cmr0l4pt40008l404z7qzls2p	PROCUREMENT_OFFICER	PROCUREMENT_OFFICER	PROCUREMENT_OFFICER	t	2026-06-30 11:50:25.192	2026-06-30 11:50:25.192
cmr0l4pta0009l4045z71qukp	PROJECT_ACCOUNTANT	PROJECT_ACCOUNTANT	PROJECT_ACCOUNTANT	t	2026-06-30 11:50:25.199	2026-06-30 11:50:25.199
cmr0l4ptf000al404ffsjb4k3	PROJECT_DIRECTOR	PROJECT_DIRECTOR	PROJECT_DIRECTOR	t	2026-06-30 11:50:25.204	2026-06-30 11:50:25.204
cmr0l4ptk000bl404bq9mqe72	PROJECT_ENGINEER	PROJECT_ENGINEER	PROJECT_ENGINEER	t	2026-06-30 11:50:25.208	2026-06-30 11:50:25.208
cmr0l4ptp000cl404zna2d18s	PROJECT_MANAGER	PROJECT_MANAGER	PROJECT_MANAGER	t	2026-06-30 11:50:25.213	2026-06-30 11:50:25.213
cmr0l4ptt000dl404pa0rcncm	PURCHASING_OFFICER	PURCHASING_OFFICER	PURCHASING_OFFICER	t	2026-06-30 11:50:25.218	2026-06-30 11:50:25.218
cmr0l4ptx000el404422dp48q	SITE_ADMIN	SITE_ADMIN	SITE_ADMIN	t	2026-06-30 11:50:25.222	2026-06-30 11:50:25.222
cmr0l4pu2000fl4040gj26edh	SITE_ENGINEER	SITE_ENGINEER	SITE_ENGINEER	t	2026-06-30 11:50:25.227	2026-06-30 11:50:25.227
cmr0l4pu6000gl4048tnnhana	STOCKMAN	STOCKMAN	STOCKMAN	t	2026-06-30 11:50:25.231	2026-06-30 11:50:25.231
cmr0l4puc000hl404mtgnuln5	SUPER_ADMIN	SUPER_ADMIN	SUPER_ADMIN	t	2026-06-30 11:50:25.236	2026-06-30 11:50:25.236
cmr0l4pug000il404qjy88zgu	WAREHOUSEMAN	WAREHOUSEMAN	WAREHOUSEMAN	t	2026-06-30 11:50:25.241	2026-06-30 11:50:25.241
\.


--
-- Data for Name: RoleConflictRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RoleConflictRule" (id, "role1Code", "role2Code", severity, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermission" (id, "roleId", "moduleId", "moduleName", "canView", "canCreate", "canEditDraft", "canSubmit", "canReview", "canRecommend", "canApprove", "canReject", "canReturnForCorrection", "canCancel", "canRevise", "canLock", "canUnlockWithAuthorization", "canReleasePayment", "canMarkAsPaid", "canUploadAttachment", "canDownloadAttachment", "canPrint", "canExport", "canDeleteDraft", "canVoidRecord", "canViewAuditLogs", "createdAt", "updatedAt") FROM stdin;
cmr1cma4x001gvchkw3zhhkwf	cmr0l4puc000hl404mtgnuln5	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:39:54.078	2026-07-01 00:39:54.078
cmr1cmb3d001ivchkc67vy1si	cmr0l4puc000hl404mtgnuln5	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:39:55.561	2026-07-01 00:39:55.561
cmr1cmc2d001kvchkn2hehmu2	cmr0l4puc000hl404mtgnuln5	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:39:56.821	2026-07-01 00:39:56.821
cmr1cmd0l001mvchkdxr9p5ea	cmr0l4puc000hl404mtgnuln5	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:39:58.053	2026-07-01 00:39:58.053
cmr1cmdzj001ovchkit1v2v5a	cmr0l4puc000hl404mtgnuln5	cmr1clfsm000zvchku418mv7u	INVENTORY	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:39:59.312	2026-07-01 00:39:59.312
cmr1cmexz001qvchky7k0a6i0	cmr0l4puc000hl404mtgnuln5	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:00.552	2026-07-01 00:40:00.552
cmr1cmfvz001svchkezsp07j8	cmr0l4puc000hl404mtgnuln5	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:01.775	2026-07-01 00:40:01.775
cmr1cmgv2001uvchk91z2daoq	cmr0l4puc000hl404mtgnuln5	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:03.038	2026-07-01 00:40:03.038
cmr1cmht7001wvchktm82cww1	cmr0l4puc000hl404mtgnuln5	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:04.267	2026-07-01 00:40:04.267
cmr1cmirq001yvchkw2fjln7z	cmr0l4puc000hl404mtgnuln5	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:05.511	2026-07-01 00:40:05.511
cmr1cmjqb0020vchkpfvzo7b3	cmr0l4puc000hl404mtgnuln5	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:06.755	2026-07-01 00:40:06.755
cmr1cmkp60022vchkfn5tn4j5	cmr0l4puc000hl404mtgnuln5	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:08.01	2026-07-01 00:40:08.01
cmr1cmlnm0024vchk1huzu2k1	cmr0l4puc000hl404mtgnuln5	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:09.25	2026-07-01 00:40:09.25
cmr1cmmsa0026vchk47bhcahz	cmr0l4puc000hl404mtgnuln5	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:10.476	2026-07-01 00:40:10.476
cmr1cmnqo0028vchkk86h2u5s	cmr0l4puc000hl404mtgnuln5	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:11.953	2026-07-01 00:40:11.953
cmr1cmoqi002avchkltsr47v3	cmr0l4puc000hl404mtgnuln5	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:13.243	2026-07-01 00:40:13.243
cmr1cmprg002cvchk8vce8uuw	cmr0l4puc000hl404mtgnuln5	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:14.572	2026-07-01 00:40:14.572
cmr1cmqqm002evchk0g2ef5in	cmr0l4puc000hl404mtgnuln5	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:15.838	2026-07-01 00:40:15.838
cmr1cmrpn002gvchkjcu0be8z	cmr0l4puc000hl404mtgnuln5	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:17.099	2026-07-01 00:40:17.099
cmr1cmsoj002ivchkussil5on	cmr0l4puc000hl404mtgnuln5	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	2026-07-01 00:40:18.355	2026-07-01 00:40:18.355
cmr1cmtny002kvchkkcekykwn	cmr0l4ptf000al404ffsjb4k3	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:19.631	2026-07-01 00:40:19.631
cmr1cmumi002mvchk2lmw2tdx	cmr0l4ptf000al404ffsjb4k3	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:20.874	2026-07-01 00:40:20.874
cmr1cmvyx002ovchkyd5fb029	cmr0l4ptf000al404ffsjb4k3	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:22.618	2026-07-01 00:40:22.618
cmr1cmwxi002qvchkc85otl6n	cmr0l4ptf000al404ffsjb4k3	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:23.862	2026-07-01 00:40:23.862
cmr1cmxwq002svchkcxsgabfg	cmr0l4ptf000al404ffsjb4k3	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:25.131	2026-07-01 00:40:25.131
cmr1cmzg3002uvchk36oqkwpm	cmr0l4ptf000al404ffsjb4k3	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:26.878	2026-07-01 00:40:26.878
cmr1cn0g0002wvchkbvxyjeg7	cmr0l4ptf000al404ffsjb4k3	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:28.416	2026-07-01 00:40:28.416
cmr1cn1eb002yvchkvzgqdshp	cmr0l4ptf000al404ffsjb4k3	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:29.651	2026-07-01 00:40:29.651
cmr1cn2cs0030vchk54385vf8	cmr0l4ptf000al404ffsjb4k3	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:30.892	2026-07-01 00:40:30.892
cmr1cn3az0032vchkq9f3niyl	cmr0l4ptf000al404ffsjb4k3	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:32.123	2026-07-01 00:40:32.123
cmr1cn4970034vchk3oc7w1x7	cmr0l4ptf000al404ffsjb4k3	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:33.355	2026-07-01 00:40:33.355
cmr1cn5730036vchklswemg2p	cmr0l4ptf000al404ffsjb4k3	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:34.576	2026-07-01 00:40:34.576
cmr1cn65s0038vchkslw9fz8u	cmr0l4ptf000al404ffsjb4k3	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:35.825	2026-07-01 00:40:35.825
cmr1cn74s003avchk8adbiad1	cmr0l4ptf000al404ffsjb4k3	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:37.085	2026-07-01 00:40:37.085
cmr1cn82v003cvchk6elyvgsl	cmr0l4ptf000al404ffsjb4k3	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:38.311	2026-07-01 00:40:38.311
cmr1cn90b003evchkh1eajsdt	cmr0l4ptf000al404ffsjb4k3	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:39.515	2026-07-01 00:40:39.515
cmr1cn9zo003gvchkwix44rs9	cmr0l4ptf000al404ffsjb4k3	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:40.788	2026-07-01 00:40:40.788
cmr1cnaxn003ivchk37c7y6lo	cmr0l4ptf000al404ffsjb4k3	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:42.011	2026-07-01 00:40:42.011
cmr1cnc36003kvchkevytx5pp	cmr0l4ptf000al404ffsjb4k3	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:43.228	2026-07-01 00:40:43.228
cmr1cnd1r003mvchkshetr2pt	cmr0l4ptf000al404ffsjb4k3	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	t	2026-07-01 00:40:44.752	2026-07-01 00:40:44.752
cmr1cndzn003ovchk957g4l2z	cmr0l4afl00pivcd47ytdlmsa	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:45.971	2026-07-01 00:40:45.971
cmr1cneyc003qvchkulvcbso6	cmr0l4afl00pivcd47ytdlmsa	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:47.22	2026-07-01 00:40:47.22
cmr1cnfwj003svchky7cd6zvi	cmr0l4afl00pivcd47ytdlmsa	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:48.451	2026-07-01 00:40:48.451
cmr1cngv3003uvchkiusy91z3	cmr0l4afl00pivcd47ytdlmsa	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:49.695	2026-07-01 00:40:49.695
cmr1cnhsv003wvchkwx1a3mbe	cmr0l4afl00pivcd47ytdlmsa	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:50.912	2026-07-01 00:40:50.912
cmr1cnirb003yvchk4bximkv6	cmr0l4afl00pivcd47ytdlmsa	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:52.152	2026-07-01 00:40:52.152
cmr1cnjpr0040vchk272knjq9	cmr0l4afl00pivcd47ytdlmsa	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:53.392	2026-07-01 00:40:53.392
cmr1cnko30042vchko0gtvngc	cmr0l4afl00pivcd47ytdlmsa	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:54.627	2026-07-01 00:40:54.627
cmr1cnlmr0044vchkf0iajvte	cmr0l4afl00pivcd47ytdlmsa	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:55.875	2026-07-01 00:40:55.875
cmr1cnmle0046vchkrtbvtmu7	cmr0l4afl00pivcd47ytdlmsa	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:57.122	2026-07-01 00:40:57.122
cmr1cno3b0048vchkb0q32d6o	cmr0l4afl00pivcd47ytdlmsa	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:40:58.812	2026-07-01 00:40:58.812
cmr1cnp1s004avchkwlws24w7	cmr0l4afl00pivcd47ytdlmsa	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:00.304	2026-07-01 00:41:00.304
cmr1cnq00004cvchk5t56dh0a	cmr0l4afl00pivcd47ytdlmsa	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:01.536	2026-07-01 00:41:01.536
cmr1cnqyk004evchkpeiq9ynh	cmr0l4afl00pivcd47ytdlmsa	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:02.78	2026-07-01 00:41:02.78
cmr1cnrx0004gvchk6qtqwukb	cmr0l4afl00pivcd47ytdlmsa	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:04.02	2026-07-01 00:41:04.02
cmr1cnsvg004ivchk0mgto1e2	cmr0l4afl00pivcd47ytdlmsa	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:05.26	2026-07-01 00:41:05.26
cmr1cntub004kvchkeugs7wnd	cmr0l4afl00pivcd47ytdlmsa	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:06.515	2026-07-01 00:41:06.515
cmr1cnusk004mvchk1g7w4jwv	cmr0l4afl00pivcd47ytdlmsa	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:07.748	2026-07-01 00:41:07.748
cmr1cnvqs004ovchkne4dvrgb	cmr0l4afl00pivcd47ytdlmsa	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:08.98	2026-07-01 00:41:08.98
cmr1cnwpn004qvchk6hz207qe	cmr0l4afl00pivcd47ytdlmsa	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	t	t	t	t	t	f	f	t	t	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:10.235	2026-07-01 00:41:10.235
cmr1cnxo4004svchk1l9xxbly	cmr0l3zzg00pcvcd4iq9tafen	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:11.476	2026-07-01 00:41:11.476
cmr1cnymg004uvchkjhfrgm82	cmr0l3zzg00pcvcd4iq9tafen	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:12.712	2026-07-01 00:41:12.712
cmr1cnzmg004wvchkrhgpnt9o	cmr0l3zzg00pcvcd4iq9tafen	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:14.008	2026-07-01 00:41:14.008
cmr1co0s7004yvchkfazfrsta	cmr0l3zzg00pcvcd4iq9tafen	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:15.26	2026-07-01 00:41:15.26
cmr1co1r70050vchk37o5cgx5	cmr0l3zzg00pcvcd4iq9tafen	cmr1clfsm000zvchku418mv7u	INVENTORY	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:16.772	2026-07-01 00:41:16.772
cmr1co2oz0052vchk22xbecbj	cmr0l3zzg00pcvcd4iq9tafen	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:17.988	2026-07-01 00:41:17.988
cmr1co3nc0054vchkkkdhoprf	cmr0l3zzg00pcvcd4iq9tafen	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:19.224	2026-07-01 00:41:19.224
cmr1co4m30056vchkl4txwfvh	cmr0l3zzg00pcvcd4iq9tafen	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:20.476	2026-07-01 00:41:20.476
cmr1co5ka0058vchkbtloc26a	cmr0l3zzg00pcvcd4iq9tafen	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:21.706	2026-07-01 00:41:21.706
cmr1co6jb005avchkjk40o3ac	cmr0l3zzg00pcvcd4iq9tafen	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:22.967	2026-07-01 00:41:22.967
cmr1co7hx005cvchkd9hb238e	cmr0l3zzg00pcvcd4iq9tafen	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:24.213	2026-07-01 00:41:24.213
cmr1co8gg005evchkx9adn263	cmr0l3zzg00pcvcd4iq9tafen	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:25.456	2026-07-01 00:41:25.456
cmr1co9f9005gvchkll8nqbfe	cmr0l3zzg00pcvcd4iq9tafen	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:26.71	2026-07-01 00:41:26.71
cmr1coars005ivchk6hgxpvq2	cmr0l3zzg00pcvcd4iq9tafen	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:28.456	2026-07-01 00:41:28.456
cmr1cobq4005kvchk2dzztba8	cmr0l3zzg00pcvcd4iq9tafen	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:29.692	2026-07-01 00:41:29.692
cmr1cocv7005mvchktb6srqed	cmr0l3zzg00pcvcd4iq9tafen	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:30.922	2026-07-01 00:41:30.922
cmr1codt4005ovchkrii825yw	cmr0l3zzg00pcvcd4iq9tafen	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:32.392	2026-07-01 00:41:32.392
cmr1coerg005qvchk6frl1p13	cmr0l3zzg00pcvcd4iq9tafen	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:33.629	2026-07-01 00:41:33.629
cmr1cofq3005svchk7kfd9n49	cmr0l3zzg00pcvcd4iq9tafen	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:34.875	2026-07-01 00:41:34.875
cmr1cogov005uvchkkt7i5ll8	cmr0l3zzg00pcvcd4iq9tafen	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:36.127	2026-07-01 00:41:36.127
cmr1coho3005wvchkt03l5ppe	cmr0l4ptp000cl404zna2d18s	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:37.395	2026-07-01 00:41:37.395
cmr1coimj005yvchkf6m0wd8g	cmr0l4ptp000cl404zna2d18s	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:38.636	2026-07-01 00:41:38.636
cmr1cojln0060vchk52c4bovs	cmr0l4ptp000cl404zna2d18s	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:39.899	2026-07-01 00:41:39.899
cmr1cokjr0062vchkxvz3x3g3	cmr0l4ptp000cl404zna2d18s	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:41.127	2026-07-01 00:41:41.127
cmr1coli00064vchk8xpttktq	cmr0l4ptp000cl404zna2d18s	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:42.36	2026-07-01 00:41:42.36
cmr1comip0066vchkxnhxst0f	cmr0l4ptp000cl404zna2d18s	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:43.681	2026-07-01 00:41:43.681
cmr1conh40068vchkbp5sg0j1	cmr0l4ptp000cl404zna2d18s	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:44.921	2026-07-01 00:41:44.921
cmr1coof2006avchkfcpf10bn	cmr0l4ptp000cl404zna2d18s	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:46.143	2026-07-01 00:41:46.143
cmr1copjx006cvchkmo6la4xd	cmr0l4ptp000cl404zna2d18s	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:41:47.374	2026-07-01 00:41:47.374
cmr1coqif006evchkpmnoo8r7	cmr0l4ptp000cl404zna2d18s	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:48.855	2026-07-01 00:41:48.855
cmr1coria006gvchkw2xh3pq6	cmr0l4ptp000cl404zna2d18s	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:50.146	2026-07-01 00:41:50.146
cmr1cosgi006ivchk0b1ycnbx	cmr0l4ptp000cl404zna2d18s	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:51.379	2026-07-01 00:41:51.379
cmr1cots4006kvchkinuduytn	cmr0l4ptp000cl404zna2d18s	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:53.092	2026-07-01 00:41:53.092
cmr1couzm006mvchkgzgwfxhg	cmr0l4ptp000cl404zna2d18s	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:54.659	2026-07-01 00:41:54.659
cmr1covy5006ovchk66my68s3	cmr0l4ptp000cl404zna2d18s	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:55.901	2026-07-01 00:41:55.901
cmr1cowwp006qvchkm6a42839	cmr0l4ptp000cl404zna2d18s	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:57.146	2026-07-01 00:41:57.146
cmr1coxwf006svchkfuuky2y7	cmr0l4ptp000cl404zna2d18s	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:58.432	2026-07-01 00:41:58.432
cmr1coyua006uvchkp6fi1pdj	cmr0l4ptp000cl404zna2d18s	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:41:59.65	2026-07-01 00:41:59.65
cmr1cp0rg006wvchk5pce7pp8	cmr0l4ptp000cl404zna2d18s	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:02.14	2026-07-01 00:42:02.14
cmr1cp1wm006yvchk801673dp	cmr0l4ptp000cl404zna2d18s	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:03.38	2026-07-01 00:42:03.38
cmr1cp3en0070vchkgalzji8s	cmr0l4ptk000bl404bq9mqe72	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:05.568	2026-07-01 00:42:05.568
cmr1cp4el0072vchk8zw7tz01	cmr0l4ptk000bl404bq9mqe72	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:06.861	2026-07-01 00:42:06.861
cmr1cp5d30074vchke89z5v46	cmr0l4ptk000bl404bq9mqe72	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:08.104	2026-07-01 00:42:08.104
cmr1cp6cb0076vchkyi2yhbhm	cmr0l4ptk000bl404bq9mqe72	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:09.371	2026-07-01 00:42:09.371
cmr1cp7b30078vchklkxql3ym	cmr0l4ptk000bl404bq9mqe72	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:10.623	2026-07-01 00:42:10.623
cmr1cp8lr007avchkle87oi90	cmr0l4ptk000bl404bq9mqe72	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:12.303	2026-07-01 00:42:12.303
cmr1cp9kj007cvchk4355rw6b	cmr0l4ptk000bl404bq9mqe72	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:13.555	2026-07-01 00:42:13.555
cmr1cpbx0007evchk4swvfvx3	cmr0l4ptk000bl404bq9mqe72	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:14.777	2026-07-01 00:42:14.777
cmr1cpcwr007gvchkawiacd4u	cmr0l4ptk000bl404bq9mqe72	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:17.883	2026-07-01 00:42:17.883
cmr1cpdvk007ivchkl01hgmjt	cmr0l4ptk000bl404bq9mqe72	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:19.136	2026-07-01 00:42:19.136
cmr1cpeus007kvchkxf1dca2n	cmr0l4ptk000bl404bq9mqe72	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:20.404	2026-07-01 00:42:20.404
cmr1cpfu0007mvchkfnostqxl	cmr0l4ptk000bl404bq9mqe72	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:21.672	2026-07-01 00:42:21.672
cmr1cpgt5007ovchkiv0kjjko	cmr0l4ptk000bl404bq9mqe72	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:22.938	2026-07-01 00:42:22.938
cmr1cphsk007qvchkylje7nd3	cmr0l4ptk000bl404bq9mqe72	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:24.213	2026-07-01 00:42:24.213
cmr1cpir3007svchkmebyng5u	cmr0l4ptk000bl404bq9mqe72	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:25.455	2026-07-01 00:42:25.455
cmr1cpjpc007uvchkwtupo52s	cmr0l4ptk000bl404bq9mqe72	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:26.689	2026-07-01 00:42:26.689
cmr1cpknw007wvchksq4b3u4r	cmr0l4ptk000bl404bq9mqe72	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:27.933	2026-07-01 00:42:27.933
cmr1cplr7007yvchk3o93btbx	cmr0l4ptk000bl404bq9mqe72	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:29.347	2026-07-01 00:42:29.347
cmr1cpmro0080vchk60i95bo6	cmr0l4ptk000bl404bq9mqe72	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:30.661	2026-07-01 00:42:30.661
cmr1cpnyg0082vchkwcfvj8ak	cmr0l4ptk000bl404bq9mqe72	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:31.951	2026-07-01 00:42:31.951
cmr1cppkn0084vchkhcbl337q	cmr0l4psz0007l404ur088sb9	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:34.296	2026-07-01 00:42:34.296
cmr1cpqnw0086vchk7nip43eo	cmr0l4psz0007l404ur088sb9	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:35.708	2026-07-01 00:42:35.708
cmr1cproi0088vchk9smtw2t9	cmr0l4psz0007l404ur088sb9	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:37.026	2026-07-01 00:42:37.026
cmr1cpsp1008avchku8q9tp53	cmr0l4psz0007l404ur088sb9	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:38.342	2026-07-01 00:42:38.342
cmr1cpuc3008cvchk4zlro0hi	cmr0l4psz0007l404ur088sb9	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:40.468	2026-07-01 00:42:40.468
cmr1cpvdu008evchkvhrhd0r3	cmr0l4psz0007l404ur088sb9	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:41.827	2026-07-01 00:42:41.827
cmr1cpwfw008gvchknr7v6m8b	cmr0l4psz0007l404ur088sb9	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:43.197	2026-07-01 00:42:43.197
cmr1cpxed008ivchk28gaccwe	cmr0l4psz0007l404ur088sb9	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:44.438	2026-07-01 00:42:44.438
cmr1cpyd5008kvchkhiqgsks5	cmr0l4psz0007l404ur088sb9	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:42:45.689	2026-07-01 00:42:45.689
cmr1cpzax008mvchk24qbjdf6	cmr0l4psz0007l404ur088sb9	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:46.905	2026-07-01 00:42:46.905
cmr1cq0gp008ovchkhiwrhgo2	cmr0l4psz0007l404ur088sb9	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:48.17	2026-07-01 00:42:48.17
cmr1cq1fk008qvchkgnrbbvdr	cmr0l4psz0007l404ur088sb9	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:49.665	2026-07-01 00:42:49.665
cmr1cq2e4008svchk769iapq6	cmr0l4psz0007l404ur088sb9	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:50.908	2026-07-01 00:42:50.908
cmr1cq3dg008uvchkmgu8ky2d	cmr0l4psz0007l404ur088sb9	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:52.18	2026-07-01 00:42:52.18
cmr1cq4cc008wvchkpgnwrkrd	cmr0l4psz0007l404ur088sb9	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:53.436	2026-07-01 00:42:53.436
cmr1cq5av008yvchkj41xte1o	cmr0l4psz0007l404ur088sb9	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:54.679	2026-07-01 00:42:54.679
cmr1cq6jz0090vchka36bozwq	cmr0l4psz0007l404ur088sb9	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:56.303	2026-07-01 00:42:56.303
cmr1cq7i90092vchkxad2dyga	cmr0l4psz0007l404ur088sb9	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:57.537	2026-07-01 00:42:57.537
cmr1cq8h50094vchk2mcftb49	cmr0l4psz0007l404ur088sb9	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:42:58.793	2026-07-01 00:42:58.793
cmr1cq9fv0096vchkafjp0wvz	cmr0l4psz0007l404ur088sb9	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:00.044	2026-07-01 00:43:00.044
cmr1cqaea0098vchke7se2z85	cmr0l4psu0006l404ofccwo3t	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:01.282	2026-07-01 00:43:01.282
cmr1cqbd4009avchkqq7pcsgk	cmr0l4psu0006l404ofccwo3t	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:02.537	2026-07-01 00:43:02.537
cmr1cqci4009cvchkmnof8cox	cmr0l4psu0006l404ofccwo3t	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:03.773	2026-07-01 00:43:03.773
cmr1cqdhd009evchkk01pweds	cmr0l4psu0006l404ofccwo3t	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:05.281	2026-07-01 00:43:05.281
cmr1cqef9009gvchklhwm72zq	cmr0l4psu0006l404ofccwo3t	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:06.501	2026-07-01 00:43:06.501
cmr1cqfen009ivchk6bamd6as	cmr0l4psu0006l404ofccwo3t	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:07.776	2026-07-01 00:43:07.776
cmr1cqgel009kvchkv0iqg3k1	cmr0l4psu0006l404ofccwo3t	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:09.07	2026-07-01 00:43:09.07
cmr1cqhdc009mvchkb13za4lx	cmr0l4psu0006l404ofccwo3t	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:10.32	2026-07-01 00:43:10.32
cmr1cqico009ovchk0t2y4cmq	cmr0l4psu0006l404ofccwo3t	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:11.593	2026-07-01 00:43:11.593
cmr1cqjb4009qvchkrh4euw8k	cmr0l4psu0006l404ofccwo3t	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:12.833	2026-07-01 00:43:12.833
cmr1cqk9i009svchk28u3zv01	cmr0l4psu0006l404ofccwo3t	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:14.07	2026-07-01 00:43:14.07
cmr1cql7i009uvchk0immlaca	cmr0l4psu0006l404ofccwo3t	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:15.295	2026-07-01 00:43:15.295
cmr1cqm78009wvchkht9fjc44	cmr0l4psu0006l404ofccwo3t	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:16.58	2026-07-01 00:43:16.58
cmr1cqn6t009yvchkphh7iiaj	cmr0l4psu0006l404ofccwo3t	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:17.861	2026-07-01 00:43:17.861
cmr1cqon100a0vchkpkcfgpf2	cmr0l4psu0006l404ofccwo3t	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:19.486	2026-07-01 00:43:19.486
cmr1cqpm200a2vchkg5oa9ety	cmr0l4psu0006l404ofccwo3t	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:21.002	2026-07-01 00:43:21.002
cmr1cqqkf00a4vchkwjjo3hb1	cmr0l4psu0006l404ofccwo3t	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:22.239	2026-07-01 00:43:22.239
cmr1cqrjp00a6vchk0girsof2	cmr0l4psu0006l404ofccwo3t	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:23.509	2026-07-01 00:43:23.509
cmr1cqsj900a8vchknfjkmuca	cmr0l4psu0006l404ofccwo3t	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:24.789	2026-07-01 00:43:24.789
cmr1cqtje00aavchkxgdvqr2n	cmr0l4psu0006l404ofccwo3t	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:26.09	2026-07-01 00:43:26.09
cmr1cqui800acvchka93djyfc	cmr0l4ptx000el404422dp48q	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:27.344	2026-07-01 00:43:27.344
cmr1cqvgc00aevchko7vvc8g2	cmr0l4ptx000el404422dp48q	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:28.573	2026-07-01 00:43:28.573
cmr1cqweh00agvchkeua9dlz8	cmr0l4ptx000el404422dp48q	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:29.801	2026-07-01 00:43:29.801
cmr1cqxd800aivchk8jg95sfy	cmr0l4ptx000el404422dp48q	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:31.052	2026-07-01 00:43:31.052
cmr1cqyb400akvchkw7bfd4ir	cmr0l4ptx000el404422dp48q	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:32.273	2026-07-01 00:43:32.273
cmr1cqz9l00amvchk5584tsmo	cmr0l4ptx000el404422dp48q	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:33.514	2026-07-01 00:43:33.514
cmr1cr0eg00aovchkvp8e3wav	cmr0l4ptx000el404422dp48q	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:34.741	2026-07-01 00:43:34.741
cmr1cr1cx00aqvchkb4oyv5qs	cmr0l4ptx000el404422dp48q	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:36.225	2026-07-01 00:43:36.225
cmr1cr2at00asvchkqy11p2yp	cmr0l4ptx000el404422dp48q	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:37.445	2026-07-01 00:43:37.445
cmr1cr39a00auvchkzb1lvkf8	cmr0l4ptx000el404422dp48q	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:38.687	2026-07-01 00:43:38.687
cmr1cr47s00awvchkmu314bu2	cmr0l4ptx000el404422dp48q	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:39.929	2026-07-01 00:43:39.929
cmr1cr55r00ayvchkio5l3gkj	cmr0l4ptx000el404422dp48q	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:41.151	2026-07-01 00:43:41.151
cmr1cr64c00b0vchk5smvvp1g	cmr0l4ptx000el404422dp48q	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:42.397	2026-07-01 00:43:42.397
cmr1cr75h00b2vchkmywhrj9t	cmr0l4ptx000el404422dp48q	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:43.733	2026-07-01 00:43:43.733
cmr1cr84700b4vchkwgusa0yg	cmr0l4ptx000el404422dp48q	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:44.983	2026-07-01 00:43:44.983
cmr1cr93500b6vchk8c346bs9	cmr0l4ptx000el404422dp48q	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:46.241	2026-07-01 00:43:46.241
cmr1cra1l00b8vchk7k50c2dw	cmr0l4ptx000el404422dp48q	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:47.482	2026-07-01 00:43:47.482
cmr1crb0t00bavchkdadt4pof	cmr0l4ptx000el404422dp48q	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:48.749	2026-07-01 00:43:48.749
cmr1crbyx00bcvchkehyv7vwe	cmr0l4ptx000el404422dp48q	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:49.978	2026-07-01 00:43:49.978
cmr1crd4000bevchkd1gdlryl	cmr0l4ptx000el404422dp48q	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:43:51.213	2026-07-01 00:43:51.213
cmr1cre2500bgvchkhaibk3s0	cmr0l4pu2000fl4040gj26edh	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:52.685	2026-07-01 00:43:52.685
cmr1crf0t00bivchk50vftr67	cmr0l4pu2000fl4040gj26edh	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:53.934	2026-07-01 00:43:53.934
cmr1crfzg00bkvchk8ox4ftz6	cmr0l4pu2000fl4040gj26edh	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:55.181	2026-07-01 00:43:55.181
cmr1crgy200bmvchkkqz73lcd	cmr0l4pu2000fl4040gj26edh	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:56.426	2026-07-01 00:43:56.426
cmr1crhw500bovchkzfums6xs	cmr0l4pu2000fl4040gj26edh	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:57.653	2026-07-01 00:43:57.653
cmr1criwc00bqvchk8ij8mj46	cmr0l4pu2000fl4040gj26edh	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:43:58.956	2026-07-01 00:43:58.956
cmr1crkdp00bsvchkfakekv05	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:00.877	2026-07-01 00:44:00.877
cmr1crlbw00buvchk5rvfpku8	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:02.108	2026-07-01 00:44:02.108
cmr1crma800bwvchk4rov7a4z	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:03.345	2026-07-01 00:44:03.345
cmr1crn8d00byvchkjiktife0	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:04.573	2026-07-01 00:44:04.573
cmr1cro6d00c0vchkdyxgyz4o	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:05.798	2026-07-01 00:44:05.798
cmr1crpbc00c2vchkhe6vvet1	cmr0l4j6i00pmvcd4gf4yrpb7	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:07.034	2026-07-01 00:44:07.034
cmr1crq9o00c4vchk5398quu4	cmr0l44cl00pfvcd4rffz3w4y	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:08.509	2026-07-01 00:44:08.509
cmr1crr8000c6vchkvke32vhg	cmr0l44cl00pfvcd4rffz3w4y	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:09.745	2026-07-01 00:44:09.745
cmr1crs6000c8vchkohaz2qlk	cmr0l44cl00pfvcd4rffz3w4y	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:10.968	2026-07-01 00:44:10.968
cmr1crt4900cavchkkopt0ku2	cmr0l44cl00pfvcd4rffz3w4y	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:12.201	2026-07-01 00:44:12.201
cmr1cru3t00ccvchkyvuwk1vs	cmr0l44cl00pfvcd4rffz3w4y	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:13.481	2026-07-01 00:44:13.481
cmr1crv2h00cevchkh4fsb82f	cmr0l44cl00pfvcd4rffz3w4y	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:14.73	2026-07-01 00:44:14.73
cmr1crw9s00cgvchkyad2lx22	cmr0l4psg0003l40441mfbft7	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:16.289	2026-07-01 00:44:16.289
cmr1crx7x00civchk137j30to	cmr0l4psg0003l40441mfbft7	cmr1clfsm000zvchku418mv7u	INVENTORY	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:17.518	2026-07-01 00:44:17.518
cmr1cry6s00ckvchkidmm2fm3	cmr0l4psg0003l40441mfbft7	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:18.773	2026-07-01 00:44:18.773
cmr1crz4w00cmvchktem7at9t	cmr0l4psg0003l40441mfbft7	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:20.001	2026-07-01 00:44:20.001
cmr1cs03l00covchk3gbtsod3	cmr0l4psg0003l40441mfbft7	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:21.25	2026-07-01 00:44:21.25
cmr1cs18l00cqvchk3cc90yil	cmr0l4psg0003l40441mfbft7	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:22.485	2026-07-01 00:44:22.485
cmr1cs27r00csvchkvigbu8d9	cmr0l4psg0003l40441mfbft7	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:23.991	2026-07-01 00:44:23.991
cmr1cs36u00cuvchk499gytzz	cmr0l4psg0003l40441mfbft7	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:25.254	2026-07-01 00:44:25.254
cmr1cs4ld00cwvchk2f7twobx	cmr0l4psg0003l40441mfbft7	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:27.074	2026-07-01 00:44:27.074
cmr1cs5jw00cyvchk1iwgwx3n	cmr0l4psg0003l40441mfbft7	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:28.316	2026-07-01 00:44:28.316
cmr1cs6ih00d0vchk96mhvibf	cmr0l4ptt000dl404pa0rcncm	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:29.561	2026-07-01 00:44:29.561
cmr1cs7h000d2vchk2mlwrlgt	cmr0l4ptt000dl404pa0rcncm	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:30.804	2026-07-01 00:44:30.804
cmr1cs8fd00d4vchkzhqwxxdn	cmr0l4ptt000dl404pa0rcncm	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:32.041	2026-07-01 00:44:32.041
cmr1cs9d800d6vchkkgcjulnu	cmr0l4ptt000dl404pa0rcncm	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:33.261	2026-07-01 00:44:33.261
cmr1csab500d8vchkqccuwat7	cmr0l4ptt000dl404pa0rcncm	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:34.481	2026-07-01 00:44:34.481
cmr1csb9d00davchkmmvzepn6	cmr0l4ptt000dl404pa0rcncm	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:35.713	2026-07-01 00:44:35.713
cmr1csc7g00dcvchkfpr8tvc5	cmr0l4ptt000dl404pa0rcncm	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:36.941	2026-07-01 00:44:36.941
cmr1csdd400devchkdc22agj2	cmr0l4ptt000dl404pa0rcncm	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:38.194	2026-07-01 00:44:38.194
cmr1csh8u00dmvchkzamd2sz6	cmr0l4pt40008l404z7qzls2p	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:43.47	2026-07-01 00:44:43.47
cmr1csicy00dovchkhcst3gk3	cmr0l4pt40008l404z7qzls2p	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:44.915	2026-07-01 00:44:44.915
cmr1csjdq00dqvchkyg2warhi	cmr0l4pt40008l404z7qzls2p	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:46.238	2026-07-01 00:44:46.238
cmr1cskco00dsvchk5sm8qs0s	cmr0l4pt40008l404z7qzls2p	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:47.497	2026-07-01 00:44:47.497
cmr1csld600duvchkk46q9iqx	cmr0l4pt40008l404z7qzls2p	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:48.811	2026-07-01 00:44:48.811
cmr1csmcm00dwvchkijsodkan	cmr0l4gvy00plvcd4e88g3jso	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	t	t	t	t	t	t	f	f	f	2026-07-01 00:44:50.086	2026-07-01 00:44:50.086
cmr1csncr00dyvchkncumpjcd	cmr0l4gvy00plvcd4e88g3jso	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	t	t	t	t	t	t	t	t	f	f	f	f	t	t	t	t	t	t	f	f	f	2026-07-01 00:44:51.387	2026-07-01 00:44:51.387
cmr1csod200e0vchkatg1ld46	cmr0l4gvy00plvcd4e88g3jso	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	t	t	t	t	t	t	f	f	f	2026-07-01 00:44:52.694	2026-07-01 00:44:52.694
cmr1cspk900e2vchkdnvyid5a	cmr0l4gvy00plvcd4e88g3jso	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	t	t	t	t	t	t	t	t	f	f	f	f	t	t	t	t	t	t	f	f	f	2026-07-01 00:44:53.994	2026-07-01 00:44:53.994
cmr1csqkn00e4vchk3s24zbc8	cmr0l4gvy00plvcd4e88g3jso	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	t	t	t	t	t	f	f	f	f	t	t	t	t	t	t	f	f	f	2026-07-01 00:44:55.56	2026-07-01 00:44:55.56
cmr1csrkc00e6vchkky74f0kl	cmr0l4gvy00plvcd4e88g3jso	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:56.844	2026-07-01 00:44:56.844
cmr1csslx00e8vchk58jlyyhr	cmr0l4gvy00plvcd4e88g3jso	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:58.197	2026-07-01 00:44:58.197
cmr1csty500eavchkh3jm08p6	cmr0l4gvy00plvcd4e88g3jso	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:44:59.934	2026-07-01 00:44:59.934
cmr1csuwx00ecvchk1bmdx61n	cmr0l4gvy00plvcd4e88g3jso	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:01.185	2026-07-01 00:45:01.185
cmr1csvvm00eevchk490yjmwb	cmr0l4gvy00plvcd4e88g3jso	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:02.434	2026-07-01 00:45:02.434
cmr1csebj00dgvchk9ymycwkr	cmr0l4pt40008l404z7qzls2p	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:39.68	2026-07-01 00:44:39.68
cmr1csf9l00divchkgxummj0h	cmr0l4pt40008l404z7qzls2p	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:40.905	2026-07-01 00:44:40.905
cmr1csg7t00dkvchkvim7i5k6	cmr0l4pt40008l404z7qzls2p	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:44:42.138	2026-07-01 00:44:42.138
cmr1cswui00egvchks7oc7sig	cmr0l4gvy00plvcd4e88g3jso	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:03.69	2026-07-01 00:45:03.69
cmr1csxt100eivchkag4ioxiu	cmr0l4gvy00plvcd4e88g3jso	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:04.934	2026-07-01 00:45:04.934
cmr1csys500ekvchkeoblblrx	cmr0l4gvy00plvcd4e88g3jso	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:06.197	2026-07-01 00:45:06.197
cmr1cszqp00emvchkrdn8drdy	cmr0l4gvy00plvcd4e88g3jso	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:07.441	2026-07-01 00:45:07.441
cmr1ct0p900eovchk6mwk8d4o	cmr0l4gvy00plvcd4e88g3jso	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:08.686	2026-07-01 00:45:08.686
cmr1ct1ux00eqvchk5jjgtkgn	cmr0l4gvy00plvcd4e88g3jso	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:09.938	2026-07-01 00:45:09.938
cmr1ct2ts00esvchks9phcy96	cmr0l4gvy00plvcd4e88g3jso	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:11.441	2026-07-01 00:45:11.441
cmr1ct3t100euvchkk3rzzvfx	cmr0l4gvy00plvcd4e88g3jso	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:12.709	2026-07-01 00:45:12.709
cmr1ct4rb00ewvchkk8u1j83p	cmr0l4gvy00plvcd4e88g3jso	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:13.944	2026-07-01 00:45:13.944
cmr1ct5q300eyvchkwaykmyci	cmr0l4gvy00plvcd4e88g3jso	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:15.196	2026-07-01 00:45:15.196
cmr1ct6o600f0vchk1rezwh2k	cmr0l4pta0009l4045z71qukp	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:16.422	2026-07-01 00:45:16.422
cmr1ct7mp00f2vchk5y9hm9bj	cmr0l4pta0009l4045z71qukp	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:17.666	2026-07-01 00:45:17.666
cmr1ct8l200f4vchkb48s3exz	cmr0l4pta0009l4045z71qukp	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:18.903	2026-07-01 00:45:18.903
cmr1ct9jp00f6vchky53oxb6g	cmr0l4pta0009l4045z71qukp	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:20.149	2026-07-01 00:45:20.149
cmr1ctahl00f8vchkmmonmkh0	cmr0l4pta0009l4045z71qukp	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:21.37	2026-07-01 00:45:21.37
cmr1ctbgo00favchk9gr238ey	cmr0l4pta0009l4045z71qukp	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:22.633	2026-07-01 00:45:22.633
cmr1ctcfy00fcvchkvaqbev1e	cmr0l4pta0009l4045z71qukp	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:23.902	2026-07-01 00:45:23.902
cmr1ctddg00fevchk87xaelke	cmr0l4pta0009l4045z71qukp	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:25.108	2026-07-01 00:45:25.108
cmr1cteik00fgvchkoaljtw7z	cmr0l4pta0009l4045z71qukp	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:26.333	2026-07-01 00:45:26.333
cmr1ctfgs00fivchky2xma6nf	cmr0l4pta0009l4045z71qukp	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:27.82	2026-07-01 00:45:27.82
cmr1ctgru00fkvchk5io5ni7s	cmr0l3xul00pbvcd46atnnarx	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:29.514	2026-07-01 00:45:29.514
cmr1cthqh00fmvchk2jltgmqw	cmr0l3xul00pbvcd46atnnarx	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:30.761	2026-07-01 00:45:30.761
cmr1ctips00fovchk4pafrua3	cmr0l3xul00pbvcd46atnnarx	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:32.032	2026-07-01 00:45:32.032
cmr1ctjo800fqvchkc3v3h1h9	cmr0l3xul00pbvcd46atnnarx	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:33.272	2026-07-01 00:45:33.272
cmr1ctkn700fsvchkkr73ly6s	cmr0l3xul00pbvcd46atnnarx	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:34.531	2026-07-01 00:45:34.531
cmr1ctll400fuvchkdvm5h64x	cmr0l3xul00pbvcd46atnnarx	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:35.752	2026-07-01 00:45:35.752
cmr1ctmj300fwvchk3990ecbs	cmr0l3xul00pbvcd46atnnarx	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:36.975	2026-07-01 00:45:36.975
cmr1ctnhs00fyvchku0lrwnpr	cmr0l3xul00pbvcd46atnnarx	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:38.224	2026-07-01 00:45:38.224
cmr1ctogm00g0vchkmwz6a0o9	cmr0l3xul00pbvcd46atnnarx	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:39.479	2026-07-01 00:45:39.479
cmr1ctpfj00g2vchkglsn6vat	cmr0l3xul00pbvcd46atnnarx	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:40.735	2026-07-01 00:45:40.735
cmr1ctqky00g4vchkjpdbmgmj	cmr0l489e00phvcd4uj2xx4vj	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:41.982	2026-07-01 00:45:41.982
cmr1ctrj600g6vchkt7d0a08e	cmr0l489e00phvcd4uj2xx4vj	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:43.458	2026-07-01 00:45:43.458
cmr1ctsia00g8vchkcbt6h91q	cmr0l489e00phvcd4uj2xx4vj	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:44.722	2026-07-01 00:45:44.722
cmr1ctth400gavchkdslzfdm5	cmr0l489e00phvcd4uj2xx4vj	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:45.976	2026-07-01 00:45:45.976
cmr1ctuzc00gcvchk5y33u7zc	cmr0l489e00phvcd4uj2xx4vj	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:47.928	2026-07-01 00:45:47.928
cmr1ctvyr00gevchket8wlunp	cmr0l489e00phvcd4uj2xx4vj	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:49.204	2026-07-01 00:45:49.204
cmr1ctwwp00ggvchkoiii7pip	cmr0l489e00phvcd4uj2xx4vj	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:50.425	2026-07-01 00:45:50.425
cmr1ctxvf00givchk4t2aguu1	cmr0l4ps10000l404rd5ojtgs	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:51.675	2026-07-01 00:45:51.675
cmr1ctytj00gkvchk9voek504	cmr0l4ps10000l404rd5ojtgs	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:52.903	2026-07-01 00:45:52.903
cmr1ctzrr00gmvchkksqdphug	cmr0l4ps10000l404rd5ojtgs	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:54.135	2026-07-01 00:45:54.135
cmr1cu0qa00govchkgd7dgt55	cmr0l4ps10000l404rd5ojtgs	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:55.379	2026-07-01 00:45:55.379
cmr1cu1p600gqvchkowcaue36	cmr0l4ps10000l404rd5ojtgs	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:45:56.634	2026-07-01 00:45:56.634
cmr1cu2vi00gsvchkj35s8uig	cmr0l4ps10000l404rd5ojtgs	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:57.881	2026-07-01 00:45:57.881
cmr1cu3ty00guvchk45lzsimh	cmr0l4ps10000l404rd5ojtgs	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:45:59.398	2026-07-01 00:45:59.398
cmr1cu4sl00gwvchkc0z4sgp0	cmr0l4ps70001l404xp0g5mgn	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:00.646	2026-07-01 00:46:00.646
cmr1cu5ri00gyvchkqt92nyp0	cmr0l4ps70001l404xp0g5mgn	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:01.902	2026-07-01 00:46:01.902
cmr1cu6px00h0vchk3gprf7d3	cmr0l4ps70001l404xp0g5mgn	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:03.141	2026-07-01 00:46:03.141
cmr1cu7oo00h2vchk1hh52uq9	cmr0l4ps70001l404xp0g5mgn	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:04.393	2026-07-01 00:46:04.393
cmr1cu8ng00h4vchklz1e0y7e	cmr0l4ps70001l404xp0g5mgn	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:05.644	2026-07-01 00:46:05.644
cmr1cu9md00h6vchklrqpzogl	cmr0l4ps70001l404xp0g5mgn	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:06.901	2026-07-01 00:46:06.901
cmr1cual700h8vchkjg7m9hoq	cmr0l4ps70001l404xp0g5mgn	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:08.155	2026-07-01 00:46:08.155
cmr1cubjo00havchkrc6ma1s9	cmr0l4psp0005l404akqqsv3m	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:09.396	2026-07-01 00:46:09.396
cmr1cuci000hcvchk2447cngp	cmr0l4psp0005l404akqqsv3m	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:10.632	2026-07-01 00:46:10.632
cmr1cudgj00hevchkh1vacfnm	cmr0l4psp0005l404akqqsv3m	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:11.875	2026-07-01 00:46:11.875
cmr1cuenr00hgvchky6rcrsci	cmr0l4psp0005l404akqqsv3m	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:13.177	2026-07-01 00:46:13.177
cmr1cuflz00hivchkjheyxqp1	cmr0l4psp0005l404akqqsv3m	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:14.664	2026-07-01 00:46:14.664
cmr1cugk500hkvchksu2as50a	cmr0l4psp0005l404akqqsv3m	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:15.893	2026-07-01 00:46:15.893
cmr1cuhvb00hmvchkxqi5r7ni	cmr0l4psp0005l404akqqsv3m	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:17.591	2026-07-01 00:46:17.591
cmr1cuit700hovchk4d4yof3m	cmr0l4psk0004l404mlg07yvu	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:18.811	2026-07-01 00:46:18.811
cmr1cujrf00hqvchkrpyjymvf	cmr0l4psk0004l404mlg07yvu	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:20.043	2026-07-01 00:46:20.043
cmr1cukqm00hsvchk8xci9z4t	cmr0l4psk0004l404mlg07yvu	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:21.311	2026-07-01 00:46:21.311
cmr1culom00huvchka627gpuw	cmr0l4psk0004l404mlg07yvu	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:22.534	2026-07-01 00:46:22.534
cmr1cumnj00hwvchkw35j4kma	cmr0l4psk0004l404mlg07yvu	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:23.791	2026-07-01 00:46:23.791
cmr1cunmh00hyvchkhifxjsfw	cmr0l4psk0004l404mlg07yvu	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:25.05	2026-07-01 00:46:25.05
cmr1cuol500i0vchk6009vigk	cmr0l4psk0004l404mlg07yvu	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:26.297	2026-07-01 00:46:26.297
cmr1cupj800i2vchks8qh0fyb	cmr0l4pu6000gl4048tnnhana	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:27.524	2026-07-01 00:46:27.524
cmr1cuqnt00i4vchksa2bu91a	cmr0l4pu6000gl4048tnnhana	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:28.746	2026-07-01 00:46:28.746
cmr1curm800i6vchk6lqv6euh	cmr0l4pu6000gl4048tnnhana	cmr1clfsm000zvchku418mv7u	INVENTORY	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:30.225	2026-07-01 00:46:30.225
cmr1cuske00i8vchkeze9a7xd	cmr0l4pu6000gl4048tnnhana	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:31.454	2026-07-01 00:46:31.454
cmr1cutio00iavchk9hi6g4t3	cmr0l4pu6000gl4048tnnhana	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:32.689	2026-07-01 00:46:32.689
cmr1cuuhe00icvchk9cc0cq87	cmr0l4pu6000gl4048tnnhana	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:33.938	2026-07-01 00:46:33.938
cmr1cuvfu00ievchk32zat26g	cmr0l4pu6000gl4048tnnhana	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:35.178	2026-07-01 00:46:35.178
cmr1cuwe000igvchkj5kscr2q	cmr0l4pug000il404qjy88zgu	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:36.408	2026-07-01 00:46:36.408
cmr1cuxc100iivchkgbjlrfg2	cmr0l4pug000il404qjy88zgu	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:37.633	2026-07-01 00:46:37.633
cmr1cuy9s00ikvchkjry1g4se	cmr0l4pug000il404qjy88zgu	cmr1clfsm000zvchku418mv7u	INVENTORY	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:38.849	2026-07-01 00:46:38.849
cmr1cuz7k00imvchkmep2ltsl	cmr0l4pug000il404qjy88zgu	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:40.064	2026-07-01 00:46:40.064
cmr1cv06700iovchklhuo5q6y	cmr0l4pug000il404qjy88zgu	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:41.311	2026-07-01 00:46:41.311
cmr1cv13r00iqvchkdpsrg944	cmr0l4pug000il404qjy88zgu	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:42.52	2026-07-01 00:46:42.52
cmr1cv21j00isvchknk3k1v2v	cmr0l4pug000il404qjy88zgu	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:43.735	2026-07-01 00:46:43.735
cmr1cv38200iuvchkbg6585fs	cmr0l4cjk00pjvcd4nrbgpo28	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:45.015	2026-07-01 00:46:45.015
cmr1cv46l00iwvchkz2cc1ys9	cmr0l4cjk00pjvcd4nrbgpo28	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:46.509	2026-07-01 00:46:46.509
cmr1cv55a00iyvchk7wv6y6l9	cmr0l4cjk00pjvcd4nrbgpo28	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:47.758	2026-07-01 00:46:47.758
cmr1cv63s00j0vchkw7vp5moe	cmr0l4cjk00pjvcd4nrbgpo28	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:49	2026-07-01 00:46:49
cmr1cv72900j2vchkby8vnhwv	cmr0l4psc0002l404esq7cviz	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:50.241	2026-07-01 00:46:50.241
cmr1cv80p00j4vchki7qzpf07	cmr0l4psc0002l404esq7cviz	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:51.482	2026-07-01 00:46:51.482
cmr1cv8yi00j6vchkvf73fonm	cmr0l4psc0002l404esq7cviz	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:52.698	2026-07-01 00:46:52.698
cmr1cv9wo00j8vchkynka9f5n	cmr0l4psc0002l404esq7cviz	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:46:53.928	2026-07-01 00:46:53.928
cmr1cvaux00javchkc3hzjod2	cmr0l4psc0002l404esq7cviz	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:55.161	2026-07-01 00:46:55.161
cmr1cvbtv00jcvchkf55uuue9	cmr0l46ar00pgvcd4l56nrtdq	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:56.419	2026-07-01 00:46:56.419
cmr1cvcs700jevchkcq51bc2c	cmr0l46ar00pgvcd4l56nrtdq	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:57.656	2026-07-01 00:46:57.656
cmr1cvdqj00jgvchk93sbbuze	cmr0l46ar00pgvcd4l56nrtdq	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:46:58.891	2026-07-01 00:46:58.891
cmr1cveoq00jivchktcf057b1	cmr0l46ar00pgvcd4l56nrtdq	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:00.123	2026-07-01 00:47:00.123
cmr1cvfu800jkvchket6i5b5p	cmr0l46ar00pgvcd4l56nrtdq	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:01.367	2026-07-01 00:47:01.367
cmr1cvgsj00jmvchk4es50nz6	cmr0l46ar00pgvcd4l56nrtdq	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:02.851	2026-07-01 00:47:02.851
cmr1cvhqf00jovchkr74iyn7e	cmr0l46ar00pgvcd4l56nrtdq	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:04.071	2026-07-01 00:47:04.071
cmr1cviom00jqvchkmys6kmcu	cmr0l46ar00pgvcd4l56nrtdq	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:05.303	2026-07-01 00:47:05.303
cmr1cvjna00jsvchk96zik7vm	cmr0l4eob00pkvcd416e7uor5	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:06.55	2026-07-01 00:47:06.55
cmr1cvkl900juvchkqhzle329	cmr0l4eob00pkvcd416e7uor5	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:07.773	2026-07-01 00:47:07.773
cmr1cvljt00jwvchkobxqzi8i	cmr0l4eob00pkvcd416e7uor5	cmr1clugj0017vchkxen01q1d	REPORTS	t	t	t	t	t	t	t	t	t	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:09.017	2026-07-01 00:47:09.017
cmr1cvmhx00jyvchkb3jap923	cmr0l4eob00pkvcd416e7uor5	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:10.245	2026-07-01 00:47:10.245
cmr1cvng400k0vchkopykd1m3	cmr0l4eob00pkvcd416e7uor5	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:11.476	2026-07-01 00:47:11.476
cmr1cvof400k2vchkoaoz719g	cmr0l4eob00pkvcd416e7uor5	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	t	t	t	f	f	f	f	f	f	f	f	f	f	f	t	t	t	t	f	f	f	2026-07-01 00:47:12.736	2026-07-01 00:47:12.736
cmr1cvqc900k6vchkeeqks7r9	cmr0l429c00pevcd454levwco	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:15.225	2026-07-01 00:47:15.225
cmr1cvtqo00kavchkyqxwdcse	cmr0l429c00pevcd454levwco	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:17.746	2026-07-01 00:47:17.746
cmr1cvwms00kgvchk75233861	cmr0l429c00pevcd454levwco	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:23.38	2026-07-01 00:47:23.38
cmr1cvyjr00kkvchk8p9y1dss	cmr0l429c00pevcd454levwco	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:25.863	2026-07-01 00:47:25.863
cmr1cvpdu00k4vchkjjsg5j63	cmr0l429c00pevcd454levwco	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:13.986	2026-07-01 00:47:13.986
cmr1cvrb800k8vchkkvciv4gb	cmr0l429c00pevcd454levwco	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:16.485	2026-07-01 00:47:16.485
cmr1cvup400kcvchk3xoj8rd9	cmr0l429c00pevcd454levwco	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:20.872	2026-07-01 00:47:20.872
cmr1cvvo300kevchkz7ub075p	cmr0l429c00pevcd454levwco	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:22.132	2026-07-01 00:47:22.132
cmr1cvxkv00kivchk1q0mjii8	cmr0l429c00pevcd454levwco	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:24.607	2026-07-01 00:47:24.607
cmr1cvzj700kmvchkaai8eht5	cmr0l429c00pevcd454levwco	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:27.139	2026-07-01 00:47:27.139
cmr1cw0it00kovchkunxtuf8o	cmr0l429c00pevcd454levwco	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:28.421	2026-07-01 00:47:28.421
cmr1cw1i500kqvchkby1w2583	cmr0l429c00pevcd454levwco	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:29.694	2026-07-01 00:47:29.694
cmr1cw2gc00ksvchkbev3ooyi	cmr0l429c00pevcd454levwco	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:30.924	2026-07-01 00:47:30.924
cmr1cw3et00kuvchknu9so1rr	cmr0l429c00pevcd454levwco	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:32.165	2026-07-01 00:47:32.165
cmr1cw4d400kwvchkhatkradl	cmr0l429c00pevcd454levwco	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:33.4	2026-07-01 00:47:33.4
cmr1cw5io00kyvchkjdyb0295	cmr0l429c00pevcd454levwco	cmr1clzyo001avchkudtwff1z	SYSTEM_ROLES	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:34.653	2026-07-01 00:47:34.653
cmr1cw6gb00l0vchkut8dn547	cmr0l429c00pevcd454levwco	cmr1cm1rp001bvchkjenybyd3	SYSTEM_SETTINGS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:36.107	2026-07-01 00:47:36.107
cmr1cw7er00l2vchkztqwryi5	cmr0l429c00pevcd454levwco	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:37.348	2026-07-01 00:47:37.348
cmr1cw8d100l4vchk14cgp3k9	cmr0l429c00pevcd454levwco	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:38.581	2026-07-01 00:47:38.581
cmr1cw9b800l6vchk78bpgr1i	cmr0l429c00pevcd454levwco	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	t	2026-07-01 00:47:39.813	2026-07-01 00:47:39.813
cmr1cwaa800l8vchkjsip1hcj	cmr0l4llp00pnvcd41hsajz24	cmr1cl8tt000vvchkcgf8dvoc	DASHBOARD	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:41.072	2026-07-01 00:47:41.072
cmr1cwb8300lavchk5sbblwdi	cmr0l4llp00pnvcd41hsajz24	cmr1clajx000wvchk1qnmtg0w	PROJECT_MANAGEMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:42.291	2026-07-01 00:47:42.291
cmr1cwc5w00lcvchkp4uxos38	cmr0l4llp00pnvcd41hsajz24	cmr1clc9i000xvchk6f6razkd	AI_COMMAND_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:43.509	2026-07-01 00:47:43.509
cmr1cwd5f00levchk0os0ab6u	cmr0l4llp00pnvcd41hsajz24	cmr1cldza000yvchkl9yarbby	PROCUREMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:44.788	2026-07-01 00:47:44.788
cmr1cwe4d00lgvchkqlonec0d	cmr0l4llp00pnvcd41hsajz24	cmr1clfsm000zvchku418mv7u	INVENTORY	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:46.045	2026-07-01 00:47:46.045
cmr1cwf3600livchk00o9umaz	cmr0l4llp00pnvcd41hsajz24	cmr1clhko0010vchks8o2gwx4	MATERIAL_ISSUANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:47.298	2026-07-01 00:47:47.298
cmr1cwg1f00lkvchkpezjdhto	cmr0l4llp00pnvcd41hsajz24	cmr1cljcv0011vchkf6ug2iev	FINANCE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:48.531	2026-07-01 00:47:48.531
cmr1cwh1900lmvchkgceqkcxb	cmr0l4llp00pnvcd41hsajz24	cmr1cllar0012vchkn5neij9j	SUBCONTRACTING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:49.821	2026-07-01 00:47:49.821
cmr1cwi8100lovchkuhmamdvk	cmr0l4llp00pnvcd41hsajz24	cmr1clnd50013vchkttn304o9	ACCOMPLISHMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:51.102	2026-07-01 00:47:51.102
cmr1cwj7g00lqvchkv17w3d3r	cmr0l4llp00pnvcd41hsajz24	cmr1clp5w0014vchkbobwfpud	PAYROLL	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:52.636	2026-07-01 00:47:52.636
cmr1cwk7500lsvchkb09ep4of	cmr0l4llp00pnvcd41hsajz24	cmr1clqyc0015vchkpr1l1vsu	EQUIPMENT	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:53.922	2026-07-01 00:47:53.922
cmr1cwl6400luvchkr8319wfr	cmr0l4llp00pnvcd41hsajz24	cmr1clspe0016vchk5uio70zd	VARIATION_ORDERS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:55.18	2026-07-01 00:47:55.18
cmr1cwm5t00lwvchksn0ih21p	cmr0l4llp00pnvcd41hsajz24	cmr1clugj0017vchkxen01q1d	REPORTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:56.465	2026-07-01 00:47:56.465
cmr1cwnnv00lyvchk1t0s2wqs	cmr0l4llp00pnvcd41hsajz24	cmr1clw7i0018vchke5in6hit	DOCUMENTS	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:58.412	2026-07-01 00:47:58.412
cmr1cwomf00m0vchkr8sx0gp1	cmr0l4llp00pnvcd41hsajz24	cmr1cly6h0019vchkyuqvd4ex	KNOWLEDGE_CENTER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:47:59.655	2026-07-01 00:47:59.655
cmr1cwpkq00m2vchkau7jolwg	cmr0l4llp00pnvcd41hsajz24	cmr1cm3pv001cvchkqunuows9	WORKER_DATABASE	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:48:00.891	2026-07-01 00:48:00.891
cmr1cwqix00m4vchk4mrknrgy	cmr0l4llp00pnvcd41hsajz24	cmr1cm5gc001dvchkki9eaydp	DELIVERY_RECEIVING	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:48:02.122	2026-07-01 00:48:02.122
cmr1cwrh600m6vchk1t4i0rps	cmr0l4llp00pnvcd41hsajz24	cmr1cm779001evchkyqms7gm1	PURCHASE_ORDER	t	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	f	2026-07-01 00:48:03.354	2026-07-01 00:48:03.354
\.


--
-- Data for Name: SSSTable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SSSTable" (id, "effectiveYear", "minCompensation", "maxCompensation", "monthlySalaryCredit", "regularSsEmployer", "regularSsEmployee", "ecEmployer", "wispEmployer", "wispEmployee", "totalEmployer", "totalEmployee", "totalContribution", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScheduleActivity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleActivity" (id, "scheduleId", "wbsId", "activityCode", name, description, discipline, "plannedStartDate", "plannedFinishDate", "plannedDuration", "actualStartDate", "actualFinishDate", "actualDuration", "baselineStartDate", "baselineFinishDate", "plannedQuantity", "actualQuantity", unit, "plannedWeight", "actualProgressPercent", status, priority, "criticalPath", "totalFloat", "freeFloat", "assignedToId", "subcontractorId", "jobOrderId", "createdAt", "updatedAt", "activityType", "aiRationale", "allocatedAmount", "classificationConfidence", "crewCountAssumption", "durationMethod", "predecessorData", "productivityAssumption", "systemOrArea", "workFrontAssumption") FROM stdin;
\.


--
-- Data for Name: ScheduleApproval; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleApproval" (id, "projectId", "scheduleId", "reviewRound", "revisionCode", "approvalStage", decision, "reviewerId", "reviewerNameSnapshot", "reviewerRoleSnapshot", comments, "validationSnapshot", "snapshotVersion", "scheduleSnapshotHash", "lockedBOQChecksum", "decidedAt", "createdAt", "idempotencyKey", "requestId") FROM stdin;
\.


--
-- Data for Name: ScheduleBOQAllocation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleBOQAllocation" (id, "activityId", "awardedBoqItemId", "mappedQuantity", "mappedWeight", "scheduleId", "projectId", "phaseId", "boqLineId", "allocationMode", "awardedQuantity", "allocatedQuantity", "allocatedPercentage", "awardedAmount", "allocatedAmount", "allocationReason") FROM stdin;
\.


--
-- Data for Name: ScheduleDelayRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleDelayRecord" (id, "scheduleId", "activityId", "delayStartDate", "delayEndDate", "delayDays", category, cause, "impactToCriticalPath", "approvalStatus", "reportedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleDependency; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleDependency" (id, "scheduleId", "predecessorId", "successorId", type, "lagDays", remarks) FROM stdin;
\.


--
-- Data for Name: ScheduleGenerationAudit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleGenerationAudit" (id, "projectId", "userId", action, "previousScheduleId", "newScheduleId", "lockedBOQVersionId", "lockedBOQChecksum", "generationRequestId", "modelIdentifier", "promptVersion", "schemaVersion", "schedulingRulesVersion", "reasoningSetting", "requestTimestamp", "responseTimestamp", "tokenUsage", "resultStatus", "validationResults", "correctionAttemptCount", "timestamp") FROM stdin;
\.


--
-- Data for Name: ScheduleMilestone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleMilestone" (id, "scheduleId", name, description, "targetDate", "actualDate", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: SchedulePOWMapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchedulePOWMapping" (id, "activityId", "programOfWorksId") FROM stdin;
\.


--
-- Data for Name: ScheduleProgressUpdate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleProgressUpdate" (id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", remarks, "reportedById", "accomplishmentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRecoveryPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleRecoveryPlan" (id, "scheduleId", "targetActivityId", "delayCause", "requiredAction", "targetRecoveryDate", "estimatedRecoveredDays", status, "approvalStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleReviewComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleReviewComment" (id, "projectId", "scheduleId", "reviewRound", "activityId", "phaseId", "commentType", comment, status, "createdById", "createdByNameSnapshot", "createdByRoleSnapshot", "resolvedById", "resolutionComment", "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRevisionReason; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleRevisionReason" (id, "projectId", "scheduleId", "parentScheduleId", "revisionType", reason, "supportingReference", "createdById", "createdByNameSnapshot", "createdByRoleSnapshot", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRevisionRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleRevisionRequest" (id, "scheduleId", reason, "delayImpact", "costImpact", status, "requestedById", "approvedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleWBS; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduleWBS" (id, "scheduleId", "parentId", code, name, description, level, "orderIndex", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecurityEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecurityEvent" (id, "timestamp", severity, "riskScore", category, "threatType", "sourceIp", country, city, region, latitude, longitude, isp, asn, organization, "userId", "userEmail", "userRole", "projectId", "targetProjectId", module, endpoint, method, "actionAttempted", "resourceType", "resourceId", "payloadSummary", "fieldsAttempted", "rbacResult", "pbacResult", "dataClassification", "threatDetected", "systemResponse", result, status, "dataExposure", "adminActionRequired", reviewed, "reviewedBy", "reviewedAt", "incidentId", simulated, environment, "userAgent", "sessionId", message, blocked, "createdAt", "updatedAt", "actualResponse", "expectedResponse", "simulationPassed", "simulationRunId") FROM stdin;
cmrh8s80e0003jj04y305x7qp	2026-07-12 03:36:51.854	High	\N	AI	AI Override Tampering	192.168.1.110	Philippines	Cebu	\N	10.3157	123.8854	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	PURCHASING_OFFICER	\N	\N	AI_VALIDATION	/api/ai/overrides/approve	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	PURCHASING_OFFICER attempted AI override approval — role not permitted	Action blocked, security event created, Director notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:36:51.854	2026-07-12 03:36:51.854	Action blocked, security event created, Director notified	Action blocked, security event created, Director notified	t	cmrh8s8030001jj04i0o47108
cmrh8sez2000ajj04vpqnl46o	2026-07-12 03:37:00.878	Critical	\N	Authentication	Session Hijacking Attempt	45.33.32.156	Germany	Frankfurt	\N	50.1109	8.6821	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	PROJECT_MANAGER	\N	\N	SYSTEM_SETTINGS	/api/auth/session	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x	Session terminated, user forced to re-authenticate	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:00.878	2026-07-12 03:37:00.878	Session terminated, user forced to re-authenticate	Session terminated, user forced to re-authenticate	t	cmrh8seyz0008jj04h9ikb3ze
cmrh8sjjm0003l504wfbfn9yi	2026-07-12 03:37:06.802	High	\N	Authentication	Brute Force Login Attack	203.0.113.55	China	Beijing	\N	39.9042	116.4074	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	UNKNOWN	\N	\N	SYSTEM_SETTINGS	/api/auth/login	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	10+ failed logins from same IP in 60 seconds	Temporary IP block and admin alert sent	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:06.802	2026-07-12 03:37:06.802	Temporary IP block and admin alert sent	Temporary IP block and admin alert sent	t	cmrh8sjjf0001l5042vc5cld3
cmrh8smjc000al504covi9ia4	2026-07-12 03:37:10.681	Critical	\N	Authorization	Unauthorized BOQ Modification	192.168.1.100	Philippines	Manila	\N	14.5995	120.9842	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	FOREMAN	\N	\N	PROJECTS	/api/projects/[id]/boq	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	Permission denied: FOREMAN cannot modify locked BOQ	Request rejected, event logged, PM notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:10.681	2026-07-12 03:37:10.681	Request rejected, event logged, PM notified	Request rejected, event logged, PM notified	t	cmrh8smj90008l504czn334t2
cmrh8sq9b0003l704mrsfnwyg	2026-07-12 03:37:15.503	Critical	\N	Authorization	Privilege Escalation via Role Manipulation	192.168.1.250	Philippines	Quezon City	\N	14.676	121.0437	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	GUEST_USER	\N	\N	SYSTEM_SETTINGS	/api/users/[id]/role	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	GUEST_USER attempted to POST to role update endpoint	Request rejected, account flagged, admin notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:15.503	2026-07-12 03:37:15.503	Request rejected, account flagged, admin notified	Request rejected, account flagged, admin notified	t	cmrh8sq960001l704dh9ii6fl
\.


--
-- Data for Name: SecurityIncident; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecurityIncident" (id, title, description, severity, status, "assignedTo", "affectedUserId", "affectedProjectId", "affectedModule", "sourceIp", countermeasure, result, "dataExposure", "relatedEventIds", "rootCause", "resolutionNotes", "adminNotes", "openedAt", "closedAt", "createdBy", "updatedAt", "evidenceJson", "linkedSimulationRunId", "timelineJson") FROM stdin;
cmrh8s80w0006jj04eigs0yt0	[SIMULATION] AI Override Tampering	Simulates an attempt to approve an AI validation override without proper authority.	High	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	AI_VALIDATION	192.168.1.110	Action blocked, security event created, Director notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:36:51.872	\N	\N	2026-07-12 03:36:51.872	{"scenarioId":"cmr1esajj0003vc94g42dsw2u","mitreTechnique":"T1565 - Data Manipulation","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8s8030001jj04i0o47108	[{"time":"2026-07-12T03:36:51.871Z","event":"Threat Detected","details":"PURCHASING_OFFICER attempted AI override approval — role not permitted"},{"time":"2026-07-12T03:36:51.871Z","event":"Countermeasure Applied","details":"Action blocked, security event created, Director notified"}]
cmrh8sez9000djj04hxwi6csc	[SIMULATION] Session Hijacking Attempt	Simulates use of a stolen session cookie from a different IP address to access the ERP.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	45.33.32.156	Session terminated, user forced to re-authenticate	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:00.886	\N	\N	2026-07-12 03:37:00.886	{"scenarioId":"cmr1esgwp0006vc94ayn5bdle","mitreTechnique":"T1539 - Steal Web Session Cookie","owaspCategory":"A07:2021 - Identification and Authentication Failures"}	cmrh8seyz0008jj04h9ikb3ze	[{"time":"2026-07-12T03:37:00.885Z","event":"Threat Detected","details":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x"},{"time":"2026-07-12T03:37:00.885Z","event":"Countermeasure Applied","details":"Session terminated, user forced to re-authenticate"}]
cmrh8sjjz0006l504xg51h66l	[SIMULATION] Brute Force Login Attack	Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.	High	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	203.0.113.55	Temporary IP block and admin alert sent	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:06.815	\N	\N	2026-07-12 03:37:06.815	{"scenarioId":"cmr1es6iw0001vc94al5etulm","mitreTechnique":"T1110 - Brute Force","owaspCategory":"A07:2021 - Identification and Authentication Failures"}	cmrh8sjjf0001l5042vc5cld3	[{"time":"2026-07-12T03:37:06.814Z","event":"Threat Detected","details":"10+ failed logins from same IP in 60 seconds"},{"time":"2026-07-12T03:37:06.814Z","event":"Countermeasure Applied","details":"Temporary IP block and admin alert sent"}]
cmrh8smjj000dl504dcjgxg5l	[SIMULATION] Unauthorized BOQ Modification	Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	PROJECTS	192.168.1.100	Request rejected, event logged, PM notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:10.688	\N	\N	2026-07-12 03:37:10.688	{"scenarioId":"cmr1es8km0002vc94a0cy0sd3","mitreTechnique":"T1078 - Valid Accounts","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8smj90008l504czn334t2	[{"time":"2026-07-12T03:37:10.687Z","event":"Threat Detected","details":"Permission denied: FOREMAN cannot modify locked BOQ"},{"time":"2026-07-12T03:37:10.687Z","event":"Countermeasure Applied","details":"Request rejected, event logged, PM notified"}]
cmrh8sq9k0006l704bu0w0ofv	[SIMULATION] Privilege Escalation via Role Manipulation	Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	192.168.1.250	Request rejected, account flagged, admin notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:15.512	\N	\N	2026-07-12 03:37:15.512	{"scenarioId":"cmr1esivl0007vc94hsic4msb","mitreTechnique":"T1548 - Abuse Elevation Control Mechanism","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8sq960001l704dh9ii6fl	[{"time":"2026-07-12T03:37:15.511Z","event":"Threat Detected","details":"GUEST_USER attempted to POST to role update endpoint"},{"time":"2026-07-12T03:37:15.511Z","event":"Countermeasure Applied","details":"Request rejected, account flagged, admin notified"}]
\.


--
-- Data for Name: SecurityRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecurityRule" (id, name, description, category, enabled, severity, condition, countermeasure, "notifyAdmins", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecuritySimulationArchive; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecuritySimulationArchive" (id, "archiveNumber", "simulationRunId", "campaignId", "scenarioName", "runMode", environment, "initiatedBy", "clearedBy", "startedAt", "completedAt", "clearedAt", "totalEventsArchived", "totalIncidentsArchived", "totalCountermeasuresArchived", "detectionScore", "responseScore", "evidenceScore", "finalScore", "overallResult", "archiveJson", "exportedPdfUrl", "exportedExcelUrl", "createdAt") FROM stdin;
cmr4gacyu0000j809o08ge7nm	ARC-ALL-1783053955106	\N	\N	ALL_SIMULATIONS	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	2026-07-03 04:45:55.11	17	17	17	\N	\N	\N	\N	\N	{"events":[{"id":"cmr1k1wxj0003lb04o6a4ib8d","timestamp":"2026-07-01T04:08:01.015Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k1wxc0001lb04vqyva7sa","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-01T04:08:01.015Z","updatedAt":"2026-07-01T04:08:01.015Z"},{"id":"cmr1k2a4p000alb04t65lb9ib","timestamp":"2026-07-01T04:08:18.121Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k2a4k0008lb04eglroca0","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-01T04:08:18.121Z","updatedAt":"2026-07-01T04:08:18.121Z"},{"id":"cmr1k2h07000hlb04qwsetle2","timestamp":"2026-07-01T04:08:27.031Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Privilege Escalation via Role Manipulation","sourceIp":"192.168.1.250","country":"Philippines","city":"Quezon City","region":null,"latitude":14.676,"longitude":121.0437,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"GUEST_USER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/users/[id]/role","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"GUEST_USER attempted to POST to role update endpoint","systemResponse":"Request rejected, account flagged, admin notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k2h02000flb04zotmlddh","expectedResponse":"Request rejected, account flagged, admin notified","actualResponse":"Request rejected, account flagged, admin notified","simulationPassed":true,"createdAt":"2026-07-01T04:08:27.031Z","updatedAt":"2026-07-01T04:08:27.031Z"},{"id":"cmr1qb52a0003jm04k2ryjuzc","timestamp":"2026-07-01T07:03:09.154Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1qb51z0001jm0460hto2f3","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-01T07:03:09.154Z","updatedAt":"2026-07-01T07:03:09.154Z"},{"id":"cmr1qc2z5000ajm04163rqybz","timestamp":"2026-07-01T07:03:53.105Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1qc2yy0008jm04ckiucozd","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-01T07:03:53.105Z","updatedAt":"2026-07-01T07:03:53.105Z"},{"id":"cmr2u3twg0003jn0ab36u1oj2","timestamp":"2026-07-02T01:37:12.736Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2u3tvs0001jn0akelgc5bg","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-02T01:37:12.736Z","updatedAt":"2026-07-02T01:37:12.736Z"},{"id":"cmr2z1i0v0003le04gj10bhqa","timestamp":"2026-07-02T03:55:22.111Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1i0h0001le04fkumlxn2","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-02T03:55:22.111Z","updatedAt":"2026-07-02T03:55:22.111Z"},{"id":"cmr2z1jql000ale0493nvn8gs","timestamp":"2026-07-02T03:55:24.333Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1jqg0008le04p3aef4mp","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-02T03:55:24.333Z","updatedAt":"2026-07-02T03:55:24.333Z"},{"id":"cmr2z1lhs0003i904yztwmpcu","timestamp":"2026-07-02T03:55:26.608Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1lhn0001i904qxp142bk","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-02T03:55:26.608Z","updatedAt":"2026-07-02T03:55:26.608Z"},{"id":"cmr4a240k0003l404tvf5hkzt","timestamp":"2026-07-03T01:51:32.564Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a24060001l404z5udnorz","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-03T01:51:32.564Z","updatedAt":"2026-07-03T01:51:32.564Z"},{"id":"cmr4a27320003ic04tutxd8al","timestamp":"2026-07-03T01:51:36.543Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a272u0001ic04b2kaq79r","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-03T01:51:36.543Z","updatedAt":"2026-07-03T01:51:36.543Z"},{"id":"cmr4a2900000aic042vmmeek7","timestamp":"2026-07-03T01:51:39.024Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a28zw0008ic04v23isak6","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-03T01:51:39.024Z","updatedAt":"2026-07-03T01:51:39.024Z"},{"id":"cmr4a2ak3000hic04br93nzxz","timestamp":"2026-07-03T01:51:41.043Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a2ajy000fic04hf4kugbw","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-03T01:51:41.043Z","updatedAt":"2026-07-03T01:51:41.043Z"},{"id":"cmr4eb9nf0003jf0aye6qrfcb","timestamp":"2026-07-03T03:50:38.236Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4eb9n30001jf0asku1oqu6","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-03T03:50:38.236Z","updatedAt":"2026-07-03T03:50:38.236Z"},{"id":"cmr4ebfxu000ajf0ad3pdfz6p","timestamp":"2026-07-03T03:50:46.386Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebfxo0008jf0aqw0uta7g","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-03T03:50:46.386Z","updatedAt":"2026-07-03T03:50:46.386Z"},{"id":"cmr4ebjwe000hjf0ajsv51e6k","timestamp":"2026-07-03T03:50:51.519Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebjwa000fjf0awkow0vlo","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-03T03:50:51.519Z","updatedAt":"2026-07-03T03:50:51.519Z"},{"id":"cmr4eboxb000ojf0ai8tjc75x","timestamp":"2026-07-03T03:50:58.031Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebox5000mjf0ahv6mhfq1","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-03T03:50:58.031Z","updatedAt":"2026-07-03T03:50:58.031Z"}],"incidents":[{"id":"cmr1k1wxx0006lb04ea3p0y3d","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:01.028Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-01T04:08:01.028Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1k1wxc0001lb04vqyva7sa","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:01.029Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:01.029Z"},{"id":"cmr1k2a4y000dlb04pwt33mv2","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:18.129Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-01T04:08:18.129Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr1k2a4k0008lb04eglroca0","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:18.130Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:18.130Z"},{"id":"cmr1k2h0g000klb040xiumpf4","title":"[SIMULATION] Privilege Escalation via Role Manipulation","description":"Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"192.168.1.250","countermeasure":"Request rejected, account flagged, admin notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:27.039Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"GUEST_USER attempted to POST to role update endpoint\\"},{\\"time\\":\\"2026-07-01T04:08:27.039Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, account flagged, admin notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esivl0007vc94hsic4msb\\",\\"mitreTechnique\\":\\"T1548 - Abuse Elevation Control Mechanism\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr1k2h02000flb04zotmlddh","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:27.040Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:27.040Z"},{"id":"cmr1qb52v0006jm04zbftex0o","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T07:03:09.174Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-01T07:03:09.174Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1qb51z0001jm0460hto2f3","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T07:03:09.175Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T07:03:09.175Z"},{"id":"cmr1qc2zh000djm047lpu9f2l","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T07:03:53.117Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-01T07:03:53.117Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1qc2yy0008jm04ckiucozd","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T07:03:53.117Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T07:03:53.117Z"},{"id":"cmr2u3tx10006jn0alf34p08z","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T01:37:12.756Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-02T01:37:12.756Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr2u3tvs0001jn0akelgc5bg","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T01:37:12.757Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T01:37:12.757Z"},{"id":"cmr2z1i1e0006le049vhatpun","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:22.129Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-02T03:55:22.129Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr2z1i0h0001le04fkumlxn2","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:22.130Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:22.130Z"},{"id":"cmr2z1jqu000dle04d05w6czs","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:24.342Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-02T03:55:24.342Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr2z1jqg0008le04p3aef4mp","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:24.343Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:24.343Z"},{"id":"cmr2z1li20006i904kvs8o8f2","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:26.617Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-02T03:55:26.617Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr2z1lhn0001i904qxp142bk","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:26.618Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:26.618Z"},{"id":"cmr4a24100006l404sn6x1jaf","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:32.579Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-03T01:51:32.579Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4a24060001l404z5udnorz","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:32.580Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:32.580Z"},{"id":"cmr4a273h0006ic04qlbxg1zl","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:36.556Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-03T01:51:36.556Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4a272u0001ic04b2kaq79r","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:36.557Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:36.557Z"},{"id":"cmr4a2909000dic04yvxv2dgu","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:39.033Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-03T01:51:39.033Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4a28zw0008ic04v23isak6","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:39.033Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:39.033Z"},{"id":"cmr4a2akb000kic047keu3q8o","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:41.051Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-03T01:51:41.051Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4a2ajy000fic04hf4kugbw","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:41.052Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:41.052Z"},{"id":"cmr4eb9o80006jf0ahzid2zkf","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:38.263Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-03T03:50:38.263Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4eb9n30001jf0asku1oqu6","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:38.264Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:38.264Z"},{"id":"cmr4ebfy5000djf0aty2sso87","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:46.396Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-03T03:50:46.396Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4ebfxo0008jf0aqw0uta7g","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:46.397Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:46.397Z"},{"id":"cmr4ebjwo000kjf0aoxm7jlxi","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:51.527Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-03T03:50:51.527Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4ebjwa000fjf0awkow0vlo","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:51.528Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:51.528Z"},{"id":"cmr4eboxk000rjf0ad2snp8js","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:58.039Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-03T03:50:58.039Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4ebox5000mjf0ahv6mhfq1","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:58.040Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:58.040Z"}],"countermeasures":[{"id":"cmr1k1wxr0004lb04d8me55av","securityEventId":"cmr1k1wxj0003lb04o6a4ib8d","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":44,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:01.023Z","createdAt":"2026-07-01T04:08:01.023Z"},{"id":"cmr1k2a4u000blb042xhdvas7","securityEventId":"cmr1k2a4p000alb04t65lb9ib","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":42,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:18.126Z","createdAt":"2026-07-01T04:08:18.126Z"},{"id":"cmr1k2h0c000ilb045k75lqzs","securityEventId":"cmr1k2h07000hlb04qwsetle2","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, account flagged, admin notified","result":"SUCCESS","responseTimeMs":45,"expectedResult":"Request rejected, account flagged, admin notified","actualResult":"Request rejected, account flagged, admin notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:27.036Z","createdAt":"2026-07-01T04:08:27.036Z"},{"id":"cmr1qb52l0004jm04y05skc6j","securityEventId":"cmr1qb52a0003jm04k2ryjuzc","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":51,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T07:03:09.165Z","createdAt":"2026-07-01T07:03:09.165Z"},{"id":"cmr1qc2zb000bjm040d19k5fy","securityEventId":"cmr1qc2z5000ajm04163rqybz","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":21,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T07:03:53.111Z","createdAt":"2026-07-01T07:03:53.111Z"},{"id":"cmr2u3tws0004jn0apgx2jml7","securityEventId":"cmr2u3twg0003jn0ab36u1oj2","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":30,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T01:37:12.748Z","createdAt":"2026-07-02T01:37:12.748Z"},{"id":"cmr2z1i150004le04bwo1mquy","securityEventId":"cmr2z1i0v0003le04gj10bhqa","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":18,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:22.122Z","createdAt":"2026-07-02T03:55:22.122Z"},{"id":"cmr2z1jqr000ble04dyo5150b","securityEventId":"cmr2z1jql000ale0493nvn8gs","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":55,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:24.339Z","createdAt":"2026-07-02T03:55:24.339Z"},{"id":"cmr2z1lhx0004i904ld33zobi","securityEventId":"cmr2z1lhs0003i904yztwmpcu","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":42,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:26.614Z","createdAt":"2026-07-02T03:55:26.614Z"},{"id":"cmr4a240s0004l404t2rqv0e1","securityEventId":"cmr4a240k0003l404tvf5hkzt","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":15,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:32.573Z","createdAt":"2026-07-03T01:51:32.573Z"},{"id":"cmr4a273a0004ic04aycr6a2g","securityEventId":"cmr4a27320003ic04tutxd8al","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":33,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:36.550Z","createdAt":"2026-07-03T01:51:36.550Z"},{"id":"cmr4a2905000bic04te9sh503","securityEventId":"cmr4a2900000aic042vmmeek7","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":26,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:39.029Z","createdAt":"2026-07-03T01:51:39.029Z"},{"id":"cmr4a2ak7000iic041btdl7xz","securityEventId":"cmr4a2ak3000hic04br93nzxz","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":49,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:41.048Z","createdAt":"2026-07-03T01:51:41.048Z"},{"id":"cmr4eb9ny0004jf0amjsd4fmw","securityEventId":"cmr4eb9nf0003jf0aye6qrfcb","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":41,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:38.255Z","createdAt":"2026-07-03T03:50:38.255Z"},{"id":"cmr4ebfy0000bjf0aiknj48sw","securityEventId":"cmr4ebfxu000ajf0ad3pdfz6p","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":23,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:46.392Z","createdAt":"2026-07-03T03:50:46.392Z"},{"id":"cmr4ebjwj000ijf0a44366cpf","securityEventId":"cmr4ebjwe000hjf0ajsv51e6k","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":52,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:51.524Z","createdAt":"2026-07-03T03:50:51.524Z"},{"id":"cmr4eboxg000pjf0a0frwmdm9","securityEventId":"cmr4eboxb000ojf0ai8tjc75x","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":46,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:58.036Z","createdAt":"2026-07-03T03:50:58.036Z"}]}	\N	\N	2026-07-03 04:45:55.11
\.


--
-- Data for Name: SecuritySimulationCampaign; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecuritySimulationCampaign" (id, name, description, severity, "scenarioSequenceJson", status, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecuritySimulationRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecuritySimulationRun" (id, "scenarioId", "campaignId", "runMode", environment, status, "initiatedBy", "startedAt", "completedAt", "detectionScore", "responseScore", "evidenceScore", "finalScore", "overallResult", notes) FROM stdin;
cmrh8smj90008l504czn334t2	cmr1es8km0002vc94a0cy0sd3	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:10.677	2026-07-12 03:37:10.698	100	100	100	100	Passed	\N
cmrh8sq960001l704dh9ii6fl	cmr1esivl0007vc94hsic4msb	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:15.499	2026-07-12 03:37:15.523	100	100	100	100	Passed	\N
cmrh8s8030001jj04i0o47108	cmr1esajj0003vc94g42dsw2u	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:36:51.843	2026-07-12 03:36:51.895	100	100	100	100	Passed	\N
cmrh8seyz0008jj04h9ikb3ze	cmr1esgwp0006vc94ayn5bdle	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:00.875	2026-07-12 03:37:00.896	100	100	100	100	Passed	\N
cmrh8sjjf0001l5042vc5cld3	cmr1es6iw0001vc94al5etulm	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:06.795	2026-07-12 03:37:06.84	100	100	100	100	Passed	\N
\.


--
-- Data for Name: SecuritySimulationScenario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecuritySimulationScenario" (id, name, description, category, severity, "targetModule", "targetRoute", "simulatedRole", "simulatedSourceIp", "simulatedCountry", "simulatedCity", latitude, longitude, "mitreTechnique", "owaspCategory", "expectedDetection", "expectedCountermeasure", "passFailCriteria", enabled, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmr1es4h80000vc942fidm9i7	SQL Injection via Material Request Form	Simulates a SQL injection attack via the MRF creation endpoint to test database query sanitization.	Injection	Critical	PROCUREMENT	/api/material-requests	GUEST_USER	185.220.101.45	Russia	Moscow	55.7558	37.6176	T1190 - Exploit Public-Facing Application	A03:2021 - Injection	Malicious payload detected in request body	Request blocked and IP flagged	Event must be created with status BLOCKED within 2 seconds	t	\N	2026-07-01 01:40:26.156	2026-07-01 01:40:26.156
cmr1es6iw0001vc94al5etulm	Brute Force Login Attack	Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.	Authentication	High	SYSTEM_SETTINGS	/api/auth/login	UNKNOWN	203.0.113.55	China	Beijing	39.9042	116.4074	T1110 - Brute Force	A07:2021 - Identification and Authentication Failures	10+ failed logins from same IP in 60 seconds	Temporary IP block and admin alert sent	Rate limit must trigger before 15th failed attempt	t	\N	2026-07-01 01:40:28.808	2026-07-01 01:40:28.808
cmr1es8km0002vc94a0cy0sd3	Unauthorized BOQ Modification	Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.	Authorization	Critical	PROJECTS	/api/projects/[id]/boq	FOREMAN	192.168.1.100	Philippines	Manila	14.5995	120.9842	T1078 - Valid Accounts	A01:2021 - Broken Access Control	Permission denied: FOREMAN cannot modify locked BOQ	Request rejected, event logged, PM notified	RBAC guard must return 403 Forbidden	t	\N	2026-07-01 01:40:31.462	2026-07-01 01:40:31.462
cmr1esajj0003vc94g42dsw2u	AI Override Tampering	Simulates an attempt to approve an AI validation override without proper authority.	AI	High	AI_VALIDATION	/api/ai/overrides/approve	PURCHASING_OFFICER	192.168.1.110	Philippines	Cebu	10.3157	123.8854	T1565 - Data Manipulation	A01:2021 - Broken Access Control	PURCHASING_OFFICER attempted AI override approval — role not permitted	Action blocked, security event created, Director notified	Only PROJECT_DIRECTOR or SUPER_ADMIN may approve AI overrides	t	\N	2026-07-01 01:40:34.016	2026-07-01 01:40:34.016
cmr1esck80004vc94j88he4us	Malicious File Upload via Documents	Simulates a user uploading a file with a dangerous extension (.exe, .sh) disguised as a PDF.	FILE	High	DOCUMENTS	/api/documents/upload	SITE_ADMIN	10.0.0.55	Philippines	Davao	7.1907	125.4553	T1566.001 - Spearphishing Attachment	A04:2021 - Insecure Design	Blocked file with extension .exe uploaded as invoice.pdf	File quarantined, upload rejected, user warned	File extension validation must reject non-whitelisted file types	t	\N	2026-07-01 01:40:36.633	2026-07-01 01:40:36.633
cmr1esei50005vc94n6dl8g95	Cross-Site Request Forgery on PO Approval	Simulates a CSRF attack designed to force a Director to approve a fraudulent Purchase Order.	CSRF	Medium	PROCUREMENT	/api/purchase-orders/[id]/approve	PROJECT_DIRECTOR	198.51.100.77	United States	New York	40.7128	-74.006	T1059 - Command and Scripting Interpreter	A01:2021 - Broken Access Control	CSRF token mismatch detected on PO approval	Request rejected with 403, token invalidated	CSRF protection must reject cross-origin state-changing requests	t	\N	2026-07-01 01:40:39.15	2026-07-01 01:40:39.15
cmr1esgwp0006vc94ayn5bdle	Session Hijacking Attempt	Simulates use of a stolen session cookie from a different IP address to access the ERP.	Authentication	Critical	SYSTEM_SETTINGS	/api/auth/session	PROJECT_MANAGER	45.33.32.156	Germany	Frankfurt	50.1109	8.6821	T1539 - Steal Web Session Cookie	A07:2021 - Identification and Authentication Failures	Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x	Session terminated, user forced to re-authenticate	IP binding must detect session used from different IP range	t	\N	2026-07-01 01:40:42.266	2026-07-01 01:40:42.266
cmr1esivl0007vc94hsic4msb	Privilege Escalation via Role Manipulation	Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.	Authorization	Critical	SYSTEM_SETTINGS	/api/users/[id]/role	GUEST_USER	192.168.1.250	Philippines	Quezon City	14.676	121.0437	T1548 - Abuse Elevation Control Mechanism	A01:2021 - Broken Access Control	GUEST_USER attempted to POST to role update endpoint	Request rejected, account flagged, admin notified	Only SUPER_ADMIN can modify user roles	t	\N	2026-07-01 01:40:44.818	2026-07-01 01:40:44.818
\.


--
-- Data for Name: SensitiveExportLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SensitiveExportLog" (id, "userId", "userEmail", role, "projectId", module, "exportType", "recordCount", "dataClassification", "sourceIp", approved, blocked, reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: SubcontractAccomplishment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubcontractAccomplishment" (id, "packageId", "jobOrderId", "workDescription", location, "prevPercent", "currentPercent", "cumulativePercent", "prevQty", "currentQty", "totalQty", "remainingQty", photos, videos, "inspectionReport", "qaQcStatus", "materialIssuedRef", "deliveryRef", remarks, "preparedBy", "verifiedBy", "approvedBy", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractBilling; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubcontractBilling" (id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "retentionDeduction", "whtDeduction", "mobilizationDeduction", "backCharges", "materialCharges", penalties, "otherDeductions", "netPayable", "billingPeriod", "supportingDocs", "aiValidationResult", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractPackage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubcontractPackage" (id, "projectId", "packageNumber", "subcontractorId", "workCategory", "contractType", "awardedBoqItemId", "masterBoqItemId", "scopeOfWork", location, "floorBuildingZone", quantity, unit, "unitCost", "contractAmount", "internalBudget", "costType", "paymentTerms", "retentionPct", "whtPct", "mobilizationAdvance", "startDate", "targetCompletion", "warrantyPeriod", attachments, status, "isLocked", remarks, "createdAt", "updatedAt", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: Subcontractor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subcontractor" (id, name, "businessName", "businessType", address, "contactPerson", "contactNumber", email, tin, "birReg", "dtiSecReg", "mayorPermit", "pcabLicense", "bankName", "bankAccountName", "bankAccountNumber", specialization, accreditation, "contractType", "isSeedData", "requiredDocs", "docExpiries", "safetyRecords", "evaluationRating", remarks, "createdAt", "updatedAt") FROM stdin;
ae463659-bb0e-4e98-bf00-c094ed6cc145	Sample Steel Works Subcon	\N	CORPORATION	\N	Juan Dela Cruz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
63671a32-fe4b-4217-bcee-bbfbfc4d8995	Sample Painting Subcon	\N	CORPORATION	\N	Pedro Penduko	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
9116d674-148c-4d8b-a286-9fbffc95108c	Sample Electrical Subcon	\N	CORPORATION	\N	John Doe	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
201203d4-29d2-4273-8263-0c4885e5588d	Sample Plumbing Subcon	\N	CORPORATION	\N	Jane Doe	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
36d5f45c-4424-4ebf-847b-b96af9a55cc5	Sample Tile Works Subcon	\N	CORPORATION	\N	Mario Rossi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
\.


--
-- Data for Name: SubcontractorBOQItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubcontractorBOQItem" (id, "subcontractorId", "awardedBoqItemId", quantity, "unitCost", "totalCost", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractorVariationOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubcontractorVariationOrder" (id, "svoNumber", "projectId", "originalSubcontractId", "originalBenchmarkQty", "originalBenchmarkAmt", "originalSubcontractQty", "originalSubcontractAmt", "proposedAdditionalQty", "proposedAdditionalAmt", "revisedSubcontractQty", "revisedSubcontractAmt", reason, "costImpact", "scheduleImpact", "profitabilityImpact", "approvalStatus", "preparedById", "reviewedById", "approvedById", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supplier" (id, name, tin, "contactPerson", "contactNumber", email, address, "paymentTerms", website, "plantLocation", "isVatable", "isSeedData", "createdAt", "updatedAt") FROM stdin;
cmrirfsma0005if04hnk8ldlb	Sample Hardware Supplier	\N	Supplier Contact 1	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0006if04brvcxvhf	Sample Cement Supplier	\N	Supplier Contact 2	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0007if04gzuclb9c	Sample Electrical Supplier	\N	Supplier Contact 3	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0008if04us1jrz6o	Sample Lumber Supplier	\N	Supplier Contact 4	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0009if04h8awi0w4	Sample Paints Supplier	\N	Supplier Contact 5	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
\.


--
-- Data for Name: SupplierQuotation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupplierQuotation" (id, status, "totalAmount", "isRecommended", "deliveryPeriod", "paymentTerms", "aiRank", "aiRationale", "canvassFormId", "supplierId", "createdAt", "updatedAt", "fileUrl") FROM stdin;
\.


--
-- Data for Name: SystemRole; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SystemRole" (id, name, "createdAt") FROM stdin;
cmqixwxzn0000vc6c5qjpjshh	SUPER_ADMIN	2026-06-18 03:28:26.387
cmqixwy010001vc6cx7fzcgji	MATERIALS_ENGINEER	2026-06-18 03:28:26.401
cmqixwy0a0002vc6cemocyanp	PURCHASING_OFFICER	2026-06-18 03:28:26.41
cmqixwy0k0003vc6cpclbn9g7	PROJECT_DIRECTOR	2026-06-18 03:28:26.42
cmqixwy0u0004vc6ccxgonv66	PROJECT_MANAGER	2026-06-18 03:28:26.43
cmqixwy150005vc6cwpsu00td	FINANCE_OFFICER	2026-06-18 03:28:26.441
cmqixwy1f0006vc6c8iuscxb0	STOCKMAN	2026-06-18 03:28:26.451
cmqixwy1p0007vc6ck2iar6x0	PROJECT_ACCOUNTANT	2026-06-18 03:28:26.461
cmqixwy1z0008vc6ckw2d865m	COST_OFFICER	2026-06-18 03:28:26.471
cmqiy5yy90003vclsjwkvqng6	SITE_ENGINEER	2026-06-18 03:35:27.537
cmqiy5yyy0009vclsl6a4y06o	HR_MANAGER	2026-06-18 03:35:27.563
cmqiy5yza000bvclsxdpuudde	CONTRACTS_ADMINISTRATOR	2026-06-18 03:35:27.574
cmqiy5yzh000cvclsuizx3483	EQUIPMENT_MANAGER	2026-06-18 03:35:27.582
cmqn6llw40002vc1snpxqrhpa	DIRECTORS	2026-06-21 02:42:38.741
cmqn6llwb0003vc1sqxb6kf1a	ADMINISTRATOR	2026-06-21 02:42:38.747
cmqn6llwj0005vc1sbn7y66by	PROJECT_ENGINEER	2026-06-21 02:42:38.756
cmqn6llwq0006vc1swpsct709	PME	2026-06-21 02:42:38.762
cmqn6llww0007vc1sm7awqbok	PEE	2026-06-21 02:42:38.768
cmqn6llx10008vc1s8ogsyw8r	SITE_ADMIN	2026-06-21 02:42:38.774
cmqn6llxa000cvc1skfodq47q	PROCUREMENT_OFFICER	2026-06-21 02:42:38.782
cmqn6llxh000fvc1ssq20hyv6	ACCOUNTANT	2026-06-21 02:42:38.79
cmqn6llxo000ivc1s1n7vyc8k	HR_OFFICER	2026-06-21 02:42:38.797
cmqn6llxu000jvc1sng6k16js	PAYROLL_OFFICER	2026-06-21 02:42:38.802
cmqn6llxz000kvc1slwd7036s	PAYROLL_MASTER	2026-06-21 02:42:38.808
cmqn6lly7000mvc1siu91n174	WAREHOUSEMAN	2026-06-21 02:42:38.815
cmqn6llye000nvc1sy4jt2e22	DRIVER	2026-06-21 02:42:38.822
cmqn6llyj000ovc1syr5t3ggp	LIASON_OFFICER	2026-06-21 02:42:38.828
cmqn6llyp000rvc1syk1tu8m2	AUDITOR	2026-06-21 02:42:38.834
cmqn6llyv000svc1s46ws713d	FOREMAN	2026-06-21 02:42:38.839
cmqn6llz1000tvc1sf6ky3k1n	BILLING_ENGINEER	2026-06-21 02:42:38.845
cmqpcow1f000uvcdsc2k5nxy7	GUEST_USER	2026-06-22 15:08:41.908
cmqpcw0nm000uvcl8nr6t54lp	GUEST USER	2026-06-22 15:14:14.482
\.


--
-- Data for Name: ThreatIp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ThreatIp" (id, "ipAddress", country, city, region, latitude, longitude, isp, asn, organization, "firstSeen", "lastSeen", "attemptCount", severity, status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TransactionWorkflow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TransactionWorkflow" (id, "moduleName", "transactionId", "preparedBy", "preparedByRole", "reviewedBy", "reviewedByRole", "recommendedBy", "recommendedByRole", "approvedBy", "approvedByRole", "paidBy", "paidByRole", "currentStatus", "currentStage", "nextRequiredRole", "datePrepared", "dateReviewed", "dateRecommended", "dateApproved", "datePaid", remarks, "auditReference", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UploadedWorkbookFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UploadedWorkbookFile" (id, "projectId", "originalFilename", "fileHash", "storagePath", "preservedOriginalUrl", "uploadedBy", "uploadedAt", "recognizedTemplate", "validationStatus", "createdAt", "updatedAt", "commitStatus", "documentType", "extractionStatus", "fileSize", "latestPreservedVersionId", "metadataJson", "mimeType", "onlyOfficeDocumentKey", "templateCode", "templateName", "templateVersion") FROM stdin;
fake-file-id	fake-project-id	f	f	f	\N	fake-user-id	2026-07-16 07:24:58.929	\N	PENDING	2026-07-16 07:24:58.929	2026-07-16 07:24:58.929	PENDING	\N	PENDING	100	\N	\N	f	\N	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, password, "emailVerified", image, role, "createdAt", "updatedAt", "passwordHash", status, "defaultRole", department, "lastLoginAt", "mustChangePassword", "sessionVersion", "passwordChangedAt", "failedLoginAttempts", "lockedUntil") FROM stdin;
cmqn5zlim0000vckg4hzn5u7o	SYSTEM ADMIN 01	admin01@demo.com	superadmin001	\N	\N	SUPER_ADMIN	2026-06-21 02:25:31.821	2026-07-13 03:58:55.557	\N	ACTIVE	\N	\N	\N	f	0	\N	0	\N
cmriningq001dvchcz9yk1y7x	Purchasing Officer	purchasing@onesystemserp.com	admin001	\N	\N	PURCHASING_OFFICER	2026-07-13 03:17:05.738	2026-07-13 05:06:50.976	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	PURCHASING_OFFICER	\N	\N	f	0	\N	0	\N
cmrinioec001gvchcueq8v3db	Finance Officer	finance@onesystemserp.com	admin001	\N	\N	FINANCE_OFFICER	2026-07-13 03:17:06.948	2026-07-13 05:06:50.987	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	FINANCE_OFFICER	\N	\N	f	0	\N	0	\N
cmrinipcb001jvchcx9r97i6i	Accounting Officer	accounting@onesystemserp.com	admin001	\N	\N	ACCOUNTANT	2026-07-13 03:17:08.171	2026-07-13 05:06:50.996	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	ACCOUNTANT	\N	\N	f	0	\N	0	\N
cmrinipwp001kvchcbm6q2hfk	Billing Officer	billing@onesystemserp.com	admin001	\N	\N	BILLING_ENGINEER	2026-07-13 03:17:08.905	2026-07-13 05:06:51.005	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	BILLING_ENGINEER	\N	\N	f	0	\N	0	\N
cmriniqgy001lvchcegw8qcxv	Site Engineer	engineer@onesystemserp.com	admin001	\N	\N	SITE_ENGINEER	2026-07-13 03:17:09.633	2026-07-13 05:06:51.016	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	SITE_ENGINEER	\N	\N	f	0	\N	0	\N
cmrioubtm0026vchcc4pcayuu	Site Admin	admin@onesystemserp.com	admin001	\N	\N	SITE_ADMIN	2026-07-13 03:54:10.138	2026-07-13 05:06:51.025	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	SITE_ADMIN	\N	\N	f	0	\N	0	\N
cmrinimix001avchckwzmfxsu	BERNARD MANUEL	manager@onesystemserp.com	\N	\N	\N	PROJECT_MANAGER	2026-07-13 03:17:04.521	2026-07-16 07:57:25.653	$2b$10$47r45NurUA5ZXOsF/Y/5Y.c4n09MeUxAHuSmDaAFG8ZSvdOKWraka	ACTIVE	PROJECT_MANAGER	\N	\N	f	5	\N	0	\N
cmrinikue0017vchcnxm8wqzn	Project Director	director@onesystemserp.com	\N	\N	\N	PROJECT_DIRECTOR	2026-07-13 03:17:02.34	2026-07-16 07:57:27.51	$2b$10$n9mSYhXAO/0tcEWJ9vl/ZuyhqSs9/us0Bzp9BbwrYG01pLsVLRILO	ACTIVE	PROJECT_DIRECTOR	\N	\N	f	5	\N	0	\N
cmqiy15bq0000vc1cq1f3zg6j	J BURNS	J.BURNS2372@GMAIL.COM	Junixsys_001	\N	\N	SUPER_ADMIN	2026-06-18 03:31:42.518	2026-07-16 06:46:42.642	$2b$10$mkBHiCR5vikOYsI0JqRMeOZweCivo5NWtV3L45NBppwuwndVxgBJ.	ACTIVE	\N	\N	\N	f	0	\N	0	\N
fake-user-id	Fake User	fake@example.com	\N	\N	\N	SUPER_ADMIN	2026-07-16 07:21:52.271	2026-07-16 07:21:52.271	fake	VERIFIED	\N	\N	\N	f	0	\N	0	\N
\.


--
-- Data for Name: UserLoginLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserLoginLog" (id, "userId", "ipAddress", "deviceInfo", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserRole" (id, "userId", "roleId", "createdAt", "updatedAt") FROM stdin;
cmrinilyk0019vchctr4w6mw0	cmrinikue0017vchcnxm8wqzn	cmr0l4ptf000al404ffsjb4k3	2026-07-13 03:17:03.787	2026-07-13 03:17:03.787
cmrinin39001cvchcpzswphcy	cmrinimix001avchckwzmfxsu	cmr0l4ptp000cl404zna2d18s	2026-07-13 03:17:05.253	2026-07-13 03:17:05.253
cmrinio0s001fvchc24mqj3bq	cmriningq001dvchcz9yk1y7x	cmr0l4ptt000dl404pa0rcncm	2026-07-13 03:17:06.46	2026-07-13 03:17:06.46
cmrinioyr001ivchcuxigk56d	cmrinioec001gvchcueq8v3db	cmr0l4gvy00plvcd4e88g3jso	2026-07-13 03:17:07.683	2026-07-13 03:17:07.683
cmrinir13001nvchcy9v6ze8r	cmriniqgy001lvchcegw8qcxv	cmr0l4pu2000fl4040gj26edh	2026-07-13 03:17:10.359	2026-07-13 03:17:10.359
cmriou9kx0023vchcc886bicy	cmrinipcb001jvchcx9r97i6i	cmr0l3xul00pbvcd46atnnarx	2026-07-13 03:54:07.233	2026-07-13 03:54:07.233
cmriouap10025vchchzyi4cru	cmrinipwp001kvchcbm6q2hfk	cmr0l44cl00pfvcd4rffz3w4y	2026-07-13 03:54:08.677	2026-07-13 03:54:08.677
cmriouck00028vchcstsvbc12	cmrioubtm0026vchcc4pcayuu	cmr0l4ptx000el404422dp48q	2026-07-13 03:54:11.088	2026-07-13 03:54:11.088
\.


--
-- Data for Name: UserSessionSecurityLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserSessionSecurityLog" (id, "userId", "sourceIp", "userAgent", device, "approximateLocation", "loginAt", "lastActivityAt", "revokedAt", "revokedBy", status, "riskScore", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValidationAuditLog" (id, "projectId", "userId", "userRole", "actionType", "validationRecordId", "aiScoreAtTime", "aiFindingsAtTime", "manualOverrideReason", "approvalRemarks", "evidenceVersion", "ipAddress", "deviceInfo", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationEvidencePack; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValidationEvidencePack" (id, "projectId", "relatedBillingId", "relatedAccomplishId", "executiveSummary", "claimedAccomplish", "aiValidatedAccomplish", "billingAmount", "riskFindings", "finalRecommendation", "filePdfUrl", "fileExcelUrl", status, "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValidationSettings" (id, "boqWeight", "plansWeight", "photoWeight", "droneWeight", "cctvWeight", "satelliteWeight", "deliveryWeight", "scheduleWeight", "approvalWeight", "updatedById", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ValueEngineeringRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValueEngineeringRecord" (id, "veNumber", "projectId", description, "currentCost", "proposedCost", "estimatedSavings", "actualSavingsAchieved", "qualityImpact", "safetyImpact", "contractImpact", "requiredApproval", "aiRecommendation", "humanReviewStatus", "finalApprovalStatus", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: VariationOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VariationOrder" (id, "voNumber", "dateRequested", "requestedById", "requestingDepartment", "variationType", "variationCategory", "sourceOfVariation", "reasonForVariation", "detailedDescription", "affectedLocation", "affectedFloorZone", "originalContractAmount", "totalPreviouslyApprovedAdditive", "totalPreviouslyApprovedDeductive", "currentRevisedContractAmount", "additionalAmount", "deductiveAmount", "netVariationAmount", "percentageImpact", "timeImpact", "additionalCalendarDaysRequested", "effectOnCriticalPath", "effectOnProjectCompletionDate", "technicalJustification", "commercialJustification", "safetyJustification", "clientInstructionReference", "consultantInstructionReference", "drawingReference", "siteInstructionReference", "inspectionReportReference", "quantityTakeOffReference", "costEstimateReference", "supplierQuotationReference", "subcontractorQuotationReference", "aiValidationResult", "aiRiskRating", "currentStatus", "approvalHistory", remarks, "approvedForImplementation", "approvedForProcurement", "approvedForSubcontracting", "approvedForJobOrder", "approvedForBilling", "subcontractPackageId", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderApproval; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VariationOrderApproval" (id, stage, action, "actionById", remarks, "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderDocument; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VariationOrderDocument" (id, "fileName", "fileType", "fileUrl", "documentCategory", remarks, "uploadedById", "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VariationOrderItem" (id, "voItemNumber", "itemClassification", "workCategory", location, description, unit, "originalQuantity", "previouslyApprovedQuantity", "currentProposedQuantity", "revisedQuantity", "originalUnitCost", "proposedUnitCost", "approvedUnitCost", "originalAmount", "additionalAmount", "deductiveAmount", "netAmount", "costSource", "pricingBasis", "materialCost", "laborCost", "equipmentCost", "subcontractCost", "transportationCost", consumables, overhead, "profitMarkup", tax, "otherDirectCost", "supplierQuotationReference", "subcontractorQuotationReference", "canvassReference", "attachmentReference", "procurementStatus", "subcontractStatus", "accomplishmentStatus", "billingStatus", "approvalStatus", remarks, "variationOrderId", "originalBoqItemId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VideoEvidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VideoEvidence" (id, "fleetEventId", "equipmentId", "deviceId", "channelNo", "evidenceType", "fileUrl", "playbackStartTime", "playbackEndTime", "thumbnailUrl", "storageLocation", "retentionUntil", checksum, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkbookExtractionAudit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkbookExtractionAudit" (id, "uploadedWorkbookFileId", "projectId", action, status, message, "detailsJson", "performedBy", "performedAt", "ipAddress", "performedByRole", "userAgent") FROM stdin;
\.


--
-- Data for Name: WorkbookFormulaValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkbookFormulaValidation" (id, "uploadedWorkbookFileId", "sheetName", "cellAddress", "sourceRowNumber", "expectedFormula", "actualFormula", "validationStatus", message, "createdAt", "projectId", severity, "actualValue", "expectedValue") FROM stdin;
\.


--
-- Data for Name: WorkbookTemplateValidation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkbookTemplateValidation" (id, "uploadedWorkbookFileId", "projectId", "validationType", "validationKey", "expectedValue", "actualValue", severity, status, message, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkbookVersion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkbookVersion" (id, "uploadedWorkbookFileId", "projectId", "versionNumber", "versionLabel", "sourceType", "filePath", "fileHash", "createdBy", "createdAt", remarks) FROM stdin;
\.


--
-- Data for Name: Worker; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Worker" (id, "workerId", "firstName", "lastName", "middleName", suffix, nickname, "dateOfBirth", gender, "civilStatus", "mobileNumber", "emailAddress", "completeAddress", "emergencyContactName", "emergencyContactNumber", "emergencyContactRelation", "employmentType", "workerCategory", designation, department, "dateHired", "engagementStartDate", "contractEndDate", "employmentStatus", "restDay", "standardWorkHours", "overtimeEligible", "nightDifferentialEligible", "holidayPayEligible", "subjectToAttendance", "subjectToPayrollCutoff", "rateType", "basicMonthlySalary", "dailyRate", "hourlyRate", "pieceRate", "unitDescription", "contractAmount", "professionalFee", "paymentBasis", "billingFrequency", "prorationMethod", "retentionPercentage", "withholdingTaxRate", allowance, "tinNumber", "sssNumber", "philHealthNumber", "pagIbigNumber", "umidNumber", "nationalIdNumber", "validIdType", "validIdNumber", "validIdExpiryDate", "withholdingTaxEnabled", "sssDeductionEnabled", "philHealthDeductionEnabled", "pagibigDeductionEnabled", "otherGovernmentDeductionEnabled", "taxClassification", "withholdingTaxType", "taxExemptionReason", "birFormType", "registeredBusinessName", "officialReceiptRequired", "taxStatus", "payrollMode", "bankName", "bankAccountName", "bankAccountNumber", "gcashAccountName", "gcashNumber", "checkPayeeName", "billingPayeeName", "billingAddress", "projectId", "createdAt", "updatedAt", "allowedPaymentMethod", "bankAccountType", "bankApprovedBy", "bankBranch", "bankLastUpdatedDate", "bankSupportingAttachment", "bankUpdatedBy", "bankVerificationStatus", "gcashApprovedBy", "gcashLastUpdatedDate", "gcashSupportingAttachment", "gcashUpdatedBy", "gcashVerificationStatus", "paymentHoldReason", "paymentProfileStatus", "paymentRemarks", "payrollCategory", "isSeedData") FROM stdin;
cmrirfslm0000if04wh4dg6as	\N	Sample	Foreman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Foreman	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	800	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0001if042on7al6u	\N	Sample	Mason	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Mason	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	650	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0002if049eiwfck3	\N	Sample	Carpenter	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Carpenter	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	650	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0003if04e54ww2kd	\N	Sample	Helper 1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	UNSKILLED	Helper	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	500	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0004if04garmkvku	\N	Sample	Helper 2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	UNSKILLED	Helper	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	500	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
\.


--
-- Data for Name: WorkerDocument; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkerDocument" (id, "workerId", title, category, "fileUrl", "expiryDate", remarks, "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowStep; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkflowStep" (id, "templateId", "stepOrder", "stageName", "requiredRole", "actionRequired", "isTerminal", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkflowTemplate" (id, "moduleName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ac07bf7f-6a14-40ad-a064-98b1e7ad8126	696e407e7273457d1e1ee86aa5e70e7796b61f27dd35e619a88f7823202dc73b	2026-07-16 06:10:54.614219+00	20260626065906_init_postgres		\N	2026-07-16 06:10:54.614219+00	0
b2373df3-b99f-4f6b-9d53-59d75de36177	03421f007578142e633880730fbb609d1bde4a773c034427e1d105b1897a6565	2026-07-16 06:11:06.746284+00	20260714_reconcile_pre_phase3_schema_drift		\N	2026-07-16 06:11:06.746284+00	0
6754d43a-77bd-4aca-9069-1dd5a51845ef	888f79223760297c0901d26a960becc43d714f51a40a4fbf261d7bbc9157ff4a	2026-07-16 06:11:18.734142+00	20260714190000_phase3_baseline_workflow		\N	2026-07-16 06:11:18.734142+00	0
8a1ff896-6642-4bb5-8eab-527e65737c4f	7fc62f231236922586c62facc16ac5b7f2200264b299fa5213f878b877e0e144	2026-07-16 06:11:30.738384+00	20260714200000_harden_schedule_baseline_activation		\N	2026-07-16 06:11:30.738384+00	0
15b3be53-ead5-4bc2-b2fd-590fde44a5e5	5693b4b8fc81711149d8322b404dcdcdd68afa0f3b46f7d1b19cba5fe14a28e4	2026-07-16 06:11:42.864438+00	20260715_reconcile_gate7_boq_integrity_metadata		\N	2026-07-16 06:11:42.864438+00	0
4b13f1d2-018e-4721-b9fe-07441b410bbe	dea02b20ce06d021a7e41098a6284448e19a0e9ff798108229fb87552c382625	2026-07-16 06:11:55.034488+00	20260715100000_security_remediation		\N	2026-07-16 06:11:55.034488+00	0
\.


--
-- PostgreSQL database dump complete
--

\unrestrict kWLTqUmFfgSzzzdC294k9ck7QcNahzzVR803ndTCYzIKkXN1Ny7ZqQeT0UZE9dq

