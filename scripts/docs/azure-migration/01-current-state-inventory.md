# Current State Inventory

## 1. Application Overview
- **Application**: OneSystemsERP
- **Frontend**: Next.js 16.2.7 (Turbopack) hosted on Vercel
- **Backend Runtime**: Vercel Server Actions (72+ action files) and Next.js Route Handlers (~70 endpoints)
- **Database**: PostgreSQL (Prisma ORM v6.19.3)
- **Storage**: AWS S3 (Client installed) and local/Vercel blobs
- **Authentication**: NextAuth 5.0.0-beta.31
- **AI Integrations**: OpenAI, Google GenAI
- **External Integrations**: Hikvision, UnionBank, Geotab FMS

## 2. Route Inventory (Sample)
| Route / Action | Current Runtime | Auth Required | Database Used | Migration Target |
|---|---|---|---|---|
| `src/app/actions/payrollActions.ts` | Vercel Server | Yes | `PayrollPeriod`, etc. | Azure Container Apps |
| `src/app/actions/financeActions.ts` | Vercel Server | Yes | `Expense`, etc. | Azure Container Apps |
| `api/projects/[id]/scheduling/ai` | Vercel API | Yes | `Project`, `ScheduleActivity` | Azure Container Apps |
| `api/cron/payment-polling` | Vercel Cron | Token | `PayrollBankLedger` | Azure Container Apps Scheduled Job |

## 3. Database Inventory
- **Engine**: PostgreSQL
- **Key Tables**: `User`, `Project`, `PurchaseOrder`, `MaterialRequest`, `Expense`, `PettyCashAccount`, `KnowledgeRecord`, `ScheduleActivity`
- **Audit Logging**: `AuditLog`, `KnowledgeAuditTrail`
- **Financial Integrity**: Full transactional double-entry mapping in ledgers.

## 4. Integration & Environment
- **Env Vars**: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`
- **Secrets Management**: Currently in Vercel Environment Variables.
