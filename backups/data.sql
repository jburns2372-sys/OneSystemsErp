--
-- PostgreSQL database dump
--

\restrict 8YFqvKH4qN82bqsqfBzkMPDnsEH3cCF1uIFAS3aKbHt5BFmKtRTnVexPy4YvIhD

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
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
d39fdcaa-ee73-4b39-a2fd-e9ad84cec6ce	neon-camel-bell	ep-red-mountain-ap48rfat	2026-06-10 04:58:35.703+00	2026-06-10 04:58:35.703+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: neon_auth
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIAuditFinding; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIAuditFinding" (id, "transactionId", "moduleName", "findingType", description, "riskLevel", "detectedAt") FROM stdin;
\.


--
-- Data for Name: AIConfiguration; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIConfiguration" (id, "primaryPlanningModel", "secondaryClassificationModel", "fallbackModel", "reasoningEffort", "maxOutputTokens", "timeoutMs", "retryLimit", "promptVersion", "jsonSchemaVersion", "schedulingRulesVersion", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIDuplicatePhotoCheck; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIDuplicatePhotoCheck" (id, "currentFileId", "matchedFileId", "projectId", "similarityScore", "matchType", "previousBillingId", "previousAccomplishmentId", result, "createdAt") FROM stdin;
\.


--
-- Data for Name: AIExecutiveQuery; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIExecutiveQuery" (id, "userId", "userRole", "queryText", "scopeType", "projectId", "dateRangeStart", "dateRangeEnd", "aiResponse", "sourceReferences", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIGeneratedReport; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIGeneratedReport" (id, "reportCode", "reportType", title, "scopeType", "projectId", "departmentId", "dateRangeStart", "dateRangeEnd", "generatedById", "reviewedById", "approvedById", status, "aiSummary", "aiFindings", "aiRecommendations", "sourceReferences", "filePdfUrl", "fileExcelUrl", "fileDocxUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIGeneratedReportVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIGeneratedReportVersion" (id, "reportId", "versionNumber", "editedById", "aiSummary", "aiFindings", "aiRecommendations", "managementRemarks", "sourceReferences", "filePdfUrl", "fileExcelUrl", "fileDocxUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIHumanReview; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIHumanReview" (id, "reviewerId", "reviewerRole", decision, remarks, "overrideReason", "aiValidationRunId", "reviewedAt") FROM stdin;
\.


--
-- Data for Name: AIModulePrompt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIModulePrompt" (id, category, "moduleName", "promptTemplate", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AINotebookReference; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AINotebookReference" (id, "fileName", "fileType", "fileUrl", "uploadedBy", "uploadedByRole", "projectAssignment", "moduleAssignment", "referenceCategory", "effectiveDate", "expiryDate", "versionNumber", status, "isMandatory", "supersededById", "approvedBy", "approvedDate", "isLocked", "aiIndexingStatus", "aiSummary", keywords, "validationUseCase", "fileHash", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AINotification; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AINotification" (id, "userId", "userRole", message, "moduleName", "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIQuerySecurityLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIQuerySecurityLog" (id, "userId", role, "projectScope", query, "normalizedQuery", "detectedThreat", blocked, "retrievedDocumentIds", "blockedDocumentIds", "dataClassificationUsed", "responseStatus", "tokenUsage", "costEstimate", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIReferenceUsageLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIReferenceUsageLog" (id, "referenceId", "transactionId", "moduleName", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIRiskScore; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIRiskScore" (id, "transactionId", "moduleName", "riskLevel", score, reasons, "createdAt") FROM stdin;
\.


--
-- Data for Name: AISearchLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AISearchLog" (id, "userId", "userRole", "searchQuery", "moduleScope", "createdAt") FROM stdin;
\.


--
-- Data for Name: AITransactionValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AITransactionValidation" (id, "moduleName", "transactionId", "userId", "userRole", "validationType", "referenceId", "referenceVersionId", "validationStatus", "riskLevel", "aiFindings", "aiRecommendation", "blockingFlag", "overrideAllowed", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationEvidence; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationEvidence" (id, "evidenceType", "fileUrl", "fileName", source, "capturedFromLiveCamera", "cameraId", latitude, longitude, "timestamp", "metadataStatus", "aiValidationRunId", "evidenceFileId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationFinding; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationFinding" (id, "findingCategory", "findingTitle", "findingDescription", severity, "confidenceScore", "relatedFileId", "relatedBoqItemId", "recommendedAction", "aiValidationRunId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationLog" (id, "moduleName", "transactionId", "userId", "userRole", "validationType", "validationResult", "riskLevel", "aiFindings", "aiRecommendation", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationOverride; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationOverride" (id, "validationResultId", "transactionId", "moduleName", "overriddenBy", "overriddenByRole", "overrideReason", "supportingAttachment", "approvedBy", "approvedByRole", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationRecord" (id, "projectId", "moduleSource", "relatedDocumentId", "relatedBillingId", "relatedBoqItemId", "evidenceType", "evidenceFileUrl", "aiFindings", "aiConfidenceScore", "riskLevel", recommendation, status, "createdById", "reviewedById", "reviewedAt", "approvalAction", "overrideReason", "auditTrailRef", "findingsData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationResult; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationResult" (id, type, status, score, details, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationRule" (id, "ruleCode", description, "moduleName", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIValidationRun; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIValidationRun" (id, "validationType", status, "overallScore", "visualScore", "locationScore", "dateScore", "boqMatchScore", "planMatchScore", "duplicateRiskScore", recommendation, "summaryFindings", "createdById", "completedAt", "projectId", "accomplishmentId", "billingId", "boqItemId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AIVariationOrderValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIVariationOrderValidation" (id, "validationType", result, "confidenceLevel", "riskLevel", findings, "missingRequirements", "duplicateWarnings", "recommendedAction", "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIWorkerValidationResult; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AIWorkerValidationResult" (id, "workerId", category, severity, message, "fieldRef", status, "ignoreReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Accomplishment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Accomplishment" (id, "billingPeriod", "accomplishmentDate", remarks, "preparedById", status, "approvedAmount", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AccomplishmentItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AccomplishmentItem" (id, "workCategory", "descriptionOfWork", "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "remainingQuantity", "unitCost", "currentAccomplishmentAmount", "totalAccomplishmentAmount", "percentageAccomplished", "aiValidationStatus", "inspectionStatus", "approvalStatus", remarks, "accomplishmentId", "boqItemId") FROM stdin;
\.


--
-- Data for Name: AccomplishmentRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AccomplishmentRecord" (id, "jobOrderId", description, "quantityCompleted", "completedAt", photos, videos, "aiValidationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AccountsPayable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AccountsPayable" (id, amount, "dueDate", status, "paymentMethod", "paymentRef", "paidAt", "paidAmount", "netAmount", "vatAmount", "deliveryId", "poId", "supplierId", "createdAt", "updatedAt", "voucherNumber") FROM stdin;
\.


--
-- Data for Name: AiAccessAuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiAccessAuditLog" (id, "userId", "userRole", "projectId", question, "answerStatus", "denialReason", "sourcesRetrieved", "sourcesDenied", "tokensUsed", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiChatMessage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiChatMessage" (id, "sessionId", "userId", role, message, "authorizedContextUsed", "citedSources", "projectId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiChatSession; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiChatSession" (id, "userId", "projectId", "moduleName", "sessionTitle", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiComparisonMap; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiComparisonMap" (id, "comparisonName", "userQuestionPattern", "primaryModule", "primaryTable", "primaryField", "relatedModules", "relatedTables", "relatedFields", "comparisonLogic", "calculationFormula", "requiredPermission", "projectScoped", confidential, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiIndexingJob; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiIndexingJob" (id, "jobType", status, "sourceCount", "chunkCount", "errorMessage", "startedAt", "completedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiKnowledgeChunk; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiKnowledgeChunk" (id, "sourceId", "chunkIndex", "chunkText", "chunkSummary", "moduleName", "projectId", "allowedRoles", "visibilityScope", "confidentialityLevel", "vectorEmbedding", "tokenCount", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiKnowledgeMap; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: AiKnowledgeSource; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiKnowledgeSource" (id, "sourceType", title, description, "moduleName", "projectId", "filePath", "storageUrl", "originalFilename", "mimeType", "uploadedById", "visibilityScope", "allowedRoles", "allowedProjects", "confidentialityLevel", status, "indexedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagEmbedding; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiRagEmbedding" (id, "sourceType", "sourceModule", "sourceRecordId", "sourceTitle", "sourceTextChunk", "embeddingVector", "metadataJson", "accessLevel", "projectId", "modulePermissionRequired", "confidentialityLevel", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagKeywordRegistry; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: AiRagNoiseExclusion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiRagNoiseExclusion" (id, "noiseTerm", "normalizedTerm", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRagSchemaMap; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiRagSchemaMap" (id, "moduleName", "tableName", "fieldName", "fieldAlias", "fieldDescription", "dataType", "relationshipTable", "relationshipField", searchable, filterable, comparable, aggregatable, confidential, "requiredAccessRole", "requiredPermission", "projectScoped", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRegistryCleanupReport; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiRegistryCleanupReport" (id, "runBy", "runAt", "totalRowsScanned", "duplicateGroupsFound", "rowsMerged", "aliasesMerged", "schemaFieldsMoved", "uiLabelsMoved", "noiseTermsExcluded", "acronymsFixed", "activeRowsRemaining", "rollbackSupported", "rolledBackAt", "rolledBackBy") FROM stdin;
\.


--
-- Data for Name: AiSystemEnumRegistry; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiSystemEnumRegistry" (id, "enumValue", "normalizedValue", "enumCategory", "businessMeaning", aliases, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiUiActionRegistry; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AiUiActionRegistry" (id, "uiLabel", "normalizedLabel", "componentOrPage", "actionType", aliases, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Allowance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Allowance" (id, "workerId", type, amount, "isTaxable", frequency, "effectiveDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AuditLog" (id, "userId", "userRole", "moduleName", "transactionId", "actionType", "oldValue", "newValue", remarks, "ipAddress", "deviceInfo", "createdAt") FROM stdin;
cmrirfspj000aif04kgitnz75	cmqiy15bq0000vc1cq1f3zg6j	\N	SYSTEM_SETTINGS	\N	DELETE	\N	\N	MASTER RESET: All transactional and master data wiped. Only Users, System Roles, Access Matrix, and Knowledge Base preserved.	\N	\N	2026-07-13 05:06:51.032
\.


--
-- Data for Name: AwardedBOQItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."AwardedBOQItem" (id, "itemCode", category, description, unit, quantity, "directCost", "indirectCost", "combinedUnitCost", "totalCost", "previousQuantityAccomplished", "currentQuantityAccomplished", "totalQuantityAccomplished", "remainingQuantity", "percentageAccomplished", "amountAccomplished", "balanceAmount", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", "previousBilledQuantity", "currentBillingQuantity", "totalBilledQuantity", "revenueRecognized", "actualOrderedQuantity", "actualDeliveredQuantity", "actualInstalledQuantity", "finalApprovedInstalledQuantity", "materialSavingsQuantity", "materialSavingsAmount", "wastageQuantity", "actualCost", "costVariance", "aiValidationRequired", "requiredEvidenceType", status, "processingType", "projectId", "createdAt", "updatedAt") FROM stdin;
cmrirhhwl0001ic0435u6sn61		\N	I GENERAL REQUIREMENTS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwl0002ic04moy0zxdf		\N	PERMITS, FEES, TAXES AND LICENSES		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0003ic04064fl1yv		\N	a. Barangay Permits by client		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0004ic04ejvbcb40		\N	b. Local Government Permits by client		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0005ic04ypko2gim		\N	c. BFD Permits by client		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0006ic04tutbisiv		\N	d. DENR Permits by client		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0007ic04f2lhjr7o		\N	e. Permits and Fees by client		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0008ic04lr0f6pd9		\N	INSURANCES AND BONDS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm0009ic049k3f8z6e		\N	a. Guarantee / Warranty Bonds Included		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000aic048gghwbnm		\N	b. Contractor's All Risk Insurance (CARI) Included		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000bic04imfk2nuv		\N	c. Performance Bond Included		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000cic04s7ljngyn		\N	d. Other Insurances and Bonds Excluded		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000dic04qo51wxt0	1.0	\N	Mobilization and Demobilization	lot	1	0	0	98313.33333333333	103229	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000eic04tbaaph7r		\N	Site Management Work		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000fic0406t5sguf	1.0	\N	a. Project Management	lot	1	0	0	646643.8095238095	678976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000gic0423kdk3cf	2.0	\N	b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	0	0	266266.6666666666	279579.9999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000hic04djizf9j0	3.0	\N	c.Quality Management	lot	1	0	0	266266.6666666666	279579.9999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000iic049hc1vmpj	4.0	\N	d. Engineering Management\r\n - Clarifications & Drawings	lot	1	0	0	304303.8095238095	319519	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000jic04l89ah2hu		\N	Temporary Works		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwm000kic040btsis11	1.0	\N	a. Site Office	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000lic04arcb1av1	2.0	\N	b. Warehouse	lot	1	0	0	49157.14285714286	51615	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000mic04af1l1i2f	3.0	\N	b. Site Office Materials & Communication	lot	1	0	0	14044.7619047619	14747	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000nic04of68djxo	4.0	\N	c. Temporary Tools & Cleaning Materials	lot	1	0	0	7022.857142857142	7373.999999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000oic04xo27duet	5.0	\N	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	0	0	175560	184338	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000pic04304lp4bp		\N	Temporary Utilities		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000qic04nxatrf4i	1.0	\N	a. On-Site Water Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000ric04fg60jlkl	2.0	\N	b. On-Site Electric Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000sic0449ve6b0m		\N	Security, Safety and Protection		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000tic04s2wq48qq	1.0	\N	a. Safety Officer	lot	1	0	0	316006.6666666666	331806.9999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000uic04ow02ziv2	2.0	\N	b. Personal Protective Equipment (PPE's)	lot	1	0	0	70223.80952380953	73735	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000vic04qwwajsy9	3.0	\N	b. Security Guards	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000wic04903rs4jh		\N	Quality Standard and Control		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000xic04byt0ina1	1.0	\N	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	0	0	112358.0952380952	117976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000yic04d8tm1g02	2.0	\N	b. Material Testing	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn000zic04r2dfxujp		\N	Transportation		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn0010ic04gfmvkn5i	1.0	\N	a. Manpower Service	lot	1	0	0	140447.6190476191	147470	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwn0011ic04tphyitl1	2.0	\N	b. Engineer Transportation	lot	1	0	0	105336.1904761905	110603	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0012ic047e2ggqu4		\N	c. Village Delivery/Gate Pass Fees NA		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0013ic04fb4zpq0q		\N	III MECHANICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0014ic04qzfd5gt5		\N	Mechanical Works		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0015ic043xyisc6h		\N	I-A. AIR CONDITIONING- VRV SYSTEM A		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0016ic049bdbcg79	AIR CONDITIONING- VRV SYSTEM A	\N	ACCU- 18HP Model: RXQ18BYM	units	3	0	0	588141.0396825396	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0017ic04t2waet82	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	6	0	0	43720.11111111111	330524.0399999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0018ic04lzb0akxj	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	0	0	44621.31746031746	168668.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo0019ic04ysm4blwk	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	0	0	69468.80158730158	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001aic04eitwy3vf		\N	ACU Accessories:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001bic04tpnn1bnr	ACU Accessories:	\N	Navigation Wired Controller Model: BRC1E63	units	11	0	0	9333.904761904763	129367.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001cic04qo1lwhaf	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	17734.42063492064	44690.74000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001dic04v59zce2n	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	2	0	0	3453.547619047619	8702.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001eic04kbmrp7z8	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	2	0	0	3920.246031746032	9879.020000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001fic04g2w706j9	ACU Accessories:	\N	Refnet Joints Model: KHRP26A732T	units	3	0	0	6533.738095238095	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001gic04plk863b6	ACU Accessories:	\N	Refnet Joints Model: KHRP26A733T	units	3	0	0	11200.69047619048	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001hic04t5vd7qnz	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	4760.293650793651	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwo001iic04pv3rpc21	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	31548.5873015873	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001jic049ch48ecc		\N	Copper Pipes - Type L Hard Drawn Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001kic04tng0u7l5	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	10	0	0	1682.801587301587	21203.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001lic04f55jdewn	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	13	0	0	2343.134920634921	38380.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001mic0475k42u1o	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	14	0	0	3727.714285714286	65756.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001nic04jh8dmp0m	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	9	0	0	5377.738095238095	60983.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001oic04r8mbe0m1	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	9	0	0	6858.992063492063	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001pic04j3itzqqz	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	2	0	0	8626.992063492064	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001qic04b428vika	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	8	0	0	12354.69841269841	124535.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001ric044k0p9xnm	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	5	0	0	16678.83333333334	105076.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001sic04fbjo6hxa	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	4	0	0	16678.83333333334	84061.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001tic04xviucorw		\N	Copper Pipes Insulation 25mm Thick		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001uic045mdjwosr	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	19	0	0	344.1031746031746	8237.83	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001vic04o4thfos2	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	26	0	0	350.6587301587301	11487.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001wic041w8l6yrh	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	27	0	0	409.6428571428571	13936.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001xic04a05ysjzt	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	18	0	0	499.7698412698413	11334.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001yic04x3kt75jk	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	17	0	0	562.031746031746	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp001zic0436oz6enb	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	4	0	0	622.6587301587301	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwp0020ic04gdbostqh	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	15	0	0	671.8174603174604	12697.35	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0021ic04lymamnys	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	10	0	0	711.1349206349206	8960.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0022ic049218oa03	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	8	0	0	711.1349206349206	7168.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0023ic04rp3qesta	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	46012.63492063492	57975.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0024ic04qhu4tst4	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	22	0	0	2545.619047619048	70564.56000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0025ic048wrguv6v	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	17684.00793650794	22281.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0026ic04zlxx5356	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	7636.833333333333	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0027ic04s5ezb4cs		\N	Condensate Drain Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0028ic04gtnirk6a	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	39	0	0	320.7539682539683	15761.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq0029ic042g6jvgby	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	22	0	0	509.3888888888889	14120.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002aic04aj7u9ok5		\N	Condensate Drain Pipes Rubber Insulation 1.5 meters		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002bic04mj294wb0	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	77	0	0	339.4206349206349	32930.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002cic04t6vtis7c	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	43	0	0	644.8968253968253	34940.50999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002dic04corp1jhf		\N	Drain Pump		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002eic04uy9v7e8x	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	9	0	0	24185.04761904762	274258.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002fic04runcyfd0		\N	Fittings		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002gic047mizdu0z	Fittings	\N	Wye Reducer 50 x 32	pcs	11	0	0	152.7460317460317	2117.059999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwq002hic04ixjokd6g	Fittings	\N	Tee 32mm	pcs	2	0	0	42.43650793650794	106.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002iic04sp1hgix8	Fittings	\N	Tee Reducer 50 x 32	pcs	2	0	0	161.2301587301587	406.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002jic042lc7e7el	Fittings	\N	Elbow 32mm	pcs	6	0	0	34.62698412698413	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002kic04h9x8n3wa	Fittings	\N	Cleanout 50mm	pcs	4	0	0	169.7142857142857	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002lic04bmyr9jt0		\N	RELATED ELECTRICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002mic04w0x9y20u		\N	Rough-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002nic04j2010ow3	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	320.7539682539683	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002oic044nokcul0	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	586	0	0	52.27777777777778	38599.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002pic04righq0q1	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	29	0	0	25.46825396825397	930.6100000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002qic04e62x83bf		\N	Cables / Wires		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002ric040ccjj76s	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	419	0	0	64.15873015873017	33871.96000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002sic04c1pqq57e	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	71	0	0	62.28571428571429	5572.080000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002tic04246au0v5	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	95.32539682539682	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002uic04s3vbzu9g	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	627.2460317460317	46629.47	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002vic04agz1r7w7		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002wic042u9w09ed	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	72	0	0	62.28571428571429	5650.560000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwr002xic04o5bomt9a	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	149.1111111111111	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws002yic040751wioy		\N	I-B. CONSUMABLES		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws002zic04vcca5rty	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	1103.103174603174	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0030ic04rv7ac1zb	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	2002.555555555556	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0031ic0480no0y96	CONSUMABLES	\N	Rugby	bottle	21	0	0	220.6269841269842	5837.790000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0032ic04z11fiudm	CONSUMABLES	\N	White Tape	rolls	42	0	0	296.9999999999999	15717.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0033ic04fl980hc3	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	94	0	0	135.7698412698413	16080.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0034ic0457h36kmq	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	16.97619047619048	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0035ic04bq9ekzsq	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	8.49206349206349	342.3999999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0036ic04bs275189	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	2723.809523809524	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0037ic04wtxw5fzu	CONSUMABLES	\N	Loop Hangers	pcs	351	0	0	33.95238095238096	15015.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0038ic04mbcc8nxf	CONSUMABLES	\N	Freon	tank	6	0	0	11506.16666666667	86986.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws0039ic04ebb0l0j1	CONSUMABLES	\N	Nitrogen	tank	3	0	0	14425.12698412698	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws003aic04leu5rrd7	CONSUMABLES	\N	Mapp Gas	tank	11	0	0	678.8333333333333	9408.63	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws003bic04dqf2k2gp	CONSUMABLES	\N	Silver Rod	pcs	141	0	0	42.43650793650794	7539.27	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhws003cic0476pk4367	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	169.7142857142857	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003dic04b7859yqv	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	585197.4920634922	737348.8400000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003eic047aw282al	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	4511.158730158731	5684.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003fic04rrol4onn	TESTING & COMMISSIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	32771.06349206349	41291.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003gic049oxqwluw		\N	II.A AIR CONDITIONING- VRV SYSTEM B		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003hic046seu157i	AIR CONDITIONING- VRV SYSTEM B	\N	ACCU-  Model: RXQ18BYM	units	3	0	0	588141.0396825396	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003jic04j81t0rkg	AIR CONDITIONING- VRV SYSTEM B	\N	FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	0	0	44621.31746031746	112445.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003kic04ueyr96fa	AIR CONDITIONING- VRV SYSTEM B	\N	FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	0	0	69468.80158730158	87530.69	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003lic04w8waq6a6		\N	Accessories:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003mic0410stp1rb	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	13	0	0	9333.904761904763	152889.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003nic043zqquldq	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	1	0	0	17734.42063492064	22345.37	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003oic04ruxlzqcq	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	6	0	0	3453.547619047619	26108.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003pic04nxq92yfs	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	1	0	0	3920.246031746032	4939.510000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwt003qic04hcdogb1b	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	3	0	0	6533.738095238095	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003ric0403av5wbz	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	2	0	0	11200.69047619048	28225.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003sic04mhxaelcj	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	2	0	0	4760.293650793651	11995.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004wic04v2p7lfy9		\N	RELATED ELECTRICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003tic04hx9mdxh6	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	31548.5873015873	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003uic040m0z1gfq		\N	Copper Pipes - Type L Hard Drawn Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003vic04p99ba9ak	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	14	0	0	1682.801587301587	29684.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003wic04gwjwqai4	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	11	0	0	2343.134920634921	32475.85000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003xic04rfrow78v	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	15	0	0	3727.714285714286	70453.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003yic04ekhxflyo	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	12	0	0	5377.738095238095	81311.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu003zic04kqfnrcst	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	13	0	0	6858.992063492063	112350.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0040ic04cfsqpfom	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	1	0	0	8626.992063492064	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0041ic04dyvhnx2w	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	12354.69841269841	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0042ic049zxgntn0	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	1	0	0	21460.13492063492	27039.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0043ic04q6juc61z	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	12	0	0	21460.13492063492	324477.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0044ic04b7wg9t4n		\N	Copper Pipes Insulation 25mm Thick		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwu0045ic04lw6cb0ty	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	27	0	0	344.1031746031746	11706.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv0046ic048jhmlndp	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	21	0	0	350.6587301587301	9278.429999999998	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv0047ic04lnryjswn	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	30	0	0	409.6428571428571	15484.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv0048ic04vq8safwi	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	24	0	0	499.7698412698413	15113.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv0049ic04s0xi2hqu	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	26	0	0	562.031746031746	18412.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004aic045plf66i9	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	2	0	0	622.6587301587301	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004bic047gt906nk	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	9	0	0	671.8174603174604	7618.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004cic04dr9nt0u2	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	2	0	0	802.9047619047619	2023.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004dic042tgpf8rd	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	24	0	0	802.9047619047619	24279.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004eic04cggnlv2l	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	69629.73015873015	87733.45999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004fic04fdxh22k3	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	26	0	0	2545.619047619048	83394.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004gic04two3ni64	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	6535.531746031746	8234.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004hic04a41mc6iy	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	7636.833333333333	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwv004iic04zddsxwv1		\N	Condensate Drain Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004jic04mo3rt3rr	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	37	0	0	320.7539682539683	14953.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004kic04gi3ee59i	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	24	0	0	509.3888888888889	15403.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004lic04uwd4fvu5		\N	Condensate Drain Pipes Rubber Insulation 1.5 meters		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004mic04d3j7rfvq	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	74	0	0	339.4206349206349	31647.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004nic04nsz6rmj3	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	48	0	0	644.8968253968253	39003.35999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004oic04yk9os6ch		\N	Drain Pump		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004pic04my68ms8x	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	12	0	0	24185.04761904762	365677.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004qic04twrnz0b2		\N	Fittings		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004ric04ooskbhdq	Fittings	\N	Wye 50mm	pcs	3	0	0	169.7142857142857	641.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004sic04xevb5yr4	Fittings	\N	Wye Reducer 50 x 32	pcs	13	0	0	152.7460317460317	2501.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004tic04ged5f4iy	Fittings	\N	Tee 32mm	pcs	3	0	0	42.43650793650794	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004uic04pzrai1bz	Fittings	\N	Elbow 32mm	pcs	6	0	0	34.62698412698413	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004vic046d3j967b	Fittings	\N	Cleanout 50mm	pcs	4	0	0	169.7142857142857	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhww004xic04iw4sh01i		\N	Rough-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx004yic04omzb5vc1	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	320.7539682539683	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx004zic04eyomf68p	Rough-ins	\N	Metallic Flexible Conduit	m	673	0	0	52.27777777777778	44330.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0050ic04tohu75jx	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	34	0	0	25.46825396825397	1091.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0051ic04xrgfo0p6		\N	Cables / Wires		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0052ic04idd37z7z	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	482	0	0	64.15873015873017	38964.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0053ic04w5luwazf	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	94	0	0	62.28571428571429	7377.120000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0054ic040l5zvikl	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	13	0	0	91.92857142857144	1505.79	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0055ic04c968w5sx	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	626.5634920634922	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0056ic04ipf9wat2		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0057ic04doghd5y4	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	85	0	0	62.28571428571429	6670.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0058ic04lkq93q4s	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	149.1111111111111	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx0059ic045wax5dgx		\N	CONSUMABLES		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx005aic04pfmejfyu	CONSUMABLES	\N	Vibration Isolator	pcs	16	0	0	1103.103174603174	22238.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx005bic04hygtbgnn	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	6	0	0	2002.555555555556	15139.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx005cic04vjszzc1x	CONSUMABLES	\N	Rugby	bottle	25	0	0	220.6269841269842	6949.750000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwx005dic04dmlmjjwq	CONSUMABLES	\N	White Tape	rolls	49	0	0	296.9999999999999	18336.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005eic043m60opdq	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	107	0	0	135.7698412698413	18304.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005fic046p4c0oct	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	16.97619047619048	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005gic04m7bpj2tf	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	8.49206349206349	342.3999999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005hic04lj68imw5	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	2723.809523809524	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005iic04tnqxa98z	CONSUMABLES	\N	Loop Hangers	pcs	402	0	0	33.95238095238096	17197.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005jic04ifzcbuvd	CONSUMABLES	\N	Freon	tank	7	0	0	11506.16666666667	101484.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005kic04fphv3uq4	CONSUMABLES	\N	Nitrogen	tank	4	0	0	14425.12698412698	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005lic04u63oc0l6	CONSUMABLES	\N	Mapp Gas	tank	12	0	0	678.8333333333333	10263.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005mic04dx2xxcpq	CONSUMABLES	\N	Silver Rod	pcs	160	0	0	42.43650793650794	8555.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005nic04y7yrdniq	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	169.7142857142857	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005oic04iivh5ew8	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	585197.4920634922	737348.8400000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005pic04e12yddlu	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	5270.404761904762	6640.710000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005qic04g8ylpcnd	TESTING & COMMISIONING	\N	TESTING & COMMISIONING	lot	1	0	0	37452.64285714286	47190.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005ric04f5x06o3e		\N	III.A AIR CONDITIONING- VRV SYSTEM C		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwy005sic04pnv35ny9	AIR CONDITIONING- VRV SYSTEM C	\N	ACCU- Model: RXQ18BYM	units	3	0	0	588141.0396825396	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz005vic04g0lf9ad2	AIR CONDITIONING- VRV SYSTEM C	\N	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	69468.80158730158	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz005wic04z000ryh2		\N	Accessories:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz005xic04x80onq4i	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	10	0	0	9333.904761904763	117607.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz005yic044b507o5c	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	17734.42063492064	44690.74000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz005zic04w4xukn61	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	2	0	0	3920.246031746032	9879.020000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0060ic04phs14ow9	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	4	0	0	6533.738095238095	32930.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0061ic04kqg7acp5	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	3	0	0	11200.69047619048	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0062ic04l0s040hx	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	4760.293650793651	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0063ic04waks123g	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	31548.5873015873	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0064ic049vly3gsu		\N	Copper Pipes - Type L Hard Drawn Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0065ic04x3jtstb8	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	1	0	0	1682.801587301587	2120.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0066ic04vb1buo40	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	11	0	0	2343.134920634921	32475.85000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0067ic048mjsevwl	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	2	0	0	3727.714285714286	9393.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0068ic044c5rvzmu	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	14	0	0	5377.738095238095	94863.30000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhwz0069ic04btv6bdk1	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	9	0	0	6858.992063492063	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006aic044xaa4e9z	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	1	0	0	8626.992063492064	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006bic0426gwjpcl	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	12354.69841269841	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006cic040cuws42z	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	3	0	0	16678.83333333334	63045.99000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006dic04gxhbikfm	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	7	0	0	21460.13492063492	189278.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006eic04upi6056h		\N	Copper Pipes Insulation 25mm Thick		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006fic04baruy0af	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	2	0	0	344.1031746031746	867.1399999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006gic04nou04k20	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	21	0	0	350.6587301587301	9278.429999999998	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx0006hic04z3d6eutq	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	4	0	0	409.6428571428571	2064.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006iic04xaxt5w0k	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	27	0	0	499.7698412698413	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006jic04qd48psry	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	17	0	0	562.031746031746	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006kic04b1xigg2r	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	2	0	0	622.6587301587301	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006lic04uzjslbsk	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	10	0	0	671.8174603174604	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006mic04ko01554c	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	5	0	0	711.1349206349206	4480.15	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006nic04bkjzrgio	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	13	0	0	802.9047619047619	13151.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006oic043z1g380y	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	46932.65873015873	59135.14999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006pic048yunsuk2	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	20	0	0	2545.619047619048	64149.60000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006qic04zi1uhf3j	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	15644.22222222222	19711.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006ric04lwrm2asm	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	7636.833333333333	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006sic040ayfr90y		\N	Condensate Drain Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006tic04n22z9v1o	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	33	0	0	320.7539682539683	13336.95	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006uic04gtf2g91s	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	12	0	0	509.3888888888889	7701.959999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006vic040ijm7zsm		\N	Condensate Drain Pipes Rubber Insulation 1.5 meters		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006wic04vmiahcxx	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	66	0	0	339.4206349206349	28226.21999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx1006xic04234qxo1a	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	23	0	0	644.8968253968253	18689.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2006yic04dxeglsm4		\N	Drain Pump		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2006zic04a1ogwq0i	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	11	0	0	24185.04761904762	335204.76	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20070ic04yzv62k13		\N	Fittings		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20071ic044jwjmlrf	Fittings	\N	Wye Reducer 50 x 32	length/s	7	0	0	152.7460317460317	1347.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20072ic04cl195ybl	Fittings	\N	Tee 32mm	length/s	6	0	0	42.43650793650794	320.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20073ic04aug41nuf	Fittings	\N	Elbow 32mm	length/s	7	0	0	34.62698412698413	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20074ic046vso8rcc	Fittings	\N	Cleanout 50mm	length/s	2	0	0	169.7142857142857	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20075ic04qch0ijps		\N	RELATED ELECTRICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20076ic041rzwwfrc		\N	Rough-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20077ic047xczzeni	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	320.7539682539683	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20078ic04w3pz93ll	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	444	0	0	52.27777777777778	29246.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx20079ic04zsbi3w08	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	26	0	0	25.46825396825397	834.3400000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2007aic048prpt12i		\N	Cables / Wires		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2007bic04caj7jwv4	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	291	0	0	64.15873015873017	23524.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2007cic0486k87vur	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	63	0	0	62.29365079365079	4944.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx2007dic04t092ibxj	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	95.32539682539682	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007eic042141rbpy	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	626.5634920634922	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007fic04saiqh54d		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007gic04jbg7ufox	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	65	0	0	62.29365079365079	5101.849999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007hic047bm3nr1z	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	149.1111111111111	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007iic04jnzthxye		\N	CONSUMABLES		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007jic0407sjd5mi	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	1103.103174603174	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007kic04ycuv6c8u	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	2002.555555555556	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007lic04dco2un3z	CONSUMABLES	\N	Rugby	bottle	15	0	0	220.6269841269842	4169.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007mic04qyco72hu	CONSUMABLES	\N	White Tape	rolls	30	0	0	296.9999999999999	11226.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007nic04wb32ozll	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	65	0	0	135.7698412698413	11119.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007oic04ck58wu3n	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	16.97619047619048	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007pic04fyddnkt3	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	8.49206349206349	342.3999999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007qic04kyjyo401	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	2723.809523809524	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007ric04vqid1nhm	CONSUMABLES	\N	Loop Hangers	pcs	244	0	0	33.95238095238096	10438.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007sic04gqudu0c1	CONSUMABLES	\N	Freon	tank	5	0	0	11506.16666666667	72488.84999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx3007tic04o33egv8k	CONSUMABLES	\N	Nitrogen	tank	3	0	0	14425.12698412698	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007uic04gl8lrqba	CONSUMABLES	\N	Mapp Gas	tank	8	0	0	644.8968253968253	6500.559999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007vic04s3k9vn8y	CONSUMABLES	\N	Silver Rod	pcs	98	0	0	42.43650793650794	5240.059999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007wic04jmii7gi4	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	169.7142857142857	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007xic041fbq7vof	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	585197.4920634922	737348.8400000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007yic04wrn0h5af	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	3976.579365079365	5010.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx4007zic0448bt4twr	TESTING & COMMISIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	30430.26984126984	38342.14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40080ic04o60vebqa		\N	AIR CONDITIONING- VRV SYSTEM D		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40081ic04hvht8uz2	AIR CONDITIONING- VRV SYSTEM D	\N	ACCU- Model: RXQ20BYM	units	3	0	0	626442.2142857142	2367951.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40084ic04nvspa4zt	AIR CONDITIONING- VRV SYSTEM D	\N	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	69468.80158730158	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40085ic04y77suxvo		\N	Accessories:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40086ic04sb4vqffp	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	12	0	0	9333.904761904763	141128.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40087ic045dwb67de	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	17734.42063492064	44690.74000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx40088ic04jsyk6m47	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	4	0	0	3453.547619047619	17405.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx50089ic04bq6mvvqe	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	1	0	0	3920.246031746032	4939.510000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008aic04h9qjgefo	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	3	0	0	6533.738095238095	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008bic04g5x3ney1	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	3	0	0	11200.69047619048	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008cic046btpbijg	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	4760.293650793651	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008dic041utkfyci	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	31548.5873015873	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008eic04hs8sr3d8		\N	Copper Pipes - Type L Hard Drawn Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008fic04d0xhtfx6	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	8	0	0	1682.801587301587	16962.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008gic048zn13t1y	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	12	0	0	2343.134920634921	35428.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008hic04zxner2gv	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	10	0	0	3727.714285714286	46969.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008iic04t29at6xm	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	14	0	0	5377.738095238095	94863.30000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008jic041iecwlbd	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	16	0	0	6858.992063492063	138277.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008kic04f86a2kbv	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	2	0	0	8626.992063492064	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008lic04b6hsoo7w	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	12354.69841269841	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008mic04t1kv8oyi	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	2	0	0	16678.83333333334	42030.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008nic0431crn4fb	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	14	0	0	21460.13492063492	378556.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx5008oic04t8yuy3m2		\N	Copper Pipes Insulation 25mm Thick		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008pic047y9ztpn6	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	16	0	0	344.1031746031746	6937.119999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008qic0498u9vasw	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	24	0	0	350.6587301587301	10603.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008ric04m3s1vnqo	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	19	0	0	409.6428571428571	9806.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008sic04sk4dlqdo	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	27	0	0	499.7698412698413	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008tic049svkqici	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	31	0	0	562.031746031746	21952.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008uic04ap3bmpr7	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	4	0	0	622.6587301587301	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008vic04yn7jhtyz	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	10	0	0	671.8174603174604	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008wic049kfxen06	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	4	0	0	711.1349206349206	3584.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008xic043ttlnrt4	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	27	0	0	802.9047619047619	27314.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008yic04ril5hjt6	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	76714.2619047619	96659.96999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx6008zic04mnfo7k3j	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	24	0	0	2545.619047619048	76979.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx60090ic04o9vs3glg	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	25571.42857142857	32220	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx60091ic04xbealtjp	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	7636.833333333333	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx60092ic04mnxbbbs0		\N	Condensate Drain Pipes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx60093ic04g7ua7h7n	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	31	0	0	320.7539682539683	12528.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx60094ic04yhuxr0tl	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	38	0	0	509.3888888888889	24389.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx70095ic04woyg21c0		\N	Condensate Drain Pipes Rubber Insulation 1.5 meters		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx70096ic040o5q9p83	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	61	0	0	339.4206349206349	26087.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx70097ic04tgz1n9zr	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	75	0	0	644.8968253968253	60942.74999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx70098ic04qmyv75ye		\N	Drain Pump		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx70099ic04adxx1cq7	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	10	0	0	24185.04761904762	304731.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009aic04dhzkvq8c		\N	Fittings		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009bic044iy70ej8	Fittings	\N	Wye 50mm	length/s	2	0	0	169.7142857142857	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009cic04l2epiqci	Fittings	\N	Wye Reducer 50 x 32	length/s	11	0	0	152.7460317460317	2117.059999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009dic04lzpcdpkk	Fittings	\N	Tee 32mm	length/s	3	0	0	42.43650793650794	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009eic04jort71j2	Fittings	\N	Tee Reducer 50 x 32	length/s	3	0	0	161.2301587301587	609.4499999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009fic04pd4mo6dj	Fittings	\N	Elbow 32mm	length/s	7	0	0	34.62698412698413	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009gic04iq4svwt4	Fittings	\N	Cleanout 50mm	length/s	6	0	0	169.7142857142857	1283.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009hic04zaz4dysi		\N	RELATED ELECTRICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009iic04myfdhmwh		\N	Rough-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009jic04w4voejzo	Rough-ins	\N	liquid-tight metallic flexible conduits 2"	m	78	0	0	605.8650793650793	59544.41999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx7009kic0462251y9e	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	654	0	0	52.27777777777778	43078.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009lic041olsak22	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	32	0	0	25.46825396825397	1026.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009mic040vc6w66f		\N	Cables / Wires		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009nic049jwqwx3x	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	472	0	0	64.15873015873017	38156.48000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009oic04q7hqrdys	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	78	0	0	61.15079365079364	6009.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009pic04u22fzaxn	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	95.32539682539682	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009qic04gwgg2s6d	Cables / Wires	\N	Wire 38.0mm² THHN (5 meters per Unit)	m	59	0	0	744.6031746031746	55353.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009ric04a50cv16j		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009sic04m1jg52f2	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	78	0	0	59.80952380952381	5878.08	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009tic04o64hr99h	Cables / Wires	\N	Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	246.8333333333333	6220.200000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009uic04z54cm3nk		\N	CONSUMABLES		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009vic044iy6j7u0	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	1103.103174603174	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009wic04vmzzzttm	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	2002.555555555556	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009xic04lc4eb1hv	CONSUMABLES	\N	Rugby	bottle	24	0	0	220.6269841269842	6671.760000000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009yic043yn8gdvr	CONSUMABLES	\N	White Tape	rolls	47	0	0	296.9999999999999	17588.34	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx8009zic049toae254	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	104	0	0	135.7698412698413	17791.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a0ic04shjmc75o	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	16.97619047619048	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a1ic04zw9mg9tl	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	8.49206349206349	342.3999999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a2ic04v31a68kc	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	2723.809523809524	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a3ic0497cc27dx	CONSUMABLES	\N	Loop Hangers	pcs	393	0	0	33.95238095238096	16812.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a4ic04rcob0j3o	CONSUMABLES	\N	Freon	tank	8	0	0	11506.16666666667	115982.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a5ic04vtytwuhw	CONSUMABLES	\N	Nitrogen	tank	4	0	0	14425.12698412698	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a6ic0496kckkc9	CONSUMABLES	\N	Mapp Gas	tank	12	0	0	644.8968253968253	9750.839999999998	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a7ic0411ea2kwl	CONSUMABLES	\N	Silver Rod	pcs	158	0	0	42.43650793650794	8448.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a8ic04i4fjnab0	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	169.7142857142857	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900a9ic04rpyyuqis	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	585197.4920634922	737348.8400000002	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900aaic04opked8mh	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	5776.119047619048	7277.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900abic04tpz4wtys	TESTING & COMMISIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	35111.85714285714	44240.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900acic04vkh71q1i		\N	IV ELECTRICAL WORKS		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900adic04rmbti5sq		\N	Electrical Works		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900aeic04b6p8xjye		\N	I. Service Entrance Existing. Tap only		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhx900afic04stg5lj57		\N	II. Feeder		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00agic04atc1smli		\N	Feeder Wire		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00ahic04mnzr4d5m	Cables / Wires	\N	250mm² THHN	m	726	0	0	5628.857142857144	5149053.360000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00aiic04f22o2464	Cables / Wires	\N	200mm² THHN	m	117	0	0	4372.349206349207	644571.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00ajic040526g782	Cables / Wires	\N	38mm² THHN	m	390	0	0	894.031746031746	439327.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00akic04s1lmdza8		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00alic0494vtcb3j	Cables / Wires	\N	80mm² THHN	m	242	0	0	1690.285714285714	515401.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00amic04e8q4hyr0	Cables / Wires	\N	30mm² THHN	m	39	0	0	653.7222222222222	32123.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00anic04zddu6a2j	Cables / Wires	\N	14mm² THHN	m	130	0	0	284.8174603174603	46653.09999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00aoic045p0yx2om		\N	Roughing-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00apic04ll95e7yc	Roughing-ins	\N	90mm dia. IMC	length/s	94	0	0	7382.277777777778	874356.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00aqic04mtf9j5t6	Roughing-ins	\N	40mm dia. IMC	length/s	45	0	0	2121.349206349206	120280.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00aric041yvfj8nf		\N	III. Panel Board & Pullbox		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00asic042l0xxkqz	Panel Board & Pullbox	\N	DP-Main	Assy	1	0	0	612877.3412698413	772225.4500000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00atic045ht1zkul		\N	Main CB: 1200AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00auic04kq1ogu89		\N	Branches: 1 - 700AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxa00avic04494ga0rh		\N	4 - 125AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00awic04l89ufs48	Panel Board & Pullbox	\N	PP-System A	Assy	1	0	0	99862.7857142857	125827.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00axic04fq3k9swl		\N	Main CB: 125AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00ayic045hcs2mhs		\N	Branches: 2 - 40AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00azic04nelat2ei		\N	3 - 40AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b0ic04uyz7zwwz		\N	9 - 30AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b1ic049psql0l0	Panel Board & Pullbox	\N	PP-System B	Assy	1	0	0	107355.6587301587	135268.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b2ic04pprq5yzp		\N	Main CB: 125AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b3ic04pkympx9b		\N	Branches: 1 - 40AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b4ic04mgntnb18		\N	2 - 40AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b5ic04chzk7uih		\N	11 - 30AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b6ic04trrjiuet	Panel Board & Pullbox	\N	PP-System C	Assy	1	0	0	95389.53968253967	120190.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b7ic0407rzjfmg		\N	Main CB: 125AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b8ic04mg66evrq		\N	Branches: 2 - 40AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00b9ic04veyjb87i		\N	7 - 40AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00baic0492umixw9		\N	5 - 30AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxb00bbic04lar1f7sa	Panel Board & Pullbox	\N	PP-System D	Assy	1	0	0	104343.0555555556	131472.25	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bcic04p9itux50		\N	Main CB: 125AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bdic04ckyju3sa		\N	Branches: 3 - 40AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00beic0497ton30j		\N	4 - 40AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bfic04jvwmvof0		\N	8 - 30AT, 2P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bgic0480g6fzuh	Panel Board & Pullbox	\N	PP-Outdoor	Assy	1	0	0	375853.626984127	473575.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bhic04mkzg6upq		\N	Main CB: 700AT, 3P, 230V, 60Hz, Bolt-on Nema12		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00biic04bi2d5cqc		\N	Branches: 4 - 150AT, 3P		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bjic04x20rmes8	1.0	\N	Transformer	Assy	1	0	0	740157.7936507937	932598.8200000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bkic04292urbyi		\N	Transformer 500KVA Step Down Dry Type Transformer, 480V to 230V, 3P\r\nFloor mounted, Indoor Type, 60Hz, Nema1 "TRANSPHIL"		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00blic04hqso2rhn	ECB	\N	ECB 1250AT Nema 12	pc	1	0	0	239720.3095238096	302047.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bmic04k3fgmlr0	Pullbox	\N	Pullbox (350mm x 350mm x 200mm)	pc	5	0	0	4395.428571428571	27691.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bnic04acew76sj	Wire Gutter	\N	Wire Gutter	lot	1	0	0	25456.09523809524	32074.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00boic04vusypcl8		\N	IV. Mechanical System Power Supply		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bpic04jihm8occ		\N	ECB's		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxc00bqic04g5n5zgwd	ECB	\N	ECB 150AT, 3P, 230V, Nema3R	pc	4	0	0	23031.03968253968	116076.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bric04rqc0hjnd	ECB	\N	ECB 40AT, 3P, 230V, Nema3R	pc	7	0	0	8796.698412698413	77586.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bsic04x05ebxdm	ECB	\N	ECB 40AT, 2P, 230V, Nema3R	pc	16	0	0	7483.507936507937	150867.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00btic04yvzhpklm	ECB	\N	ECB 30AT, 2P, 230V, Nema3R	pc	23	0	0	7483.507936507937	216872.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00buic041nirjqxw		\N	Roughing-ins		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bvic04bovafjcu	Roughing-ins	\N	40mm dia. IMC	length/s	49	0	0	2121.349206349206	130972.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bwic04rj1vwxno	Roughing-ins	\N	25mm dia. IMC	length/s	1003	0	0	1391.611111111111	1758690.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bxic040crap2x5		\N	Roughing-ins Boxes		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00byic049ka18618	Roughing-ins	\N	Junction boxes with cover	pc/s	195	0	0	99.88095238095238	24540.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00bzic04t3jmvwss		\N	Wires		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c0ic04w64h8jnx	Cables / Wires	\N	50mm² THHN	Lm/s	429	0	0	1107.857142857143	598841.1000000001	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c1ic04vd5nuupi	Cables / Wires	\N	5.5mm² THHN	Lm/s	6798	0	0	114.3888888888889	979795.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c2ic046kg30acc		\N	for ground:		0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c3ic04vv6ygnr9	Cables / Wires	\N	14mm² THHN	Lm/s	143	0	0	284.8174603174603	51318.40999999999	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c4ic04i3rqidy4	Cables / Wires	\N	5.5mm² THHN	Lm/s	3185	0	0	114.3888888888889	459054.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c5ic0450e2biv8	Chipping & Restoration Works (Rough only)	\N	Chipping & Restoration Works (Rough only)	lot	1	0	0	115429.4365079365	145441.09	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxd00c6ic04a80twhh2	Hangers & Supports	\N	Hangers & Supports	lot	1	0	0	138515.3253968254	174529.31	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxe00c7ic04g225kpa3	Miscelleneuos	\N	Miscelleneuos	lot	1	0	0	69257.66666666667	87264.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrirhhxe00c8ic04qccwzden	Testing & Commissioning	\N	Testing & Commissioning	lot	1	0	0	702236.9920634921	884818.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	PENDING	MATERIAL_EQUIPMENT	cmrirhhw30000ic0406v47smb	2026-07-13 05:08:10.304	2026-07-13 05:08:10.304
cmrlx44mz0124vceo6s4ylza6	1.0	\N	Mobilization and Demobilization	lot	1	0	0	103229	103229	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44mz0125vceorgen7ina	1.0	\N	a. Project Management	lot	1	0	0	0	678976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44mz0126vceolsmsg4ri	2.0	\N	b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	0	0	0	279580	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44mz0127vceoz6p1ihx1	3.0	\N	c.Quality Management	lot	1	0	0	0	279580	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n00128vceo3f0yc99e	4.0	\N	d. Engineering Management\r\n - Clarifications & Drawings	lot	1	0	0	0	319519	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n00129vceo27omk1ba	1.0	\N	a. Site Office	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012avceop4jx14cs	2.0	\N	b. Warehouse	lot	1	0	0	0	51615	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012bvceoiwtfcuv7	3.0	\N	b. Site Office Materials & Communication	lot	1	0	0	0	14747	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012cvceo16591omf	4.0	\N	c. Temporary Tools & Cleaning Materials	lot	1	0	0	0	7374	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012dvceo9gduc0vf	5.0	\N	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	0	0	0	184338	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012evceosuk9i05v	1.0	\N	a. On-Site Water Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012fvceoc4ifnqdg	2.0	\N	b. On-Site Electric Consumption	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012gvceojgqhjxrf	1.0	\N	a. Safety Officer	lot	1	0	0	0	331807	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n0012hvceo1xvmpimt	2.0	\N	b. Personal Protective Equipment (PPE's)	lot	1	0	0	0	73735	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012ivceojup1dw93	3.0	\N	b. Security Guards	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012jvceo9m7cr9vi	1.0	\N	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	0	0	0	117976	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012kvceoaofh66e2	2.0	\N	b. Material Testing	lot	1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012lvceo88svddo4	1.0	\N	a. Manpower Service	lot	1	0	0	0	147470	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012mvceoexe3brq2	2.0	\N	b. Engineer Transportation	lot	1	0	0	0	110603	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012nvceo2ko4e10q	AIR CONDITIONING- VRV SYSTEM A	\N	ACCU- 18HP Model: RXQ18BYM	units	3	0	0	1259369.789999997	3778109.37	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012ovceorvoi5ga7	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	6	0	0	0	330524.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012pvceojx9sqy54	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	0	0	0	168668.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n1012qvceoqzskyz0n	AIR CONDITIONING- VRV SYSTEM A	\N	FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012rvceory6u0aoo	ACU Accessories:	\N	Navigation Wired Controller Model: BRC1E63	units	11	0	0	0	129367.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012svceorx8lp90z	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012tvceook3nzh4z	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	2	0	0	0	8702.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012uvceoviohc5q0	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	2	0	0	0	9879.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012vvceo3me5dl3c	ACU Accessories:	\N	Refnet Joints Model: KHRP26A732T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012wvceokavnaa0k	ACU Accessories:	\N	Refnet Joints Model: KHRP26A733T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012xvceo3j0zrj1k	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012yvceo5tgclsnt	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n2012zvceow7dl445u	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	10	0	0	0	21203.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n20130vceotlqnb9ku	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	13	0	0	0	38380.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30131vceo9ycccwcx	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	14	0	0	0	65756.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30132vceobamfawnc	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	9	0	0	0	60983.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30133vceoushs9h94	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	9	0	0	0	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30134vceo6q74cfzs	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	2	0	0	0	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30135vceon0mz20yc	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	8	0	0	0	124535.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30136vceoiao7tz23	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	5	0	0	0	105076.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30137vceo02xbrixp	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	4	0	0	0	84061.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n30138vceopyb6rdi2	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	19	0	0	0	8237.83	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n40139vceo2asuoxpq	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	26	0	0	0	11487.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013avceo39jxqnw3	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	27	0	0	0	13936.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013bvceoz35a3xej	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	18	0	0	0	11334.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013cvceoq6g73e1p	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	17	0	0	0	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013dvceostq06ded	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	4	0	0	0	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013evceoai6o7vag	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	15	0	0	0	12697.35	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013fvceo5kt5ezcj	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	10	0	0	0	8960.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013gvceo7bp062tr	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	8	0	0	0	7168.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013hvceox55nbf6n	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	0	57975.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n4013ivceof1gzarvr	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	22	0	0	0	70564.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013jvceowtl2fqda	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	0	22281.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013kvceo7lghm679	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013lvceof94r7jnv	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	39	0	0	0	15761.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013mvceov645teky	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	22	0	0	0	14120.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013nvceovkkgcgl9	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	77	0	0	0	32930.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013ovceo2l1r3pn0	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	43	0	0	0	34940.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013pvceozju0i99z	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	9	0	0	0	274258.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n5013qvceorut6mf5x	Fittings	\N	Wye Reducer 50 x 32	pcs	11	0	0	0	2117.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013rvceoezmihx3p	Fittings	\N	Tee 32mm	pcs	2	0	0	0	106.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013svceoay60cnw4	Fittings	\N	Tee Reducer 50 x 32	pcs	2	0	0	0	406.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013tvceoazihpaxa	Fittings	\N	Elbow 32mm	pcs	6	0	0	0	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013uvceobr8izjer	Fittings	\N	Cleanout 50mm	pcs	4	0	0	0	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013vvceonmp0zxsk	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013wvceo2eujqshd	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	586	0	0	0	38599.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013xvceo5l62fang	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	29	0	0	0	930.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013yvceoh718dxil	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	419	0	0	0	33871.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n6013zvceodwntogk7	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	71	0	0	0	5572.08	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70140vceo6cm01mdn	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70141vceohgxhhl3i	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46629.47	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70142vceo0fdh2f46	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	72	0	0	0	5650.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70143vceo5cfqe461	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70144vceoz846pdxt	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70145vceowamoh1q9	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70146vceors0bja4e	CONSUMABLES	\N	Rugby	bottle	21	0	0	0	5837.79	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70147vceozcuv9564	CONSUMABLES	\N	White Tape	rolls	42	0	0	0	15717.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70148vceo3nq0r37l	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	94	0	0	0	16080.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n70149vceobtp865ly	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014avceoa92rhwxy	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014bvceoeqjvrgpn	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014cvceotz145406	CONSUMABLES	\N	Loop Hangers	pcs	351	0	0	0	15015.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014dvceodvzddsmo	CONSUMABLES	\N	Freon	tank	6	0	0	0	86986.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014evceonikkyjrq	CONSUMABLES	\N	Nitrogen	tank	3	0	0	0	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014fvceooam6qldi	CONSUMABLES	\N	Mapp Gas	tank	11	0	0	0	9408.63	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014gvceoszfaazgy	CONSUMABLES	\N	Silver Rod	pcs	141	0	0	0	7539.27	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n8014hvceorqyqho6m	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014ivceoa8ooahj6	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014jvceoi2u9hf9u	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	0	5684.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014kvceo42oz7nig	TESTING & COMMISSIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	0	41291.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014lvceog4txtgre	AIR CONDITIONING- VRV SYSTEM B	\N	ACCU-  Model: RXQ18BYM	units	3	0	0	0	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014mvceofurwy8xk	AIR CONDITIONING- VRV SYSTEM B	\N	FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	0	0	0	112445.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44n9014nvceol69zirjc	AIR CONDITIONING- VRV SYSTEM B	\N	FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	0	0	0	87530.69	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014ovceoggvuspll	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	13	0	0	0	152889.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014pvceome8s77xq	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	1	0	0	0	22345.37	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014qvceotowozfnw	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	6	0	0	0	26108.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014rvceo0szqyqid	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	1	0	0	0	4939.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014svceo6okppi5v	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014tvceoi6r2osa8	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	2	0	0	0	28225.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014uvceof4d6g4pm	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	2	0	0	0	11995.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44na014vvceow0bx2rto	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb014wvceolz1fwlas	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	14	0	0	0	29684.62	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb014xvceotwqfwe8v	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	11	0	0	0	32475.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb014yvceoo9qweore	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	15	0	0	0	70453.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb014zvceompuw774n	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	12	0	0	0	81311.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb0150vceon1vcsezf	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	13	0	0	0	112350.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb0151vceok7ym4zfe	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	1	0	0	0	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb0152vceov3iyd2lq	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nb0153vceod3uban97	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	1	0	0	0	27039.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0154vceoletbnout	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	12	0	0	0	324477.24	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0155vceoa46owtk0	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	27	0	0	0	11706.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0156vceo164yx4hw	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	21	0	0	0	9278.43	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0157vceo0hqb42ok	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	30	0	0	0	15484.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0158vceodk8l39tr	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	24	0	0	0	15113.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc0159vceoyggcfjuj	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	26	0	0	0	18412.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc015avceoyd1opz4l	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	2	0	0	0	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nc015bvceoy9mw3sjn	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	9	0	0	0	7618.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015cvceodjjeooef	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	2	0	0	0	2023.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015dvceos7y54mfj	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	24	0	0	0	24279.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015evceoajnkwgg9	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	0	87733.46	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015fvceoq150j4a8	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	26	0	0	0	83394.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015gvceob4icjj7o	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	0	8234.77	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015hvceo8imkpx7b	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015ivceoi2ybgfj2	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	37	0	0	0	14953.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nd015jvceoozbmwakk	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	24	0	0	0	15403.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015kvceopfe6w83e	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	74	0	0	0	31647.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015lvceosuo0f73h	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	48	0	0	0	39003.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015mvceopgyftcqi	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	12	0	0	0	365677.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015nvceodtmb3nqd	Fittings	\N	Wye 50mm	pcs	3	0	0	0	641.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015ovceonemfhlzb	Fittings	\N	Wye Reducer 50 x 32	pcs	13	0	0	0	2501.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015pvceoxu5yq5lb	Fittings	\N	Tee 32mm	pcs	3	0	0	0	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ne015qvceoq5nvekpl	Fittings	\N	Elbow 32mm	pcs	6	0	0	0	261.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015rvceoljwvme7p	Fittings	\N	Cleanout 50mm	pcs	4	0	0	0	855.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015svceovwu4ndc9	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015tvceozdb5un1w	Rough-ins	\N	Metallic Flexible Conduit	m	673	0	0	0	44330.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015uvceol8rvrbid	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	34	0	0	0	1091.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015vvceonowtl3n5	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	482	0	0	0	38964.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015wvceofsuoi22y	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	94	0	0	0	7377.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015xvceo9deh25qg	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	13	0	0	0	1505.79	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nf015yvceo4fx7cfrz	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng015zvceoje5wvtuh	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	85	0	0	0	6670.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0160vceorpim3ctm	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0161vceo1q8zzja6	CONSUMABLES	\N	Vibration Isolator	pcs	16	0	0	0	22238.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0162vceoveyxlpnt	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	6	0	0	0	15139.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0163vceolkzz5e3m	CONSUMABLES	\N	Rugby	bottle	25	0	0	0	6949.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0164vceodm6tjt2q	CONSUMABLES	\N	White Tape	rolls	49	0	0	0	18336.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ng0165vceoppexx6oy	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	107	0	0	0	18304.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh0166vceo8kphkaeh	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh0167vceowq104d9y	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh0168vceodqoihvov	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh0169vceovg0jez38	CONSUMABLES	\N	Loop Hangers	pcs	402	0	0	0	17197.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh016avceonoan0cik	CONSUMABLES	\N	Freon	tank	7	0	0	0	101484.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh016bvceo1yironug	CONSUMABLES	\N	Nitrogen	tank	4	0	0	0	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh016cvceob62y9fxm	CONSUMABLES	\N	Mapp Gas	tank	12	0	0	0	10263.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh016dvceoeb3e6znh	CONSUMABLES	\N	Silver Rod	pcs	160	0	0	0	8555.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nh016evceoyrvcfyqe	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016fvceoo3u1es3x	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016gvceor268ykr5	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	0	6640.71	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016hvceomp5moahy	TESTING & COMMISIONING	\N	TESTING & COMMISIONING	lot	1	0	0	0	47190.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016ivceo1hqd4zvl	AIR CONDITIONING- VRV SYSTEM C	\N	ACCU- Model: RXQ18BYM	units	3	0	0	0	2223173.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016jvceotwxz5gb5	AIR CONDITIONING- VRV SYSTEM C	\N	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016kvceofkqgjkox	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	10	0	0	0	117607.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016lvceo9wltrhne	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016mvceo99lip9qm	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	2	0	0	0	9879.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ni016nvceotdydjw2t	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	4	0	0	0	32930.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016ovceoyu0pbwi3	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016pvceoh57kfzgd	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016qvceosf43mq5s	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016rvceoy04uhlip	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	1	0	0	0	2120.33	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016svceo6gwmvju2	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	11	0	0	0	32475.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016tvceo97vpovy1	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	2	0	0	0	9393.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016uvceozfm1rkdx	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	14	0	0	0	94863.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016vvceoxui92837	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	9	0	0	0	77780.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nj016wvceo4fsd6f9g	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	1	0	0	0	10870.01	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk016xvceo4ueopmzo	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk016yvceopkt5pikb	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	3	0	0	0	63045.99	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk016zvceo4xfascgs	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	7	0	0	0	189278.39	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk0170vceo6spi6kqo	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	2	0	0	0	867.14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk0171vceou21kholb	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	21	0	0	0	9278.43	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk0172vceo3dave3yc	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	4	0	0	0	2064.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nk0173vceoxhwrqbcw	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	27	0	0	0	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0174vceo307pzaxw	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	17	0	0	0	12038.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0175vceob0ss7upr	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	2	0	0	0	1569.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0176vceo4h7w8a7f	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	10	0	0	0	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0177vceoji2d4pqo	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	5	0	0	0	4480.15	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0178vceo56bw94ed	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	13	0	0	0	13151.58	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl0179vceom3fcyoh4	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	0	59135.15	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl017avceobcq9k41p	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	20	0	0	0	64149.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl017bvceotfl8w9r6	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	0	19711.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nl017cvceoazq77uog	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017dvceo5apayk50	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	33	0	0	0	13336.95	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017evceoqyk0v2un	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	12	0	0	0	7701.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017fvceofv59o0er	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	66	0	0	0	28226.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017gvceokpjs7g65	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	23	0	0	0	18689.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017hvceo0ew46bb5	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	11	0	0	0	335204.76	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017ivceo2j9qvtgp	Fittings	\N	Wye Reducer 50 x 32	length/s	7	0	0	0	1347.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017jvceo38s85rqj	Fittings	\N	Tee 32mm	length/s	6	0	0	0	320.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nm017kvceorz5fr1l1	Fittings	\N	Elbow 32mm	length/s	7	0	0	0	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017lvceoss0elmv9	Fittings	\N	Cleanout 50mm	length/s	2	0	0	0	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017mvceoerkd6r3o	Rough-ins	\N	liquid-tight metallic flexible conduits 1-1/2"	m	78	0	0	0	31523.7	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017nvceos4yubvm6	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	444	0	0	0	29246.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017ovceo2o287iwo	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	26	0	0	0	834.34	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017pvceoiijv2ivd	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	291	0	0	0	23524.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017qvceoc2rq27lr	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	63	0	0	0	4944.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017rvceokvmxn0qi	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nn017svceox0ndv3ck	Cables / Wires	\N	Wire 30.0mm² THHN (5 meters per Unit)	m	59	0	0	0	46578.73	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017tvceoo7rcgw6m	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	65	0	0	0	5101.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017uvceo48rfasd3	Cables / Wires	\N	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	3757.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017vvceowty5n79r	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017wvceonr4oswzk	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017xvceoieuauxt5	CONSUMABLES	\N	Rugby	bottle	15	0	0	0	4169.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017yvceoqhd2wgo5	CONSUMABLES	\N	White Tape	rolls	30	0	0	0	11226.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no017zvceoyk6jsrow	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	65	0	0	0	11119.55	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no0180vceok4qi13sz	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44no0181vceozz9xxj70	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0182vceowx4a7qbw	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0183vceo34alkh2w	CONSUMABLES	\N	Loop Hangers	pcs	244	0	0	0	10438.32	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0184vceonjs6hbt9	CONSUMABLES	\N	Freon	tank	5	0	0	0	72488.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0185vceooyxmorch	CONSUMABLES	\N	Nitrogen	tank	3	0	0	0	54526.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0186vceo27tie0uu	CONSUMABLES	\N	Mapp Gas	tank	8	0	0	0	6500.56	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0187vceop2a6226s	CONSUMABLES	\N	Silver Rod	pcs	98	0	0	0	5240.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0188vceotui11dts	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np0189vceo2dkt9dc1	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44np018avceoqv0caagz	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	0	5010.49	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018bvceo099rdmwt	TESTING & COMMISIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	0	38342.14	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018cvceoci17tnek	AIR CONDITIONING- VRV SYSTEM D	\N	ACCU- Model: RXQ20BYM	units	3	0	0	0	2367951.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018dvceosbzlx6pl	AIR CONDITIONING- VRV SYSTEM D	\N	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	0	0	0	175061.38	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018evceonpgsxjq8	ACU Accessories:	\N	Wired Remote Controller Model: BRC1E63	units	12	0	0	0	141128.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018fvceokqdtc20i	ACU Accessories:	\N	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	0	0	0	44690.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018gvceoiw98akds	ACU Accessories:	\N	Refnet Joints Model: KHRP26A22T	units	4	0	0	0	17405.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nq018hvceot2xbg9cd	ACU Accessories:	\N	Refnet Joints Model: KHRP26A33T	units	1	0	0	0	4939.51	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018ivceo4iwj5odu	ACU Accessories:	\N	Refnet Joints Model: KHRP26A72T	units	3	0	0	0	24697.53	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018jvceo0c4l4plp	ACU Accessories:	\N	Refnet Joints Model: KHRP26A73T	units	3	0	0	0	42338.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018kvceoq7aknjqk	ACU Accessories:	\N	Pipe Size Reducer Model: KHRP26M73TP	units	3	0	0	0	17993.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018lvceouz2how9u	ACU Accessories:	\N	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	0	0	0	39751.22	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018mvceoeuxmix00	Copper Pipes - Type L Hard Drawn Pipes	\N	1/4"	length/s	8	0	0	0	16962.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018nvceoabpcog7m	Copper Pipes - Type L Hard Drawn Pipes	\N	3/8"	length/s	12	0	0	0	35428.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018ovceo1dijnlzl	Copper Pipes - Type L Hard Drawn Pipes	\N	1/2"	length/s	10	0	0	0	46969.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nr018pvceocmp0u103	Copper Pipes - Type L Hard Drawn Pipes	\N	5/8"	length/s	14	0	0	0	94863.3	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018qvceo1hr4q4b8	Copper Pipes - Type L Hard Drawn Pipes	\N	3/4"	length/s	16	0	0	0	138277.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018rvceom9zdy00j	Copper Pipes - Type L Hard Drawn Pipes	\N	7/8"	length/s	2	0	0	0	21740.02	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018svceo4ogbgws0	Copper Pipes - Type L Hard Drawn Pipes	\N	1-1/8"	length/s	5	0	0	0	77834.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018tvceob9cvi3v1	Copper Pipes - Type L Hard Drawn Pipes	\N	1-3/8"	length/s	2	0	0	0	42030.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018uvceo6iji4qlj	Copper Pipes - Type L Hard Drawn Pipes	\N	1-5/8"	length/s	14	0	0	0	378556.78	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018vvceoe7o9n7rn	Copper Pipes Insulation 25mm Thick	\N	1/4"	length/s	16	0	0	0	6937.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018wvceokg5xzmge	Copper Pipes Insulation 25mm Thick	\N	3/8"	length/s	24	0	0	0	10603.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018xvceo6k2vytjk	Copper Pipes Insulation 25mm Thick	\N	1/2"	length/s	19	0	0	0	9806.85	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ns018yvceoyp2bycmu	Copper Pipes Insulation 25mm Thick	\N	5/8"	length/s	27	0	0	0	17002.17	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt018zvceoltu9x58n	Copper Pipes Insulation 25mm Thick	\N	3/4"	length/s	31	0	0	0	21952.96	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0190vceox8869llh	Copper Pipes Insulation 25mm Thick	\N	7/8"	length/s	4	0	0	0	3138.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0191vceoip5qpphz	Copper Pipes Insulation 25mm Thick	\N	1-1/8"	length/s	10	0	0	0	8464.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0192vceokk5ue1hs	Copper Pipes Insulation 25mm Thick	\N	1-3/8"	length/s	4	0	0	0	3584.12	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0193vceo4v0mly34	Copper Pipes Insulation 25mm Thick	\N	1-5/8"	length/s	27	0	0	0	27314.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0194vceoyc8z6bkc	Copper Pipe Fittings	\N	Copper Pipe Fittings	lot	1	0	0	0	96659.97	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0195vceooo9gyro6	Isolation Ball Valves	\N	Isolation Ball Valves	pc/s	24	0	0	0	76979.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0196vceorerpwg3f	PVC Cladding Works	\N	PVC Cladding Works	lot	1	0	0	0	32220	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nt0197vceov2zpo7ws	Concrete Pad	\N	Concrete Pad	pcs	3	0	0	0	28867.23	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu0198vceolb1hc2tm	Condensate Drain Pipes	\N	32mm dia. uPVC blue pipe PNS 65	length/s	31	0	0	0	12528.65	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu0199vceovu8w2y1a	Condensate Drain Pipes	\N	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	38	0	0	0	24389.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019avceobrzdgj4c	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 32mm pvc	length/s	61	0	0	0	26087.87	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019bvceo1ia0r0ms	Condensate Drain Pipes Rubber Insulation 1.5 meters	\N	3/4'' thick for 50mm pvc	length/s	75	0	0	0	60942.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019cvceofy0eahpt	(5.0m pump Lift) Model: BDU513A450VE	\N	(5.0m pump Lift) Model: BDU513A450VE	pcs	10	0	0	0	304731.6	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019dvceoxi0sbmko	Fittings	\N	Wye 50mm	length/s	2	0	0	0	427.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019evceovw6akn9i	Fittings	\N	Wye Reducer 50 x 32	length/s	11	0	0	0	2117.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nu019fvceoqunv23vb	Fittings	\N	Tee 32mm	length/s	3	0	0	0	160.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019gvceotx5ve4zh	Fittings	\N	Tee Reducer 50 x 32	length/s	3	0	0	0	609.45	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019hvceoa3gfeglq	Fittings	\N	Elbow 32mm	length/s	7	0	0	0	305.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019ivceow16j8dvr	Fittings	\N	Cleanout 50mm	length/s	6	0	0	0	1283.04	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019jvceou3e9krb3	Rough-ins	\N	liquid-tight metallic flexible conduits 2"	m	78	0	0	0	59544.42	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019kvceocmv2zdp1	Rough-ins	\N	Metallic Flexible Conduit 20mm	m	654	0	0	0	43078.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019lvceomqsr5nab	Rough-ins	\N	Metallic Flexible Conduit Connector 20mm	pcs	32	0	0	0	1026.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019mvceodoqtcbym	Cables / Wires	\N	Communication wire (PD Royal Cord 0.75mm/2C)	m	472	0	0	0	38156.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019nvceofpyco8jp	Cables / Wires	\N	Wire 3.5mm² THHN (5 meters per Unit)	m	78	0	0	0	6009.9	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nv019ovceojs9q2v6n	Cables / Wires	\N	Wire 5.5mm² THHN (5 meters per Unit)	m	26	0	0	0	3122.86	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019pvceo8tbcmvpl	Cables / Wires	\N	Wire 38.0mm² THHN (5 meters per Unit)	m	59	0	0	0	55353.8	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019qvceo86eg6af3	Cables / Wires	\N	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	78	0	0	0	5878.08	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019rvceoy23vzkwp	Cables / Wires	\N	Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	0	0	0	6220.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019svceomoazqboh	CONSUMABLES	\N	Vibration Isolator	pcs	20	0	0	0	27798.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019tvceoiwecqcp7	CONSUMABLES	\N	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	0	0	0	17662.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019uvceore50u4de	CONSUMABLES	\N	Rugby	bottle	24	0	0	0	6671.76	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nw019vvceojhtzyjzk	CONSUMABLES	\N	White Tape	rolls	47	0	0	0	17588.34	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx019wvceofeyy4ee4	CONSUMABLES	\N	Threaded rod 3/8 (6 meters)	length/s	104	0	0	0	17791.28	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx019xvceo6dawi9jv	CONSUMABLES	\N	Nuts and washer 3/8	pcs	32	0	0	0	684.48	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx019yvceongpb32yv	CONSUMABLES	\N	Grip Anchor 3/8	pcs	32	0	0	0	342.4	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx019zvceobsfsfd27	CONSUMABLES	\N	Paint (Red Oxide)	gallon	1	0	0	0	3432	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx01a0vceo8xou1x3t	CONSUMABLES	\N	Loop Hangers	pcs	393	0	0	0	16812.54	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx01a1vceoyrdts9ut	CONSUMABLES	\N	Freon	tank	8	0	0	0	115982.16	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx01a2vceor735pahu	CONSUMABLES	\N	Nitrogen	tank	4	0	0	0	72702.64	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nx01a3vceowkobzmub	CONSUMABLES	\N	Mapp Gas	tank	12	0	0	0	9750.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a4vceowhejzf7s	CONSUMABLES	\N	Silver Rod	pcs	158	0	0	0	8448.26	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a5vceoyilj1c0t	CONSUMABLES	\N	Paint Brush	pcs	1	0	0	0	213.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a6vceookksm0np	CHIPPING & RESTORATION (ROUGH-ONLY)	\N	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	0	0	0	737348.84	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a7vceojph18uhn	MISCELLANEOUS	\N	MISCELLANEOUS	lot	1	0	0	0	7277.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a8vceo54xu48e5	TESTING & COMMISIONING	\N	TESTING & COMMISSIONING	lot	1	0	0	0	44240.94	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01a9vceo6xs1ooha	Cables / Wires	\N	250mm² THHN	m	726	0	0	7092.359999999999	5149053.36	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01aavceoxcvx44bn	Cables / Wires	\N	200mm² THHN	m	117	0	0	0	644571.72	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01abvceouoa2gge8	Cables / Wires	\N	38mm² THHN	m	390	0	0	0	439327.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44ny01acvceogtpesrf3	Cables / Wires	\N	80mm² THHN	m	242	0	0	0	515401.92	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01advceohtgj9qxn	Cables / Wires	\N	30mm² THHN	m	39	0	0	0	32123.91	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01aevceo32y19gyo	Cables / Wires	\N	14mm² THHN	m	130	0	0	0	46653.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01afvceovvk6wfzt	Roughing-ins	\N	90mm dia. IMC	length/s	94	0	0	0	874356.98	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01agvceodywdjup2	Roughing-ins	\N	40mm dia. IMC	length/s	45	0	0	0	120280.5	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01ahvceodz219w9z	Panel Board & Pullbox	\N	DP-Main	Assy	1	0	0	0	772225.45	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01aivceos3q6ge0y	Panel Board & Pullbox	\N	PP-System A	Assy	1	0	0	0	125827.11	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01ajvceop1hhzjye	Panel Board & Pullbox	\N	PP-System B	Assy	1	0	0	0	135268.13	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01akvceoqurhmwr0	Panel Board & Pullbox	\N	PP-System C	Assy	1	0	0	0	120190.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44nz01alvceomgzy5dt3	Panel Board & Pullbox	\N	PP-System D	Assy	1	0	0	0	131472.25	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001amvceodypje7yf	Panel Board & Pullbox	\N	PP-Outdoor	Assy	1	0	0	0	473575.57	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001anvceoidkbscjm	1.0	\N	Transformer	Assy	1	0	0	0	932598.82	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001aovceoeyht45yl	ECB	\N	ECB 1250AT Nema 12	pc	1	0	0	0	302047.59	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001apvceo2b8nkyiu	Pullbox	\N	Pullbox (350mm x 350mm x 200mm)	pc	5	0	0	0	27691.2	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001aqvceoar9xxjlf	Wire Gutter	\N	Wire Gutter	lot	1	0	0	0	32074.68	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001arvceo5cf5cpy3	ECB	\N	ECB 150AT, 3P, 230V, Nema3R	pc	4	0	0	0	116076.44	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o001asvceojncgnclu	ECB	\N	ECB 40AT, 3P, 230V, Nema3R	pc	7	0	0	0	77586.88	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101atvceoaikzit7w	ECB	\N	ECB 40AT, 2P, 230V, Nema3R	pc	16	0	0	0	150867.52	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101auvceooz306unq	ECB	\N	ECB 30AT, 2P, 230V, Nema3R	pc	23	0	0	0	216872.06	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101avvceofka1lrgf	Roughing-ins	\N	40mm dia. IMC	length/s	49	0	0	0	130972.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101awvceobyewwmm8	Roughing-ins	\N	25mm dia. IMC	length/s	1003	0	0	0	1758690.29	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101axvceo81r5reej	Roughing-ins	\N	Junction boxes with cover	pc/s	195	0	0	0	24540.75	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101ayvceofvqa1k6p	Cables / Wires	\N	50mm² THHN	Lm/s	429	0	0	0	598841.1	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o101azvceoceg9b3z6	Cables / Wires	\N	5.5mm² THHN	Lm/s	6798	0	0	0	979795.74	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b0vceoxpo0mrky	Cables / Wires	\N	14mm² THHN	Lm/s	143	0	0	0	51318.41	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b1vceoqd7gu8ne	Cables / Wires	\N	5.5mm² THHN	Lm/s	3185	0	0	0	459054.05	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b2vceodhujze9f	Chipping & Restoration Works (Rough only)	\N	Chipping & Restoration Works (Rough only)	lot	1	0	0	0	145441.09	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b3vceolo93exhz	Hangers & Supports	\N	Hangers & Supports	lot	1	0	0	0	174529.31	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b4vceoiz83a3y9	Miscelleneuos	\N	Miscelleneuos	lot	1	0	0	0	87264.66	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
cmrlx44o201b5vceopt0zo1vl	Testing & Commissioning	\N	Testing & Commissioning	lot	1	0	0	0	884818.61	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	\N	0	0	0	0	0	t	\N	LOCKED	MATERIAL_EQUIPMENT	cmrlx3xcg00swvceoxntp02vz	2026-07-15 10:09:02.832	2026-07-15 10:09:02.832
\.


--
-- Data for Name: BIRWithholdingTaxTable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BIRWithholdingTaxTable" (id, "effectiveYear", "payrollFrequency", "bracketNo", "compensationFrom", "compensationTo", "baseTax", "taxRatePercent", "excessOver", "isActive", "isLocked", "createdBy", "updatedBy", "approvedBy", "approvedAt", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BOQExtractedItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BOQExtractedItem" (id, "uploadedWorkbookFileId", "projectId", "sectionId", "sheetName", "sourceRowNumber", "itemNumber", description, unit, quantity, "materialUnitCost", "laborUnitCost", "equipmentUnitCost", "totalDirectCost", ocm, cp, vat, "totalIndirectCost", "unitCost", amount, percentage, "formulaMapJson", "validationStatus", "validationErrorsJson", "createdAt", "updatedAt") FROM stdin;
cmrlx3yvf00t2vceo0p1xd2yp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	22	1.0	Mobilization and Demobilization	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	103229	103229	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t3vceo7c4x322u	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	24	1.0	a. Project Management	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	678976	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t4vceo79ehvv7h	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	25	2.0	b. Admin Support\r\n  - Accounting, Procurement, Logistics	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	279580	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t5vceofxef1t2n	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	26	3.0	c.Quality Management	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	279580	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t6vceov3eyusw0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	27	4.0	d. Engineering Management\r\n - Clarifications & Drawings	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	319519	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t7vceolr1iyppp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	29	1.0	a. Site Office	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t8vceo48ujquxk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	30	2.0	b. Warehouse	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	51615	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00t9vceo8l8n791b	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	31	3.0	b. Site Office Materials & Communication	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	14747	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00tavceoyz1vv5ko	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	32	4.0	c. Temporary Tools & Cleaning Materials	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	7374	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00tbvceopxjg9d44	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	33	5.0	b. Off-site Barracks\r\n   - Construction and-or Rent\r\n   - Electric Consumption\r\n   - Water Consumption	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	184338	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvf00tcvceopqztkrej	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	35	1.0	a. On-Site Water Consumption	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tdvceo5w7e8uto	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	36	2.0	b. On-Site Electric Consumption	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tevceotxxan1dp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	38	1.0	a. Safety Officer	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	331807	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tfvceoxqtm8kla	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	39	2.0	b. Personal Protective Equipment (PPE's)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	73735	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tgvceo07345jba	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	40	3.0	b. Security Guards	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00thvceodzvdaw7t	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	42	1.0	a. Shopdrawings, As-built plans for Occupancy including Sign & Seal	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	117976	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tivceozala9z2e	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	43	2.0	b. Material Testing	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tjvceoef1eujxe	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	45	1.0	a. Manpower Service	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	147470	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tkvceo250hs664	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	46	2.0	b. Engineer Transportation	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	110603	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tlvceodljd20gq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	51	AIR CONDITIONING- VRV SYSTEM A	ACCU- 18HP Model: RXQ18BYM	units	3	\N	\N	\N	\N	\N	\N	\N	\N	1259369.789999997	3778109.37	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tmvceo2j5yzxx4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	52	AIR CONDITIONING- VRV SYSTEM A	FCU- 2 HP Wall Mounted VRF A (OR No. 2, PNCOU, OR No.3, OR, Pantry, OR Complex Conference Room) Model: FXAQ50BVM	units	6	\N	\N	\N	\N	\N	\N	\N	\N	0	330524.04	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tnvceootoxjlbc	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	53	AIR CONDITIONING- VRV SYSTEM A	FCU- 2.5HP Wall Mounted VRF A (OR No. 2 ENT, OR No. 1 ENT, Chief Nurse, OR Pharmacy) Model: FXAQ63BVM	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	168668.58	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tovceou85dmunp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	54	AIR CONDITIONING- VRV SYSTEM A	FCU- 6HP ceiling Cassette VRF A (Corridor Near OR No.1, Corridor Near OR No. 2 ENT) Model: FXFQ140AVM	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	175061.38	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tpvceotwsxxu4h	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	56	ACU Accessories:	Navigation Wired Controller Model: BRC1E63	units	11	\N	\N	\N	\N	\N	\N	\N	\N	0	129367.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00tqvceow8zf8g4m	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	57	ACU Accessories:	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	44690.74	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvg00trvceo75arjou5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	58	ACU Accessories:	Refnet Joints Model: KHRP26A22T	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	8702.94	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00tsvceook4bhyya	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	59	ACU Accessories:	Refnet Joints Model: KHRP26A33T	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	9879.02	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00ttvceoqukl8yzw	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	60	ACU Accessories:	Refnet Joints Model: KHRP26A732T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	24697.53	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00tuvceofxp33w0w	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	61	ACU Accessories:	Refnet Joints Model: KHRP26A733T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	42338.61	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00tvvceoxe99cv7l	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	62	ACU Accessories:	Pipe Size Reducer Model: KHRP26M73TP	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	17993.91	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00twvceo57n776as	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	63	ACU Accessories:	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	39751.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00txvceo7asb8r52	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	65	Copper Pipes - Type L Hard Drawn Pipes	1/4"	length/s	10	\N	\N	\N	\N	\N	\N	\N	\N	0	21203.3	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00tyvceohb618413	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	66	Copper Pipes - Type L Hard Drawn Pipes	3/8"	length/s	13	\N	\N	\N	\N	\N	\N	\N	\N	0	38380.55	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00tzvceolh8bilvx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	67	Copper Pipes - Type L Hard Drawn Pipes	1/2"	length/s	14	\N	\N	\N	\N	\N	\N	\N	\N	0	65756.88	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u0vceof1tf8o8j	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	68	Copper Pipes - Type L Hard Drawn Pipes	5/8"	length/s	9	\N	\N	\N	\N	\N	\N	\N	\N	0	60983.55	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u1vceo0qh1syft	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	69	Copper Pipes - Type L Hard Drawn Pipes	3/4"	length/s	9	\N	\N	\N	\N	\N	\N	\N	\N	0	77780.97	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u2vceo5pud79hy	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	70	Copper Pipes - Type L Hard Drawn Pipes	7/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	21740.02	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u3vceo78orksxy	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	71	Copper Pipes - Type L Hard Drawn Pipes	1-1/8"	length/s	8	\N	\N	\N	\N	\N	\N	\N	\N	0	124535.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u4vceoxwrtwfb7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	72	Copper Pipes - Type L Hard Drawn Pipes	1-3/8"	length/s	5	\N	\N	\N	\N	\N	\N	\N	\N	0	105076.65	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvh00u5vceo73m93c71	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	73	Copper Pipes - Type L Hard Drawn Pipes	1-5/8"	length/s	4	\N	\N	\N	\N	\N	\N	\N	\N	0	84061.32	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00u6vceodrfu7uax	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	75	Copper Pipes Insulation 25mm Thick	1/4"	length/s	19	\N	\N	\N	\N	\N	\N	\N	\N	0	8237.83	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00u7vceoa6v9u058	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	76	Copper Pipes Insulation 25mm Thick	3/8"	length/s	26	\N	\N	\N	\N	\N	\N	\N	\N	0	11487.58	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00u8vceoad8w14v7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	77	Copper Pipes Insulation 25mm Thick	1/2"	length/s	27	\N	\N	\N	\N	\N	\N	\N	\N	0	13936.05	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00u9vceo9q19vy4c	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	78	Copper Pipes Insulation 25mm Thick	5/8"	length/s	18	\N	\N	\N	\N	\N	\N	\N	\N	0	11334.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00uavceouj4sgcu1	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	79	Copper Pipes Insulation 25mm Thick	3/4"	length/s	17	\N	\N	\N	\N	\N	\N	\N	\N	0	12038.72	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ubvceot25rivw5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	80	Copper Pipes Insulation 25mm Thick	7/8"	length/s	4	\N	\N	\N	\N	\N	\N	\N	\N	0	3138.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ucvceozgihn442	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	81	Copper Pipes Insulation 25mm Thick	1-1/8"	length/s	15	\N	\N	\N	\N	\N	\N	\N	\N	0	12697.35	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00udvceocrbhlo3j	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	82	Copper Pipes Insulation 25mm Thick	1-3/8"	length/s	10	\N	\N	\N	\N	\N	\N	\N	\N	0	8960.3	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00uevceocs11xup2	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	83	Copper Pipes Insulation 25mm Thick	1-5/8"	length/s	8	\N	\N	\N	\N	\N	\N	\N	\N	0	7168.24	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ufvceowp4m0u3v	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	84	Copper Pipe Fittings	Copper Pipe Fittings	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	57975.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ugvceooxelfavk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	85	Isolation Ball Valves	Isolation Ball Valves	pc/s	22	\N	\N	\N	\N	\N	\N	\N	\N	0	70564.56	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00uhvceoln4x0o4s	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	86	PVC Cladding Works	PVC Cladding Works	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	22281.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00uivceoj5dymbfi	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	87	Concrete Pad	Concrete Pad	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	28867.23	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ujvceoesb7ha9c	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	89	Condensate Drain Pipes	32mm dia. uPVC blue pipe PNS 65	length/s	39	\N	\N	\N	\N	\N	\N	\N	\N	0	15761.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ukvceo6ibcz3ki	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	90	Condensate Drain Pipes	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	22	\N	\N	\N	\N	\N	\N	\N	\N	0	14120.26	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvi00ulvceojf310dh5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	92	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 32mm pvc	length/s	77	\N	\N	\N	\N	\N	\N	\N	\N	0	32930.59	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00umvceo9zdxmxit	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	93	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 50mm pvc	length/s	43	\N	\N	\N	\N	\N	\N	\N	\N	0	34940.51	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00unvceo3z6569sq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	95	(5.0m pump Lift) Model: BDU513A450VE	(5.0m pump Lift) Model: BDU513A450VE	pcs	9	\N	\N	\N	\N	\N	\N	\N	\N	0	274258.44	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uovceo44rls6un	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	97	Fittings	Wye Reducer 50 x 32	pcs	11	\N	\N	\N	\N	\N	\N	\N	\N	0	2117.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00upvceozfspemdb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	98	Fittings	Tee 32mm	pcs	2	\N	\N	\N	\N	\N	\N	\N	\N	0	106.94	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uqvceozwrqjob3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	99	Fittings	Tee Reducer 50 x 32	pcs	2	\N	\N	\N	\N	\N	\N	\N	\N	0	406.3	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00urvceottgd9oq0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	100	Fittings	Elbow 32mm	pcs	6	\N	\N	\N	\N	\N	\N	\N	\N	0	261.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00usvceodfbh1veq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	101	Fittings	Cleanout 50mm	pcs	4	\N	\N	\N	\N	\N	\N	\N	\N	0	855.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00utvceoh3o44q5k	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	104	Rough-ins	liquid-tight metallic flexible conduits 1-1/2"	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	31523.7	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uuvceoc31nhlt5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	105	Rough-ins	Metallic Flexible Conduit 20mm	m	586	\N	\N	\N	\N	\N	\N	\N	\N	0	38599.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uvvceozs5vsysa	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	106	Rough-ins	Metallic Flexible Conduit Connector 20mm	pcs	29	\N	\N	\N	\N	\N	\N	\N	\N	0	930.61	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uwvceok6t2qi9g	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	108	Cables / Wires	Communication wire (PD Royal Cord 0.75mm/2C)	m	419	\N	\N	\N	\N	\N	\N	\N	\N	0	33871.96	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uxvceoepb83kda	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	109	Cables / Wires	Wire 3.5mm² THHN (5 meters per Unit)	m	71	\N	\N	\N	\N	\N	\N	\N	\N	0	5572.08	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uyvceooayxsic0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	110	Cables / Wires	Wire 5.5mm² THHN (5 meters per Unit)	m	26	\N	\N	\N	\N	\N	\N	\N	\N	0	3122.86	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00uzvceoz7h4tluf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	111	Cables / Wires	Wire 30.0mm² THHN (5 meters per Unit)	m	59	\N	\N	\N	\N	\N	\N	\N	\N	0	46629.47	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvj00v0vceoy4x1b2ea	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	113	Cables / Wires	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	72	\N	\N	\N	\N	\N	\N	\N	\N	0	5650.56	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v1vceot0fus1t5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	114	Cables / Wires	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	\N	\N	\N	\N	\N	\N	\N	\N	0	3757.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v2vceoxl8awzlm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	116	CONSUMABLES	Vibration Isolator	pcs	20	\N	\N	\N	\N	\N	\N	\N	\N	0	27798.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v3vceolav8buo5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	117	CONSUMABLES	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	17662.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v4vceofvwvs31i	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	118	CONSUMABLES	Rugby	bottle	21	\N	\N	\N	\N	\N	\N	\N	\N	0	5837.79	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v5vceoxfplb4wl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	119	CONSUMABLES	White Tape	rolls	42	\N	\N	\N	\N	\N	\N	\N	\N	0	15717.24	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v6vceo9iy5o21z	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	120	CONSUMABLES	Threaded rod 3/8 (6 meters)	length/s	94	\N	\N	\N	\N	\N	\N	\N	\N	0	16080.58	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v7vceo779kfm5k	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	121	CONSUMABLES	Nuts and washer 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	684.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v8vceoa4rax7a9	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	122	CONSUMABLES	Grip Anchor 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	342.4	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00v9vceoxn9mbeoq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	123	CONSUMABLES	Paint (Red Oxide)	gallon	1	\N	\N	\N	\N	\N	\N	\N	\N	0	3432	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00vavceoets50ntn	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	124	CONSUMABLES	Loop Hangers	pcs	351	\N	\N	\N	\N	\N	\N	\N	\N	0	15015.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvk00vbvceo6e28ua38	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	125	CONSUMABLES	Freon	tank	6	\N	\N	\N	\N	\N	\N	\N	\N	0	86986.62	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vcvceocub069vz	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	126	CONSUMABLES	Nitrogen	tank	3	\N	\N	\N	\N	\N	\N	\N	\N	0	54526.98	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vdvceo4r7o18w0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	127	CONSUMABLES	Mapp Gas	tank	11	\N	\N	\N	\N	\N	\N	\N	\N	0	9408.63	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vevceoivuhalq3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	128	CONSUMABLES	Silver Rod	pcs	141	\N	\N	\N	\N	\N	\N	\N	\N	0	7539.27	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vfvceognhbp6b7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	129	CONSUMABLES	Paint Brush	pcs	1	\N	\N	\N	\N	\N	\N	\N	\N	0	213.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vgvceojbjglfin	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	130	CHIPPING & RESTORATION (ROUGH-ONLY)	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	737348.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vhvceoh42i3twg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	131	MISCELLANEOUS	MISCELLANEOUS	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	5684.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vivceo8fpwjjdp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	132	TESTING & COMMISSIONING	TESTING & COMMISSIONING	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	41291.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vjvceoysdmmomf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	134	AIR CONDITIONING- VRV SYSTEM B	ACCU-  Model: RXQ18BYM	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	2223173.13	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vkvceo6i5xmlea	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	135	AIR CONDITIONING- VRV SYSTEM B	FCU- 2.5HP Wall Mounted VRF B ( OR no. 4, 6, 13, 14, 15, OR Pharmacy) Model: FXAQ63BVM	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	112445.72	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vlvceorcdaeoyk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	136	AIR CONDITIONING- VRV SYSTEM B	FCU- 6HP ceiling Cassette VRF B (Corridor near OR No. 2 NSS, Corridor Near Supply Room) Model: FXFQ140AVM	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	87530.69	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vmvceo3nvq5vqw	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	138	ACU Accessories:	Wired Remote Controller Model: BRC1E63	units	13	\N	\N	\N	\N	\N	\N	\N	\N	0	152889.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vnvceo756dp24f	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	139	ACU Accessories:	Standard panel(Fresh white) Model: BYCQ125EAF	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	22345.37	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vovceoyooourjm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	140	ACU Accessories:	Refnet Joints Model: KHRP26A22T	units	6	\N	\N	\N	\N	\N	\N	\N	\N	0	26108.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvl00vpvceoqp55aorv	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	141	ACU Accessories:	Refnet Joints Model: KHRP26A33T	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	4939.51	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vqvceobx0kzdav	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	142	ACU Accessories:	Refnet Joints Model: KHRP26A72T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	24697.53	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vrvceozp2x2jlh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	143	ACU Accessories:	Refnet Joints Model: KHRP26A73T	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	28225.74	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vsvceo4jfd4k5a	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	144	ACU Accessories:	Pipe Size Reducer Model: KHRP26M73TP	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	11995.94	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vtvceo2fnvadca	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	145	ACU Accessories:	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	39751.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vuvceorolyi3z2	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	147	Copper Pipes - Type L Hard Drawn Pipes	1/4"	length/s	14	\N	\N	\N	\N	\N	\N	\N	\N	0	29684.62	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vvvceofrrkreiz	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	148	Copper Pipes - Type L Hard Drawn Pipes	3/8"	length/s	11	\N	\N	\N	\N	\N	\N	\N	\N	0	32475.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vwvceophe79nz5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	149	Copper Pipes - Type L Hard Drawn Pipes	1/2"	length/s	15	\N	\N	\N	\N	\N	\N	\N	\N	0	70453.8	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vxvceo42590x3m	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	150	Copper Pipes - Type L Hard Drawn Pipes	5/8"	length/s	12	\N	\N	\N	\N	\N	\N	\N	\N	0	81311.4	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vyvceofijmiye6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	151	Copper Pipes - Type L Hard Drawn Pipes	3/4"	length/s	13	\N	\N	\N	\N	\N	\N	\N	\N	0	112350.29	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00vzvceolg3nyihx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	152	Copper Pipes - Type L Hard Drawn Pipes	7/8"	length/s	1	\N	\N	\N	\N	\N	\N	\N	\N	0	10870.01	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00w0vceomlvl1nma	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	153	Copper Pipes - Type L Hard Drawn Pipes	1-1/8"	length/s	5	\N	\N	\N	\N	\N	\N	\N	\N	0	77834.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvm00w1vceo3lk43kto	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	154	Copper Pipes - Type L Hard Drawn Pipes	1-3/8"	length/s	1	\N	\N	\N	\N	\N	\N	\N	\N	0	27039.77	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w2vceoc677sj5e	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	155	Copper Pipes - Type L Hard Drawn Pipes	1-5/8"	length/s	12	\N	\N	\N	\N	\N	\N	\N	\N	0	324477.24	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w3vceo5jk1ptjq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	157	Copper Pipes Insulation 25mm Thick	1/4"	length/s	27	\N	\N	\N	\N	\N	\N	\N	\N	0	11706.39	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w4vceo9fsv27wq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	158	Copper Pipes Insulation 25mm Thick	3/8"	length/s	21	\N	\N	\N	\N	\N	\N	\N	\N	0	9278.43	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w5vceo8leomxk0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	159	Copper Pipes Insulation 25mm Thick	1/2"	length/s	30	\N	\N	\N	\N	\N	\N	\N	\N	0	15484.5	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w6vceo60ie5pur	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	160	Copper Pipes Insulation 25mm Thick	5/8"	length/s	24	\N	\N	\N	\N	\N	\N	\N	\N	0	15113.04	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w7vceog6nbwfa8	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	161	Copper Pipes Insulation 25mm Thick	3/4"	length/s	26	\N	\N	\N	\N	\N	\N	\N	\N	0	18412.16	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w8vceo2alzjjb0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	162	Copper Pipes Insulation 25mm Thick	7/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	1569.1	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00w9vceov7jjbkn1	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	163	Copper Pipes Insulation 25mm Thick	1-1/8"	length/s	9	\N	\N	\N	\N	\N	\N	\N	\N	0	7618.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wavceos3rgwkwg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	164	Copper Pipes Insulation 25mm Thick	1-3/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	2023.32	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wbvceoawprckcw	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	165	Copper Pipes Insulation 25mm Thick	1-5/8"	length/s	24	\N	\N	\N	\N	\N	\N	\N	\N	0	24279.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wcvceowxsu6gpw	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	166	Copper Pipe Fittings	Copper Pipe Fittings	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	87733.46	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wdvceoiom0ov4w	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	167	Isolation Ball Valves	Isolation Ball Valves	pc/s	26	\N	\N	\N	\N	\N	\N	\N	\N	0	83394.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wevceozypxt1v9	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	168	PVC Cladding Works	PVC Cladding Works	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	8234.77	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wfvceomm6c0tnr	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	169	Concrete Pad	Concrete Pad	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	28867.23	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvn00wgvceosjl4l68j	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	171	Condensate Drain Pipes	32mm dia. uPVC blue pipe PNS 65	length/s	37	\N	\N	\N	\N	\N	\N	\N	\N	0	14953.55	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00whvceoy5rskoub	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	172	Condensate Drain Pipes	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	24	\N	\N	\N	\N	\N	\N	\N	\N	0	15403.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wivceofdsu7ftt	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	174	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 32mm pvc	length/s	74	\N	\N	\N	\N	\N	\N	\N	\N	0	31647.58	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wjvceo9zuv1eht	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	175	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 50mm pvc	length/s	48	\N	\N	\N	\N	\N	\N	\N	\N	0	39003.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wkvceomembaeek	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	177	(5.0m pump Lift) Model: BDU513A450VE	(5.0m pump Lift) Model: BDU513A450VE	pcs	12	\N	\N	\N	\N	\N	\N	\N	\N	0	365677.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wlvceoc7gtxo25	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	179	Fittings	Wye 50mm	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	641.52	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wmvceo7q005mct	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	180	Fittings	Wye Reducer 50 x 32	pcs	13	\N	\N	\N	\N	\N	\N	\N	\N	0	2501.98	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wnvceo3drib6jo	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	181	Fittings	Tee 32mm	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	160.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wovceo0r87akd0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	182	Fittings	Elbow 32mm	pcs	6	\N	\N	\N	\N	\N	\N	\N	\N	0	261.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wpvceoma53cka0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	183	Fittings	Cleanout 50mm	pcs	4	\N	\N	\N	\N	\N	\N	\N	\N	0	855.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wqvceoshlic1fb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	186	Rough-ins	liquid-tight metallic flexible conduits 1-1/2"	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	31523.7	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wrvceo6ebbjwyg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	187	Rough-ins	Metallic Flexible Conduit	m	673	\N	\N	\N	\N	\N	\N	\N	\N	0	44330.51	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wsvceoh1dayzyl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	188	Rough-ins	Metallic Flexible Conduit Connector 20mm	pcs	34	\N	\N	\N	\N	\N	\N	\N	\N	0	1091.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wtvceoblmb5s7b	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	190	Cables / Wires	Communication wire (PD Royal Cord 0.75mm/2C)	m	482	\N	\N	\N	\N	\N	\N	\N	\N	0	38964.88	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvo00wuvceoidipdnsb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	191	Cables / Wires	Wire 3.5mm² THHN (5 meters per Unit)	m	94	\N	\N	\N	\N	\N	\N	\N	\N	0	7377.12	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00wvvceoty1e2hit	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	192	Cables / Wires	Wire 5.5mm² THHN (5 meters per Unit)	m	13	\N	\N	\N	\N	\N	\N	\N	\N	0	1505.79	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00wwvceo7i1c25gh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	193	Cables / Wires	Wire 30.0mm² THHN (5 meters per Unit)	m	59	\N	\N	\N	\N	\N	\N	\N	\N	0	46578.73	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00wxvceocgpvnbt7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	195	Cables / Wires	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	85	\N	\N	\N	\N	\N	\N	\N	\N	0	6670.8	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00wyvceoj0qznugx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	196	Cables / Wires	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	\N	\N	\N	\N	\N	\N	\N	\N	0	3757.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00wzvceo1rixxzox	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	198	CONSUMABLES	Vibration Isolator	pcs	16	\N	\N	\N	\N	\N	\N	\N	\N	0	22238.56	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x0vceom2zj1jfb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	199	CONSUMABLES	Angle Bar, 2x2x 1/4 (6 meters)	length/s	6	\N	\N	\N	\N	\N	\N	\N	\N	0	15139.32	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x1vceog6sag31x	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	200	CONSUMABLES	Rugby	bottle	25	\N	\N	\N	\N	\N	\N	\N	\N	0	6949.75	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x2vceo98ppj3vc	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	201	CONSUMABLES	White Tape	rolls	49	\N	\N	\N	\N	\N	\N	\N	\N	0	18336.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x3vceoaceb6uxz	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	202	CONSUMABLES	Threaded rod 3/8 (6 meters)	length/s	107	\N	\N	\N	\N	\N	\N	\N	\N	0	18304.49	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x4vceomqpr4t7e	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	203	CONSUMABLES	Nuts and washer 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	684.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x5vceonz7wsqi7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	204	CONSUMABLES	Grip Anchor 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	342.4	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x6vceoyn5wargd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	205	CONSUMABLES	Paint (Red Oxide)	gallon	1	\N	\N	\N	\N	\N	\N	\N	\N	0	3432	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x7vceo66cre2nl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	206	CONSUMABLES	Loop Hangers	pcs	402	\N	\N	\N	\N	\N	\N	\N	\N	0	17197.56	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x8vceorsa71z0w	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	207	CONSUMABLES	Freon	tank	7	\N	\N	\N	\N	\N	\N	\N	\N	0	101484.39	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00x9vceoqht811dd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	208	CONSUMABLES	Nitrogen	tank	4	\N	\N	\N	\N	\N	\N	\N	\N	0	72702.64	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvp00xavceo7e0y09wx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	209	CONSUMABLES	Mapp Gas	tank	12	\N	\N	\N	\N	\N	\N	\N	\N	0	10263.96	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xbvceo66xv5iby	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	210	CONSUMABLES	Silver Rod	pcs	160	\N	\N	\N	\N	\N	\N	\N	\N	0	8555.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xcvceo3ij1cxqo	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	211	CONSUMABLES	Paint Brush	pcs	1	\N	\N	\N	\N	\N	\N	\N	\N	0	213.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xdvceosnape4dm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	212	CHIPPING & RESTORATION (ROUGH-ONLY)	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	737348.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xevceoy0iea8ct	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	213	MISCELLANEOUS	MISCELLANEOUS	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	6640.71	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xfvceosdvhb5t9	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	214	TESTING & COMMISIONING	TESTING & COMMISIONING	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	47190.33	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xgvceojt50i2ui	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	216	AIR CONDITIONING- VRV SYSTEM C	ACCU- Model: RXQ18BYM	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	2223173.13	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xhvceo3samf76v	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	217	AIR CONDITIONING- VRV SYSTEM C	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	175061.38	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xivceo3hfumm4s	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	219	ACU Accessories:	Wired Remote Controller Model: BRC1E63	units	10	\N	\N	\N	\N	\N	\N	\N	\N	0	117607.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xjvceoet3w640a	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	220	ACU Accessories:	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	44690.74	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xkvceoiy4l6dsy	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	221	ACU Accessories:	Refnet Joints Model: KHRP26A33T	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	9879.02	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xlvceoy68dio4z	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	222	ACU Accessories:	Refnet Joints Model: KHRP26A72T	units	4	\N	\N	\N	\N	\N	\N	\N	\N	0	32930.04	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xmvceob00h9rsf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	223	ACU Accessories:	Refnet Joints Model: KHRP26A73T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	42338.61	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xnvceo0hpum8rk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	224	ACU Accessories:	Pipe Size Reducer Model: KHRP26M73TP	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	17993.91	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xovceo1k4qepch	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	225	ACU Accessories:	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	39751.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xpvceo1blqc3y2	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	227	Copper Pipes - Type L Hard Drawn Pipes	1/4"	length/s	1	\N	\N	\N	\N	\N	\N	\N	\N	0	2120.33	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvq00xqvceo0vo44ovr	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	228	Copper Pipes - Type L Hard Drawn Pipes	3/8"	length/s	11	\N	\N	\N	\N	\N	\N	\N	\N	0	32475.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xrvceoqlu6kadb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	229	Copper Pipes - Type L Hard Drawn Pipes	1/2"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	9393.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xsvceo5avoe19i	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	230	Copper Pipes - Type L Hard Drawn Pipes	5/8"	length/s	14	\N	\N	\N	\N	\N	\N	\N	\N	0	94863.3	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xtvceokh0iupta	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	231	Copper Pipes - Type L Hard Drawn Pipes	3/4"	length/s	9	\N	\N	\N	\N	\N	\N	\N	\N	0	77780.97	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xuvceoi7xieqdr	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	232	Copper Pipes - Type L Hard Drawn Pipes	7/8"	length/s	1	\N	\N	\N	\N	\N	\N	\N	\N	0	10870.01	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xvvceoblbppp3m	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	233	Copper Pipes - Type L Hard Drawn Pipes	1-1/8"	length/s	5	\N	\N	\N	\N	\N	\N	\N	\N	0	77834.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xwvceowo01lmri	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	234	Copper Pipes - Type L Hard Drawn Pipes	1-3/8"	length/s	3	\N	\N	\N	\N	\N	\N	\N	\N	0	63045.99	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xxvceohvr58vp6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	235	Copper Pipes - Type L Hard Drawn Pipes	1-5/8"	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	189278.39	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xyvceo199hqbp8	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	237	Copper Pipes Insulation 25mm Thick	1/4"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	867.14	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00xzvceokp4spqlx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	238	Copper Pipes Insulation 25mm Thick	3/8"	length/s	21	\N	\N	\N	\N	\N	\N	\N	\N	0	9278.43	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y0vceotxnrrru6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	239	Copper Pipes Insulation 25mm Thick	1/2"	length/s	4	\N	\N	\N	\N	\N	\N	\N	\N	0	2064.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y1vceo02rlqnoj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	240	Copper Pipes Insulation 25mm Thick	5/8"	length/s	27	\N	\N	\N	\N	\N	\N	\N	\N	0	17002.17	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y2vceouu9967rg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	241	Copper Pipes Insulation 25mm Thick	3/4"	length/s	17	\N	\N	\N	\N	\N	\N	\N	\N	0	12038.72	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y3vceo1bm75p9o	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	242	Copper Pipes Insulation 25mm Thick	7/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	1569.1	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y4vceoct9depm3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	243	Copper Pipes Insulation 25mm Thick	1-1/8"	length/s	10	\N	\N	\N	\N	\N	\N	\N	\N	0	8464.9	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y5vceo2q1yky2w	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	244	Copper Pipes Insulation 25mm Thick	1-3/8"	length/s	5	\N	\N	\N	\N	\N	\N	\N	\N	0	4480.15	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvr00y6vceoqs327cxl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	245	Copper Pipes Insulation 25mm Thick	1-5/8"	length/s	13	\N	\N	\N	\N	\N	\N	\N	\N	0	13151.58	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00y7vceo8m5pe7l2	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	246	Copper Pipe Fittings	Copper Pipe Fittings	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	59135.15	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00y8vceoek6329f4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	247	Isolation Ball Valves	Isolation Ball Valves	pc/s	20	\N	\N	\N	\N	\N	\N	\N	\N	0	64149.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00y9vceohf0mzw6t	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	248	PVC Cladding Works	PVC Cladding Works	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	19711.72	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yavceovijss0vh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	249	Concrete Pad	Concrete Pad	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	28867.23	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ybvceo3ylba923	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	251	Condensate Drain Pipes	32mm dia. uPVC blue pipe PNS 65	length/s	33	\N	\N	\N	\N	\N	\N	\N	\N	0	13336.95	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ycvceors8oiep9	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	252	Condensate Drain Pipes	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	12	\N	\N	\N	\N	\N	\N	\N	\N	0	7701.96	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ydvceojmjfj5cp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	254	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 32mm pvc	length/s	66	\N	\N	\N	\N	\N	\N	\N	\N	0	28226.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yevceo8dtm4kvf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	255	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 50mm pvc	length/s	23	\N	\N	\N	\N	\N	\N	\N	\N	0	18689.11	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yfvceoq2jj5rtm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	257	(5.0m pump Lift) Model: BDU513A450VE	(5.0m pump Lift) Model: BDU513A450VE	pcs	11	\N	\N	\N	\N	\N	\N	\N	\N	0	335204.76	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ygvceo3xcwkx2n	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	259	Fittings	Wye Reducer 50 x 32	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	1347.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yhvceokn40sd4n	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	260	Fittings	Tee 32mm	length/s	6	\N	\N	\N	\N	\N	\N	\N	\N	0	320.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yivceo9icadyby	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	261	Fittings	Elbow 32mm	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	305.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00yjvceo7ff8o9j6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	262	Fittings	Cleanout 50mm	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	427.68	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ykvceocxhk0whg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	265	Rough-ins	liquid-tight metallic flexible conduits 1-1/2"	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	31523.7	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ylvceo1fpa61jh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	266	Rough-ins	Metallic Flexible Conduit 20mm	m	444	\N	\N	\N	\N	\N	\N	\N	\N	0	29246.28	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvs00ymvceox47lwnpj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	267	Rough-ins	Metallic Flexible Conduit Connector 20mm	pcs	26	\N	\N	\N	\N	\N	\N	\N	\N	0	834.34	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00ynvceolpxneryu	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	269	Cables / Wires	Communication wire (PD Royal Cord 0.75mm/2C)	m	291	\N	\N	\N	\N	\N	\N	\N	\N	0	23524.44	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yovceozcp22v2t	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	270	Cables / Wires	Wire 3.5mm² THHN (5 meters per Unit)	m	63	\N	\N	\N	\N	\N	\N	\N	\N	0	4944.87	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00ypvceobkcp0561	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	271	Cables / Wires	Wire 5.5mm² THHN (5 meters per Unit)	m	26	\N	\N	\N	\N	\N	\N	\N	\N	0	3122.86	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yqvceo9yssu8hb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	272	Cables / Wires	Wire 30.0mm² THHN (5 meters per Unit)	m	59	\N	\N	\N	\N	\N	\N	\N	\N	0	46578.73	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yrvceowi4yia51	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	274	Cables / Wires	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	65	\N	\N	\N	\N	\N	\N	\N	\N	0	5101.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00ysvceocajq3wfw	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	275	Cables / Wires	Wire 8.0mm² THHN (G) (5 meters per Unit)	m	20	\N	\N	\N	\N	\N	\N	\N	\N	0	3757.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00ytvceo0ckepnal	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	277	CONSUMABLES	Vibration Isolator	pcs	20	\N	\N	\N	\N	\N	\N	\N	\N	0	27798.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yuvceof78wixot	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	278	CONSUMABLES	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	17662.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yvvceo3t3to48e	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	279	CONSUMABLES	Rugby	bottle	15	\N	\N	\N	\N	\N	\N	\N	\N	0	4169.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00ywvceorfn7iurq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	280	CONSUMABLES	White Tape	rolls	30	\N	\N	\N	\N	\N	\N	\N	\N	0	11226.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yxvceotg3qnsvp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	281	CONSUMABLES	Threaded rod 3/8 (6 meters)	length/s	65	\N	\N	\N	\N	\N	\N	\N	\N	0	11119.55	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yyvceo9ao50zkd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	282	CONSUMABLES	Nuts and washer 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	684.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvt00yzvceoqmfeals0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	283	CONSUMABLES	Grip Anchor 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	342.4	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z0vceolglusboz	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	284	CONSUMABLES	Paint (Red Oxide)	gallon	1	\N	\N	\N	\N	\N	\N	\N	\N	0	3432	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z1vceof62cor9c	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	285	CONSUMABLES	Loop Hangers	pcs	244	\N	\N	\N	\N	\N	\N	\N	\N	0	10438.32	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z2vceosckxc1qj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	286	CONSUMABLES	Freon	tank	5	\N	\N	\N	\N	\N	\N	\N	\N	0	72488.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z3vceoyr4il439	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	287	CONSUMABLES	Nitrogen	tank	3	\N	\N	\N	\N	\N	\N	\N	\N	0	54526.98	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z4vceoma6v0b3g	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	288	CONSUMABLES	Mapp Gas	tank	8	\N	\N	\N	\N	\N	\N	\N	\N	0	6500.56	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z5vceo8p86jdw1	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	289	CONSUMABLES	Silver Rod	pcs	98	\N	\N	\N	\N	\N	\N	\N	\N	0	5240.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z6vceoq7wymox4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	290	CONSUMABLES	Paint Brush	pcs	1	\N	\N	\N	\N	\N	\N	\N	\N	0	213.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z7vceoftf1vax8	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	291	CHIPPING & RESTORATION (ROUGH-ONLY)	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	737348.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z8vceot2ioanu9	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	292	MISCELLANEOUS	MISCELLANEOUS	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	5010.49	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00z9vceozrazejen	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	293	TESTING & COMMISIONING	TESTING & COMMISSIONING	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	38342.14	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zavceooerpeec4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	295	AIR CONDITIONING- VRV SYSTEM D	ACCU- Model: RXQ20BYM	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	2367951.57	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zbvceoiaj5pjjp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	296	AIR CONDITIONING- VRV SYSTEM D	FCU- 6HP ceiling Cassette VRF C (Corridor near Ortho, Corridor near OR. No. 10, Corridor near NSS/Pay) Model: FXFQ140AVM	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	175061.38	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zcvceo3g1494vl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	298	ACU Accessories:	Wired Remote Controller Model: BRC1E63	units	12	\N	\N	\N	\N	\N	\N	\N	\N	0	141128.64	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zdvceojsk52znh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	299	ACU Accessories:	Standard panel(Fresh white) Model: BYCQ125EAF	units	2	\N	\N	\N	\N	\N	\N	\N	\N	0	44690.74	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zevceo0c0o21wk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	300	ACU Accessories:	Refnet Joints Model: KHRP26A22T	units	4	\N	\N	\N	\N	\N	\N	\N	\N	0	17405.88	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvu00zfvceoqidqwozc	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	301	ACU Accessories:	Refnet Joints Model: KHRP26A33T	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	4939.51	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zgvceoqngkxn5n	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	302	ACU Accessories:	Refnet Joints Model: KHRP26A72T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	24697.53	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zhvceohfk430xs	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	303	ACU Accessories:	Refnet Joints Model: KHRP26A73T	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	42338.61	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zivceowv9c5hae	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	304	ACU Accessories:	Pipe Size Reducer Model: KHRP26M73TP	units	3	\N	\N	\N	\N	\N	\N	\N	\N	0	17993.91	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zjvceorxcjqajq	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	305	ACU Accessories:	VRV Multi Con piping kit Model: BHFP22R168-7	units	1	\N	\N	\N	\N	\N	\N	\N	\N	0	39751.22	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zkvceolwpi8loj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	307	Copper Pipes - Type L Hard Drawn Pipes	1/4"	length/s	8	\N	\N	\N	\N	\N	\N	\N	\N	0	16962.64	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zlvceoglxy7323	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	308	Copper Pipes - Type L Hard Drawn Pipes	3/8"	length/s	12	\N	\N	\N	\N	\N	\N	\N	\N	0	35428.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zmvceoh11fcmn8	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	309	Copper Pipes - Type L Hard Drawn Pipes	1/2"	length/s	10	\N	\N	\N	\N	\N	\N	\N	\N	0	46969.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00znvceotuut3nn6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	310	Copper Pipes - Type L Hard Drawn Pipes	5/8"	length/s	14	\N	\N	\N	\N	\N	\N	\N	\N	0	94863.3	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zovceoo6nphkso	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	311	Copper Pipes - Type L Hard Drawn Pipes	3/4"	length/s	16	\N	\N	\N	\N	\N	\N	\N	\N	0	138277.28	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zpvceou94dmahd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	312	Copper Pipes - Type L Hard Drawn Pipes	7/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	21740.02	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zqvceohnphb00i	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	313	Copper Pipes - Type L Hard Drawn Pipes	1-1/8"	length/s	5	\N	\N	\N	\N	\N	\N	\N	\N	0	77834.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zrvceovgftnqr3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	314	Copper Pipes - Type L Hard Drawn Pipes	1-3/8"	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	42030.66	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zsvceolfv072hk	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	315	Copper Pipes - Type L Hard Drawn Pipes	1-5/8"	length/s	14	\N	\N	\N	\N	\N	\N	\N	\N	0	378556.78	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00ztvceoomof6zha	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	317	Copper Pipes Insulation 25mm Thick	1/4"	length/s	16	\N	\N	\N	\N	\N	\N	\N	\N	0	6937.12	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvv00zuvceoaqo13mue	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	318	Copper Pipes Insulation 25mm Thick	3/8"	length/s	24	\N	\N	\N	\N	\N	\N	\N	\N	0	10603.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw00zvvceo0332j929	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	319	Copper Pipes Insulation 25mm Thick	1/2"	length/s	19	\N	\N	\N	\N	\N	\N	\N	\N	0	9806.85	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw00zwvceodyb9nya7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	320	Copper Pipes Insulation 25mm Thick	5/8"	length/s	27	\N	\N	\N	\N	\N	\N	\N	\N	0	17002.17	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw00zxvceorv9060bs	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	321	Copper Pipes Insulation 25mm Thick	3/4"	length/s	31	\N	\N	\N	\N	\N	\N	\N	\N	0	21952.96	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw00zyvceo9fg9vwgs	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	322	Copper Pipes Insulation 25mm Thick	7/8"	length/s	4	\N	\N	\N	\N	\N	\N	\N	\N	0	3138.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw00zzvceobvh1h8yd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	323	Copper Pipes Insulation 25mm Thick	1-1/8"	length/s	10	\N	\N	\N	\N	\N	\N	\N	\N	0	8464.9	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0100vceopz6kvlqd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	324	Copper Pipes Insulation 25mm Thick	1-3/8"	length/s	4	\N	\N	\N	\N	\N	\N	\N	\N	0	3584.12	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0101vceo39ijk2xd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	325	Copper Pipes Insulation 25mm Thick	1-5/8"	length/s	27	\N	\N	\N	\N	\N	\N	\N	\N	0	27314.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0102vceowg2tzilo	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	326	Copper Pipe Fittings	Copper Pipe Fittings	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	96659.97	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0103vceo1c15kg1k	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	327	Isolation Ball Valves	Isolation Ball Valves	pc/s	24	\N	\N	\N	\N	\N	\N	\N	\N	0	76979.52	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0104vceo4oad7ue6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	328	PVC Cladding Works	PVC Cladding Works	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	32220	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0105vceoou705n4u	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	329	Concrete Pad	Concrete Pad	pcs	3	\N	\N	\N	\N	\N	\N	\N	\N	0	28867.23	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0106vceo314u736h	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	331	Condensate Drain Pipes	32mm dia. uPVC blue pipe PNS 65	length/s	31	\N	\N	\N	\N	\N	\N	\N	\N	0	12528.65	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0107vceouij534ai	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	332	Condensate Drain Pipes	50mm dia. PVC blue uPVC blue pipe PNS 65	length/s	38	\N	\N	\N	\N	\N	\N	\N	\N	0	24389.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0108vceog7hyddab	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	334	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 32mm pvc	length/s	61	\N	\N	\N	\N	\N	\N	\N	\N	0	26087.87	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw0109vceo8p8xspvu	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	335	Condensate Drain Pipes Rubber Insulation 1.5 meters	3/4'' thick for 50mm pvc	length/s	75	\N	\N	\N	\N	\N	\N	\N	\N	0	60942.75	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvw010avceofxzvorr5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	337	(5.0m pump Lift) Model: BDU513A450VE	(5.0m pump Lift) Model: BDU513A450VE	pcs	10	\N	\N	\N	\N	\N	\N	\N	\N	0	304731.6	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010bvceourc3y3ku	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	339	Fittings	Wye 50mm	length/s	2	\N	\N	\N	\N	\N	\N	\N	\N	0	427.68	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010cvceok4g77c4s	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	340	Fittings	Wye Reducer 50 x 32	length/s	11	\N	\N	\N	\N	\N	\N	\N	\N	0	2117.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010dvceor6k0wtay	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	341	Fittings	Tee 32mm	length/s	3	\N	\N	\N	\N	\N	\N	\N	\N	0	160.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010evceo4y5o4hpj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	342	Fittings	Tee Reducer 50 x 32	length/s	3	\N	\N	\N	\N	\N	\N	\N	\N	0	609.45	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010fvceonj0jamjh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	343	Fittings	Elbow 32mm	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	305.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010gvceozbajj8wl	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	344	Fittings	Cleanout 50mm	length/s	6	\N	\N	\N	\N	\N	\N	\N	\N	0	1283.04	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010hvceod90bz8ox	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	347	Rough-ins	liquid-tight metallic flexible conduits 2"	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	59544.42	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010ivceoeq1t4xmd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	348	Rough-ins	Metallic Flexible Conduit 20mm	m	654	\N	\N	\N	\N	\N	\N	\N	\N	0	43078.98	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010jvceo6mr0zek0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	349	Rough-ins	Metallic Flexible Conduit Connector 20mm	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	1026.88	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010kvceon3ut70k6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	351	Cables / Wires	Communication wire (PD Royal Cord 0.75mm/2C)	m	472	\N	\N	\N	\N	\N	\N	\N	\N	0	38156.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010lvceohvzvl5xm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	352	Cables / Wires	Wire 3.5mm² THHN (5 meters per Unit)	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	6009.9	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010mvceox9lj8vmx	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	353	Cables / Wires	Wire 5.5mm² THHN (5 meters per Unit)	m	26	\N	\N	\N	\N	\N	\N	\N	\N	0	3122.86	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010nvceo7fly4c3l	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	354	Cables / Wires	Wire 38.0mm² THHN (5 meters per Unit)	m	59	\N	\N	\N	\N	\N	\N	\N	\N	0	55353.8	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010ovceoyskt2zk7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	356	Cables / Wires	Wire 3.5mm² THHN (G) (5 meters per Unit)	m	78	\N	\N	\N	\N	\N	\N	\N	\N	0	5878.08	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010pvceoj45zbc2i	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	357	Cables / Wires	Wire 14.0mm² THHN (G) (5 meters per Unit)	m	20	\N	\N	\N	\N	\N	\N	\N	\N	0	6220.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvx010qvceomh14y7k1	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	359	CONSUMABLES	Vibration Isolator	pcs	20	\N	\N	\N	\N	\N	\N	\N	\N	0	27798.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010rvceowph6w0pg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	360	CONSUMABLES	Angle Bar, 2x2x 1/4 (6 meters)	length/s	7	\N	\N	\N	\N	\N	\N	\N	\N	0	17662.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010svceooijsahqe	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	361	CONSUMABLES	Rugby	bottle	24	\N	\N	\N	\N	\N	\N	\N	\N	0	6671.76	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010tvceohnnu7zc3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	362	CONSUMABLES	White Tape	rolls	47	\N	\N	\N	\N	\N	\N	\N	\N	0	17588.34	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010uvceo6ov6zjxh	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	363	CONSUMABLES	Threaded rod 3/8 (6 meters)	length/s	104	\N	\N	\N	\N	\N	\N	\N	\N	0	17791.28	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010vvceor8x9g18h	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	364	CONSUMABLES	Nuts and washer 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	684.48	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010wvceouqdbatpd	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	365	CONSUMABLES	Grip Anchor 3/8	pcs	32	\N	\N	\N	\N	\N	\N	\N	\N	0	342.4	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010xvceo2uy604bv	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	366	CONSUMABLES	Paint (Red Oxide)	gallon	1	\N	\N	\N	\N	\N	\N	\N	\N	0	3432	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010yvceocs24zh4c	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	367	CONSUMABLES	Loop Hangers	pcs	393	\N	\N	\N	\N	\N	\N	\N	\N	0	16812.54	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy010zvceoogypnmj5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	368	CONSUMABLES	Freon	tank	8	\N	\N	\N	\N	\N	\N	\N	\N	0	115982.16	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0110vceojuaujvup	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	369	CONSUMABLES	Nitrogen	tank	4	\N	\N	\N	\N	\N	\N	\N	\N	0	72702.64	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0111vceoe0tjavi7	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	370	CONSUMABLES	Mapp Gas	tank	12	\N	\N	\N	\N	\N	\N	\N	\N	0	9750.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0112vceoua7jxfkg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	371	CONSUMABLES	Silver Rod	pcs	158	\N	\N	\N	\N	\N	\N	\N	\N	0	8448.26	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0113vceom6q6ha34	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	372	CONSUMABLES	Paint Brush	pcs	1	\N	\N	\N	\N	\N	\N	\N	\N	0	213.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0114vceowfua23sj	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	373	CHIPPING & RESTORATION (ROUGH-ONLY)	CHIPPING & RESTORATION (ROUGH-ONLY)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	737348.84	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0115vceototbgnes	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	374	MISCELLANEOUS	MISCELLANEOUS	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	7277.91	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvy0116vceow5rorydp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	375	TESTING & COMMISIONING	TESTING & COMMISSIONING	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	44240.94	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz0117vceo2frwybat	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	381	Cables / Wires	250mm² THHN	m	726	\N	\N	\N	\N	\N	\N	\N	\N	7092.359999999999	5149053.36	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz0118vceoxwaijqnb	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	382	Cables / Wires	200mm² THHN	m	117	\N	\N	\N	\N	\N	\N	\N	\N	0	644571.72	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz0119vceosyig86vf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	383	Cables / Wires	38mm² THHN	m	390	\N	\N	\N	\N	\N	\N	\N	\N	0	439327.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011avceo7gz1hvb4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	385	Cables / Wires	80mm² THHN	m	242	\N	\N	\N	\N	\N	\N	\N	\N	0	515401.92	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011bvceohf12cmkm	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	386	Cables / Wires	30mm² THHN	m	39	\N	\N	\N	\N	\N	\N	\N	\N	0	32123.91	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011cvceopwydjh0c	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	387	Cables / Wires	14mm² THHN	m	130	\N	\N	\N	\N	\N	\N	\N	\N	0	46653.1	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011dvceo6tb8eald	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	389	Roughing-ins	90mm dia. IMC	length/s	94	\N	\N	\N	\N	\N	\N	\N	\N	0	874356.98	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011evceolri11bhg	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	390	Roughing-ins	40mm dia. IMC	length/s	45	\N	\N	\N	\N	\N	\N	\N	\N	0	120280.5	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011fvceolphpn5r3	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	392	Panel Board & Pullbox	DP-Main	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	772225.45	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011gvceoix9fbzki	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	396	Panel Board & Pullbox	PP-System A	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	125827.11	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011hvceo9raabcx5	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	401	Panel Board & Pullbox	PP-System B	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	135268.13	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011ivceoeo1r97py	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	406	Panel Board & Pullbox	PP-System C	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	120190.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011jvceo4eu1z06f	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	411	Panel Board & Pullbox	PP-System D	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	131472.25	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yvz011kvceoo1yf772t	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	416	Panel Board & Pullbox	PP-Outdoor	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	473575.57	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011lvceov0w2t88i	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	419	1.0	Transformer	Assy	1	\N	\N	\N	\N	\N	\N	\N	\N	0	932598.82	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011mvceok5n4b1ia	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	421	ECB	ECB 1250AT Nema 12	pc	1	\N	\N	\N	\N	\N	\N	\N	\N	0	302047.59	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011nvceoo4wmegx6	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	422	Pullbox	Pullbox (350mm x 350mm x 200mm)	pc	5	\N	\N	\N	\N	\N	\N	\N	\N	0	27691.2	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011ovceooxbx1m5w	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	423	Wire Gutter	Wire Gutter	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	32074.68	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011pvceozhws7nye	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	426	ECB	ECB 150AT, 3P, 230V, Nema3R	pc	4	\N	\N	\N	\N	\N	\N	\N	\N	0	116076.44	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011qvceobwkr68r4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	427	ECB	ECB 40AT, 3P, 230V, Nema3R	pc	7	\N	\N	\N	\N	\N	\N	\N	\N	0	77586.88	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011rvceo9qq3q70t	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	428	ECB	ECB 40AT, 2P, 230V, Nema3R	pc	16	\N	\N	\N	\N	\N	\N	\N	\N	0	150867.52	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011svceoa53p8mp0	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	429	ECB	ECB 30AT, 2P, 230V, Nema3R	pc	23	\N	\N	\N	\N	\N	\N	\N	\N	0	216872.06	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011tvceopgfoavje	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	431	Roughing-ins	40mm dia. IMC	length/s	49	\N	\N	\N	\N	\N	\N	\N	\N	0	130972.1	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011uvceojzjdzoox	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	432	Roughing-ins	25mm dia. IMC	length/s	1003	\N	\N	\N	\N	\N	\N	\N	\N	0	1758690.29	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011vvceo6dfba4u4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	434	Roughing-ins	Junction boxes with cover	pc/s	195	\N	\N	\N	\N	\N	\N	\N	\N	0	24540.75	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011wvceogr8b6lzp	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	436	Cables / Wires	50mm² THHN	Lm/s	429	\N	\N	\N	\N	\N	\N	\N	\N	0	598841.1	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011xvceowte9pet4	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	437	Cables / Wires	5.5mm² THHN	Lm/s	6798	\N	\N	\N	\N	\N	\N	\N	\N	0	979795.74	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011yvceouy0m9qgf	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	439	Cables / Wires	14mm² THHN	Lm/s	143	\N	\N	\N	\N	\N	\N	\N	\N	0	51318.41	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw0011zvceom0f4b8me	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	440	Cables / Wires	5.5mm² THHN	Lm/s	3185	\N	\N	\N	\N	\N	\N	\N	\N	0	459054.05	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw00120vceoc5kap5tn	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	441	Chipping & Restoration Works (Rough only)	Chipping & Restoration Works (Rough only)	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	145441.09	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw10121vceoy1dw4ib1	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	442	Hangers & Supports	Hangers & Supports	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	174529.31	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw10122vceocrw6tj79	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	443	Miscelleneuos	Miscelleneuos	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	87264.66	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
cmrlx3yw10123vceozr00i2ev	cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	\N	\N	444	Testing & Commissioning	Testing & Commissioning	lot	1	\N	\N	\N	\N	\N	\N	\N	\N	0	884818.61	\N	\N	PENDING	\N	2026-07-15 10:08:55.361	2026-07-15 10:08:55.361
\.


--
-- Data for Name: BOQExtractedSection; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BOQExtractedSection" (id, "uploadedWorkbookFileId", "projectId", "sheetName", "sourceRowNumber", "sectionCode", "sectionName", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BOQLotBreakdown; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BOQLotBreakdown" (id, description, "weightPercentage", "boqItemId") FROM stdin;
\.


--
-- Data for Name: BOQMapping; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: BackCharge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BackCharge" (id, "backChargeNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", description, "incidentDate", "costComputation", photos, "inspectionReport", "materialRef", "manpowerRef", amount, acknowledgment, "disputeStatus", "approvalStatus", "deductionStatus", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BaselineActivation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BaselineActivation" (id, "projectId", "scheduleId", "reviewRound", "revisionCode", "previousBaselineId", "validationSnapshot", "snapshotVersion", "scheduleSnapshotHash", "lockedBOQChecksum", "activatedById", "activatedByNameSnapshot", "activatedByRoleSnapshot", "activatedAt", "createdAt", "idempotencyKey", "invalidatedAt", "invalidationReason", "isAuthoritative", "requestId") FROM stdin;
\.


--
-- Data for Name: Billing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Billing" (id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "totalPreviousBilling", "currentBillingAmount", "totalBillingToDate", "balanceContractAmount", "aiBillingRiskStatus", status, "preparedById", "checkedById", "approvedById", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BillingDeduction; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BillingDeduction" (id, "grossBilling", retention, "withholdingTax", vat, "mobilizationAdvanceRecoupment", "previousOverpayment", "liquidatedDamages", "backCharges", "otherDeductions", "netAmountDue", "billingId") FROM stdin;
\.


--
-- Data for Name: BillingItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."BillingItem" (id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "previousAmountBilled", "currentAmount", "totalAmountToDate", "balanceQuantity", "balanceAmount", "percentageAccomplished", "aiStatus", "aiRiskLevel", "billingId", "boqItemId") FROM stdin;
\.


--
-- Data for Name: CanvassForm; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CanvassForm" (id, "canvassNumber", status, "mrId", "projectId", "preparedById", "recommendedSupplierId", "aiSummary", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CanvassItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CanvassItem" (id, "quantityRequired", "canvassFormId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ChatbotFeedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ChatbotFeedback" (id, "auditLogId", "userId", "feedbackType", "correctionNote", "adminAction", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ClientVariationOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ClientVariationOrder" (id, "cvoNumber", "projectId", status, description, "createdAt", "updatedAt", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: CommitmentLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CommitmentLedger" (id, "projectId", "commitmentType", "supplierName", "subcontractorName", "workerName", "approvedAmount", "deliveredAmount", "billedAmount", "paidAmount", "remainingCommitment", status, "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ConsolidatedBOQItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: ConsumptionItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ConsumptionItem" (id, quantity, "logId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ConsumptionLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ConsumptionLog" (id, date, description, "projectId", "loggedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CountermeasureLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CountermeasureLog" (id, "securityEventId", "countermeasureType", description, result, "performedBySystem", "performedByUserId", "timestamp", "createdAt", "actualResult", "expectedResult", passed, "responseTimeMs") FROM stdin;
cmrh8s80m0004jj040n7bm3n4	cmrh8s80e0003jj04y305x7qp	SIMULATED_RESPONSE	Simulated action: Action blocked, security event created, Director notified	SUCCESS	t	\N	2026-07-12 03:36:51.863	2026-07-12 03:36:51.863	Action blocked, security event created, Director notified	Action blocked, security event created, Director notified	t	20
cmrh8sez6000bjj04lf2ry3xd	cmrh8sez2000ajj04vpqnl46o	SIMULATED_RESPONSE	Simulated action: Session terminated, user forced to re-authenticate	SUCCESS	t	\N	2026-07-12 03:37:00.882	2026-07-12 03:37:00.882	Session terminated, user forced to re-authenticate	Session terminated, user forced to re-authenticate	t	42
cmrh8sjjs0004l50447ahpxmf	cmrh8sjjm0003l504wfbfn9yi	SIMULATED_RESPONSE	Simulated action: Temporary IP block and admin alert sent	SUCCESS	t	\N	2026-07-12 03:37:06.809	2026-07-12 03:37:06.809	Temporary IP block and admin alert sent	Temporary IP block and admin alert sent	t	46
cmrh8smjg000bl504zp46163s	cmrh8smjc000al504covi9ia4	SIMULATED_RESPONSE	Simulated action: Request rejected, event logged, PM notified	SUCCESS	t	\N	2026-07-12 03:37:10.684	2026-07-12 03:37:10.684	Request rejected, event logged, PM notified	Request rejected, event logged, PM notified	t	23
cmrh8sq9g0004l704yihwon3x	cmrh8sq9b0003l704mrsfnwyg	SIMULATED_RESPONSE	Simulated action: Request rejected, account flagged, admin notified	SUCCESS	t	\N	2026-07-12 03:37:15.508	2026-07-12 03:37:15.508	Request rejected, account flagged, admin notified	Request rejected, account flagged, admin notified	t	44
\.


--
-- Data for Name: DailyTimeRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DailyTimeRecord" (id, "workerId", date, "projectId", "timeIn", "timeOut", "regularHours", "overtimeHours", "nightDiffHours", "restDayHours", "holidayHours", "lateMinutes", "undertimeMinutes", "isAbsent", "absenceStatus", "sourceFile", "validationStatus", remarks, status, "encodedById", "payrollPeriodId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeductionLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DeductionLedger" (id, "workerId", type, "principalAmount", "deductionPerPayroll", balance, status, remarks, "approvedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeductionLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DeductionLog" (id, "ledgerId", "payrollPeriodId", "amountDeducted", "createdAt") FROM stdin;
\.


--
-- Data for Name: Delivery; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Delivery" (id, "receiptNumber", date, status, "poId", "receivedById", "verifierId", "reviewerId", "approverId", "proofFileUrl", "hasProof", "isMismatch", "mismatchNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeliveryItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DeliveryItem" (id, quantity, "deliveryId", "consolidatedBoqItemId", remarks, "drQuantity") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Document" (id, title, category, "fileUrl", "fileType", "fileSize", "projectId", "uploaderId", "createdAt", "updatedAt") FROM stdin;
cmrirhi1o00ccic04ldfcqb1t	Awarded BOQ Template	AWARDED_BOQ_TEMPLATE		application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	1789072	cmrirhhw30000ic0406v47smb	\N	2026-07-13 05:08:10.524	2026-07-13 05:08:10.524
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."DocumentTemplate" (id, "templateName", "templateType", "fileUrl", "fileName", "parsedData", "isLocked", "uploadedById", status, "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Equipment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Equipment" (id, code, name, category, brand, model, "plateNumber", "ownershipType", status, "hourlyRate", "purchaseDate", "fmsDeviceId", "fmsProvider", "lastOdometer", "lastEngineHours", "createdAt", "updatedAt", "assignedDepartment", "chassisNumber", "engineNumber", "fuelType") FROM stdin;
\.


--
-- Data for Name: EquipmentAIValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EquipmentAIValidation" (id, "equipmentId", type, severity, findings, recommendations, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EquipmentDeployment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EquipmentDeployment" (id, "equipmentId", "projectId", "driverId", "targetDate", "expectedReturnDate", "dateDeployed", "dateReturned", status, purpose, notes, "requestedById", "approvedById", "createdAt", "updatedAt", "destinationAddress", "destinationLat", "destinationLng") FROM stdin;
\.


--
-- Data for Name: EquipmentMaintenance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EquipmentMaintenance" (id, "equipmentId", type, "scheduledDate", "completedDate", cost, description, status, "fmsFaultCode", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EquipmentTelemetry; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EquipmentTelemetry" (id, "equipmentId", "timestamp", latitude, longitude, speed, "engineState", odometer, "engineHours", "fuelLevel", "faultCodes", "gpsAccuracy", heading, "ignitionStatus", "locationSource", "rawPayloadJson", "receivedAt", "satelliteCount") FROM stdin;
\.


--
-- Data for Name: EquipmentUtilization; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EquipmentUtilization" (id, "equipmentId", "projectId", date, "hoursUsed", "fuelConsumed", "taskDescription", "loggedBy", source, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvidenceFile; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."EvidenceFile" (id, "fileName", "fileType", "evidenceType", "fileUrl", "uploadedById", "uploadDate", "gpsLatitude", "gpsLongitude", "dateTaken", "metadataStatus", description, "versionNumber", "projectId", "boqItemId", "accomplishmentId") FROM stdin;
\.


--
-- Data for Name: ExecutiveAccessLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExecutiveAccessLog" (id, "userId", role, action, "moduleAccessed", "projectId", "transactionId", "ipAddress", "deviceInfo", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExecutiveAlertLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExecutiveAlertLog" (id, "alertType", "projectId", severity, title, description, "sourceModule", "sourceTransactionId", "financialImpact", "operationalImpact", "recommendedAction", status, "assignedTo", "dueDate", "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ExecutiveDashboardPreference; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExecutiveDashboardPreference" (id, "userId", "defaultView", "defaultDateRange", "defaultProjectFilter", "visibleWidgets", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Expense" (id, amount, "totalBreakdownAmount", date, category, description, "receiptRef", "supplierName", "isAccrued", "netAmount", "vatAmount", "billingEligibility", status, "aiValidationStatus", "approvalStatus", "aiValidationRisk", "projectId", "loggedById", "costType", "awardedBoqItemId", "consolidatedBoqItemId", "createdAt", "updatedAt", "reviewerId", "approverId") FROM stdin;
\.


--
-- Data for Name: ExpenseAIValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExpenseAIValidation" (id, "expenseId", "validationStatus", "validationScore", findings, recommendations, "duplicateWarning", "budgetWarning", "scopeAlignmentResult", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExpenseApprovalLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExpenseApprovalLog" (id, "expenseId", action, "actionByUserId", comments, "previousStatus", "newStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExpenseBreakdownItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExpenseBreakdownItem" (id, "expenseId", description, specification, quantity, unit, "unitCost", "totalCost", "supplierName", "purchaseReferenceNo", "receiptInvoiceNo", "purchaseDate", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExpenseProofFile; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ExpenseProofFile" (id, "expenseId", "breakdownItemId", "fileName", "fileType", "fileUrl", "fileHash", "uploadedById", "uploadedAt", "verifiedById", "verifiedAt", status) FROM stdin;
\.


--
-- Data for Name: FileSecurityLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FileSecurityLog" (id, "fileId", "userId", "projectId", module, action, filename, "mimeType", size, "scanStatus", "threatDetected", countermeasure, "createdAt") FROM stdin;
\.


--
-- Data for Name: FinancialDataWaiver; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FinancialDataWaiver" (id, "projectId", "scheduleId", reason, "affectedFields", "normalizationMethod", "migrationDeadline", "requestedById", "requestedByNameSnapshot", "requestedByRoleSnapshot", "approvedById", "approvedByNameSnapshot", "approvedByRoleSnapshot", "approvedAt", "expiresAt", status, "createdAt", "revokedAt", "revocationReason") FROM stdin;
\.


--
-- Data for Name: FleetAIReview; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FleetAIReview" (id, "fleetEventId", "equipmentId", "driverId", "aiSummary", "aiRiskScore", "aiRecommendation", "aiValidationStatus", "reviewedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: FleetEvent; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FleetEvent" (id, "equipmentId", "deviceId", "driverId", "eventType", "eventCategory", severity, "eventTime", "receivedAt", latitude, longitude, "speedKph", heading, title, description, status, "acknowledgedById", "acknowledgedAt", "resolvedById", "resolvedAt", "rawPayloadJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FleetTrip; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."FleetTrip" (id, "equipmentId", "driverId", "deviceId", "tripStartTime", "tripEndTime", "startLatitude", "startLongitude", "endLatitude", "endLongitude", "startAddress", "endAddress", "totalDistanceKm", "maxSpeedKph", "averageSpeedKph", "idleDurationMinutes", "tripStatus", "projectId", purpose, remarks, "createdAt", "updatedAt", "subcontractPackageId") FROM stdin;
\.


--
-- Data for Name: Geofence; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Geofence" (id, name, type, "polygonOrRadiusJson", address, "projectId", "alertOnEntry", "alertOnExit", status, "createdAt", "updatedAt", "subcontractPackageId") FROM stdin;
\.


--
-- Data for Name: GovernmentSettings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."GovernmentSettings" (id, "phEmployeeRate", "phEmployerRate", "phSalaryFloor", "phSalaryCeiling", "pagibigEmployeeRate", "pagibigEmployerRate", "pagibigMaxSalary", "deductionSchedule", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HikvisionDevice; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."HikvisionDevice" (id, "deviceName", "deviceModel", "deviceSerialNumber", "imeiOrUniqueId", "firmwareVersion", "integrationType", "ipAddress", "domainName", port, "usernameEncrypted", "passwordEncrypted", "apiKeyReference", "rtspUrlEncrypted", "deviceGatewayId", "hikcentralResourceId", "hikconnectDeviceId", "simNumber", "simProvider", "installationDate", "installedBy", status, "lastSeenAt", "lastGpsAt", remarks, "equipmentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Inspection; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Inspection" (id, "inspectionDateRequested", "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectionFindings", deficiencies, "punchlistItems", "inspectorName", "dateInspected", "approvalStatus", remarks, "accomplishmentItemId", "createdAt") FROM stdin;
\.


--
-- Data for Name: IssuanceItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."IssuanceItem" (id, "requestedQty", "releasedQty", "issuanceId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: JobOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."JobOrder" (id, "jobNumber", "projectId", "subcontractorId", "packageId", description, "boqReferenceId", location, "contractAmount", "paymentBasis", "startDate", "completionDate", "requiredOutput", "materialResponsibility", "safetyRequirements", "acceptanceCriteria", attachments, "preparedBy", "reviewedBy", "approvedBy", status, remarks, "createdAt", "updatedAt", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: KnowledgeAuditTrail; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."KnowledgeAuditTrail" (id, "knowledgeRecordId", action, "performedBy", "oldValue", "newValue", reason, "timestamp") FROM stdin;
\.


--
-- Data for Name: KnowledgeRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: KnowledgeReference; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."KnowledgeReference" (id, "knowledgeRecordId", "projectId", "workerId", "payrollPeriodId", "createdAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeRuleAuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."KnowledgeRuleAuditLog" (id, "transactionId", "moduleName", "notebookName", "ruleApplied", "validationResult", "actionTaken", "userAction", "overrideRequested", "overrideApprovedBy", "overrideReason", "timestamp") FROM stdin;
\.


--
-- Data for Name: KnowledgeRuleReference; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."KnowledgeRuleReference" (id, "notebookName", "moduleName", "ruleCategory", "ruleTitle", "ruleDescription", "affectedProcess", "validationType", severity, "isMandatory", "effectiveDate", "lastReviewedDate", "sourceLink", "createdBy", "updatedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LiveCameraSnapshot; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LiveCameraSnapshot" (id, "fileUrl", "capturedAt", "capturedById", "cameraId") FROM stdin;
\.


--
-- Data for Name: LockedRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."LockedRecord" (id, "moduleName", "transactionId", "lockedBy", "lockedAt", reason) FROM stdin;
\.


--
-- Data for Name: MaterialIssuance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaterialIssuance" (id, "misNumber", status, activity, "projectId", "foremanId", "warehousemanId", "accountantId", "releasedById", "releaseDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialRequest; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaterialRequest" (id, "mrNumber", status, "projectId", "requesterId", "preparerId", "checkerId", "approverId", purpose, priority, "locationOfUse", remarks, "aiValidationRisk", "aiValidationNotes", "dateNeeded", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialRequestItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaterialRequestItem" (id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "breakdownData") FROM stdin;
\.


--
-- Data for Name: MaterialReturn; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."MaterialReturn" (id, "mrsNumber", status, remarks, "issuanceId", "projectId", "foremanId", "warehousemanId", "receiveDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: NotebookReference; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReference" (id, "referenceCode", title, description, "fileName", "fileType", "filePath", category, "moduleScope", "projectScope", "companyWide", "mandatoryFlag", status, "activeVersionId", "uploadedBy", "uploadedByRole", "approvedBy", "approvedByRole", "effectiveDate", "expiryDate", "createdAt", "updatedAt") FROM stdin;
cmr1cwsmh0014vc28w5tergev	POL-AI-DELIVERY-001	Delivery Receipt AI Validation Rules	Mandatory rules for Delivery Receiving AI verification.	Delivery_Validation_Rules.txt	text/plain	/mock-paths/Delivery_Validation_Rules.txt	PROCUREMENT	Delivery Receiving	\N	t	t	ACTIVE	\N	cmqn5zq7h0000vcvwmwp8s7th	PROJECT_DIRECTOR	cmqn5zq7h0000vcvwmwp8s7th	PROJECT_DIRECTOR	2026-07-01 00:48:04.853	\N	2026-07-01 00:48:04.842	2026-07-01 00:48:04.842
\.


--
-- Data for Name: NotebookReferenceApprovalLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceApprovalLog" (id, "referenceId", action, "actionByUserId", "actionByUserRole", comments, "previousStatus", "newStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceIndexLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceIndexLog" (id, "referenceId", status, details, "createdAt") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceModule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceModule" (id, "referenceId", "moduleName") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceProject; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceProject" (id, "referenceId", "projectId") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceRole; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceRole" (id, "referenceId", "roleName") FROM stdin;
\.


--
-- Data for Name: NotebookReferenceVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."NotebookReferenceVersion" (id, "referenceId", "versionNumber", "fileName", "filePath", "extractedText", "aiSummary", "aiKeywords", "fileHash", status, "indexedStatus", "uploadedBy", "approvedBy", "effectiveDate", "supersededDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OnlyOfficeSession; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."OnlyOfficeSession" (id, "uploadedWorkbookFileId", "projectId", "workbookVersionId", "documentKey", mode, "userId", "userName", "permissionsJson", "configJson", status, "createdAt", "expiresAt", "lastCallbackAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Payment" (id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "bankOrCheckNumber", "orNumber", "ewtCertificateReference", "paymentStatus", remarks, "billingId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentBatch; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentBatch" (id, "batchNumber", "payrollBatchId", "payrollPeriodId", "paymentMethodType", "transferRail", "providerId", "providerBatchReference", "expectedSettlementDate", "payrollBankAccountId", status, "totalAmount", "totalWorkers", "preparedById", "reviewedById", "approvedById", "releasedById", "dateReleased", "reconciliationFileUrl", remarks, "aiRiskLevel", "aiAuditNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentBatchRow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentBatchRow" (id, "paymentBatchId", "payrollId", "workerId", amount, "transferRail", "recipientBankName", "recipientBankCode", "recipientAccountNumber", "recipientAccountName", "gcashMobileNumber", "gcashAccountName", remarks, "senderReferenceId", "idempotencyKey", "originalInstaPayReference", "unionBankTransactionReference", "providerResponseCode", "providerResponseMessage", "failureReason", "retryCount", "expectedSettlementDate", "datePaid", "rawApiResponseReference", status, "transactionReference", "exceptionReason", "reconciledAt") FROM stdin;
\.


--
-- Data for Name: PaymentException; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentException" (id, "payrollBatchId", "payrollId", "workerId", "requiredPaymentMethod", "exceptionReason", "correctiveAction", "assignedToId", status, "approvedById", "dateResolved", "reprocessedTransactionRef", remarks, "createdAt", "updatedAt", amount, "apiPaymentBatchId", "payslipNumber", "recipientBankCode", "recipientBankName", "transferRail", "unionBankResponseCode", "unionBankResponseMessage") FROM stdin;
\.


--
-- Data for Name: PaymentFallbackRecommendation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentFallbackRecommendation" (id, "payslipNumber", "workerId", amount, "originalIntendedRoute", "fallbackRoute", "fallbackReason", "originalInstaPayRef", "recommendedBy", "approvalStatus", "approvedById", "approvalDate", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentLog" (id, "transactionId", "moduleName", amount, "paymentMethod", "referenceNumber", "processedBy", "processedByRole", "createdAt") FROM stdin;
\.


--
-- Data for Name: PaymentProvider; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentProvider" (id, "providerName", "providerType", "transferRail", environment, "apiBaseUrlSandbox", "apiBaseUrlProduction", "oauthTokenUrl", "clientId", "clientSecret", "partnerId", "corporateAccountNumber", "debitAccountNumber", "debitAccountName", currency, "webhookUrl", "webhookSigningSecret", "statusCallbackUrl", "singleTransactionLimit", "dailyTransactionLimit", "monthlyTransactionLimit", "cutOffTime", "expectedSettlementTime", status, "lastConnectionTest", "createdById", "approvedById", "dateCreated", "dateActivated", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PaymentRecord" (id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Payroll" (id, "workerId", "payrollPeriodId", "projectId", "compensationType", rate, "daysWorked", "regularHours", "overtimeHours", "basicPay", "overtimePay", "nightDiffPay", "holidayPay", "restDayPay", allowances, "nonTaxableAllowances", "otherEarnings", "grossPay", "grossTaxablePay", "sssDeduction", "sssEmployerShare", "sssEcEmployerShare", "sssWispDeduction", "sssWispEmployerShare", "philhealthDeduction", "philhealthEmployerShare", "pagibigDeduction", "pagibigEmployerShare", "taxableCompensation", "birPayrollFrequency", "birEffectiveYear", "birBracketNo", "birBaseTax", "birTaxRatePercent", "birExcessOver", "withholdingTax", "manualTaxAdjustment", "finalWithholdingTax", "cashAdvance", "loanDeduction", "otherDeductions", "lateUndertimeAmount", "totalDeductions", "netPay", remarks, "paymentMethod", "paymentStatus", "paymentHoldReason", "paymentBatchId", "createdAt", "updatedAt", "transactionReference") FROM stdin;
\.


--
-- Data for Name: PayrollApproval; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollApproval" (id, "payrollPeriodId", "approvalLevel", "approverUserId", "approverRole", "approvalStatus", "approvalDate", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollAuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollAuditLog" (id, "userId", "userName", "actionType", module, "recordId", "oldValue", "newValue", "ipAddress", remarks, "timestamp") FROM stdin;
\.


--
-- Data for Name: PayrollBankAccount; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollBankAccount" (id, "bankName", "bankBranch", "accountNumber", "accountName", currency, "beginningBalance", "currentAvailableBalance", "reservedPayrollBalance", "actualBankBalance", "lastBalanceSyncDate", "apiEnabled", "bankApiProvider", status, "createdById", "approvedById", "dateCreated", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollBankLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollBankLedger" (id, "payrollBankAccountId", "transactionDate", "transactionType", amount, "balanceAfter", "referenceId", "referenceNumber", remarks, "createdById") FROM stdin;
\.


--
-- Data for Name: PayrollCutoffSetting; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollCutoffSetting" (id, "cutoffName", "cutoffType", "startDay", "endDay", "payrollReleaseDay", "crossesMonth", "isDefault", status, "appliesTo", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollDeduction; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollDeduction" (id, "payrollId", "deductionType", amount, "recurringStatus", "governmentMandatedStatus", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollEarning; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollEarning" (id, "payrollId", "earningType", amount, "taxableStatus", remarks) FROM stdin;
\.


--
-- Data for Name: PayrollFundingRequest; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollFundingRequest" (id, "fundingRequestNumber", "payrollBatchId", "payrollPeriodId", "totalNetPay", "estimatedCharges", "totalRequiredFunding", "availablePayrollBalance", "fundingShortage", "fundingSourceAccount", "destinationAccountId", "fundingStatus", "preparedById", "reviewedById", "approvedById", "dateFunded", "fundingBankReferenceNumber", "proofOfTransferUrl", remarks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollPeriod; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PayrollPeriod" (id, "payrollBatchNumber", month, year, "calendarRule", "periodType", "startDate", "endDate", "payrollDate", status, "projectId", notes, "createdById", "approvedById", "cancelledAt", "dateApproved", "dateReleased", "isLocked", "lockedAt", "lockedById", "dummyField", "createdAt", "updatedAt", "destinationAddress", "destinationLat", "destinationLng") FROM stdin;
\.


--
-- Data for Name: PettyCashAccount; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PettyCashAccount" (id, "accountName", department, "fundLimit", "replenishmentTrigger", "currentBalance", "projectId", "custodianId", "approverId", "reviewerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PettyCashExpense; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PettyCashExpense" (id, date, payee, purpose, category, amount, "isVat", "netAmount", "vatAmount", "billingEligibility", "receiptNumber", "attachmentUrl", "isNoReceipt", remarks, status, "expenseId", "accountId", "projectId", "replenishmentId", "costType", "awardedBoqItemId", "consolidatedBoqItemId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PettyCashReplenishment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PettyCashReplenishment" (id, "requestNumber", status, "fundLimit", "beginningBalance", "totalExpenses", "cashOnHand", "amountRequested", "reviewerAction", "reviewerRemarks", "approverId", "approvalDate", "releaseDate", "releaseMode", "releaseRefNo", "receiverId", "accountId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProcurementBenchmarkItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: ProgramOfWorks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProgramOfWorks" (id, "packageId", title, description, "startDate", "endDate", activities, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Project" (id, name, description, location, "startDate", "endDate", status, "contractAmountVATInclusive", "vatRate", "retentionPercentage", "withholdingTaxPercentage", "mobilizationAdvanceAmount", "advanceRecoupmentMethod", "liquidatedDamagesRate", "otherDeductions", "paymentTerms", "boqLocked", "consolidatedBOQLocked", "procurementBenchmarkLocked", "contractNumber", client, contractor, "gpsLatitude", "gpsLongitude", "acceptableGeotagRadius", "projectCategory", "fundingSource", "contractAmount", "originalContractDuration", "noticeToProceedDate", "originalCompletionDate", "revisedCompletionDate", "implementingOffice", "managerId", "createdAt", "updatedAt") FROM stdin;
cmrirhhw30000ic0406v47smb	PGH_AWARDED BILL OF QUANTITY	Automated Project Import from BOQ File: PGH_AWARDED BILL OF QUANTITY.xlsx	Unknown Location	2026-06-12 00:00:00	2026-12-09 00:00:00	ACTIVE	t	12	10	2	0	PRO_RATA	0.1	0	\N	t	t	t	\N	\N	\N	\N	\N	100	\N	\N	43106674.89000002	180	\N	2026-12-09 00:00:00	\N	\N	cmrinimix001avchckwzmfxsu	2026-07-13 05:08:10.304	2026-07-13 05:14:36.752
cmrlx3xcg00swvceoxntp02vz	PGH SCHEDULING ACCEPTANCE – RECOVERED BOQ	Authoritative reconstruction from validated awarded BOQ evidence following loss of the historical execution database.	UNKNOWN	2026-06-12 00:00:00	2026-12-09 00:00:00	ACTIVE	t	12	10	2	0	PRO_RATA	0.1	0	\N	f	f	f	\N	\N	\N	\N	\N	100	\N	\N	43106674.89	\N	\N	2026-12-09 00:00:00	\N	\N	cmrinimix001avchckwzmfxsu	2026-07-15 10:08:53.391	2026-07-15 10:08:53.391
\.


--
-- Data for Name: ProjectAccomplishmentAIFinding; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectAccomplishmentAIFinding" (id, "fileId", "projectId", "billingId", "findingType", "sheetName", "cellReference", description, severity, recommendation, "createdAt") FROM stdin;
\.


--
-- Data for Name: ProjectAccomplishmentFile; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectAccomplishmentFile" (id, "projectId", "billingId", "fileName", "originalFilePath", "workingFilePath", "fileSize", "fileType", "fileVersion", "uploadedById", status, "isLockedOriginal", remarks, "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: ProjectAccomplishmentFileVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectAccomplishmentFileVersion" (id, "fileId", "versionNumber", "filePath", "savedBy", "savedAt", remarks) FROM stdin;
\.


--
-- Data for Name: ProjectBOQVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectBOQVersion" (id, "projectId", "sourceUploadedWorkbookFileId", "versionNumber", "versionLabel", status, "committedBy", "committedAt", "approvedBy", "approvedAt", "totalDirectCost", "totalIndirectCost", "totalAmount", remarks, "createdAt", "updatedAt", checksum, "checksumAlgorithm", "checksumVersion", "lockedAt", "lockedById", "sourceProvenance") FROM stdin;
cmrlwsoi70009vceo9lkw6asc	cmrlwsnrk0006vceojyl9d776	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:00:08.72	2026-07-15 10:00:08.72	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlwtnru000gvceolaxp4y5w	cmrlwtn1g000dvceohx1fqbav	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:00:54.427	2026-07-15 10:00:54.427	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlwulh2000nvceo7jp7hz88	cmrlwukpd000kvceonokozxg5	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:01:38.102	2026-07-15 10:01:38.102	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlwveuy000uvceoaca4wkm1	cmrlwveh0000rvceou2tdn46u	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:02:16.186	2026-07-15 10:02:16.186	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlwwaqk0011vceoxlew848d	cmrlwwacu000yvceoc3telkez	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:02:57.5	2026-07-15 10:02:57.5	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlwxb9o0018vceohyks396u	cmrlwxaw20015vceox44xev3k	\N	1	Awarded BOQ (Reconstructed)	IMPORTED_PENDING_VALIDATION	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 10:03:44.845	2026-07-15 10:03:44.845	\N	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlx0a4s00ahvceo9kf1ulkv	cmrlx09ds00aevceok7lrhr5c	\N	1	Awarded BOQ (Reconstructed)	VALIDATED_PENDING_LOCK	\N	\N	\N	\N	\N	\N	43106674.89	\N	2026-07-15 10:06:03.341	2026-07-15 10:06:07.1	514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlx26xy00jqvceo2q9zz06r	cmrlx266r00jnvceookhlxslq	\N	1	Awarded BOQ (Reconstructed)	VALIDATED_PENDING_LOCK	\N	\N	\N	\N	\N	\N	43106674.89	\N	2026-07-15 10:07:32.518	2026-07-15 10:07:36.338	514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17	\N	\N	\N	\N	SYNTHESIZED_NORMALIZED_RECOVERY_FROM_VALIDATED_BOQ_DATA
cmrlx3yh500t1vceomq83o215	cmrlx3xcg00swvceoxntp02vz	cmrlx3y3q00t0vceoathnib57	1	Awarded BOQ (Reconstructed)	LOCKED	\N	\N	\N	\N	\N	\N	43106674.89	\N	2026-07-15 10:08:54.858	2026-07-15 14:37:15.351	514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17	SHA-256	BOQ_CANONICAL_V1	2026-07-15 10:09:01.846	cmrinikue0017vchcnxm8wqzn	8c3f6b9a8c2f1b4a...
\.


--
-- Data for Name: ProjectCamera; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectCamera" (id, "cameraName", "cameraLocation", "cameraType", "streamUrl", username, password, "gpsLatitude", "gpsLongitude", "installationDate", status, remarks, "projectId") FROM stdin;
\.


--
-- Data for Name: ProjectCostLedger; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectCostLedger" (id, "projectId", "costDate", "costCategory", "costType", "directIndirect", "supplierName", "subcontractorName", "workerName", "referenceDocumentType", "referenceDocumentNo", quantity, "unitCost", "grossAmount", "vatAmount", "withholdingTaxAmount", "netAmount", "paidAmount", "unpaidBalance", "paymentStatus", "approvalStatus", "encodedById", "approvedById", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: ProjectSchedule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectSchedule" (id, "projectId", name, description, "baselineStartDate", "baselineFinishDate", "currentStartDate", "currentFinishDate", "actualStartDate", "actualFinishDate", status, "calendarDays", "workingDays", holidays, "workDaysConfig", "createdAt", "updatedAt", "activatedAt", "activatedById", "activationSnapshotHash", "approvedAt", "approvedBy", "awardedContractAmount", "baselineRevision", "differenceAmount", "feasibilityFlags", "generatedAt", "generatedBy", "generatedById", "generationRulesVersion", "lockedBOQChecksum", "lockedBOQVersionId", "openAiModelIdentifier", "parentScheduleId", "previousBaselineId", "projectCompletionDate", "projectStartDate", "promptVersion", "reviewRound", "revisionCode", "revisionNumber", "rowVersion", "scheduledAmount", "schedulingEngineVersion", "validationMetrics", "validationRulesVersion", "workflowStatus", "baselineCode") FROM stdin;
e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	AI Generated Construction Schedule	\N	\N	\N	\N	\N	\N	\N	AI_GENERATED_DRAFT	128	128	\N	["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]	2026-07-15 15:06:57.564	2026-07-15 15:06:57.564	\N	\N	\N	\N	\N	43106674.890000000000000000000000000000	0	0.000000000000000000000000000000	GATE8_cmrlx3xcg00swvceoxntp02vz_514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17_V1	2026-07-15 15:06:57.559	\N	cmriniqgy001lvchcegw8qcxv	GATE8_DETERMINISTIC_V1	514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17	cmrlx3yh500t1vceomq83o215	\N	\N	\N	2026-10-18 00:00:00	2026-06-12 00:00:00	\N	1	\N	\N	1	43106674.890000000000000000000000000000	\N	\N	\N	AI_GENERATED_DRAFT	\N
\.


--
-- Data for Name: ProjectUserAssignment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectUserAssignment" (id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "assignedBy", "dateAssigned", "dateRemoved", remarks, "createdAt", "updatedAt") FROM stdin;
cmrirhi1400caic04pp8v1odg	cmqiy15bq0000vc1cq1f3zg6j	cmrirhhw30000ic0406v47smb	SUPER_ADMIN	READ_WRITE	active	SYSTEM	2026-07-13 05:08:10.505	\N	\N	2026-07-13 05:08:10.505	2026-07-13 05:08:10.505
cmrlx3xqd00syvceo2lr98a2s	cmrinimix001avchckwzmfxsu	cmrlx3xcg00swvceoxntp02vz	PROJECT_MANAGER	READ_WRITE	active	SYSTEM	2026-07-15 10:08:53.893	\N	\N	2026-07-15 10:08:53.893	2026-07-15 10:08:53.893
\.


--
-- Data for Name: ProjectValidationScore; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ProjectValidationScore" (id, "projectId", "reportedProgress", "aiValidatedProgress", "billingProgress", "paidProgress", "scheduleVariance", "costVariance", "validationConfidenceScore", "riskLevel", "evidenceCompletenessScore", "executiveRecommendation", "requiredAction", "latestValidationDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PurchaseOrder" (id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "deliveryDate", "paymentTermsDays", "dueDate", "preparerId", "reviewerId", "approverId", "aiValidationRisk", "createdAt", "updatedAt", "canvassFormId") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."PurchaseOrderItem" (id, quantity, "unitCost", "poId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."QuotationItem" (id, "unitCost", "quantityAvailable", "totalCost", brand, remarks, "quotationId", "canvassItemId") FROM stdin;
\.


--
-- Data for Name: ReceivingBank; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ReceivingBank" (id, "bankCode", "bankName", "shortName", "instaPayEnabled", "pesonetEnabled", "lastSyncedDate", status, "rawApiReference", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReturnItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ReturnItem" (id, "returnedQty", condition, "returnId", "issuanceItemId", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: RevisionRequest; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."RevisionRequest" (id, "moduleName", "transactionId", "requestedBy", reason, status, "reviewedBy", "reviewedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: RoleConflictRule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."RoleConflictRule" (id, "role1Code", "role2Code", severity, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: SSSTable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SSSTable" (id, "effectiveYear", "minCompensation", "maxCompensation", "monthlySalaryCredit", "regularSsEmployer", "regularSsEmployee", "ecEmployer", "wispEmployer", "wispEmployee", "totalEmployer", "totalEmployee", "totalContribution", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScheduleActivity; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleActivity" (id, "scheduleId", "wbsId", "activityCode", name, description, discipline, "plannedStartDate", "plannedFinishDate", "plannedDuration", "actualStartDate", "actualFinishDate", "actualDuration", "baselineStartDate", "baselineFinishDate", "plannedQuantity", "actualQuantity", unit, "plannedWeight", "actualProgressPercent", status, priority, "criticalPath", "totalFloat", "freeFloat", "assignedToId", "subcontractorId", "jobOrderId", "createdAt", "updatedAt", "activityType", "aiRationale", "allocatedAmount", "classificationConfidence", "crewCountAssumption", "durationMethod", "predecessorData", "productivityAssumption", "systemOrArea", "workFrontAssumption") FROM stdin;
2ae81fcfc7d64549a3fe4ff39	e8e0b5a283714159ad88de69f	f92fc79b726e4a0f815f7fb66	\N	Mobilization and Site Prep	\N	\N	2026-06-12 00:00:00	2026-06-26 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	3189215.150000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
5aa08368994046d4b947a1679	e8e0b5a283714159ad88de69f	7649af2fbee746ccb0d672eaf	\N	Roughing-ins (Mechanical)	\N	\N	2026-06-26 00:00:00	2026-07-17 00:00:00	21	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	6003677.070000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
506881ab880041a283c968db7	e8e0b5a283714159ad88de69f	4f52cd7e60f34c9eb0d831374	\N	Roughing-ins (Electrical)	\N	\N	2026-06-26 00:00:00	2026-07-17 00:00:00	21	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	313254.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
bcc1df1a177245df96f394136	e8e0b5a283714159ad88de69f	130d0db989f745c7945d8c08b	\N	Equipment Installation (Mechanical)	\N	\N	2026-07-17 00:00:00	2026-07-31 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	13285837.010000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
e95ab38551684730b75df693f	e8e0b5a283714159ad88de69f	7db2a9b7aada42fe854bfa924	\N	Equipment Installation (Electrical)	\N	\N	2026-07-17 00:00:00	2026-07-31 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	3711026.230000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
8041255bcb054590b9469155d	e8e0b5a283714159ad88de69f	49962dc5cbe04d26b67a473ae	\N	Piping and Ducting Works	\N	\N	2026-07-31 00:00:00	2026-08-30 00:00:00	30	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	5277985.050000003000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
7153381e65794046b0daa5091	e8e0b5a283714159ad88de69f	2feaab8f5a834b95aae5d5000	\N	Wiring and Cabling Works	\N	\N	2026-07-31 00:00:00	2026-08-30 00:00:00	30	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	9922130.630000001000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
ebca0e9ce5a94a6086a2f7866	e8e0b5a283714159ad88de69f	f8e60f77ac454b4f8eadb1ab8	\N	Fixtures and Devices (Mechanical)	\N	\N	2026-08-30 00:00:00	2026-09-13 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	0.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
9c00287a8dab4ffc9b40dfb4f	e8e0b5a283714159ad88de69f	a1477dba221d4bff9a5c5c991	\N	Fixtures and Devices (Electrical)	\N	\N	2026-08-30 00:00:00	2026-09-13 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	0.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
73db67b09b194fa28a1ebc7f8	e8e0b5a283714159ad88de69f	4bdb057f3b994829af1c31ebd	\N	Finishes and Trims	\N	\N	2026-07-31 00:00:00	2026-08-30 00:00:00	30	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	126461.190000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
5cabc31dc7b74afe86a3aeff6	e8e0b5a283714159ad88de69f	ee34fcc1b33c4a3c9f7ca2259	\N	Testing and Commissioning	\N	\N	2026-09-13 00:00:00	2026-10-04 00:00:00	21	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	1055883.560000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
ae15ee9eef574713ade36461f	e8e0b5a283714159ad88de69f	786e4866f7744640bd0bb5e63	\N	Project Acceptance and Demobilization	\N	\N	2026-10-04 00:00:00	2026-10-18 00:00:00	14	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	221205.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
95e312fc6de34474869a5a8f3	e8e0b5a283714159ad88de69f	f92fc79b726e4a0f815f7fb66	\N	Project Management & Supervision	\N	\N	2026-06-12 00:00:00	2026-10-18 00:00:00	128	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	0.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
d34ec0d0fbb24c628e75cfbe2	e8e0b5a283714159ad88de69f	ee34fcc1b33c4a3c9f7ca2259	\N	Punchlisting	\N	\N	2026-09-13 00:00:00	2026-10-04 00:00:00	21	\N	\N	\N	\N	\N	0	0	\N	0	0	NOT_STARTED	MEDIUM	f	0	0	\N	\N	\N	2026-07-15 15:06:58.553	2026-07-15 15:06:58.553	\N	\N	0.000000000000000000000000000000	\N	\N	PRODUCTIVITY_BASED	\N	\N	\N	\N
\.


--
-- Data for Name: ScheduleApproval; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleApproval" (id, "projectId", "scheduleId", "reviewRound", "revisionCode", "approvalStage", decision, "reviewerId", "reviewerNameSnapshot", "reviewerRoleSnapshot", comments, "validationSnapshot", "snapshotVersion", "scheduleSnapshotHash", "lockedBOQChecksum", "decidedAt", "createdAt", "idempotencyKey", "requestId") FROM stdin;
\.


--
-- Data for Name: ScheduleBOQAllocation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleBOQAllocation" (id, "activityId", "awardedBoqItemId", "mappedQuantity", "mappedWeight", "scheduleId", "projectId", "phaseId", "boqLineId", "allocationMode", "awardedQuantity", "allocatedQuantity", "allocatedPercentage", "awardedAmount", "allocatedAmount", "allocationReason") FROM stdin;
016b778c7a3147b49bdb37b91	ae15ee9eef574713ade36461f	cmrlx44mz0124vceo6s4ylza6	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	103229.000000000000000000000000000000	103229.000000000000000000000000000000	\N
14e639607f8e44a49f1d58431	2ae81fcfc7d64549a3fe4ff39	cmrlx44mz0125vceorgen7ina	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	678976.000000000000000000000000000000	678976.000000000000000000000000000000	\N
dcb7522ffa02451c883b78b08	2ae81fcfc7d64549a3fe4ff39	cmrlx44mz0126vceolsmsg4ri	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	279580.000000000000000000000000000000	279580.000000000000000000000000000000	\N
21f76bd5744e44fb8d5c0d183	2ae81fcfc7d64549a3fe4ff39	cmrlx44mz0127vceoz6p1ihx1	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	279580.000000000000000000000000000000	279580.000000000000000000000000000000	\N
3e4f5b579c8a4587933089503	2ae81fcfc7d64549a3fe4ff39	cmrlx44n00128vceo3f0yc99e	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	319519.000000000000000000000000000000	319519.000000000000000000000000000000	\N
dd39f867f9964a91b69888679	2ae81fcfc7d64549a3fe4ff39	cmrlx44n00129vceo27omk1ba	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	0.000000000000000000000000000000	0.000000000000000000000000000000	\N
ebc1129a2d2a4949b27bb777e	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012avceop4jx14cs	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	51615.000000000000000000000000000000	51615.000000000000000000000000000000	\N
a09382fa5e084b8a8f532fbdd	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012bvceoiwtfcuv7	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	14747.000000000000000000000000000000	14747.000000000000000000000000000000	\N
6c7e3a9c933c494aaa5f08cd0	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012cvceo16591omf	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7374.000000000000000000000000000000	7374.000000000000000000000000000000	\N
81dbc7a0a97545dda10ed8fba	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012dvceo9gduc0vf	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	184338.000000000000000000000000000000	184338.000000000000000000000000000000	\N
38f8e784c41342159d5f04c48	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012evceosuk9i05v	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	0.000000000000000000000000000000	0.000000000000000000000000000000	\N
01119ece285e484ba39964b25	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012fvceoc4ifnqdg	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	0.000000000000000000000000000000	0.000000000000000000000000000000	\N
b464b49e98214f808a629ceea	2ae81fcfc7d64549a3fe4ff39	cmrlx44n0012gvceojgqhjxrf	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	331807.000000000000000000000000000000	331807.000000000000000000000000000000	\N
c33bc562c1594396bddb8c1ad	bcc1df1a177245df96f394136	cmrlx44n0012hvceo1xvmpimt	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	73735.000000000000000000000000000000	73735.000000000000000000000000000000	\N
498f78c3a5c546dea6fa851ed	2ae81fcfc7d64549a3fe4ff39	cmrlx44n1012ivceojup1dw93	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	0.000000000000000000000000000000	0.000000000000000000000000000000	\N
3613fa8dcb784149bb46e9ab4	ae15ee9eef574713ade36461f	cmrlx44n1012jvceo9m7cr9vi	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	117976.000000000000000000000000000000	117976.000000000000000000000000000000	\N
223c63a5854141e5af142a440	5cabc31dc7b74afe86a3aeff6	cmrlx44n1012kvceoaofh66e2	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	0.000000000000000000000000000000	0.000000000000000000000000000000	\N
0fa42bb537f7486e9748c9a89	2ae81fcfc7d64549a3fe4ff39	cmrlx44n1012lvceo88svddo4	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	147470.000000000000000000000000000000	147470.000000000000000000000000000000	\N
fb3819af86104766b85bb3e9b	2ae81fcfc7d64549a3fe4ff39	cmrlx44n1012mvceoexe3brq2	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	110603.000000000000000000000000000000	110603.000000000000000000000000000000	\N
19ba81294567473ba2c718bb2	bcc1df1a177245df96f394136	cmrlx44n1012nvceo2ko4e10q	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3778109.370000000000000000000000000000	3778109.370000000000000000000000000000	\N
8b2bf723f30c45828426f7258	bcc1df1a177245df96f394136	cmrlx44n1012ovceorvoi5ga7	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	330524.040000000000000000000000000000	330524.040000000000000000000000000000	\N
65e8b6af59ba4142b6a50a617	bcc1df1a177245df96f394136	cmrlx44n1012pvceojx9sqy54	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	168668.580000000000000000000000000000	168668.580000000000000000000000000000	\N
8162fef1bd594589a29af198d	bcc1df1a177245df96f394136	cmrlx44n1012qvceoqzskyz0n	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	175061.380000000000000000000000000000	175061.380000000000000000000000000000	\N
726f7469864e416085aa798f6	7153381e65794046b0daa5091	cmrlx44n2012rvceory6u0aoo	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	129367.920000000000000000000000000000	129367.920000000000000000000000000000	\N
5c16f2364af040dc90c882350	e95ab38551684730b75df693f	cmrlx44n2012svceorx8lp90z	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	44690.740000000000000000000000000000	44690.740000000000000000000000000000	\N
9acaa082923244fb892f5b329	8041255bcb054590b9469155d	cmrlx44n2012tvceook3nzh4z	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8702.940000000001000000000000000000	8702.940000000001000000000000000000	\N
742e5beb2fb54194b86098bd3	8041255bcb054590b9469155d	cmrlx44n2012uvceoviohc5q0	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9879.020000000000000000000000000000	9879.020000000000000000000000000000	\N
8a215e9ec98545118429f695e	8041255bcb054590b9469155d	cmrlx44n2012vvceo3me5dl3c	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24697.530000000000000000000000000000	24697.530000000000000000000000000000	\N
a63bef911d9b461e814677879	8041255bcb054590b9469155d	cmrlx44n2012wvceokavnaa0k	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	42338.610000000000000000000000000000	42338.610000000000000000000000000000	\N
fe48601d15314495bcd03c4e1	8041255bcb054590b9469155d	cmrlx44n2012xvceo3j0zrj1k	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17993.910000000000000000000000000000	17993.910000000000000000000000000000	\N
9b306b437042408ea74b99cb7	8041255bcb054590b9469155d	cmrlx44n2012yvceo5tgclsnt	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	39751.220000000000000000000000000000	39751.220000000000000000000000000000	\N
efde28566dfc4684be06288af	8041255bcb054590b9469155d	cmrlx44n2012zvceow7dl445u	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	21203.300000000000000000000000000000	21203.300000000000000000000000000000	\N
b201c857720348dd842db287b	8041255bcb054590b9469155d	cmrlx44n20130vceotlqnb9ku	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	38380.550000000000000000000000000000	38380.550000000000000000000000000000	\N
d5bc76f78c274877879e351d7	8041255bcb054590b9469155d	cmrlx44n30131vceo9ycccwcx	14	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	65756.880000000000000000000000000000	65756.880000000000000000000000000000	\N
615155178a154316abf3feb46	8041255bcb054590b9469155d	cmrlx44n30132vceobamfawnc	9	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	60983.550000000000000000000000000000	60983.550000000000000000000000000000	\N
1d8363620dd84a36bdae80de4	8041255bcb054590b9469155d	cmrlx44n30133vceoushs9h94	9	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77780.970000000000000000000000000000	77780.970000000000000000000000000000	\N
11d4b7618fb444fb8cbb06c18	8041255bcb054590b9469155d	cmrlx44n30134vceo6q74cfzs	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	21740.020000000000000000000000000000	21740.020000000000000000000000000000	\N
1a12ea9830ff48c5be02681f5	8041255bcb054590b9469155d	cmrlx44n30135vceon0mz20yc	8	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	124535.360000000000000000000000000000	124535.360000000000000000000000000000	\N
f8ad0e58de1644babaaf31b84	8041255bcb054590b9469155d	cmrlx44n30136vceoiao7tz23	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	105076.650000000000000000000000000000	105076.650000000000000000000000000000	\N
174ff70e04b54cd5b3cad045d	8041255bcb054590b9469155d	cmrlx44n30137vceo02xbrixp	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	84061.320000000010000000000000000000	84061.320000000010000000000000000000	\N
383ab2cd463b464d805591ce6	8041255bcb054590b9469155d	cmrlx44n30138vceopyb6rdi2	19	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8237.830000000000000000000000000000	8237.830000000000000000000000000000	\N
1d3c93736fa3462183977e988	8041255bcb054590b9469155d	cmrlx44n40139vceo2asuoxpq	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11487.580000000000000000000000000000	11487.580000000000000000000000000000	\N
70d91079625f4537b2e7572eb	8041255bcb054590b9469155d	cmrlx44n4013avceo39jxqnw3	27	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	13936.050000000000000000000000000000	13936.050000000000000000000000000000	\N
380fd37bd3314d2e81655a662	8041255bcb054590b9469155d	cmrlx44n4013bvceoz35a3xej	18	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11334.780000000000000000000000000000	11334.780000000000000000000000000000	\N
21179431c4754004912d18e2d	8041255bcb054590b9469155d	cmrlx44n4013cvceoq6g73e1p	17	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	12038.720000000000000000000000000000	12038.720000000000000000000000000000	\N
a9407f0e7cf24dfebd6ebd05a	8041255bcb054590b9469155d	cmrlx44n4013dvceostq06ded	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3138.200000000000000000000000000000	3138.200000000000000000000000000000	\N
258a2c35265c4a9d913597df7	8041255bcb054590b9469155d	cmrlx44n4013evceoai6o7vag	15	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	12697.350000000000000000000000000000	12697.350000000000000000000000000000	\N
3381d63dfbc3496fb4ce46319	8041255bcb054590b9469155d	cmrlx44n4013fvceo5kt5ezcj	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8960.299999999999000000000000000000	8960.299999999999000000000000000000	\N
72540e140e014543b62f8c641	8041255bcb054590b9469155d	cmrlx44n4013gvceo7bp062tr	8	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7168.240000000000000000000000000000	7168.240000000000000000000000000000	\N
11c5727f1be64755beb1aafaf	8041255bcb054590b9469155d	cmrlx44n4013hvceox55nbf6n	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	57975.920000000000000000000000000000	57975.920000000000000000000000000000	\N
2a986976dcfe41e6967cc84b3	8041255bcb054590b9469155d	cmrlx44n4013ivceof1gzarvr	22	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	70564.560000000000000000000000000000	70564.560000000000000000000000000000	\N
b9924df82b9f46d7b1ac921e7	8041255bcb054590b9469155d	cmrlx44n5013jvceowtl2fqda	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	22281.850000000000000000000000000000	22281.850000000000000000000000000000	\N
b4a89b83af434e99bb2216ddb	bcc1df1a177245df96f394136	cmrlx44n5013kvceo7lghm679	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28867.230000000000000000000000000000	28867.230000000000000000000000000000	\N
d08bda7eab974eaebee391793	8041255bcb054590b9469155d	cmrlx44n5013lvceof94r7jnv	39	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15761.850000000000000000000000000000	15761.850000000000000000000000000000	\N
a3187f347da6467ba1fdcaed3	8041255bcb054590b9469155d	cmrlx44n5013mvceov645teky	22	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	14120.260000000000000000000000000000	14120.260000000000000000000000000000	\N
3d5f1cc1199649c282f6e0abe	8041255bcb054590b9469155d	cmrlx44n5013nvceovkkgcgl9	77	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32930.590000000000000000000000000000	32930.590000000000000000000000000000	\N
078d58a978754df8800d29d0d	8041255bcb054590b9469155d	cmrlx44n5013ovceo2l1r3pn0	43	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	34940.510000000000000000000000000000	34940.510000000000000000000000000000	\N
d843fb4e4bd94f9a9d8e08db7	bcc1df1a177245df96f394136	cmrlx44n5013pvceozju0i99z	9	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	274258.440000000000000000000000000000	274258.440000000000000000000000000000	\N
5ae9ffbec2814332841034b1c	8041255bcb054590b9469155d	cmrlx44n5013qvceorut6mf5x	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2117.060000000000000000000000000000	2117.060000000000000000000000000000	\N
d6600f43ac5b4c5ea5341a1f6	8041255bcb054590b9469155d	cmrlx44n6013rvceoezmihx3p	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	106.940000000000000000000000000000	106.940000000000000000000000000000	\N
21ca1b9ee1214ecf9205faccc	8041255bcb054590b9469155d	cmrlx44n6013svceoay60cnw4	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	406.300000000000000000000000000000	406.300000000000000000000000000000	\N
353fb5025217437e963c024f6	8041255bcb054590b9469155d	cmrlx44n6013tvceoazihpaxa	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	261.780000000000000000000000000000	261.780000000000000000000000000000	\N
eeac5c42121f4e1ca3328b224	8041255bcb054590b9469155d	cmrlx44n6013uvceobr8izjer	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	855.360000000000000000000000000000	855.360000000000000000000000000000	\N
80a3394a0ed34c54aa8ff6211	506881ab880041a283c968db7	cmrlx44n6013vvceonmp0zxsk	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	31523.700000000000000000000000000000	31523.700000000000000000000000000000	\N
d1493c34ad454c94af10f5d59	506881ab880041a283c968db7	cmrlx44n6013wvceo2eujqshd	586	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	38599.820000000000000000000000000000	38599.820000000000000000000000000000	\N
44c1fab1af5149668b48cd506	506881ab880041a283c968db7	cmrlx44n6013xvceo5l62fang	29	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	930.610000000000000000000000000000	930.610000000000000000000000000000	\N
2ba4a388e80c417eae6191ff2	7153381e65794046b0daa5091	cmrlx44n6013yvceoh718dxil	419	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	33871.960000000000000000000000000000	33871.960000000000000000000000000000	\N
9c195a75ceca4edab962d6407	7153381e65794046b0daa5091	cmrlx44n6013zvceodwntogk7	71	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5572.080000000000000000000000000000	5572.080000000000000000000000000000	\N
5cd15d8a9b724bcf9e8a39f51	7153381e65794046b0daa5091	cmrlx44n70140vceo6cm01mdn	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3122.860000000000000000000000000000	3122.860000000000000000000000000000	\N
00dcfe1ea2324f198352d4c35	7153381e65794046b0daa5091	cmrlx44n70141vceohgxhhl3i	59	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	46629.470000000000000000000000000000	46629.470000000000000000000000000000	\N
22f551470a5847fca8f251478	7153381e65794046b0daa5091	cmrlx44n70142vceo0fdh2f46	72	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5650.560000000000000000000000000000	5650.560000000000000000000000000000	\N
06d6e3c38f7241458fc776d8f	7153381e65794046b0daa5091	cmrlx44n70143vceo5cfqe461	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3757.600000000000000000000000000000	3757.600000000000000000000000000000	\N
bb1c1dcfa4e24ad8aa911cac7	8041255bcb054590b9469155d	cmrlx44n70144vceoz846pdxt	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27798.200000000000000000000000000000	27798.200000000000000000000000000000	\N
ff87732fa01e4517961e97734	8041255bcb054590b9469155d	cmrlx44n70145vceowamoh1q9	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17662.540000000000000000000000000000	17662.540000000000000000000000000000	\N
a59ccb79489149de83fbdd1f9	2ae81fcfc7d64549a3fe4ff39	cmrlx44n70146vceors0bja4e	21	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5837.790000000000000000000000000000	5837.790000000000000000000000000000	\N
15c0b2b6e0ac4fb8b2a8f483d	2ae81fcfc7d64549a3fe4ff39	cmrlx44n70147vceozcuv9564	42	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15717.240000000000000000000000000000	15717.240000000000000000000000000000	\N
f101ad5c339e450fb84ecd710	8041255bcb054590b9469155d	cmrlx44n70148vceo3nq0r37l	94	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	16080.580000000000000000000000000000	16080.580000000000000000000000000000	\N
b383207577a4490b8d5672568	8041255bcb054590b9469155d	cmrlx44n70149vceobtp865ly	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	684.480000000000000000000000000000	684.480000000000000000000000000000	\N
9945a7f0e2a240f1989677b1a	8041255bcb054590b9469155d	cmrlx44n8014avceoa92rhwxy	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	342.400000000000000000000000000000	342.400000000000000000000000000000	\N
db692ed68e4e4404a1f8cdc75	73db67b09b194fa28a1ebc7f8	cmrlx44n8014bvceoeqjvrgpn	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3432.000000000000000000000000000000	3432.000000000000000000000000000000	\N
311bfca9e76e4b339a2980837	8041255bcb054590b9469155d	cmrlx44n8014cvceotz145406	351	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15015.780000000000000000000000000000	15015.780000000000000000000000000000	\N
1be4e01ec23e4471aa97d47b9	2ae81fcfc7d64549a3fe4ff39	cmrlx44n8014dvceodvzddsmo	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	86986.620000000000000000000000000000	86986.620000000000000000000000000000	\N
cff9f4f7748c41fd8221569e3	2ae81fcfc7d64549a3fe4ff39	cmrlx44n8014evceonikkyjrq	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	54526.980000000000000000000000000000	54526.980000000000000000000000000000	\N
b60c1b83ece347beb774b60b3	2ae81fcfc7d64549a3fe4ff39	cmrlx44n8014fvceooam6qldi	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9408.629999999999000000000000000000	9408.629999999999000000000000000000	\N
54597997896f419d80c4db063	2ae81fcfc7d64549a3fe4ff39	cmrlx44n8014gvceoszfaazgy	141	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7539.270000000000000000000000000000	7539.270000000000000000000000000000	\N
fe1eda3554064e53a2dd8d151	73db67b09b194fa28a1ebc7f8	cmrlx44n8014hvceorqyqho6m	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	213.840000000000000000000000000000	213.840000000000000000000000000000	\N
434f0705adac4ae4a0c24a8ae	5aa08368994046d4b947a1679	cmrlx44n9014ivceoa8ooahj6	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	737348.840000000000000000000000000000	737348.840000000000000000000000000000	\N
f646d7a069f349689dc8ec256	73db67b09b194fa28a1ebc7f8	cmrlx44n9014jvceoi2u9hf9u	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5684.060000000000000000000000000000	5684.060000000000000000000000000000	\N
c43b2447df4b4d2e8685178a2	5cabc31dc7b74afe86a3aeff6	cmrlx44n9014kvceo42oz7nig	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	41291.540000000000000000000000000000	41291.540000000000000000000000000000	\N
c0905ec556004178b652fd9f2	bcc1df1a177245df96f394136	cmrlx44n9014lvceog4txtgre	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2223173.130000000000000000000000000000	2223173.130000000000000000000000000000	\N
d580a10363b04321b20edfd24	bcc1df1a177245df96f394136	cmrlx44n9014mvceofurwy8xk	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	112445.720000000000000000000000000000	112445.720000000000000000000000000000	\N
72e9fcdb1979429f9dc98e67b	bcc1df1a177245df96f394136	cmrlx44n9014nvceol69zirjc	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	87530.690000000000000000000000000000	87530.690000000000000000000000000000	\N
b51e3dd3a5c348d2951296f18	7153381e65794046b0daa5091	cmrlx44na014ovceoggvuspll	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	152889.360000000000000000000000000000	152889.360000000000000000000000000000	\N
1cb2287eb2d84ab198759c9cb	e95ab38551684730b75df693f	cmrlx44na014pvceome8s77xq	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	22345.370000000000000000000000000000	22345.370000000000000000000000000000	\N
051a6a0192204c888c6cc11aa	8041255bcb054590b9469155d	cmrlx44na014qvceotowozfnw	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	26108.820000000000000000000000000000	26108.820000000000000000000000000000	\N
fae3b3b7c12d4a088042d64cf	8041255bcb054590b9469155d	cmrlx44na014rvceo0szqyqid	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	4939.510000000000000000000000000000	4939.510000000000000000000000000000	\N
a5361879c2544336a891b44e2	8041255bcb054590b9469155d	cmrlx44na014svceo6okppi5v	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24697.530000000000000000000000000000	24697.530000000000000000000000000000	\N
b091b7c2702d4f3bbb7d30713	8041255bcb054590b9469155d	cmrlx44na014tvceoi6r2osa8	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28225.740000000000000000000000000000	28225.740000000000000000000000000000	\N
eb66221cee98464f960937d7c	8041255bcb054590b9469155d	cmrlx44na014uvceof4d6g4pm	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11995.940000000000000000000000000000	11995.940000000000000000000000000000	\N
b004384119af4e24ab7f3b7bd	8041255bcb054590b9469155d	cmrlx44na014vvceow0bx2rto	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	39751.220000000000000000000000000000	39751.220000000000000000000000000000	\N
cd7aa7aa17704201b3a36b4fb	8041255bcb054590b9469155d	cmrlx44nb014wvceolz1fwlas	14	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	29684.620000000000000000000000000000	29684.620000000000000000000000000000	\N
c18c76276f974b868c8281d26	8041255bcb054590b9469155d	cmrlx44nb014xvceotwqfwe8v	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32475.850000000000000000000000000000	32475.850000000000000000000000000000	\N
2078b03482784d36a00914d50	8041255bcb054590b9469155d	cmrlx44nb014yvceoo9qweore	15	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	70453.800000000000000000000000000000	70453.800000000000000000000000000000	\N
81d4f9d8577a4f74a1e2f71d5	8041255bcb054590b9469155d	cmrlx44nb014zvceompuw774n	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	81311.399999999990000000000000000000	81311.399999999990000000000000000000	\N
a336822248d84248ab324b6b3	8041255bcb054590b9469155d	cmrlx44nb0150vceon1vcsezf	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	112350.290000000000000000000000000000	112350.290000000000000000000000000000	\N
b9d2e76e218547c5b77421bb2	8041255bcb054590b9469155d	cmrlx44nb0151vceok7ym4zfe	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	10870.010000000000000000000000000000	10870.010000000000000000000000000000	\N
e62563d185e34921ad046ee91	8041255bcb054590b9469155d	cmrlx44nb0152vceov3iyd2lq	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77834.600000000010000000000000000000	77834.600000000010000000000000000000	\N
23df10314c95416d9f9672a1f	8041255bcb054590b9469155d	cmrlx44nb0153vceod3uban97	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27039.770000000000000000000000000000	27039.770000000000000000000000000000	\N
1adaf8aa33cd4f148233bb2ac	8041255bcb054590b9469155d	cmrlx44nc0154vceoletbnout	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	324477.240000000000000000000000000000	324477.240000000000000000000000000000	\N
1777e3a491144745bc7bdd1a6	8041255bcb054590b9469155d	cmrlx44nc0155vceoa46owtk0	27	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11706.390000000000000000000000000000	11706.390000000000000000000000000000	\N
14d619a945b94a3b91e244d75	8041255bcb054590b9469155d	cmrlx44nc0156vceo164yx4hw	21	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9278.430000000000000000000000000000	9278.430000000000000000000000000000	\N
6b04d5d7f2cd4614a10a7f653	8041255bcb054590b9469155d	cmrlx44nc0157vceo0hqb42ok	30	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15484.500000000000000000000000000000	15484.500000000000000000000000000000	\N
7df8ea9b0e8b45dba115dc9fb	8041255bcb054590b9469155d	cmrlx44nc0158vceodk8l39tr	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15113.040000000000000000000000000000	15113.040000000000000000000000000000	\N
988ae376ceb4434089b9dc2ab	8041255bcb054590b9469155d	cmrlx44nc0159vceoyggcfjuj	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	18412.160000000000000000000000000000	18412.160000000000000000000000000000	\N
80e7146ecce2453c87cb25d8a	8041255bcb054590b9469155d	cmrlx44nc015avceoyd1opz4l	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1569.100000000000000000000000000000	1569.100000000000000000000000000000	\N
7236a2ed3de8497c92ab88eb3	8041255bcb054590b9469155d	cmrlx44nc015bvceoy9mw3sjn	9	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7618.410000000000000000000000000000	7618.410000000000000000000000000000	\N
a86449f697774f96824ea600d	8041255bcb054590b9469155d	cmrlx44nd015cvceodjjeooef	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2023.320000000000000000000000000000	2023.320000000000000000000000000000	\N
0d4ae5af23744c928c20e5457	8041255bcb054590b9469155d	cmrlx44nd015dvceos7y54mfj	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24279.840000000000000000000000000000	24279.840000000000000000000000000000	\N
c63f5b420a314401b3f600084	8041255bcb054590b9469155d	cmrlx44nd015evceoajnkwgg9	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	87733.460000000010000000000000000000	87733.460000000010000000000000000000	\N
8d380fd33a6b4955a44e17cfe	8041255bcb054590b9469155d	cmrlx44nd015fvceoq150j4a8	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	83394.480000000000000000000000000000	83394.480000000000000000000000000000	\N
353ed63351a54ce4b1c3df41a	8041255bcb054590b9469155d	cmrlx44nd015gvceob4icjj7o	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8234.770000000000000000000000000000	8234.770000000000000000000000000000	\N
263e4bf261b4461bb54408393	bcc1df1a177245df96f394136	cmrlx44nd015hvceo8imkpx7b	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28867.230000000000000000000000000000	28867.230000000000000000000000000000	\N
1443e56b8d64474c8cccdfd78	8041255bcb054590b9469155d	cmrlx44nd015ivceoi2ybgfj2	37	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	14953.550000000000000000000000000000	14953.550000000000000000000000000000	\N
b99f3a00a0f64b58af4863caa	8041255bcb054590b9469155d	cmrlx44nd015jvceoozbmwakk	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15403.920000000000000000000000000000	15403.920000000000000000000000000000	\N
7b6b1a7da79e412cb4e5d25b1	8041255bcb054590b9469155d	cmrlx44ne015kvceopfe6w83e	74	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	31647.580000000000000000000000000000	31647.580000000000000000000000000000	\N
2fea191dce0d4b75801a00a70	8041255bcb054590b9469155d	cmrlx44ne015lvceosuo0f73h	48	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	39003.360000000000000000000000000000	39003.360000000000000000000000000000	\N
ffd070e088e24ce6b66f74dc0	bcc1df1a177245df96f394136	cmrlx44ne015mvceopgyftcqi	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	365677.920000000000000000000000000000	365677.920000000000000000000000000000	\N
0dd4fbd803cc476a8fd0898c0	8041255bcb054590b9469155d	cmrlx44ne015nvceodtmb3nqd	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	641.520000000000000000000000000000	641.520000000000000000000000000000	\N
1635206af12a44e9bbf8eae4f	8041255bcb054590b9469155d	cmrlx44ne015ovceonemfhlzb	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2501.980000000000000000000000000000	2501.980000000000000000000000000000	\N
f319e93514de4e3ab6d99e43c	8041255bcb054590b9469155d	cmrlx44ne015pvceoxu5yq5lb	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	160.410000000000000000000000000000	160.410000000000000000000000000000	\N
eec9cca0c0de475386c321af0	8041255bcb054590b9469155d	cmrlx44ne015qvceoq5nvekpl	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	261.780000000000000000000000000000	261.780000000000000000000000000000	\N
e1cea6276ab540e9a51dc1611	8041255bcb054590b9469155d	cmrlx44nf015rvceoljwvme7p	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	855.360000000000000000000000000000	855.360000000000000000000000000000	\N
1aac1a8aa0864a9f99c5f584a	506881ab880041a283c968db7	cmrlx44nf015svceovwu4ndc9	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	31523.700000000000000000000000000000	31523.700000000000000000000000000000	\N
c501680a7fe646e5975e4a86b	506881ab880041a283c968db7	cmrlx44nf015tvceozdb5un1w	673	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	44330.510000000000000000000000000000	44330.510000000000000000000000000000	\N
01d4bc9a51cb470aa801d0d45	506881ab880041a283c968db7	cmrlx44nf015uvceol8rvrbid	34	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1091.060000000000000000000000000000	1091.060000000000000000000000000000	\N
b4324fed386d4156ad7edfec7	7153381e65794046b0daa5091	cmrlx44nf015vvceonowtl3n5	482	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	38964.880000000000000000000000000000	38964.880000000000000000000000000000	\N
f55073d4aa174ac29b14faefb	7153381e65794046b0daa5091	cmrlx44nf015wvceofsuoi22y	94	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7377.120000000000000000000000000000	7377.120000000000000000000000000000	\N
36cd57f3cbaf42a492aeaccb3	7153381e65794046b0daa5091	cmrlx44nf015xvceo9deh25qg	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1505.790000000000000000000000000000	1505.790000000000000000000000000000	\N
44d848d0da084a51844c8576e	7153381e65794046b0daa5091	cmrlx44nf015yvceo4fx7cfrz	59	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	46578.730000000000000000000000000000	46578.730000000000000000000000000000	\N
8fcb1ee6eb1943139923eacb5	7153381e65794046b0daa5091	cmrlx44ng015zvceoje5wvtuh	85	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6670.800000000000000000000000000000	6670.800000000000000000000000000000	\N
1295154628c048ffbf7a807ee	7153381e65794046b0daa5091	cmrlx44ng0160vceorpim3ctm	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3757.600000000000000000000000000000	3757.600000000000000000000000000000	\N
73c44e33888b4f8fabb9c67e9	8041255bcb054590b9469155d	cmrlx44ng0161vceo1q8zzja6	16	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	22238.560000000000000000000000000000	22238.560000000000000000000000000000	\N
8adf6affdf874374b4083e29f	8041255bcb054590b9469155d	cmrlx44ng0162vceoveyxlpnt	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	15139.320000000000000000000000000000	15139.320000000000000000000000000000	\N
53edabd856f54b808c217f44a	2ae81fcfc7d64549a3fe4ff39	cmrlx44ng0163vceolkzz5e3m	25	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6949.750000000000000000000000000000	6949.750000000000000000000000000000	\N
fff0324bbae744988bfdcafae	2ae81fcfc7d64549a3fe4ff39	cmrlx44ng0164vceodm6tjt2q	49	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	18336.780000000000000000000000000000	18336.780000000000000000000000000000	\N
c6b38791e95849498a8497e59	8041255bcb054590b9469155d	cmrlx44ng0165vceoppexx6oy	107	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	18304.490000000000000000000000000000	18304.490000000000000000000000000000	\N
cbf7daa125a8437e8a7caf09b	8041255bcb054590b9469155d	cmrlx44nh0166vceo8kphkaeh	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	684.480000000000000000000000000000	684.480000000000000000000000000000	\N
bfe2ed5a63f84fcb999b39046	8041255bcb054590b9469155d	cmrlx44nh0167vceowq104d9y	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	342.400000000000000000000000000000	342.400000000000000000000000000000	\N
776525b52db14f28be904502f	73db67b09b194fa28a1ebc7f8	cmrlx44nh0168vceodqoihvov	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3432.000000000000000000000000000000	3432.000000000000000000000000000000	\N
3e6c704599b742f5b978dd81f	8041255bcb054590b9469155d	cmrlx44nh0169vceovg0jez38	402	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17197.560000000000000000000000000000	17197.560000000000000000000000000000	\N
06885fad6a2948568fc117ad5	2ae81fcfc7d64549a3fe4ff39	cmrlx44nh016avceonoan0cik	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	101484.390000000000000000000000000000	101484.390000000000000000000000000000	\N
b3b9e74489ab4a3397da20c0e	2ae81fcfc7d64549a3fe4ff39	cmrlx44nh016bvceo1yironug	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	72702.640000000000000000000000000000	72702.640000000000000000000000000000	\N
815cadba0d23423aba9ba72a1	2ae81fcfc7d64549a3fe4ff39	cmrlx44nh016cvceob62y9fxm	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	10263.960000000000000000000000000000	10263.960000000000000000000000000000	\N
3ebe51bdd7124daba7a8a25e0	2ae81fcfc7d64549a3fe4ff39	cmrlx44nh016dvceoeb3e6znh	160	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8555.200000000001000000000000000000	8555.200000000001000000000000000000	\N
e1894a28a5e5418eb9329cd70	73db67b09b194fa28a1ebc7f8	cmrlx44nh016evceoyrvcfyqe	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	213.840000000000000000000000000000	213.840000000000000000000000000000	\N
f87991d564cc497683ed68080	5aa08368994046d4b947a1679	cmrlx44ni016fvceoo3u1es3x	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	737348.840000000000000000000000000000	737348.840000000000000000000000000000	\N
f8e941bf3f604ccb91d5c9a83	73db67b09b194fa28a1ebc7f8	cmrlx44ni016gvceor268ykr5	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6640.710000000000000000000000000000	6640.710000000000000000000000000000	\N
5ef77b23f0bb4f4bb703bc214	5cabc31dc7b74afe86a3aeff6	cmrlx44ni016hvceomp5moahy	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	47190.330000000000000000000000000000	47190.330000000000000000000000000000	\N
e15a17c513d3443ea0cd15ac4	bcc1df1a177245df96f394136	cmrlx44ni016ivceo1hqd4zvl	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2223173.130000000000000000000000000000	2223173.130000000000000000000000000000	\N
0f1f8ba7b65a493db1dbc2776	bcc1df1a177245df96f394136	cmrlx44ni016jvceotwxz5gb5	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	175061.380000000000000000000000000000	175061.380000000000000000000000000000	\N
c941f7ee2c324715b25bb5f82	7153381e65794046b0daa5091	cmrlx44ni016kvceofkqgjkox	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	117607.200000000000000000000000000000	117607.200000000000000000000000000000	\N
e4fde80c59f44c39a93f1372d	e95ab38551684730b75df693f	cmrlx44ni016lvceo9wltrhne	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	44690.740000000000000000000000000000	44690.740000000000000000000000000000	\N
eab6adf8ce754a95bb1735b3d	8041255bcb054590b9469155d	cmrlx44ni016mvceo99lip9qm	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9879.020000000000000000000000000000	9879.020000000000000000000000000000	\N
50a0bb8c425c477dbf016f7bc	8041255bcb054590b9469155d	cmrlx44ni016nvceotdydjw2t	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32930.040000000000000000000000000000	32930.040000000000000000000000000000	\N
b4f59fb4d00b425c80f939a70	8041255bcb054590b9469155d	cmrlx44nj016ovceoyu0pbwi3	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	42338.610000000000000000000000000000	42338.610000000000000000000000000000	\N
19e38cadc08f4a1e88069623d	8041255bcb054590b9469155d	cmrlx44nj016pvceoh57kfzgd	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17993.910000000000000000000000000000	17993.910000000000000000000000000000	\N
b17e364d32c94c1b8c9b60934	8041255bcb054590b9469155d	cmrlx44nj016qvceosf43mq5s	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	39751.220000000000000000000000000000	39751.220000000000000000000000000000	\N
147a6f7d20764db3921ea4afe	8041255bcb054590b9469155d	cmrlx44nj016rvceoy04uhlip	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2120.330000000000000000000000000000	2120.330000000000000000000000000000	\N
13e4650d0de44de384d65974f	8041255bcb054590b9469155d	cmrlx44nj016svceo6gwmvju2	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32475.850000000000000000000000000000	32475.850000000000000000000000000000	\N
09c4a994f6ca4d44817bd0fd7	8041255bcb054590b9469155d	cmrlx44nj016tvceo97vpovy1	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9393.840000000000000000000000000000	9393.840000000000000000000000000000	\N
e5e6d9ec3da846c09d588d7b9	8041255bcb054590b9469155d	cmrlx44nj016uvceozfm1rkdx	14	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	94863.300000000000000000000000000000	94863.300000000000000000000000000000	\N
a0fa40a179f7440f9eefc0edb	8041255bcb054590b9469155d	cmrlx44nj016vvceoxui92837	9	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77780.970000000000000000000000000000	77780.970000000000000000000000000000	\N
b3993e201fcb43b2acdfa4d84	8041255bcb054590b9469155d	cmrlx44nj016wvceo4fsd6f9g	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	10870.010000000000000000000000000000	10870.010000000000000000000000000000	\N
5b68ea8795a54d42af65a4c37	8041255bcb054590b9469155d	cmrlx44nk016xvceo4ueopmzo	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77834.600000000010000000000000000000	77834.600000000010000000000000000000	\N
9851b385310b4bd498f83e28e	8041255bcb054590b9469155d	cmrlx44nk016yvceopkt5pikb	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	63045.990000000000000000000000000000	63045.990000000000000000000000000000	\N
cded778f81b4431582b699272	8041255bcb054590b9469155d	cmrlx44nk016zvceo4xfascgs	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	189278.390000000000000000000000000000	189278.390000000000000000000000000000	\N
4a02495e46684a1690a595d6e	8041255bcb054590b9469155d	cmrlx44nk0170vceo6spi6kqo	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	867.140000000000000000000000000000	867.140000000000000000000000000000	\N
e9c23f986f87416a800d9d445	8041255bcb054590b9469155d	cmrlx44nk0171vceou21kholb	21	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9278.430000000000000000000000000000	9278.430000000000000000000000000000	\N
d8d0694415f74d3a9e41171c1	8041255bcb054590b9469155d	cmrlx44nk0172vceo3dave3yc	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2064.600000000000000000000000000000	2064.600000000000000000000000000000	\N
91a5ddf728674ef7a7546008e	8041255bcb054590b9469155d	cmrlx44nk0173vceoxhwrqbcw	27	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17002.170000000000000000000000000000	17002.170000000000000000000000000000	\N
efeef0fec9f64ebc824e0325e	8041255bcb054590b9469155d	cmrlx44nl0174vceo307pzaxw	17	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	12038.720000000000000000000000000000	12038.720000000000000000000000000000	\N
5e7a0142350c4148a6eaa78d9	8041255bcb054590b9469155d	cmrlx44nl0175vceob0ss7upr	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1569.100000000000000000000000000000	1569.100000000000000000000000000000	\N
bf62ed51f5694870a3ca33f46	8041255bcb054590b9469155d	cmrlx44nl0176vceo4h7w8a7f	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8464.900000000000000000000000000000	8464.900000000000000000000000000000	\N
7e3e6244cb4e40a386650c1d0	8041255bcb054590b9469155d	cmrlx44nl0177vceoji2d4pqo	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	4480.150000000000000000000000000000	4480.150000000000000000000000000000	\N
fda1f6758e944ee3968aec361	8041255bcb054590b9469155d	cmrlx44nl0178vceo56bw94ed	13	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	13151.580000000000000000000000000000	13151.580000000000000000000000000000	\N
90ce48099fae48feb0fa1ed62	8041255bcb054590b9469155d	cmrlx44nl0179vceom3fcyoh4	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	59135.150000000000000000000000000000	59135.150000000000000000000000000000	\N
b7b1ddc79d914a5597fbd040a	8041255bcb054590b9469155d	cmrlx44nl017avceobcq9k41p	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	64149.600000000000000000000000000000	64149.600000000000000000000000000000	\N
f564565455244aaf9abf8c587	8041255bcb054590b9469155d	cmrlx44nl017bvceotfl8w9r6	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	19711.720000000000000000000000000000	19711.720000000000000000000000000000	\N
df46c2958e254e3eb30a545df	bcc1df1a177245df96f394136	cmrlx44nl017cvceoazq77uog	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28867.230000000000000000000000000000	28867.230000000000000000000000000000	\N
71bf94649a1d4cf78efbbb39c	8041255bcb054590b9469155d	cmrlx44nm017dvceo5apayk50	33	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	13336.950000000000000000000000000000	13336.950000000000000000000000000000	\N
6149168ae6c646f785b67eff8	8041255bcb054590b9469155d	cmrlx44nm017evceoqyk0v2un	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7701.960000000000000000000000000000	7701.960000000000000000000000000000	\N
21d46b0531c84e778c3fd25d4	8041255bcb054590b9469155d	cmrlx44nm017fvceofv59o0er	66	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28226.220000000000000000000000000000	28226.220000000000000000000000000000	\N
bda1dd9144e44da58d9ddcbff	8041255bcb054590b9469155d	cmrlx44nm017gvceokpjs7g65	23	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	18689.110000000000000000000000000000	18689.110000000000000000000000000000	\N
cca1150f355e44889c245cb72	bcc1df1a177245df96f394136	cmrlx44nm017hvceo0ew46bb5	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	335204.760000000000000000000000000000	335204.760000000000000000000000000000	\N
a5df770669b94dde991445806	8041255bcb054590b9469155d	cmrlx44nm017ivceo2j9qvtgp	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1347.220000000000000000000000000000	1347.220000000000000000000000000000	\N
7d6f285291e549cd9f9d668e5	8041255bcb054590b9469155d	cmrlx44nm017jvceo38s85rqj	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	320.820000000000000000000000000000	320.820000000000000000000000000000	\N
faed65ba81174126ae9612752	8041255bcb054590b9469155d	cmrlx44nm017kvceorz5fr1l1	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	305.410000000000000000000000000000	305.410000000000000000000000000000	\N
6b6d4f6d1e4b48fd83a9b024d	8041255bcb054590b9469155d	cmrlx44nn017lvceoss0elmv9	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	427.680000000000000000000000000000	427.680000000000000000000000000000	\N
16c328180c314783b92c75da4	506881ab880041a283c968db7	cmrlx44nn017mvceoerkd6r3o	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	31523.700000000000000000000000000000	31523.700000000000000000000000000000	\N
3ab886774a084c56a07f34d16	506881ab880041a283c968db7	cmrlx44nn017nvceos4yubvm6	444	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	29246.280000000000000000000000000000	29246.280000000000000000000000000000	\N
6c3789107e914be280b723175	506881ab880041a283c968db7	cmrlx44nn017ovceo2o287iwo	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	834.340000000000000000000000000000	834.340000000000000000000000000000	\N
65b7f20364ea483e89d801362	7153381e65794046b0daa5091	cmrlx44nn017pvceoiijv2ivd	291	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	23524.440000000000000000000000000000	23524.440000000000000000000000000000	\N
f3f29ffc268943199db06ab4d	7153381e65794046b0daa5091	cmrlx44nn017qvceoc2rq27lr	63	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	4944.870000000000000000000000000000	4944.870000000000000000000000000000	\N
7fb1c30c18594d2daac18922d	7153381e65794046b0daa5091	cmrlx44nn017rvceokvmxn0qi	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3122.860000000000000000000000000000	3122.860000000000000000000000000000	\N
af58dfb620e840389f1d967ae	7153381e65794046b0daa5091	cmrlx44nn017svceox0ndv3ck	59	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	46578.730000000000000000000000000000	46578.730000000000000000000000000000	\N
3b59a28896d9477187358aca6	7153381e65794046b0daa5091	cmrlx44no017tvceoo7rcgw6m	65	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5101.850000000000000000000000000000	5101.850000000000000000000000000000	\N
803c97a30aec4018834788cab	7153381e65794046b0daa5091	cmrlx44no017uvceo48rfasd3	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3757.600000000000000000000000000000	3757.600000000000000000000000000000	\N
afa4082ff33c4bb6a9801926d	8041255bcb054590b9469155d	cmrlx44no017vvceowty5n79r	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27798.200000000000000000000000000000	27798.200000000000000000000000000000	\N
8dfc7535cdfd4ab9a2180e860	8041255bcb054590b9469155d	cmrlx44no017wvceonr4oswzk	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17662.540000000000000000000000000000	17662.540000000000000000000000000000	\N
902a5499027a4041a1d142cdf	2ae81fcfc7d64549a3fe4ff39	cmrlx44no017xvceoieuauxt5	15	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	4169.850000000000000000000000000000	4169.850000000000000000000000000000	\N
0b71b0bf277c4daeaa5efe2f5	2ae81fcfc7d64549a3fe4ff39	cmrlx44no017yvceoqhd2wgo5	30	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11226.600000000000000000000000000000	11226.600000000000000000000000000000	\N
c20f6334477844728038901e8	8041255bcb054590b9469155d	cmrlx44no017zvceoyk6jsrow	65	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	11119.550000000000000000000000000000	11119.550000000000000000000000000000	\N
6a3a5f537dc644b3967429954	8041255bcb054590b9469155d	cmrlx44no0180vceok4qi13sz	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	684.480000000000000000000000000000	684.480000000000000000000000000000	\N
42fc5036577f43ddb74a88e15	8041255bcb054590b9469155d	cmrlx44no0181vceozz9xxj70	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	342.400000000000000000000000000000	342.400000000000000000000000000000	\N
bad7981281ea489ba361b0ab5	73db67b09b194fa28a1ebc7f8	cmrlx44np0182vceowx4a7qbw	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3432.000000000000000000000000000000	3432.000000000000000000000000000000	\N
6f9b3b3c00ff432ba801c2805	8041255bcb054590b9469155d	cmrlx44np0183vceo34alkh2w	244	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	10438.320000000000000000000000000000	10438.320000000000000000000000000000	\N
345e34cce33449baa5870ee0b	2ae81fcfc7d64549a3fe4ff39	cmrlx44np0184vceonjs6hbt9	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	72488.850000000010000000000000000000	72488.850000000010000000000000000000	\N
4fa056f9656143b997893d4c2	2ae81fcfc7d64549a3fe4ff39	cmrlx44np0185vceooyxmorch	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	54526.980000000000000000000000000000	54526.980000000000000000000000000000	\N
87ea683461464f90ae66b107c	2ae81fcfc7d64549a3fe4ff39	cmrlx44np0186vceo27tie0uu	8	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6500.560000000000000000000000000000	6500.560000000000000000000000000000	\N
4bb2dc64df6c45cfaa224dea0	2ae81fcfc7d64549a3fe4ff39	cmrlx44np0187vceop2a6226s	98	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5240.060000000000000000000000000000	5240.060000000000000000000000000000	\N
32d171092c624ec2b677bf194	73db67b09b194fa28a1ebc7f8	cmrlx44np0188vceotui11dts	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	213.840000000000000000000000000000	213.840000000000000000000000000000	\N
72ef9af57a4d44e19d1f98e28	5aa08368994046d4b947a1679	cmrlx44np0189vceo2dkt9dc1	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	737348.840000000000000000000000000000	737348.840000000000000000000000000000	\N
296f1576496345d6855900f28	73db67b09b194fa28a1ebc7f8	cmrlx44np018avceoqv0caagz	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5010.490000000000000000000000000000	5010.490000000000000000000000000000	\N
5ece21266d7543cbb0a6df6ca	5cabc31dc7b74afe86a3aeff6	cmrlx44nq018bvceo099rdmwt	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	38342.140000000000000000000000000000	38342.140000000000000000000000000000	\N
dc26715f5585445e84e3554dd	bcc1df1a177245df96f394136	cmrlx44nq018cvceoci17tnek	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2367951.570000000000000000000000000000	2367951.570000000000000000000000000000	\N
4689bf9d5bb44c0a8fcb00aa5	bcc1df1a177245df96f394136	cmrlx44nq018dvceosbzlx6pl	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	175061.380000000000000000000000000000	175061.380000000000000000000000000000	\N
06db68c07eec4c4a98d681c37	7153381e65794046b0daa5091	cmrlx44nq018evceonpgsxjq8	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	141128.640000000000000000000000000000	141128.640000000000000000000000000000	\N
35fd5f70385844e5b2bcecb79	e95ab38551684730b75df693f	cmrlx44nq018fvceokqdtc20i	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	44690.740000000000000000000000000000	44690.740000000000000000000000000000	\N
baddfff431fd4a309782bf77b	8041255bcb054590b9469155d	cmrlx44nq018gvceoiw98akds	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17405.880000000000000000000000000000	17405.880000000000000000000000000000	\N
ebfef5a138d44ec1a607b8201	8041255bcb054590b9469155d	cmrlx44nq018hvceot2xbg9cd	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	4939.510000000000000000000000000000	4939.510000000000000000000000000000	\N
9cf612e05ea0427e8d45b5b49	8041255bcb054590b9469155d	cmrlx44nr018ivceo4iwj5odu	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24697.530000000000000000000000000000	24697.530000000000000000000000000000	\N
0708f95d5857494d902b48cfa	8041255bcb054590b9469155d	cmrlx44nr018jvceo0c4l4plp	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	42338.610000000000000000000000000000	42338.610000000000000000000000000000	\N
378614c6a0d242a58d7a1391c	8041255bcb054590b9469155d	cmrlx44nr018kvceoq7aknjqk	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17993.910000000000000000000000000000	17993.910000000000000000000000000000	\N
af380d7e16d74e95838ac04bc	8041255bcb054590b9469155d	cmrlx44nr018lvceouz2how9u	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	39751.220000000000000000000000000000	39751.220000000000000000000000000000	\N
b78183a9d6374bc3a483eb21f	8041255bcb054590b9469155d	cmrlx44nr018mvceoeuxmix00	8	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	16962.640000000000000000000000000000	16962.640000000000000000000000000000	\N
b2a6e3e60c6c4ed79d0eba071	8041255bcb054590b9469155d	cmrlx44nr018nvceoabpcog7m	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	35428.200000000000000000000000000000	35428.200000000000000000000000000000	\N
bc73dc94bbc3436090b6ae41b	8041255bcb054590b9469155d	cmrlx44nr018ovceo1dijnlzl	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	46969.200000000000000000000000000000	46969.200000000000000000000000000000	\N
47cfb97c213f42b29b2ecef88	8041255bcb054590b9469155d	cmrlx44nr018pvceocmp0u103	14	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	94863.300000000000000000000000000000	94863.300000000000000000000000000000	\N
27ee87aaecda4e32b99ee8e20	8041255bcb054590b9469155d	cmrlx44ns018qvceo1hr4q4b8	16	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	138277.280000000000000000000000000000	138277.280000000000000000000000000000	\N
efa24bb6aed84f22b0362b408	8041255bcb054590b9469155d	cmrlx44ns018rvceom9zdy00j	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	21740.020000000000000000000000000000	21740.020000000000000000000000000000	\N
5251a594cc7c4557aaf222c8e	8041255bcb054590b9469155d	cmrlx44ns018svceo4ogbgws0	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77834.600000000010000000000000000000	77834.600000000010000000000000000000	\N
a8f237d10e9c41a18d942ca62	8041255bcb054590b9469155d	cmrlx44ns018tvceob9cvi3v1	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	42030.660000000000000000000000000000	42030.660000000000000000000000000000	\N
de96fe203e6f446f85986822e	8041255bcb054590b9469155d	cmrlx44ns018uvceo6iji4qlj	14	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	378556.780000000000000000000000000000	378556.780000000000000000000000000000	\N
429fa6b9f5374c75b527b143d	8041255bcb054590b9469155d	cmrlx44ns018vvceoe7o9n7rn	16	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6937.120000000000000000000000000000	6937.120000000000000000000000000000	\N
d8febc7bd6a14da5a718b14af	8041255bcb054590b9469155d	cmrlx44ns018wvceokg5xzmge	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	10603.920000000000000000000000000000	10603.920000000000000000000000000000	\N
9de1ee911cc84652a70801299	8041255bcb054590b9469155d	cmrlx44ns018xvceo6k2vytjk	19	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9806.850000000000000000000000000000	9806.850000000000000000000000000000	\N
3ef86983640a4da6ab4c5f739	8041255bcb054590b9469155d	cmrlx44ns018yvceoyp2bycmu	27	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17002.170000000000000000000000000000	17002.170000000000000000000000000000	\N
13161372b5614b59a15a49ae3	8041255bcb054590b9469155d	cmrlx44nt018zvceoltu9x58n	31	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	21952.960000000000000000000000000000	21952.960000000000000000000000000000	\N
53b1fd49e28f4ca0bd936d709	8041255bcb054590b9469155d	cmrlx44nt0190vceox8869llh	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3138.200000000000000000000000000000	3138.200000000000000000000000000000	\N
e0c4b9576be74e749077335eb	8041255bcb054590b9469155d	cmrlx44nt0191vceoip5qpphz	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8464.900000000000000000000000000000	8464.900000000000000000000000000000	\N
2ce5a50473264dee907ecace6	8041255bcb054590b9469155d	cmrlx44nt0192vceokk5ue1hs	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3584.120000000000000000000000000000	3584.120000000000000000000000000000	\N
11351e71cf8d46249e974bf02	8041255bcb054590b9469155d	cmrlx44nt0193vceo4v0mly34	27	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27314.820000000000000000000000000000	27314.820000000000000000000000000000	\N
85594bcc7d8946ccb4184748c	8041255bcb054590b9469155d	cmrlx44nt0194vceoyc8z6bkc	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	96659.970000000000000000000000000000	96659.970000000000000000000000000000	\N
77ac73b51d024cdba35b1d405	8041255bcb054590b9469155d	cmrlx44nt0195vceooo9gyro6	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	76979.520000000000000000000000000000	76979.520000000000000000000000000000	\N
2c2d9a872fad4e14a15bc6551	8041255bcb054590b9469155d	cmrlx44nt0196vceorerpwg3f	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32220.000000000000000000000000000000	32220.000000000000000000000000000000	\N
dbe45b984c0144928983673dc	bcc1df1a177245df96f394136	cmrlx44nt0197vceov2zpo7ws	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	28867.230000000000000000000000000000	28867.230000000000000000000000000000	\N
977b7622f5114a589e905691b	8041255bcb054590b9469155d	cmrlx44nu0198vceolb1hc2tm	31	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	12528.650000000000000000000000000000	12528.650000000000000000000000000000	\N
33556a8516f548cab37e49ff4	8041255bcb054590b9469155d	cmrlx44nu0199vceovu8w2y1a	38	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24389.540000000000000000000000000000	24389.540000000000000000000000000000	\N
5decee39d19f4efca861b4b9b	8041255bcb054590b9469155d	cmrlx44nu019avceobrzdgj4c	61	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	26087.870000000000000000000000000000	26087.870000000000000000000000000000	\N
2735b935d3514a96a40e6a2bd	8041255bcb054590b9469155d	cmrlx44nu019bvceo1ia0r0ms	75	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	60942.750000000000000000000000000000	60942.750000000000000000000000000000	\N
7f3d0d49a7d34cc88a0724e72	bcc1df1a177245df96f394136	cmrlx44nu019cvceofy0eahpt	10	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	304731.600000000000000000000000000000	304731.600000000000000000000000000000	\N
c5d985cd3cbc467493b396046	8041255bcb054590b9469155d	cmrlx44nu019dvceoxi0sbmko	2	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	427.680000000000000000000000000000	427.680000000000000000000000000000	\N
95b3c2bdcc014cdc9c844d9cd	8041255bcb054590b9469155d	cmrlx44nu019evceovw6akn9i	11	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	2117.060000000000000000000000000000	2117.060000000000000000000000000000	\N
3d186c1e0d9b478086d4aab26	8041255bcb054590b9469155d	cmrlx44nu019fvceoqunv23vb	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	160.410000000000000000000000000000	160.410000000000000000000000000000	\N
6f58d89c104042f5a792d65ee	8041255bcb054590b9469155d	cmrlx44nv019gvceotx5ve4zh	3	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	609.450000000000000000000000000000	609.450000000000000000000000000000	\N
89d7f98e3d5044318c718d954	8041255bcb054590b9469155d	cmrlx44nv019hvceoa3gfeglq	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	305.410000000000000000000000000000	305.410000000000000000000000000000	\N
3342e8f986b04aadb375d1c7d	8041255bcb054590b9469155d	cmrlx44nv019ivceow16j8dvr	6	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1283.040000000000000000000000000000	1283.040000000000000000000000000000	\N
bebc7e1902ad4587be651fe16	506881ab880041a283c968db7	cmrlx44nv019jvceou3e9krb3	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	59544.420000000000000000000000000000	59544.420000000000000000000000000000	\N
9b1d56f873c64f0ba1acef1b4	506881ab880041a283c968db7	cmrlx44nv019kvceocmv2zdp1	654	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	43078.980000000000000000000000000000	43078.980000000000000000000000000000	\N
fbbcd7d54778488f8296237f5	506881ab880041a283c968db7	cmrlx44nv019lvceomqsr5nab	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1026.880000000000000000000000000000	1026.880000000000000000000000000000	\N
8820acd900c74a478b30b8081	7153381e65794046b0daa5091	cmrlx44nv019mvceodoqtcbym	472	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	38156.480000000000000000000000000000	38156.480000000000000000000000000000	\N
6be2a9e5d7e74abdaedb43ff3	7153381e65794046b0daa5091	cmrlx44nv019nvceofpyco8jp	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6009.900000000000000000000000000000	6009.900000000000000000000000000000	\N
bbb6d04cbf6c48ee8e196d631	7153381e65794046b0daa5091	cmrlx44nv019ovceojs9q2v6n	26	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3122.860000000000000000000000000000	3122.860000000000000000000000000000	\N
36576f4562414b978e5d035ea	7153381e65794046b0daa5091	cmrlx44nw019pvceo8tbcmvpl	59	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	55353.800000000000000000000000000000	55353.800000000000000000000000000000	\N
d44cf309534241cb879d5e83c	7153381e65794046b0daa5091	cmrlx44nw019qvceo86eg6af3	78	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5878.080000000000000000000000000000	5878.080000000000000000000000000000	\N
43ae3b236823459d9ee29117e	7153381e65794046b0daa5091	cmrlx44nw019rvceoy23vzkwp	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6220.200000000000000000000000000000	6220.200000000000000000000000000000	\N
1a4641069dcb4fb88f2c76c19	8041255bcb054590b9469155d	cmrlx44nw019svceomoazqboh	20	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27798.200000000000000000000000000000	27798.200000000000000000000000000000	\N
dc19f828a13e4593b2317509d	8041255bcb054590b9469155d	cmrlx44nw019tvceoiwecqcp7	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17662.540000000000000000000000000000	17662.540000000000000000000000000000	\N
cd0db008ef744c4cb5640e717	2ae81fcfc7d64549a3fe4ff39	cmrlx44nw019uvceore50u4de	24	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	6671.760000000000000000000000000000	6671.760000000000000000000000000000	\N
aeb334416f0d4c92a29a83526	2ae81fcfc7d64549a3fe4ff39	cmrlx44nw019vvceojhtzyjzk	47	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17588.340000000000000000000000000000	17588.340000000000000000000000000000	\N
b8eef99d61cc408a882d2946f	8041255bcb054590b9469155d	cmrlx44nx019wvceofeyy4ee4	104	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	17791.280000000000000000000000000000	17791.280000000000000000000000000000	\N
b0a9a87476d14dd68bb2249f3	8041255bcb054590b9469155d	cmrlx44nx019xvceo6dawi9jv	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	684.480000000000000000000000000000	684.480000000000000000000000000000	\N
a0529f95e3bc40d3b0e69ca84	8041255bcb054590b9469155d	cmrlx44nx019yvceongpb32yv	32	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	342.400000000000000000000000000000	342.400000000000000000000000000000	\N
5abdcd611bd14ed0b8d872a53	73db67b09b194fa28a1ebc7f8	cmrlx44nx019zvceobsfsfd27	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	3432.000000000000000000000000000000	3432.000000000000000000000000000000	\N
603e4f1a26a040d3bb951baa2	8041255bcb054590b9469155d	cmrlx44nx01a0vceo8xou1x3t	393	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	16812.540000000000000000000000000000	16812.540000000000000000000000000000	\N
627537e6f4cf41d4ac6394bd9	2ae81fcfc7d64549a3fe4ff39	cmrlx44nx01a1vceoyrdts9ut	8	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	115982.160000000000000000000000000000	115982.160000000000000000000000000000	\N
e5432e5101724489b13dc7606	2ae81fcfc7d64549a3fe4ff39	cmrlx44nx01a2vceor735pahu	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	72702.640000000000000000000000000000	72702.640000000000000000000000000000	\N
077855a85580454ebda62d92b	2ae81fcfc7d64549a3fe4ff39	cmrlx44nx01a3vceowkobzmub	12	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	9750.840000000000000000000000000000	9750.840000000000000000000000000000	\N
57729fa561014df6a6a08311e	2ae81fcfc7d64549a3fe4ff39	cmrlx44ny01a4vceowhejzf7s	158	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	8448.260000000000000000000000000000	8448.260000000000000000000000000000	\N
70ee1595adb642c6883b84b9b	73db67b09b194fa28a1ebc7f8	cmrlx44ny01a5vceoyilj1c0t	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	213.840000000000000000000000000000	213.840000000000000000000000000000	\N
d4d1ffa0dde24ca9b204c85a9	5aa08368994046d4b947a1679	cmrlx44ny01a6vceookksm0np	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	737348.840000000000000000000000000000	737348.840000000000000000000000000000	\N
fd8ddecee46e4040bfe4a4e0e	73db67b09b194fa28a1ebc7f8	cmrlx44ny01a7vceojph18uhn	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	7277.910000000000000000000000000000	7277.910000000000000000000000000000	\N
28ce84b5ed9a4eceae98093e1	5cabc31dc7b74afe86a3aeff6	cmrlx44ny01a8vceo54xu48e5	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	44240.940000000000000000000000000000	44240.940000000000000000000000000000	\N
e8d8d209e8624dbaa9a4ba4ad	7153381e65794046b0daa5091	cmrlx44ny01a9vceo6xs1ooha	726	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	5149053.360000000000000000000000000000	5149053.360000000000000000000000000000	\N
7ab132c5f7c247b99767a013c	7153381e65794046b0daa5091	cmrlx44ny01aavceoxcvx44bn	117	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	644571.720000000000000000000000000000	644571.720000000000000000000000000000	\N
5b309be4118b4864b2ef512e0	7153381e65794046b0daa5091	cmrlx44ny01abvceouoa2gge8	390	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	439327.200000000000000000000000000000	439327.200000000000000000000000000000	\N
438f085786bf497bbe25e7f25	7153381e65794046b0daa5091	cmrlx44ny01acvceogtpesrf3	242	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	515401.920000000000000000000000000000	515401.920000000000000000000000000000	\N
4537fc0f22954b3797497341c	7153381e65794046b0daa5091	cmrlx44nz01advceohtgj9qxn	39	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32123.910000000000000000000000000000	32123.910000000000000000000000000000	\N
4dfb5838c8c34853adb7f91fa	7153381e65794046b0daa5091	cmrlx44nz01aevceo32y19gyo	130	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	46653.100000000000000000000000000000	46653.100000000000000000000000000000	\N
09ec52a35d174a9c899896fd1	5aa08368994046d4b947a1679	cmrlx44nz01afvceovvk6wfzt	94	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	874356.980000000000000000000000000000	874356.980000000000000000000000000000	\N
522e86a2b0684404b2d5f27a0	5aa08368994046d4b947a1679	cmrlx44nz01agvceodywdjup2	45	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	120280.500000000000000000000000000000	120280.500000000000000000000000000000	\N
ecc787de91834833821255e81	e95ab38551684730b75df693f	cmrlx44nz01ahvceodz219w9z	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	772225.450000000000000000000000000000	772225.450000000000000000000000000000	\N
2b05b6aac34944a3bc473cdf8	e95ab38551684730b75df693f	cmrlx44nz01aivceos3q6ge0y	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	125827.110000000000000000000000000000	125827.110000000000000000000000000000	\N
17759a94d9834abebe2e1215b	e95ab38551684730b75df693f	cmrlx44nz01ajvceop1hhzjye	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	135268.130000000000000000000000000000	135268.130000000000000000000000000000	\N
cb847a04afba43c4ad65f324d	e95ab38551684730b75df693f	cmrlx44nz01akvceoqurhmwr0	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	120190.820000000000000000000000000000	120190.820000000000000000000000000000	\N
cc09e51293a645e7997a5f2e0	e95ab38551684730b75df693f	cmrlx44nz01alvceomgzy5dt3	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	131472.250000000000000000000000000000	131472.250000000000000000000000000000	\N
0e83b87602d94f0f8fb12d7ef	e95ab38551684730b75df693f	cmrlx44o001amvceodypje7yf	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	473575.570000000000000000000000000000	473575.570000000000000000000000000000	\N
ba477a52e45c48038e5f1e4cd	e95ab38551684730b75df693f	cmrlx44o001anvceoidkbscjm	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	932598.819999999900000000000000000000	932598.819999999900000000000000000000	\N
24f5333920bb4e37897d30dd7	e95ab38551684730b75df693f	cmrlx44o001aovceoeyht45yl	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	302047.590000000000000000000000000000	302047.590000000000000000000000000000	\N
1e125610a7ce4802bcf713048	7153381e65794046b0daa5091	cmrlx44o001apvceo2b8nkyiu	5	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	27691.200000000000000000000000000000	27691.200000000000000000000000000000	\N
19dcbd14a1de4c1982de3d37d	7153381e65794046b0daa5091	cmrlx44o001aqvceoar9xxjlf	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	32074.680000000000000000000000000000	32074.680000000000000000000000000000	\N
9c5c51792b824ddfaadfef7ca	e95ab38551684730b75df693f	cmrlx44o001arvceo5cf5cpy3	4	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	116076.440000000000000000000000000000	116076.440000000000000000000000000000	\N
ff00c9073f054245960ff4958	e95ab38551684730b75df693f	cmrlx44o001asvceojncgnclu	7	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	77586.880000000000000000000000000000	77586.880000000000000000000000000000	\N
7062e938c95146ceadedf33f4	e95ab38551684730b75df693f	cmrlx44o101atvceoaikzit7w	16	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	150867.520000000000000000000000000000	150867.520000000000000000000000000000	\N
c1a2c5dd231d4ef1becafdf76	e95ab38551684730b75df693f	cmrlx44o101auvceooz306unq	23	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	216872.060000000000000000000000000000	216872.060000000000000000000000000000	\N
2b37f14012424455a302218b0	5aa08368994046d4b947a1679	cmrlx44o101avvceofka1lrgf	49	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	130972.100000000000000000000000000000	130972.100000000000000000000000000000	\N
a29559d3c6f9466592895019a	5aa08368994046d4b947a1679	cmrlx44o101awvceobyewwmm8	1003	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	1758690.290000000000000000000000000000	1758690.290000000000000000000000000000	\N
9733d1bcaae543c3a91771bdf	5aa08368994046d4b947a1679	cmrlx44o101axvceo81r5reej	195	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	24540.750000000000000000000000000000	24540.750000000000000000000000000000	\N
cf006c1cf9594688aadf55a9f	7153381e65794046b0daa5091	cmrlx44o101ayvceofvqa1k6p	429	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	598841.100000000000000000000000000000	598841.100000000000000000000000000000	\N
993274fba12f4130aaf597243	7153381e65794046b0daa5091	cmrlx44o101azvceoceg9b3z6	6798	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	979795.740000000000000000000000000000	979795.740000000000000000000000000000	\N
bc17364d77994ce3b142ec16e	7153381e65794046b0daa5091	cmrlx44o201b0vceoxpo0mrky	143	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	51318.410000000000000000000000000000	51318.410000000000000000000000000000	\N
12e145161f6b48bf97864d3f1	7153381e65794046b0daa5091	cmrlx44o201b1vceoqd7gu8ne	3185	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	459054.050000000000000000000000000000	459054.050000000000000000000000000000	\N
b65a83dec5594ea181db1d842	5aa08368994046d4b947a1679	cmrlx44o201b2vceodhujze9f	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	145441.090000000000000000000000000000	145441.090000000000000000000000000000	\N
2e2fb6824ef547229bdfcdf29	8041255bcb054590b9469155d	cmrlx44o201b3vceolo93exhz	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	174529.310000000000000000000000000000	174529.310000000000000000000000000000	\N
342a25bd4fb64325b65859c3b	73db67b09b194fa28a1ebc7f8	cmrlx44o201b4vceoiz83a3y9	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	87264.660000000000000000000000000000	87264.660000000000000000000000000000	\N
404ce89e51524f5abff6c24bd	5cabc31dc7b74afe86a3aeff6	cmrlx44o201b5vceopt0zo1vl	1	1	e8e0b5a283714159ad88de69f	cmrlx3xcg00swvceoxntp02vz	\N	\N	SINGLE	\N	\N	\N	884818.610000000000000000000000000000	884818.610000000000000000000000000000	\N
\.


--
-- Data for Name: ScheduleDelayRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleDelayRecord" (id, "scheduleId", "activityId", "delayStartDate", "delayEndDate", "delayDays", category, cause, "impactToCriticalPath", "approvalStatus", "reportedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleDependency; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleDependency" (id, "scheduleId", "predecessorId", "successorId", type, "lagDays", remarks) FROM stdin;
58774b96c1bc459c94d7f394d	e8e0b5a283714159ad88de69f	2ae81fcfc7d64549a3fe4ff39	5aa08368994046d4b947a1679	FS	0	\N
32e9c97eb9e04a8a8a53c0746	e8e0b5a283714159ad88de69f	2ae81fcfc7d64549a3fe4ff39	506881ab880041a283c968db7	FS	0	\N
e73b330f47a54f239d1ed52d1	e8e0b5a283714159ad88de69f	5aa08368994046d4b947a1679	bcc1df1a177245df96f394136	FS	0	\N
c5e3f233f8dd46999fa5543fa	e8e0b5a283714159ad88de69f	506881ab880041a283c968db7	e95ab38551684730b75df693f	FS	0	\N
4f6603b6b4f144a8b6093b495	e8e0b5a283714159ad88de69f	bcc1df1a177245df96f394136	8041255bcb054590b9469155d	FS	0	\N
f277aad495384e29a43c53485	e8e0b5a283714159ad88de69f	e95ab38551684730b75df693f	7153381e65794046b0daa5091	FS	0	\N
7b4cc3d86e3248ec86d77e7da	e8e0b5a283714159ad88de69f	8041255bcb054590b9469155d	ebca0e9ce5a94a6086a2f7866	FS	0	\N
e6d07eb9b9474429a0ba998c2	e8e0b5a283714159ad88de69f	7153381e65794046b0daa5091	9c00287a8dab4ffc9b40dfb4f	FS	0	\N
b40bbaab5567443da927bf564	e8e0b5a283714159ad88de69f	ebca0e9ce5a94a6086a2f7866	5cabc31dc7b74afe86a3aeff6	FS	0	\N
4229ddbcd00a4590819107bf0	e8e0b5a283714159ad88de69f	9c00287a8dab4ffc9b40dfb4f	5cabc31dc7b74afe86a3aeff6	FS	0	\N
e9627c3498bc435db089fe1a4	e8e0b5a283714159ad88de69f	5cabc31dc7b74afe86a3aeff6	ae15ee9eef574713ade36461f	FS	0	\N
\.


--
-- Data for Name: ScheduleGenerationAudit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleGenerationAudit" (id, "projectId", "userId", action, "previousScheduleId", "newScheduleId", "lockedBOQVersionId", "lockedBOQChecksum", "generationRequestId", "modelIdentifier", "promptVersion", "schemaVersion", "schedulingRulesVersion", "reasoningSetting", "requestTimestamp", "responseTimestamp", "tokenUsage", "resultStatus", "validationResults", "correctionAttemptCount", "timestamp") FROM stdin;
\.


--
-- Data for Name: ScheduleMilestone; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleMilestone" (id, "scheduleId", name, description, "targetDate", "actualDate", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: SchedulePOWMapping; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SchedulePOWMapping" (id, "activityId", "programOfWorksId") FROM stdin;
\.


--
-- Data for Name: ScheduleProgressUpdate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleProgressUpdate" (id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", remarks, "reportedById", "accomplishmentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRecoveryPlan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleRecoveryPlan" (id, "scheduleId", "targetActivityId", "delayCause", "requiredAction", "targetRecoveryDate", "estimatedRecoveredDays", status, "approvalStatus", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleReviewComment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleReviewComment" (id, "projectId", "scheduleId", "reviewRound", "activityId", "phaseId", "commentType", comment, status, "createdById", "createdByNameSnapshot", "createdByRoleSnapshot", "resolvedById", "resolutionComment", "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRevisionReason; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleRevisionReason" (id, "projectId", "scheduleId", "parentScheduleId", "revisionType", reason, "supportingReference", "createdById", "createdByNameSnapshot", "createdByRoleSnapshot", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleRevisionRequest; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleRevisionRequest" (id, "scheduleId", reason, "delayImpact", "costImpact", status, "requestedById", "approvedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ScheduleWBS; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ScheduleWBS" (id, "scheduleId", "parentId", code, name, description, level, "orderIndex", "createdAt", "updatedAt") FROM stdin;
35b619db3a5048feafe5f20e8	e8e0b5a283714159ad88de69f	\N	CONST	Construction Phase	\N	1	1	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
f92fc79b726e4a0f815f7fb66	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-1	Mobilization and Site Prep	\N	2	1	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
7649af2fbee746ccb0d672eaf	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-2	Roughing-ins (Mechanical)	\N	2	2	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
4f52cd7e60f34c9eb0d831374	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-3	Roughing-ins (Electrical)	\N	2	3	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
130d0db989f745c7945d8c08b	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-4	Equipment Installation (Mechanical)	\N	2	4	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
7db2a9b7aada42fe854bfa924	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-5	Equipment Installation (Electrical)	\N	2	5	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
49962dc5cbe04d26b67a473ae	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-6	Piping and Ducting Works	\N	2	6	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
2feaab8f5a834b95aae5d5000	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-7	Wiring and Cabling Works	\N	2	7	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
f8e60f77ac454b4f8eadb1ab8	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-8	Fixtures and Devices (Mechanical)	\N	2	8	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
a1477dba221d4bff9a5c5c991	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-9	Fixtures and Devices (Electrical)	\N	2	9	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
4bdb057f3b994829af1c31ebd	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-10	Finishes and Trims	\N	2	10	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
ee34fcc1b33c4a3c9f7ca2259	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-11	Testing and Commissioning	\N	2	11	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
786e4866f7744640bd0bb5e63	e8e0b5a283714159ad88de69f	35b619db3a5048feafe5f20e8	PH-12	Project Acceptance and Demobilization	\N	2	12	2026-07-15 15:06:58.055	2026-07-15 15:06:58.055
\.


--
-- Data for Name: SecurityEvent; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecurityEvent" (id, "timestamp", severity, "riskScore", category, "threatType", "sourceIp", country, city, region, latitude, longitude, isp, asn, organization, "userId", "userEmail", "userRole", "projectId", "targetProjectId", module, endpoint, method, "actionAttempted", "resourceType", "resourceId", "payloadSummary", "fieldsAttempted", "rbacResult", "pbacResult", "dataClassification", "threatDetected", "systemResponse", result, status, "dataExposure", "adminActionRequired", reviewed, "reviewedBy", "reviewedAt", "incidentId", simulated, environment, "userAgent", "sessionId", message, blocked, "createdAt", "updatedAt", "actualResponse", "expectedResponse", "simulationPassed", "simulationRunId") FROM stdin;
cmrh8s80e0003jj04y305x7qp	2026-07-12 03:36:51.854	High	\N	AI	AI Override Tampering	192.168.1.110	Philippines	Cebu	\N	10.3157	123.8854	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	PURCHASING_OFFICER	\N	\N	AI_VALIDATION	/api/ai/overrides/approve	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	PURCHASING_OFFICER attempted AI override approval — role not permitted	Action blocked, security event created, Director notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:36:51.854	2026-07-12 03:36:51.854	Action blocked, security event created, Director notified	Action blocked, security event created, Director notified	t	cmrh8s8030001jj04i0o47108
cmrh8sez2000ajj04vpqnl46o	2026-07-12 03:37:00.878	Critical	\N	Authentication	Session Hijacking Attempt	45.33.32.156	Germany	Frankfurt	\N	50.1109	8.6821	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	PROJECT_MANAGER	\N	\N	SYSTEM_SETTINGS	/api/auth/session	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x	Session terminated, user forced to re-authenticate	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:00.878	2026-07-12 03:37:00.878	Session terminated, user forced to re-authenticate	Session terminated, user forced to re-authenticate	t	cmrh8seyz0008jj04h9ikb3ze
cmrh8sjjm0003l504wfbfn9yi	2026-07-12 03:37:06.802	High	\N	Authentication	Brute Force Login Attack	203.0.113.55	China	Beijing	\N	39.9042	116.4074	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	UNKNOWN	\N	\N	SYSTEM_SETTINGS	/api/auth/login	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	10+ failed logins from same IP in 60 seconds	Temporary IP block and admin alert sent	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:06.802	2026-07-12 03:37:06.802	Temporary IP block and admin alert sent	Temporary IP block and admin alert sent	t	cmrh8sjjf0001l5042vc5cld3
cmrh8smjc000al504covi9ia4	2026-07-12 03:37:10.681	Critical	\N	Authorization	Unauthorized BOQ Modification	192.168.1.100	Philippines	Manila	\N	14.5995	120.9842	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	FOREMAN	\N	\N	PROJECTS	/api/projects/[id]/boq	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	Permission denied: FOREMAN cannot modify locked BOQ	Request rejected, event logged, PM notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:10.681	2026-07-12 03:37:10.681	Request rejected, event logged, PM notified	Request rejected, event logged, PM notified	t	cmrh8smj90008l504czn334t2
cmrh8sq9b0003l704mrsfnwyg	2026-07-12 03:37:15.503	Critical	\N	Authorization	Privilege Escalation via Role Manipulation	192.168.1.250	Philippines	Quezon City	\N	14.676	121.0437	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	GUEST_USER	\N	\N	SYSTEM_SETTINGS	/api/users/[id]/role	\N	Simulated Attack	\N	\N	\N	\N	\N	\N	\N	GUEST_USER attempted to POST to role update endpoint	Request rejected, account flagged, admin notified	BLOCKED	DETECTED	\N	\N	f	\N	\N	\N	t	\N	\N	\N	\N	t	2026-07-12 03:37:15.503	2026-07-12 03:37:15.503	Request rejected, account flagged, admin notified	Request rejected, account flagged, admin notified	t	cmrh8sq960001l704dh9ii6fl
\.


--
-- Data for Name: SecurityIncident; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecurityIncident" (id, title, description, severity, status, "assignedTo", "affectedUserId", "affectedProjectId", "affectedModule", "sourceIp", countermeasure, result, "dataExposure", "relatedEventIds", "rootCause", "resolutionNotes", "adminNotes", "openedAt", "closedAt", "createdBy", "updatedAt", "evidenceJson", "linkedSimulationRunId", "timelineJson") FROM stdin;
cmrh8s80w0006jj04eigs0yt0	[SIMULATION] AI Override Tampering	Simulates an attempt to approve an AI validation override without proper authority.	High	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	AI_VALIDATION	192.168.1.110	Action blocked, security event created, Director notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:36:51.872	\N	\N	2026-07-12 03:36:51.872	{"scenarioId":"cmr1esajj0003vc94g42dsw2u","mitreTechnique":"T1565 - Data Manipulation","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8s8030001jj04i0o47108	[{"time":"2026-07-12T03:36:51.871Z","event":"Threat Detected","details":"PURCHASING_OFFICER attempted AI override approval — role not permitted"},{"time":"2026-07-12T03:36:51.871Z","event":"Countermeasure Applied","details":"Action blocked, security event created, Director notified"}]
cmrh8sez9000djj04hxwi6csc	[SIMULATION] Session Hijacking Attempt	Simulates use of a stolen session cookie from a different IP address to access the ERP.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	45.33.32.156	Session terminated, user forced to re-authenticate	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:00.886	\N	\N	2026-07-12 03:37:00.886	{"scenarioId":"cmr1esgwp0006vc94ayn5bdle","mitreTechnique":"T1539 - Steal Web Session Cookie","owaspCategory":"A07:2021 - Identification and Authentication Failures"}	cmrh8seyz0008jj04h9ikb3ze	[{"time":"2026-07-12T03:37:00.885Z","event":"Threat Detected","details":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x"},{"time":"2026-07-12T03:37:00.885Z","event":"Countermeasure Applied","details":"Session terminated, user forced to re-authenticate"}]
cmrh8sjjz0006l504xg51h66l	[SIMULATION] Brute Force Login Attack	Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.	High	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	203.0.113.55	Temporary IP block and admin alert sent	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:06.815	\N	\N	2026-07-12 03:37:06.815	{"scenarioId":"cmr1es6iw0001vc94al5etulm","mitreTechnique":"T1110 - Brute Force","owaspCategory":"A07:2021 - Identification and Authentication Failures"}	cmrh8sjjf0001l5042vc5cld3	[{"time":"2026-07-12T03:37:06.814Z","event":"Threat Detected","details":"10+ failed logins from same IP in 60 seconds"},{"time":"2026-07-12T03:37:06.814Z","event":"Countermeasure Applied","details":"Temporary IP block and admin alert sent"}]
cmrh8smjj000dl504dcjgxg5l	[SIMULATION] Unauthorized BOQ Modification	Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	PROJECTS	192.168.1.100	Request rejected, event logged, PM notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:10.688	\N	\N	2026-07-12 03:37:10.688	{"scenarioId":"cmr1es8km0002vc94a0cy0sd3","mitreTechnique":"T1078 - Valid Accounts","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8smj90008l504czn334t2	[{"time":"2026-07-12T03:37:10.687Z","event":"Threat Detected","details":"Permission denied: FOREMAN cannot modify locked BOQ"},{"time":"2026-07-12T03:37:10.687Z","event":"Countermeasure Applied","details":"Request rejected, event logged, PM notified"}]
cmrh8sq9k0006l704bu0w0ofv	[SIMULATION] Privilege Escalation via Role Manipulation	Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.	Critical	OPEN	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	SYSTEM_SETTINGS	192.168.1.250	Request rejected, account flagged, admin notified	Mitigated	\N	\N	\N	\N	\N	2026-07-12 03:37:15.512	\N	\N	2026-07-12 03:37:15.512	{"scenarioId":"cmr1esivl0007vc94hsic4msb","mitreTechnique":"T1548 - Abuse Elevation Control Mechanism","owaspCategory":"A01:2021 - Broken Access Control"}	cmrh8sq960001l704dh9ii6fl	[{"time":"2026-07-12T03:37:15.511Z","event":"Threat Detected","details":"GUEST_USER attempted to POST to role update endpoint"},{"time":"2026-07-12T03:37:15.511Z","event":"Countermeasure Applied","details":"Request rejected, account flagged, admin notified"}]
\.


--
-- Data for Name: SecurityRule; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecurityRule" (id, name, description, category, enabled, severity, condition, countermeasure, "notifyAdmins", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecuritySimulationArchive; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecuritySimulationArchive" (id, "archiveNumber", "simulationRunId", "campaignId", "scenarioName", "runMode", environment, "initiatedBy", "clearedBy", "startedAt", "completedAt", "clearedAt", "totalEventsArchived", "totalIncidentsArchived", "totalCountermeasuresArchived", "detectionScore", "responseScore", "evidenceScore", "finalScore", "overallResult", "archiveJson", "exportedPdfUrl", "exportedExcelUrl", "createdAt") FROM stdin;
cmr4gacyu0000j809o08ge7nm	ARC-ALL-1783053955106	\N	\N	ALL_SIMULATIONS	\N	\N	\N	cmqiy15bq0000vc1cq1f3zg6j	\N	\N	2026-07-03 04:45:55.11	17	17	17	\N	\N	\N	\N	\N	{"events":[{"id":"cmr1k1wxj0003lb04o6a4ib8d","timestamp":"2026-07-01T04:08:01.015Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k1wxc0001lb04vqyva7sa","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-01T04:08:01.015Z","updatedAt":"2026-07-01T04:08:01.015Z"},{"id":"cmr1k2a4p000alb04t65lb9ib","timestamp":"2026-07-01T04:08:18.121Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k2a4k0008lb04eglroca0","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-01T04:08:18.121Z","updatedAt":"2026-07-01T04:08:18.121Z"},{"id":"cmr1k2h07000hlb04qwsetle2","timestamp":"2026-07-01T04:08:27.031Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Privilege Escalation via Role Manipulation","sourceIp":"192.168.1.250","country":"Philippines","city":"Quezon City","region":null,"latitude":14.676,"longitude":121.0437,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"GUEST_USER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/users/[id]/role","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"GUEST_USER attempted to POST to role update endpoint","systemResponse":"Request rejected, account flagged, admin notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1k2h02000flb04zotmlddh","expectedResponse":"Request rejected, account flagged, admin notified","actualResponse":"Request rejected, account flagged, admin notified","simulationPassed":true,"createdAt":"2026-07-01T04:08:27.031Z","updatedAt":"2026-07-01T04:08:27.031Z"},{"id":"cmr1qb52a0003jm04k2ryjuzc","timestamp":"2026-07-01T07:03:09.154Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1qb51z0001jm0460hto2f3","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-01T07:03:09.154Z","updatedAt":"2026-07-01T07:03:09.154Z"},{"id":"cmr1qc2z5000ajm04163rqybz","timestamp":"2026-07-01T07:03:53.105Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr1qc2yy0008jm04ckiucozd","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-01T07:03:53.105Z","updatedAt":"2026-07-01T07:03:53.105Z"},{"id":"cmr2u3twg0003jn0ab36u1oj2","timestamp":"2026-07-02T01:37:12.736Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2u3tvs0001jn0akelgc5bg","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-02T01:37:12.736Z","updatedAt":"2026-07-02T01:37:12.736Z"},{"id":"cmr2z1i0v0003le04gj10bhqa","timestamp":"2026-07-02T03:55:22.111Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1i0h0001le04fkumlxn2","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-02T03:55:22.111Z","updatedAt":"2026-07-02T03:55:22.111Z"},{"id":"cmr2z1jql000ale0493nvn8gs","timestamp":"2026-07-02T03:55:24.333Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1jqg0008le04p3aef4mp","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-02T03:55:24.333Z","updatedAt":"2026-07-02T03:55:24.333Z"},{"id":"cmr2z1lhs0003i904yztwmpcu","timestamp":"2026-07-02T03:55:26.608Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr2z1lhn0001i904qxp142bk","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-02T03:55:26.608Z","updatedAt":"2026-07-02T03:55:26.608Z"},{"id":"cmr4a240k0003l404tvf5hkzt","timestamp":"2026-07-03T01:51:32.564Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a24060001l404z5udnorz","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-03T01:51:32.564Z","updatedAt":"2026-07-03T01:51:32.564Z"},{"id":"cmr4a27320003ic04tutxd8al","timestamp":"2026-07-03T01:51:36.543Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a272u0001ic04b2kaq79r","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-03T01:51:36.543Z","updatedAt":"2026-07-03T01:51:36.543Z"},{"id":"cmr4a2900000aic042vmmeek7","timestamp":"2026-07-03T01:51:39.024Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a28zw0008ic04v23isak6","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-03T01:51:39.024Z","updatedAt":"2026-07-03T01:51:39.024Z"},{"id":"cmr4a2ak3000hic04br93nzxz","timestamp":"2026-07-03T01:51:41.043Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4a2ajy000fic04hf4kugbw","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-03T01:51:41.043Z","updatedAt":"2026-07-03T01:51:41.043Z"},{"id":"cmr4eb9nf0003jf0aye6qrfcb","timestamp":"2026-07-03T03:50:38.236Z","severity":"High","riskScore":null,"category":"AI","threatType":"AI Override Tampering","sourceIp":"192.168.1.110","country":"Philippines","city":"Cebu","region":null,"latitude":10.3157,"longitude":123.8854,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PURCHASING_OFFICER","projectId":null,"targetProjectId":null,"module":"AI_VALIDATION","endpoint":"/api/ai/overrides/approve","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"PURCHASING_OFFICER attempted AI override approval — role not permitted","systemResponse":"Action blocked, security event created, Director notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4eb9n30001jf0asku1oqu6","expectedResponse":"Action blocked, security event created, Director notified","actualResponse":"Action blocked, security event created, Director notified","simulationPassed":true,"createdAt":"2026-07-03T03:50:38.236Z","updatedAt":"2026-07-03T03:50:38.236Z"},{"id":"cmr4ebfxu000ajf0ad3pdfz6p","timestamp":"2026-07-03T03:50:46.386Z","severity":"Critical","riskScore":null,"category":"Authentication","threatType":"Session Hijacking Attempt","sourceIp":"45.33.32.156","country":"Germany","city":"Frankfurt","region":null,"latitude":50.1109,"longitude":8.6821,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"PROJECT_MANAGER","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/session","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x","systemResponse":"Session terminated, user forced to re-authenticate","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebfxo0008jf0aqw0uta7g","expectedResponse":"Session terminated, user forced to re-authenticate","actualResponse":"Session terminated, user forced to re-authenticate","simulationPassed":true,"createdAt":"2026-07-03T03:50:46.386Z","updatedAt":"2026-07-03T03:50:46.386Z"},{"id":"cmr4ebjwe000hjf0ajsv51e6k","timestamp":"2026-07-03T03:50:51.519Z","severity":"High","riskScore":null,"category":"Authentication","threatType":"Brute Force Login Attack","sourceIp":"203.0.113.55","country":"China","city":"Beijing","region":null,"latitude":39.9042,"longitude":116.4074,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"UNKNOWN","projectId":null,"targetProjectId":null,"module":"SYSTEM_SETTINGS","endpoint":"/api/auth/login","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"10+ failed logins from same IP in 60 seconds","systemResponse":"Temporary IP block and admin alert sent","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebjwa000fjf0awkow0vlo","expectedResponse":"Temporary IP block and admin alert sent","actualResponse":"Temporary IP block and admin alert sent","simulationPassed":true,"createdAt":"2026-07-03T03:50:51.519Z","updatedAt":"2026-07-03T03:50:51.519Z"},{"id":"cmr4eboxb000ojf0ai8tjc75x","timestamp":"2026-07-03T03:50:58.031Z","severity":"Critical","riskScore":null,"category":"Authorization","threatType":"Unauthorized BOQ Modification","sourceIp":"192.168.1.100","country":"Philippines","city":"Manila","region":null,"latitude":14.5995,"longitude":120.9842,"isp":null,"asn":null,"organization":null,"userId":"cmqiy15bq0000vc1cq1f3zg6j","userEmail":null,"userRole":"FOREMAN","projectId":null,"targetProjectId":null,"module":"PROJECTS","endpoint":"/api/projects/[id]/boq","method":null,"actionAttempted":"Simulated Attack","resourceType":null,"resourceId":null,"payloadSummary":null,"fieldsAttempted":null,"rbacResult":null,"pbacResult":null,"dataClassification":null,"threatDetected":"Permission denied: FOREMAN cannot modify locked BOQ","systemResponse":"Request rejected, event logged, PM notified","result":"BLOCKED","status":"DETECTED","dataExposure":null,"adminActionRequired":null,"reviewed":false,"reviewedBy":null,"reviewedAt":null,"incidentId":null,"simulated":true,"environment":null,"userAgent":null,"sessionId":null,"message":null,"blocked":true,"simulationRunId":"cmr4ebox5000mjf0ahv6mhfq1","expectedResponse":"Request rejected, event logged, PM notified","actualResponse":"Request rejected, event logged, PM notified","simulationPassed":true,"createdAt":"2026-07-03T03:50:58.031Z","updatedAt":"2026-07-03T03:50:58.031Z"}],"incidents":[{"id":"cmr1k1wxx0006lb04ea3p0y3d","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:01.028Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-01T04:08:01.028Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1k1wxc0001lb04vqyva7sa","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:01.029Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:01.029Z"},{"id":"cmr1k2a4y000dlb04pwt33mv2","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:18.129Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-01T04:08:18.129Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr1k2a4k0008lb04eglroca0","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:18.130Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:18.130Z"},{"id":"cmr1k2h0g000klb040xiumpf4","title":"[SIMULATION] Privilege Escalation via Role Manipulation","description":"Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"192.168.1.250","countermeasure":"Request rejected, account flagged, admin notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T04:08:27.039Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"GUEST_USER attempted to POST to role update endpoint\\"},{\\"time\\":\\"2026-07-01T04:08:27.039Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, account flagged, admin notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esivl0007vc94hsic4msb\\",\\"mitreTechnique\\":\\"T1548 - Abuse Elevation Control Mechanism\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr1k2h02000flb04zotmlddh","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T04:08:27.040Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T04:08:27.040Z"},{"id":"cmr1qb52v0006jm04zbftex0o","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T07:03:09.174Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-01T07:03:09.174Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1qb51z0001jm0460hto2f3","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T07:03:09.175Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T07:03:09.175Z"},{"id":"cmr1qc2zh000djm047lpu9f2l","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-01T07:03:53.117Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-01T07:03:53.117Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr1qc2yy0008jm04ckiucozd","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-01T07:03:53.117Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-01T07:03:53.117Z"},{"id":"cmr2u3tx10006jn0alf34p08z","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T01:37:12.756Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-02T01:37:12.756Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr2u3tvs0001jn0akelgc5bg","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T01:37:12.757Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T01:37:12.757Z"},{"id":"cmr2z1i1e0006le049vhatpun","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:22.129Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-02T03:55:22.129Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr2z1i0h0001le04fkumlxn2","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:22.130Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:22.130Z"},{"id":"cmr2z1jqu000dle04d05w6czs","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:24.342Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-02T03:55:24.342Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr2z1jqg0008le04p3aef4mp","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:24.343Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:24.343Z"},{"id":"cmr2z1li20006i904kvs8o8f2","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-02T03:55:26.617Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-02T03:55:26.617Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr2z1lhn0001i904qxp142bk","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-02T03:55:26.618Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-02T03:55:26.618Z"},{"id":"cmr4a24100006l404sn6x1jaf","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:32.579Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-03T01:51:32.579Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4a24060001l404z5udnorz","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:32.580Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:32.580Z"},{"id":"cmr4a273h0006ic04qlbxg1zl","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:36.556Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-03T01:51:36.556Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4a272u0001ic04b2kaq79r","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:36.557Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:36.557Z"},{"id":"cmr4a2909000dic04yvxv2dgu","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:39.033Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-03T01:51:39.033Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4a28zw0008ic04v23isak6","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:39.033Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:39.033Z"},{"id":"cmr4a2akb000kic047keu3q8o","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T01:51:41.051Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-03T01:51:41.051Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4a2ajy000fic04hf4kugbw","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T01:51:41.052Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T01:51:41.052Z"},{"id":"cmr4eb9o80006jf0ahzid2zkf","title":"[SIMULATION] AI Override Tampering","description":"Simulates an attempt to approve an AI validation override without proper authority.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"AI_VALIDATION","sourceIp":"192.168.1.110","countermeasure":"Action blocked, security event created, Director notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:38.263Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"PURCHASING_OFFICER attempted AI override approval — role not permitted\\"},{\\"time\\":\\"2026-07-03T03:50:38.263Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Action blocked, security event created, Director notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esajj0003vc94g42dsw2u\\",\\"mitreTechnique\\":\\"T1565 - Data Manipulation\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4eb9n30001jf0asku1oqu6","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:38.264Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:38.264Z"},{"id":"cmr4ebfy5000djf0aty2sso87","title":"[SIMULATION] Session Hijacking Attempt","description":"Simulates use of a stolen session cookie from a different IP address to access the ERP.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"45.33.32.156","countermeasure":"Session terminated, user forced to re-authenticate","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:46.396Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x\\"},{\\"time\\":\\"2026-07-03T03:50:46.396Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Session terminated, user forced to re-authenticate\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1esgwp0006vc94ayn5bdle\\",\\"mitreTechnique\\":\\"T1539 - Steal Web Session Cookie\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4ebfxo0008jf0aqw0uta7g","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:46.397Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:46.397Z"},{"id":"cmr4ebjwo000kjf0aoxm7jlxi","title":"[SIMULATION] Brute Force Login Attack","description":"Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.","severity":"High","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"SYSTEM_SETTINGS","sourceIp":"203.0.113.55","countermeasure":"Temporary IP block and admin alert sent","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:51.527Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"10+ failed logins from same IP in 60 seconds\\"},{\\"time\\":\\"2026-07-03T03:50:51.527Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Temporary IP block and admin alert sent\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es6iw0001vc94al5etulm\\",\\"mitreTechnique\\":\\"T1110 - Brute Force\\",\\"owaspCategory\\":\\"A07:2021 - Identification and Authentication Failures\\"}","linkedSimulationRunId":"cmr4ebjwa000fjf0awkow0vlo","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:51.528Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:51.528Z"},{"id":"cmr4eboxk000rjf0ad2snp8js","title":"[SIMULATION] Unauthorized BOQ Modification","description":"Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.","severity":"Critical","status":"OPEN","assignedTo":"cmqiy15bq0000vc1cq1f3zg6j","affectedUserId":null,"affectedProjectId":null,"affectedModule":"PROJECTS","sourceIp":"192.168.1.100","countermeasure":"Request rejected, event logged, PM notified","result":"Mitigated","dataExposure":null,"relatedEventIds":null,"timelineJson":"[{\\"time\\":\\"2026-07-03T03:50:58.039Z\\",\\"event\\":\\"Threat Detected\\",\\"details\\":\\"Permission denied: FOREMAN cannot modify locked BOQ\\"},{\\"time\\":\\"2026-07-03T03:50:58.039Z\\",\\"event\\":\\"Countermeasure Applied\\",\\"details\\":\\"Request rejected, event logged, PM notified\\"}]","evidenceJson":"{\\"scenarioId\\":\\"cmr1es8km0002vc94a0cy0sd3\\",\\"mitreTechnique\\":\\"T1078 - Valid Accounts\\",\\"owaspCategory\\":\\"A01:2021 - Broken Access Control\\"}","linkedSimulationRunId":"cmr4ebox5000mjf0ahv6mhfq1","rootCause":null,"resolutionNotes":null,"adminNotes":null,"openedAt":"2026-07-03T03:50:58.040Z","closedAt":null,"createdBy":null,"updatedAt":"2026-07-03T03:50:58.040Z"}],"countermeasures":[{"id":"cmr1k1wxr0004lb04d8me55av","securityEventId":"cmr1k1wxj0003lb04o6a4ib8d","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":44,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:01.023Z","createdAt":"2026-07-01T04:08:01.023Z"},{"id":"cmr1k2a4u000blb042xhdvas7","securityEventId":"cmr1k2a4p000alb04t65lb9ib","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":42,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:18.126Z","createdAt":"2026-07-01T04:08:18.126Z"},{"id":"cmr1k2h0c000ilb045k75lqzs","securityEventId":"cmr1k2h07000hlb04qwsetle2","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, account flagged, admin notified","result":"SUCCESS","responseTimeMs":45,"expectedResult":"Request rejected, account flagged, admin notified","actualResult":"Request rejected, account flagged, admin notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T04:08:27.036Z","createdAt":"2026-07-01T04:08:27.036Z"},{"id":"cmr1qb52l0004jm04y05skc6j","securityEventId":"cmr1qb52a0003jm04k2ryjuzc","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":51,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T07:03:09.165Z","createdAt":"2026-07-01T07:03:09.165Z"},{"id":"cmr1qc2zb000bjm040d19k5fy","securityEventId":"cmr1qc2z5000ajm04163rqybz","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":21,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-01T07:03:53.111Z","createdAt":"2026-07-01T07:03:53.111Z"},{"id":"cmr2u3tws0004jn0apgx2jml7","securityEventId":"cmr2u3twg0003jn0ab36u1oj2","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":30,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T01:37:12.748Z","createdAt":"2026-07-02T01:37:12.748Z"},{"id":"cmr2z1i150004le04bwo1mquy","securityEventId":"cmr2z1i0v0003le04gj10bhqa","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":18,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:22.122Z","createdAt":"2026-07-02T03:55:22.122Z"},{"id":"cmr2z1jqr000ble04dyo5150b","securityEventId":"cmr2z1jql000ale0493nvn8gs","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":55,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:24.339Z","createdAt":"2026-07-02T03:55:24.339Z"},{"id":"cmr2z1lhx0004i904ld33zobi","securityEventId":"cmr2z1lhs0003i904yztwmpcu","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":42,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-02T03:55:26.614Z","createdAt":"2026-07-02T03:55:26.614Z"},{"id":"cmr4a240s0004l404t2rqv0e1","securityEventId":"cmr4a240k0003l404tvf5hkzt","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":15,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:32.573Z","createdAt":"2026-07-03T01:51:32.573Z"},{"id":"cmr4a273a0004ic04aycr6a2g","securityEventId":"cmr4a27320003ic04tutxd8al","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":33,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:36.550Z","createdAt":"2026-07-03T01:51:36.550Z"},{"id":"cmr4a2905000bic04te9sh503","securityEventId":"cmr4a2900000aic042vmmeek7","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":26,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:39.029Z","createdAt":"2026-07-03T01:51:39.029Z"},{"id":"cmr4a2ak7000iic041btdl7xz","securityEventId":"cmr4a2ak3000hic04br93nzxz","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":49,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T01:51:41.048Z","createdAt":"2026-07-03T01:51:41.048Z"},{"id":"cmr4eb9ny0004jf0amjsd4fmw","securityEventId":"cmr4eb9nf0003jf0aye6qrfcb","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Action blocked, security event created, Director notified","result":"SUCCESS","responseTimeMs":41,"expectedResult":"Action blocked, security event created, Director notified","actualResult":"Action blocked, security event created, Director notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:38.255Z","createdAt":"2026-07-03T03:50:38.255Z"},{"id":"cmr4ebfy0000bjf0aiknj48sw","securityEventId":"cmr4ebfxu000ajf0ad3pdfz6p","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Session terminated, user forced to re-authenticate","result":"SUCCESS","responseTimeMs":23,"expectedResult":"Session terminated, user forced to re-authenticate","actualResult":"Session terminated, user forced to re-authenticate","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:46.392Z","createdAt":"2026-07-03T03:50:46.392Z"},{"id":"cmr4ebjwj000ijf0a44366cpf","securityEventId":"cmr4ebjwe000hjf0ajsv51e6k","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Temporary IP block and admin alert sent","result":"SUCCESS","responseTimeMs":52,"expectedResult":"Temporary IP block and admin alert sent","actualResult":"Temporary IP block and admin alert sent","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:51.524Z","createdAt":"2026-07-03T03:50:51.524Z"},{"id":"cmr4eboxg000pjf0a0frwmdm9","securityEventId":"cmr4eboxb000ojf0ai8tjc75x","countermeasureType":"SIMULATED_RESPONSE","description":"Simulated action: Request rejected, event logged, PM notified","result":"SUCCESS","responseTimeMs":46,"expectedResult":"Request rejected, event logged, PM notified","actualResult":"Request rejected, event logged, PM notified","passed":true,"performedBySystem":true,"performedByUserId":null,"timestamp":"2026-07-03T03:50:58.036Z","createdAt":"2026-07-03T03:50:58.036Z"}]}	\N	\N	2026-07-03 04:45:55.11
\.


--
-- Data for Name: SecuritySimulationCampaign; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecuritySimulationCampaign" (id, name, description, severity, "scenarioSequenceJson", status, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecuritySimulationRun; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SecuritySimulationRun" (id, "scenarioId", "campaignId", "runMode", environment, status, "initiatedBy", "startedAt", "completedAt", "detectionScore", "responseScore", "evidenceScore", "finalScore", "overallResult", notes) FROM stdin;
cmrh8smj90008l504czn334t2	cmr1es8km0002vc94a0cy0sd3	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:10.677	2026-07-12 03:37:10.698	100	100	100	100	Passed	\N
cmrh8sq960001l704dh9ii6fl	cmr1esivl0007vc94hsic4msb	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:15.499	2026-07-12 03:37:15.523	100	100	100	100	Passed	\N
cmrh8s8030001jj04i0o47108	cmr1esajj0003vc94g42dsw2u	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:36:51.843	2026-07-12 03:36:51.895	100	100	100	100	Passed	\N
cmrh8seyz0008jj04h9ikb3ze	cmr1esgwp0006vc94ayn5bdle	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:00.875	2026-07-12 03:37:00.896	100	100	100	100	Passed	\N
cmrh8sjjf0001l5042vc5cld3	cmr1es6iw0001vc94al5etulm	\N	EVENT_ONLY	production	COMPLETED	cmqiy15bq0000vc1cq1f3zg6j	2026-07-12 03:37:06.795	2026-07-12 03:37:06.84	100	100	100	100	Passed	\N
\.


--
-- Data for Name: SecuritySimulationScenario; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: SensitiveExportLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SensitiveExportLog" (id, "userId", "userEmail", role, "projectId", module, "exportType", "recordCount", "dataClassification", "sourceIp", approved, blocked, reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: SubcontractAccomplishment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubcontractAccomplishment" (id, "packageId", "jobOrderId", "workDescription", location, "prevPercent", "currentPercent", "cumulativePercent", "prevQty", "currentQty", "totalQty", "remainingQty", photos, videos, "inspectionReport", "qaQcStatus", "materialIssuedRef", "deliveryRef", remarks, "preparedBy", "verifiedBy", "approvedBy", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractBilling; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubcontractBilling" (id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "retentionDeduction", "whtDeduction", "mobilizationDeduction", "backCharges", "materialCharges", penalties, "otherDeductions", "netPayable", "billingPeriod", "supportingDocs", "aiValidationResult", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractPackage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubcontractPackage" (id, "projectId", "packageNumber", "subcontractorId", "workCategory", "contractType", "awardedBoqItemId", "masterBoqItemId", "scopeOfWork", location, "floorBuildingZone", quantity, unit, "unitCost", "contractAmount", "internalBudget", "costType", "paymentTerms", "retentionPct", "whtPct", "mobilizationAdvance", "startDate", "targetCompletion", "warrantyPeriod", attachments, status, "isLocked", remarks, "createdAt", "updatedAt", "consolidatedBoqItemId") FROM stdin;
\.


--
-- Data for Name: Subcontractor; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Subcontractor" (id, name, "businessName", "businessType", address, "contactPerson", "contactNumber", email, tin, "birReg", "dtiSecReg", "mayorPermit", "pcabLicense", "bankName", "bankAccountName", "bankAccountNumber", specialization, accreditation, "contractType", "isSeedData", "requiredDocs", "docExpiries", "safetyRecords", "evaluationRating", remarks, "createdAt", "updatedAt") FROM stdin;
ae463659-bb0e-4e98-bf00-c094ed6cc145	Sample Steel Works Subcon	\N	CORPORATION	\N	Juan Dela Cruz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
63671a32-fe4b-4217-bcee-bbfbfc4d8995	Sample Painting Subcon	\N	CORPORATION	\N	Pedro Penduko	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
9116d674-148c-4d8b-a286-9fbffc95108c	Sample Electrical Subcon	\N	CORPORATION	\N	John Doe	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
201203d4-29d2-4273-8263-0c4885e5588d	Sample Plumbing Subcon	\N	CORPORATION	\N	Jane Doe	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
36d5f45c-4424-4ebf-847b-b96af9a55cc5	Sample Tile Works Subcon	\N	CORPORATION	\N	Mario Rossi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	SUBCONTRACTOR	f	\N	\N	\N	\N	\N	2026-07-13 05:06:50.9	2026-07-13 05:06:50.9
\.


--
-- Data for Name: SubcontractorBOQItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubcontractorBOQItem" (id, "subcontractorId", "awardedBoqItemId", quantity, "unitCost", "totalCost", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SubcontractorVariationOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SubcontractorVariationOrder" (id, "svoNumber", "projectId", "originalSubcontractId", "originalBenchmarkQty", "originalBenchmarkAmt", "originalSubcontractQty", "originalSubcontractAmt", "proposedAdditionalQty", "proposedAdditionalAmt", "revisedSubcontractQty", "revisedSubcontractAmt", reason, "costImpact", "scheduleImpact", "profitabilityImpact", "approvalStatus", "preparedById", "reviewedById", "approvedById", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Supplier" (id, name, tin, "contactPerson", "contactNumber", email, address, "paymentTerms", website, "plantLocation", "isVatable", "isSeedData", "createdAt", "updatedAt") FROM stdin;
cmrirfsma0005if04hnk8ldlb	Sample Hardware Supplier	\N	Supplier Contact 1	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0006if04brvcxvhf	Sample Cement Supplier	\N	Supplier Contact 2	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0007if04gzuclb9c	Sample Electrical Supplier	\N	Supplier Contact 3	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0008if04us1jrz6o	Sample Lumber Supplier	\N	Supplier Contact 4	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
cmrirfsma0009if04h8awi0w4	Sample Paints Supplier	\N	Supplier Contact 5	\N	\N	\N	\N	\N	\N	t	f	2026-07-13 05:06:50.914	2026-07-13 05:06:50.914
\.


--
-- Data for Name: SupplierQuotation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."SupplierQuotation" (id, status, "totalAmount", "isRecommended", "deliveryPeriod", "paymentTerms", "aiRank", "aiRationale", "canvassFormId", "supplierId", "createdAt", "updatedAt", "fileUrl") FROM stdin;
\.


--
-- Data for Name: SystemRole; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: ThreatIp; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ThreatIp" (id, "ipAddress", country, city, region, latitude, longitude, isp, asn, organization, "firstSeen", "lastSeen", "attemptCount", severity, status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TransactionWorkflow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."TransactionWorkflow" (id, "moduleName", "transactionId", "preparedBy", "preparedByRole", "reviewedBy", "reviewedByRole", "recommendedBy", "recommendedByRole", "approvedBy", "approvedByRole", "paidBy", "paidByRole", "currentStatus", "currentStage", "nextRequiredRole", "datePrepared", "dateReviewed", "dateRecommended", "dateApproved", "datePaid", remarks, "auditReference", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UploadedWorkbookFile; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UploadedWorkbookFile" (id, "projectId", "originalFilename", "fileHash", "storagePath", "preservedOriginalUrl", "uploadedBy", "uploadedAt", "recognizedTemplate", "validationStatus", "createdAt", "updatedAt", "commitStatus", "documentType", "extractionStatus", "fileSize", "latestPreservedVersionId", "metadataJson", "mimeType", "onlyOfficeDocumentKey", "templateCode", "templateName", "templateVersion") FROM stdin;
cmrlx3y3q00t0vceoathnib57	cmrlx3xcg00swvceoxntp02vz	Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx	dd4f54c61c54c13e0d5735ed8f6ce66842c15cf167d9fc65baa6410dd267f5b0	gate7/mock/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx	\N	cmrinimix001avchckwzmfxsu	2026-07-15 10:08:54.374	\N	VALIDATED	2026-07-15 10:08:54.374	2026-07-15 10:08:54.374	COMMITTED	\N	EXTRACTED	0	\N	\N	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	\N	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."User" (id, name, email, password, "emailVerified", image, role, "createdAt", "updatedAt", "passwordHash", status, "defaultRole", department, "lastLoginAt", "mustChangePassword", "sessionVersion", "passwordChangedAt", "failedLoginAttempts", "lockedUntil") FROM stdin;
cmqiy15bq0000vc1cq1f3zg6j	J BURNS	J.BURNS2372@GMAIL.COM	Junixsys_001	\N	\N	SUPER_ADMIN	2026-06-18 03:31:42.518	2026-06-23 12:21:43.84	\N	ACTIVE	\N	\N	\N	f	0	\N	0	\N
cmriniqgy001lvchcegw8qcxv	Site Engineer	engineer@onesystemserp.com	admin001	\N	\N	SITE_ENGINEER	2026-07-13 03:17:09.633	2026-07-15 09:51:29.057	$2b$10$j8jGoECP6sKp44h7/hUTJ.tFHvt4REiuVsrs6z6EdGyez8Et5SgTy	ACTIVE	SITE_ENGINEER	\N	\N	t	1	\N	0	\N
cmrinikue0017vchcnxm8wqzn	Project Director	director@onesystemserp.com	admin001	\N	\N	PROJECT_DIRECTOR	2026-07-13 03:17:02.34	2026-07-15 09:57:12.873	$2b$10$j8jGoECP6sKp44h7/hUTJ.tFHvt4REiuVsrs6z6EdGyez8Et5SgTy	ACTIVE	PROJECT_DIRECTOR	\N	\N	f	0	\N	0	\N
cmrinimix001avchckwzmfxsu	BERNARD MANUEL	manager@onesystemserp.com	admin001	\N	\N	PROJECT_MANAGER	2026-07-13 03:17:04.521	2026-07-15 09:57:12.873	$2b$10$j8jGoECP6sKp44h7/hUTJ.tFHvt4REiuVsrs6z6EdGyez8Et5SgTy	ACTIVE	PROJECT_MANAGER	\N	\N	f	0	\N	0	\N
cmqn5zlim0000vckg4hzn5u7o	SYSTEM ADMIN 01	admin01@demo.com	superadmin001	\N	\N	SUPER_ADMIN	2026-06-21 02:25:31.821	2026-07-13 03:58:55.557	\N	ACTIVE	\N	\N	\N	f	0	\N	0	\N
cmriningq001dvchcz9yk1y7x	Purchasing Officer	purchasing@onesystemserp.com	admin001	\N	\N	PURCHASING_OFFICER	2026-07-13 03:17:05.738	2026-07-13 05:06:50.976	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	PURCHASING_OFFICER	\N	\N	f	0	\N	0	\N
cmrinioec001gvchcueq8v3db	Finance Officer	finance@onesystemserp.com	admin001	\N	\N	FINANCE_OFFICER	2026-07-13 03:17:06.948	2026-07-13 05:06:50.987	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	FINANCE_OFFICER	\N	\N	f	0	\N	0	\N
cmrinipcb001jvchcx9r97i6i	Accounting Officer	accounting@onesystemserp.com	admin001	\N	\N	ACCOUNTANT	2026-07-13 03:17:08.171	2026-07-13 05:06:50.996	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	ACCOUNTANT	\N	\N	f	0	\N	0	\N
cmrinipwp001kvchcbm6q2hfk	Billing Officer	billing@onesystemserp.com	admin001	\N	\N	BILLING_ENGINEER	2026-07-13 03:17:08.905	2026-07-13 05:06:51.005	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	BILLING_ENGINEER	\N	\N	f	0	\N	0	\N
cmrioubtm0026vchcc4pcayuu	Site Admin	admin@onesystemserp.com	admin001	\N	\N	SITE_ADMIN	2026-07-13 03:54:10.138	2026-07-13 05:06:51.025	$2b$10$6VGqOkFNU48h/2NcmMYShuHLyRKZ9wlbVDfEtGpxSuhZO5t9A8O5u	ACTIVE	SITE_ADMIN	\N	\N	f	0	\N	0	\N
\.


--
-- Data for Name: UserLoginLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UserLoginLog" (id, "userId", "ipAddress", "deviceInfo", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
-- Data for Name: UserSessionSecurityLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."UserSessionSecurityLog" (id, "userId", "sourceIp", "userAgent", device, "approximateLocation", "loginAt", "lastActivityAt", "revokedAt", "revokedBy", status, "riskScore", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationAuditLog; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ValidationAuditLog" (id, "projectId", "userId", "userRole", "actionType", "validationRecordId", "aiScoreAtTime", "aiFindingsAtTime", "manualOverrideReason", "approvalRemarks", "evidenceVersion", "ipAddress", "deviceInfo", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationEvidencePack; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ValidationEvidencePack" (id, "projectId", "relatedBillingId", "relatedAccomplishId", "executiveSummary", "claimedAccomplish", "aiValidatedAccomplish", "billingAmount", "riskFindings", "finalRecommendation", "filePdfUrl", "fileExcelUrl", status, "createdById", "createdAt") FROM stdin;
\.


--
-- Data for Name: ValidationSettings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ValidationSettings" (id, "boqWeight", "plansWeight", "photoWeight", "droneWeight", "cctvWeight", "satelliteWeight", "deliveryWeight", "scheduleWeight", "approvalWeight", "updatedById", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ValueEngineeringRecord; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ValueEngineeringRecord" (id, "veNumber", "projectId", description, "currentCost", "proposedCost", "estimatedSavings", "actualSavingsAchieved", "qualityImpact", "safetyImpact", "contractImpact", "requiredApproval", "aiRecommendation", "humanReviewStatus", "finalApprovalStatus", "createdAt", "updatedAt", "consolidatedBoqItemId", "awardedBoqItemId") FROM stdin;
\.


--
-- Data for Name: VariationOrder; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VariationOrder" (id, "voNumber", "dateRequested", "requestedById", "requestingDepartment", "variationType", "variationCategory", "sourceOfVariation", "reasonForVariation", "detailedDescription", "affectedLocation", "affectedFloorZone", "originalContractAmount", "totalPreviouslyApprovedAdditive", "totalPreviouslyApprovedDeductive", "currentRevisedContractAmount", "additionalAmount", "deductiveAmount", "netVariationAmount", "percentageImpact", "timeImpact", "additionalCalendarDaysRequested", "effectOnCriticalPath", "effectOnProjectCompletionDate", "technicalJustification", "commercialJustification", "safetyJustification", "clientInstructionReference", "consultantInstructionReference", "drawingReference", "siteInstructionReference", "inspectionReportReference", "quantityTakeOffReference", "costEstimateReference", "supplierQuotationReference", "subcontractorQuotationReference", "aiValidationResult", "aiRiskRating", "currentStatus", "approvalHistory", remarks, "approvedForImplementation", "approvedForProcurement", "approvedForSubcontracting", "approvedForJobOrder", "approvedForBilling", "subcontractPackageId", "projectId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderApproval; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VariationOrderApproval" (id, stage, action, "actionById", remarks, "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderDocument; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VariationOrderDocument" (id, "fileName", "fileType", "fileUrl", "documentCategory", remarks, "uploadedById", "variationOrderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VariationOrderItem; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VariationOrderItem" (id, "voItemNumber", "itemClassification", "workCategory", location, description, unit, "originalQuantity", "previouslyApprovedQuantity", "currentProposedQuantity", "revisedQuantity", "originalUnitCost", "proposedUnitCost", "approvedUnitCost", "originalAmount", "additionalAmount", "deductiveAmount", "netAmount", "costSource", "pricingBasis", "materialCost", "laborCost", "equipmentCost", "subcontractCost", "transportationCost", consumables, overhead, "profitMarkup", tax, "otherDirectCost", "supplierQuotationReference", "subcontractorQuotationReference", "canvassReference", "attachmentReference", "procurementStatus", "subcontractStatus", "accomplishmentStatus", "billingStatus", "approvalStatus", remarks, "variationOrderId", "originalBoqItemId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VideoEvidence; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."VideoEvidence" (id, "fleetEventId", "equipmentId", "deviceId", "channelNo", "evidenceType", "fileUrl", "playbackStartTime", "playbackEndTime", "thumbnailUrl", "storageLocation", "retentionUntil", checksum, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkbookExtractionAudit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkbookExtractionAudit" (id, "uploadedWorkbookFileId", "projectId", action, status, message, "detailsJson", "performedBy", "performedAt", "ipAddress", "performedByRole", "userAgent") FROM stdin;
\.


--
-- Data for Name: WorkbookFormulaValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkbookFormulaValidation" (id, "uploadedWorkbookFileId", "sheetName", "cellAddress", "sourceRowNumber", "expectedFormula", "actualFormula", "validationStatus", message, "createdAt", "projectId", severity, "actualValue", "expectedValue") FROM stdin;
\.


--
-- Data for Name: WorkbookTemplateValidation; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkbookTemplateValidation" (id, "uploadedWorkbookFileId", "projectId", "validationType", "validationKey", "expectedValue", "actualValue", severity, status, message, "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkbookVersion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkbookVersion" (id, "uploadedWorkbookFileId", "projectId", "versionNumber", "versionLabel", "sourceType", "filePath", "fileHash", "createdBy", "createdAt", remarks) FROM stdin;
\.


--
-- Data for Name: Worker; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Worker" (id, "workerId", "firstName", "lastName", "middleName", suffix, nickname, "dateOfBirth", gender, "civilStatus", "mobileNumber", "emailAddress", "completeAddress", "emergencyContactName", "emergencyContactNumber", "emergencyContactRelation", "employmentType", "workerCategory", designation, department, "dateHired", "engagementStartDate", "contractEndDate", "employmentStatus", "restDay", "standardWorkHours", "overtimeEligible", "nightDifferentialEligible", "holidayPayEligible", "subjectToAttendance", "subjectToPayrollCutoff", "rateType", "basicMonthlySalary", "dailyRate", "hourlyRate", "pieceRate", "unitDescription", "contractAmount", "professionalFee", "paymentBasis", "billingFrequency", "prorationMethod", "retentionPercentage", "withholdingTaxRate", allowance, "tinNumber", "sssNumber", "philHealthNumber", "pagIbigNumber", "umidNumber", "nationalIdNumber", "validIdType", "validIdNumber", "validIdExpiryDate", "withholdingTaxEnabled", "sssDeductionEnabled", "philHealthDeductionEnabled", "pagibigDeductionEnabled", "otherGovernmentDeductionEnabled", "taxClassification", "withholdingTaxType", "taxExemptionReason", "birFormType", "registeredBusinessName", "officialReceiptRequired", "taxStatus", "payrollMode", "bankName", "bankAccountName", "bankAccountNumber", "gcashAccountName", "gcashNumber", "checkPayeeName", "billingPayeeName", "billingAddress", "projectId", "createdAt", "updatedAt", "allowedPaymentMethod", "bankAccountType", "bankApprovedBy", "bankBranch", "bankLastUpdatedDate", "bankSupportingAttachment", "bankUpdatedBy", "bankVerificationStatus", "gcashApprovedBy", "gcashLastUpdatedDate", "gcashSupportingAttachment", "gcashUpdatedBy", "gcashVerificationStatus", "paymentHoldReason", "paymentProfileStatus", "paymentRemarks", "payrollCategory", "isSeedData") FROM stdin;
cmrirfslm0000if04wh4dg6as	\N	Sample	Foreman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Foreman	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	800	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0001if042on7al6u	\N	Sample	Mason	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Mason	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	650	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0002if049eiwfck3	\N	Sample	Carpenter	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	SKILLED	Carpenter	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	650	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0003if04e54ww2kd	\N	Sample	Helper 1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	UNSKILLED	Helper	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	500	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
cmrirfslm0004if04garmkvku	\N	Sample	Helper 2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PROJECT_BASED	UNSKILLED	Helper	\N	\N	\N	\N	ACTIVE	\N	8	t	t	t	t	t	DAILY_RATE	0	500	0	0	\N	0	0	\N	\N	\N	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	f	COMPENSATION_EMPLOYEE	COMPENSATION_WITHHOLDING_TAX	\N	\N	\N	f	SINGLE	CASH	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-13 05:06:50.89	2026-07-13 05:06:50.89	Manual Hold	\N	\N	\N	\N	\N	\N	Pending	\N	\N	\N	\N	Pending	\N	Pending	\N	Other	f
\.


--
-- Data for Name: WorkerDocument; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkerDocument" (id, "workerId", title, category, "fileUrl", "expiryDate", remarks, "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowStep; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkflowStep" (id, "templateId", "stepOrder", "stageName", "requiredRole", "actionRequired", "isTerminal", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkflowTemplate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."WorkflowTemplate" (id, "moduleName", description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
333a4c5b-365f-478c-a0f9-a7ff2eb01704	696e407e7273457d1e1ee86aa5e70e7796b61f27dd35e619a88f7823202dc73b	2026-06-26 06:59:11.124856+00	20260626065906_init_postgres	\N	\N	2026-06-26 06:59:07.975291+00	1
0d48f112-2e7a-4f0c-8529-73ef05a07627	b18f132b76a5b7832607e20713aba1a55550a3f13816adde4b381b169268deab	\N	20260714_reconcile_pre_phase3_schema_drift	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260714_reconcile_pre_phase3_schema_drift\n\nDatabase error code: 42601\n\nDatabase error:\nERROR: syntax error at or near "\\"\n\nPosition:\n[1m  0[0m\n[1m  1[1;31m CREATE OR REPLACE FUNCTION _reconcile_check_column(\\n    p_table text, p_column text, p_type text, p_nullable boolean, p_default text\\n) RETURNS void AS $$\\nDECLARE\\n    v_type text;\\n    v_nullable boolean;\\n    v_default text;\\nBEGIN\\n    SELECT data_type, (is_nullable = 'YES'), column_default\\n    INTO v_type, v_nullable, v_default\\n    FROM information_schema.columns\\n    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column;\\n\\n    IF NOT FOUND THEN\\n        RAISE EXCEPTION 'Column %.% is missing', p_table, p_column;\\n    END IF;\\n\\n    IF v_type != p_type THEN\\n        RAISE EXCEPTION 'Column %.% type mismatch: expected %, got %', p_table, p_column, p_type, v_type;\\n    END IF;\\n\\n    IF v_nullable != p_nullable THEN\\n        RAISE EXCEPTION 'Column %.% nullability mismatch: expected %, got %', p_table, p_column, p_nullable, v_nullable;\\n    END IF;\\nEND;\\n$$ LANGUAGE plpgsql;\\n\\nCREATE OR REPLACE FUNCTION _reconcile_check_fk(\\n    p_table text, p_constraint text, p_col text, p_ref_table text, p_ref_col text, p_on_delete text, p_on_update text\\n) RETURNS void AS $$\\nDECLARE\\n    v_ref_table text;\\nBEGIN\\n    SELECT ccu.table_name INTO v_ref_table\\n    FROM information_schema.table_constraints tc\\n    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name\\n    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = p_table AND tc.constraint_name = p_constraint;\\n\\n    IF NOT FOUND THEN\\n        RAISE EXCEPTION 'Foreign key % on % is missing', p_constraint, p_table;\\n    END IF;\\n\\n    IF v_ref_table != p_ref_table THEN\\n        RAISE EXCEPTION 'Foreign key % targets wrong table: expected %, got %', p_constraint, p_ref_table, v_ref_table;\\n    END IF;\\nEND;\\n$$ LANGUAGE plpgsql;\\n\\nCREATE OR REPLACE FUNCTION _reconcile_check_idx(\\n    p_name text, p_table text, p_col text\\n) RETURNS void AS $$\\nDECLARE\\n    v_exists boolean;\\nBEGIN\\n    SELECT EXISTS (\\n        SELECT 1 FROM pg_indexes WHERE tablename = p_table AND indexname = p_name\\n    ) INTO v_exists;\\n\\n    IF NOT v_exists THEN\\n        RAISE EXCEPTION 'Index % on % is missing', p_name, p_table;\\n    END IF;\\nEND;\\n$$ LANGUAGE plpgsql;\\n\\nDO $$\\nBEGIN\\n    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='procurementBenchmarkItemId') THEN[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42601), message: "syntax error at or near \\"\\\\\\"", detail: None, hint: None, position: Some(Original(52)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("scan.l"), line: Some(1244), routine: Some("scanner_yyerror") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260714_reconcile_pre_phase3_schema_drift"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260714_reconcile_pre_phase3_schema_drift"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2026-07-15 07:26:07.106324+00	2026-07-15 07:11:40.003569+00	0
56450526-4939-4206-8725-9307d8b64e2b	03421f007578142e633880730fbb609d1bde4a773c034427e1d105b1897a6565	2026-07-15 07:26:40.299749+00	20260714_reconcile_pre_phase3_schema_drift	\N	\N	2026-07-15 07:26:38.530059+00	1
3502676d-1867-4c65-870b-85ba4d554b91	888f79223760297c0901d26a960becc43d714f51a40a4fbf261d7bbc9157ff4a	2026-07-15 07:26:42.16778+00	20260714190000_phase3_baseline_workflow	\N	\N	2026-07-15 07:26:40.778778+00	1
b7d742da-77b0-4709-8a41-e11a8a9e0373	7fc62f231236922586c62facc16ac5b7f2200264b299fa5213f878b877e0e144	2026-07-15 07:26:43.817367+00	20260714200000_harden_schedule_baseline_activation	\N	\N	2026-07-15 07:26:42.640598+00	1
800039c7-9655-40a8-8231-18f54b13be2b	dea02b20ce06d021a7e41098a6284448e19a0e9ff798108229fb87552c382625	2026-07-15 08:35:42.029678+00	20260715100000_security_remediation	\N	\N	2026-07-15 08:35:40.799678+00	1
b9cef0c5-2378-4da1-9fdf-e99fb63c951c	5693b4b8fc81711149d8322b404dcdcdd68afa0f3b46f7d1b19cba5fe14a28e4	2026-07-15 14:35:18.598618+00	20260715_reconcile_gate7_boq_integrity_metadata		\N	2026-07-15 14:35:18.598618+00	0
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 8YFqvKH4qN82bqsqfBzkMPDnsEH3cCF1uIFAS3aKbHt5BFmKtRTnVexPy4YvIhD

