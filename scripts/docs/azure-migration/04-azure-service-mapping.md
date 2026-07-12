# Recommended Azure Service Mapping

| Current Vercel / AWS Component | Target Azure Service | Justification |
|---|---|---|
| Next.js Server Actions / API Routes | Azure Container Apps | Serverless scaling, deep VNet integration, zero idle cost option, native Docker support. |
| Vercel Postgres (Neon) | Azure Database for PostgreSQL Flexible Server | Direct PostgreSQL compatibility, high availability, native VNet injection, Point-in-Time Restore. |
| AWS S3 / Vercel Blob | Azure Blob Storage | Native ecosystem integration, private link capability, tiered lifecycle management. |
| Vercel Cron Jobs | Azure Container Apps Jobs | Fully managed scheduled execution running the exact same container image. |
| AWS SQS / Background Jobs | Azure Service Bus | Enterprise message broker, dead-letter queues, exactly-once delivery guarantees for financial syncs. |
| Vercel Environment Variables | Azure Key Vault | Hardware security modules, managed identities, dynamic secret rotation. |
| Vercel Analytics / Logs | Azure Log Analytics + App Insights | Centralized correlation IDs, deep application performance monitoring. |
| Direct API access | Azure API Management | Optional initially, recommended for rate limiting, JWT validation, and API versioning as traffic scales. |
