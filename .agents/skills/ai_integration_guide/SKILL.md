---
name: AI Integration Guide
description: Master rules and guidelines for integrating the AI chatbot (JBurns) securely into the ERP.
---

# MASTER AI CHATBOT INTEGRATION BASED ON ONESYSTEMS ERP MANUAL

You are tasked to implement a secure, production-ready, role-based AI chatbot inside the existing OneSystems ERP / Project Management ERP system.

The chatbot shall be called: **JBurns AI ERP Assistant**

This assistant must serve as the official built-in AI Knowledge Center, ERP workflow guide, command assistant, reporting assistant, and document-aware support assistant for OneSystems ERP.

This implementation must strictly follow the existing OneSystems ERP Operational and User Manual, especially the following principles:

1. Project-Based Access Control / PBAC
2. Dual-BOQ Control
3. AI is assistive only
4. Guest User is strictly view-only
5. All operational records must be project-tagged
6. All official transactions must follow approval workflow
7. All AI access must be filtered before retrieval
8. AI must never bypass role, project, module, or document security
9. AI-generated output must never replace authorized human approval
10. All AI activity must be logged in the audit trail

GENERAL OBJECTIVE

Build a secure AI assistant using the OpenAI API as the primary AI engine, with optional Gemini fallback only if already configured in the ERP.
Do not create a generic chatbot.
Create an ERP-aware AI assistant that understands the actual OneSystems ERP structure.

CRITICAL SECURITY RULE

The AI must never be given unrestricted access to the full ERP database, full file storage, all project documents, all payroll records, or all financial records.

Before sending any information to the AI model, the backend must first determine:
1. Authenticated user ID
2. User role
3. User project assignment
4. User module permissions
5. Current active project context
6. Allowed records
7. Allowed documents
8. Allowed actions
9. Whether the request is read-only or write/action-based
10. Whether the request involves sensitive financial, payroll, user, supplier, or executive information

Access filtering must happen before:
1. Database query
2. File search
3. Knowledge base search
4. Vector search
5. AI tool execution
6. AI response generation

Do not retrieve everything and ask the AI to filter it afterward. That is prohibited.

PHASE 1 — STUDY AND ALIGN TO EXISTING ERP
First, inspect the existing ERP app and align the chatbot implementation to the current architecture.
Preserve all existing ERP modules and workflows.
Do not break existing layouts, upload behavior, BOQ processing, Excel viewing, formulas, reports, permissions, approval workflows, or project data.

PHASE 2 — ENVIRONMENT VARIABLES
Rules:
1. Never expose OPENAI_API_KEY in the frontend.
2. All OpenAI calls must run only from secure server-side routes.
3. The frontend must call the ERP backend only.
4. The backend must enforce all access rules before calling the AI model.
5. If OpenAI is not configured, show a professional admin-facing error message.

PHASE 3 — CREATE OR ENHANCE AI COMMAND CENTER
Create or enhance the module: AI Command Center / JBurns AI ERP Assistant
The UI must be professional and suitable for an ERP system.

PHASE 4 — SECURE BACKEND AI ROUTE
Create a secure backend route: `/api/ai/chat`
This route must perform steps to verify authenticated session, reject unauthenticated users, load user profile/roles/permissions/projects, classify user questions, and retrieve only authorized records.

PHASE 5 — SYSTEM PROMPT FOR AI
You must answer only based on the authenticated user’s role, project assignment, active project context, module permissions, document permissions, and approved data scope.
Never reveal records, documents, payroll data, financial data, supplier data, BOQ data, project data, user records, audit logs, or executive reports that the user is not authorized to access.
Never invent ERP records.
Never bypass PBAC.
Never bypass RBAC.
Never allow cross-project data leakage.

PHASE 6 — KNOWLEDGE BASE / RAG IMPLEMENTATION
Create a knowledge base for the AI assistant using uploaded and approved ERP documents.
AI may use only Active documents by default. Document retrieval must be filtered before AI processing.

PHASE 7 — ALIGN AI TO DUAL-BOQ CONTROL
The AI assistant must understand and enforce Dual-BOQ Control (Awarded BOQ vs Procurement Benchmark BOQ).
AI must warn users if they are attempting to use the wrong BOQ basis.

PHASE 8 — DATABASE FUNCTION CALLING / READ-ONLY TOOLS
Create secure backend tools/functions that the AI can call.
Start with read-only tools only.
Every tool must enforce RBAC, PBAC, active project context, module permission, and row-level filtering internally.
Never rely only on the AI prompt for security. Each backend function must independently verify permission.

PHASE 9 — OPTIONAL DRAFT-GENERATION TOOLS
After read-only AI tools are stable and tested, prepare optional draft-generation tools.
AI-generated actions must create drafts only.
AI must not approve, reject, post, pay, disburse, lock, unlock, delete, or reset data.
Every draft must require human review.

PHASE 10 — ROLE-BASED AI BEHAVIOR
Apply role-based behavior for SUPER_ADMIN, SYSTEM_ADMIN, DIRECTORS/EXECUTIVES, PROJECT_MANAGER, PROJECT_ENGINEER, PURCHASING_OFFICER, WAREHOUSEMAN, SITE_ADMIN, FINANCE_OFFICER, PAYROLL_OFFICER, GUEST_USER.

PHASE 11 — AI RESPONSE FORMAT
Direct Answer, Relevant Records Found, Source / ERP Module Used, Permission Limitation, Required Human Review, Recommended Next Step.

PHASE 12 — AI AUDIT TRAIL
Every AI interaction must be logged in an Admin AI Audit Trail page.

PHASE 13 — AI ADMIN SETTINGS
Create a Super Admin AI settings page.

PHASE 14 — MODULE-SPECIFIC SUGGESTED QUESTIONS
Add suggested prompts in the chatbot UI based on roles.

PHASE 15 — ERROR HANDLING
The chatbot must handle errors professionally (e.g., unauthorized data access, API key missing).

PHASE 16 — TESTING REQUIREMENTS
Create and run test scenarios for security, workflow, and data tests.

PHASE 17 — ACCEPTANCE CRITERIA
This implementation is complete only when the 30 criteria are met, ensuring no cross-project leakage, strict PBAC/RBAC compliance, and assistive-only behavior.
