# Security Operations Center (SOC) Architecture

## Overview
The Security Operations Center (SOC) module transforms the standard `/admin/security` route into a full-scale threat monitoring, intelligence, and response dashboard tailored for the OneSystemsERP environment.

## Key Components

### 1. Database Schema (`prisma/schema.prisma`)
The core foundation includes enhanced models to track complex security metadata:
- **`SecurityEvent`**: Tracks detailed context, payload summaries, geographic locations, and system responses.
- **`ThreatIp`**: A repository of suspicious IP addresses tracked with severity ratings and countermeasure statuses.
- **`CountermeasureLog`**: Audit trails for automated and manual system defenses (e.g., Session Revocation, IP Blocks).
- **`SecurityIncident`**: Elevated security events that require manual investigation by a SOC Analyst or Admin.

### 2. Telemetry and Enrichment (`src/lib/securityLogger.ts`)
A dedicated logging pipeline ensures every critical action within the ERP is captured.
- **GeoIP Enrichment**: Resolves IP addresses to approximate locations, supporting visual threat mapping.
- **Threat Specific Logging**: Dedicated helpers like `logAIThreat`, `logFileThreat`, and `logSensitiveExport` parse complex threats and log them under appropriate categories (AI, FILE, DATA_EXFILTRATION).

### 3. Frontend Dashboard (`src/app/admin/security/components/`)
A highly visual, premium interface designed for executives and DevSecOps engineers.
- **`LiveThreatMap`**: Built with React-Leaflet to plot events geographically in real-time.
- **`LiveThreatFeed`**: A chronological tabular view of all security events with contextual badges.
- **`SystemCountermeasures`**: A live-feed sidebar showing automated defenses executed by the ERP.
- **`EventDetailDrawer`**: Deep-dive forensic view showing complete request metadata, identity context, and network intelligence for a selected event.

## Security Controls
- **Access Check**: The dashboard requires explicit `IS_ADMIN` privileges or `SYSTEM_SETTINGS` View access via the `checkSocAccess` server action. Unauthorized attempts to access the dashboard are immediately logged as `UNAUTHORIZED_MODULE_ACCESS`.

## Development Tools
- **Seeder (`seed-security-events.ts`)**: Generates simulated, multi-category threat data to assist developers in testing UI components without generating genuine security incidents.
