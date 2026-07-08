// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING SOC SEED ---');

  // ──────────────────────────────────────────────────────────────
  // 1. Seed Security Simulation Scenarios
  // ──────────────────────────────────────────────────────────────
  const scenarios = [
    {
      name: 'SQL Injection via Material Request Form',
      description: 'Simulates a SQL injection attack via the MRF creation endpoint to test database query sanitization.',
      category: 'Injection',
      severity: 'Critical',
      targetModule: 'PROCUREMENT',
      targetRoute: '/api/material-requests',
      simulatedRole: 'GUEST_USER',
      simulatedSourceIp: '185.220.101.45',
      simulatedCountry: 'Russia',
      simulatedCity: 'Moscow',
      latitude: 55.7558,
      longitude: 37.6176,
      mitreTechnique: 'T1190 - Exploit Public-Facing Application',
      owaspCategory: 'A03:2021 - Injection',
      expectedDetection: 'Malicious payload detected in request body',
      expectedCountermeasure: 'Request blocked and IP flagged',
      passFailCriteria: 'Event must be created with status BLOCKED within 2 seconds',
    },
    {
      name: 'Brute Force Login Attack',
      description: 'Simulates repeated failed login attempts to detect brute-force attack patterns and trigger rate-limiting.',
      category: 'Authentication',
      severity: 'High',
      targetModule: 'SYSTEM_SETTINGS',
      targetRoute: '/api/auth/login',
      simulatedRole: 'UNKNOWN',
      simulatedSourceIp: '203.0.113.55',
      simulatedCountry: 'China',
      simulatedCity: 'Beijing',
      latitude: 39.9042,
      longitude: 116.4074,
      mitreTechnique: 'T1110 - Brute Force',
      owaspCategory: 'A07:2021 - Identification and Authentication Failures',
      expectedDetection: '10+ failed logins from same IP in 60 seconds',
      expectedCountermeasure: 'Temporary IP block and admin alert sent',
      passFailCriteria: 'Rate limit must trigger before 15th failed attempt',
    },
    {
      name: 'Unauthorized BOQ Modification',
      description: 'Simulates a low-privilege user attempting to directly modify a locked Awarded BOQ record.',
      category: 'Authorization',
      severity: 'Critical',
      targetModule: 'PROJECTS',
      targetRoute: '/api/projects/[id]/boq',
      simulatedRole: 'FOREMAN',
      simulatedSourceIp: '192.168.1.100',
      simulatedCountry: 'Philippines',
      simulatedCity: 'Manila',
      latitude: 14.5995,
      longitude: 120.9842,
      mitreTechnique: 'T1078 - Valid Accounts',
      owaspCategory: 'A01:2021 - Broken Access Control',
      expectedDetection: 'Permission denied: FOREMAN cannot modify locked BOQ',
      expectedCountermeasure: 'Request rejected, event logged, PM notified',
      passFailCriteria: 'RBAC guard must return 403 Forbidden',
    },
    {
      name: 'AI Override Tampering',
      description: 'Simulates an attempt to approve an AI validation override without proper authority.',
      category: 'AI',
      severity: 'High',
      targetModule: 'AI_VALIDATION',
      targetRoute: '/api/ai/overrides/approve',
      simulatedRole: 'PURCHASING_OFFICER',
      simulatedSourceIp: '192.168.1.110',
      simulatedCountry: 'Philippines',
      simulatedCity: 'Cebu',
      latitude: 10.3157,
      longitude: 123.8854,
      mitreTechnique: 'T1565 - Data Manipulation',
      owaspCategory: 'A01:2021 - Broken Access Control',
      expectedDetection: 'PURCHASING_OFFICER attempted AI override approval — role not permitted',
      expectedCountermeasure: 'Action blocked, security event created, Director notified',
      passFailCriteria: 'Only PROJECT_DIRECTOR or SUPER_ADMIN may approve AI overrides',
    },
    {
      name: 'Malicious File Upload via Documents',
      description: 'Simulates a user uploading a file with a dangerous extension (.exe, .sh) disguised as a PDF.',
      category: 'FILE',
      severity: 'High',
      targetModule: 'DOCUMENTS',
      targetRoute: '/api/documents/upload',
      simulatedRole: 'SITE_ADMIN',
      simulatedSourceIp: '10.0.0.55',
      simulatedCountry: 'Philippines',
      simulatedCity: 'Davao',
      latitude: 7.1907,
      longitude: 125.4553,
      mitreTechnique: 'T1566.001 - Spearphishing Attachment',
      owaspCategory: 'A04:2021 - Insecure Design',
      expectedDetection: 'Blocked file with extension .exe uploaded as invoice.pdf',
      expectedCountermeasure: 'File quarantined, upload rejected, user warned',
      passFailCriteria: 'File extension validation must reject non-whitelisted file types',
    },
    {
      name: 'Cross-Site Request Forgery on PO Approval',
      description: 'Simulates a CSRF attack designed to force a Director to approve a fraudulent Purchase Order.',
      category: 'CSRF',
      severity: 'Medium',
      targetModule: 'PROCUREMENT',
      targetRoute: '/api/purchase-orders/[id]/approve',
      simulatedRole: 'PROJECT_DIRECTOR',
      simulatedSourceIp: '198.51.100.77',
      simulatedCountry: 'United States',
      simulatedCity: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      mitreTechnique: 'T1059 - Command and Scripting Interpreter',
      owaspCategory: 'A01:2021 - Broken Access Control',
      expectedDetection: 'CSRF token mismatch detected on PO approval',
      expectedCountermeasure: 'Request rejected with 403, token invalidated',
      passFailCriteria: 'CSRF protection must reject cross-origin state-changing requests',
    },
    {
      name: 'Session Hijacking Attempt',
      description: 'Simulates use of a stolen session cookie from a different IP address to access the ERP.',
      category: 'Authentication',
      severity: 'Critical',
      targetModule: 'SYSTEM_SETTINGS',
      targetRoute: '/api/auth/session',
      simulatedRole: 'PROJECT_MANAGER',
      simulatedSourceIp: '45.33.32.156',
      simulatedCountry: 'Germany',
      simulatedCity: 'Frankfurt',
      latitude: 50.1109,
      longitude: 8.6821,
      mitreTechnique: 'T1539 - Steal Web Session Cookie',
      owaspCategory: 'A07:2021 - Identification and Authentication Failures',
      expectedDetection: 'Session IP mismatch: Original 192.168.1.x vs New 45.33.32.x',
      expectedCountermeasure: 'Session terminated, user forced to re-authenticate',
      passFailCriteria: 'IP binding must detect session used from different IP range',
    },
    {
      name: 'Privilege Escalation via Role Manipulation',
      description: 'Simulates a user attempting to modify their own role cookie to gain SUPER_ADMIN access.',
      category: 'Authorization',
      severity: 'Critical',
      targetModule: 'SYSTEM_SETTINGS',
      targetRoute: '/api/users/[id]/role',
      simulatedRole: 'GUEST_USER',
      simulatedSourceIp: '192.168.1.250',
      simulatedCountry: 'Philippines',
      simulatedCity: 'Quezon City',
      latitude: 14.6760,
      longitude: 121.0437,
      mitreTechnique: 'T1548 - Abuse Elevation Control Mechanism',
      owaspCategory: 'A01:2021 - Broken Access Control',
      expectedDetection: 'GUEST_USER attempted to POST to role update endpoint',
      expectedCountermeasure: 'Request rejected, account flagged, admin notified',
      passFailCriteria: 'Only SUPER_ADMIN can modify user roles',
    },
  ];

  for (const scenario of scenarios) {
    await prisma.securitySimulationScenario.upsert({
      where: { name: scenario.name } as any,
      update: scenario,
      create: scenario,
    }).catch(async () => {
      // If no unique constraint on name, just find or create
      const existing = await prisma.securitySimulationScenario.findFirst({ where: { name: scenario.name } });
      if (!existing) {
        return prisma.securitySimulationScenario.create({ data: scenario });
      }
      return existing;
    });
  }

  console.log(`✅ Seeded ${scenarios.length} simulation scenarios.`);

  // ──────────────────────────────────────────────────────────────
  // 2. Seed Realistic Baseline Security Events (last 7 days)
  // ──────────────────────────────────────────────────────────────
  const user = await prisma.user.findFirst();
  
  const baselineEvents = [
    { severity: 'Low', category: 'Authentication', threatType: 'FAILED_LOGIN', sourceIp: '192.168.1.55', country: 'Philippines', city: 'Manila', latitude: 14.5995, longitude: 120.9842, module: 'SYSTEM_SETTINGS', status: 'DETECTED', result: 'ALLOWED', blocked: false, daysAgo: 6, userEmail: 'unknown@attacker.com', userRole: 'UNKNOWN', systemResponse: 'Logged failed attempt', threatDetected: 'Single failed login' },
    { severity: 'Low', category: 'Authentication', threatType: 'FAILED_LOGIN', sourceIp: '192.168.1.55', country: 'Philippines', city: 'Manila', latitude: 14.5995, longitude: 120.9842, module: 'SYSTEM_SETTINGS', status: 'DETECTED', result: 'ALLOWED', blocked: false, daysAgo: 6, userEmail: 'unknown@attacker.com', userRole: 'UNKNOWN', systemResponse: 'Logged failed attempt', threatDetected: 'Single failed login' },
    { severity: 'Low', category: 'Authentication', threatType: 'FAILED_LOGIN', sourceIp: '192.168.1.55', country: 'Philippines', city: 'Manila', latitude: 14.5995, longitude: 120.9842, module: 'SYSTEM_SETTINGS', status: 'DETECTED', result: 'ALLOWED', blocked: false, daysAgo: 6, userEmail: 'unknown@attacker.com', userRole: 'UNKNOWN', systemResponse: 'Logged failed attempt', threatDetected: 'Single failed login' },
    { severity: 'Medium', category: 'Authorization', threatType: 'UNAUTHORIZED_MODULE_ACCESS', sourceIp: '192.168.1.80', country: 'Philippines', city: 'Cebu', latitude: 10.3157, longitude: 123.8854, module: 'PROJECTS', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 5, userEmail: 'guest.user@onesystems.com', userRole: 'GUEST_USER', systemResponse: 'Access denied by RBAC', threatDetected: 'Unauthorized module access' },
    { severity: 'High', category: 'Injection', threatType: 'SQL_INJECTION_ATTEMPT', sourceIp: '185.220.101.45', country: 'Russia', city: 'Moscow', latitude: 55.7558, longitude: 37.6176, module: 'PROCUREMENT', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 4, userEmail: null, userRole: 'UNKNOWN', systemResponse: 'Payload sanitized and blocked', threatDetected: 'SQL injection in request body' },
    { severity: 'Low', category: 'FILE', threatType: 'SUSPICIOUS_FILE_TYPE', sourceIp: '192.168.1.102', country: 'Philippines', city: 'Quezon City', latitude: 14.6760, longitude: 121.0437, module: 'DOCUMENTS', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 3, userEmail: 'site.admin@onesystems.com', userRole: 'SITE_ADMIN', systemResponse: 'File upload rejected', threatDetected: 'Attempted upload of .exe file' },
    { severity: 'Critical', category: 'Authorization', threatType: 'PRIVILEGE_ESCALATION_ATTEMPT', sourceIp: '203.0.113.99', country: 'China', city: 'Shanghai', latitude: 31.2304, longitude: 121.4737, module: 'SYSTEM_SETTINGS', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 2, userEmail: null, userRole: 'GUEST_USER', systemResponse: 'Escalation blocked, account flagged', threatDetected: 'Role parameter tampering detected' },
    { severity: 'Medium', category: 'Authentication', threatType: 'UNAUTHENTICATED_ACCESS', sourceIp: '45.33.32.156', country: 'Germany', city: 'Frankfurt', latitude: 50.1109, longitude: 8.6821, module: 'FINANCE', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 1, userEmail: null, userRole: 'UNKNOWN', systemResponse: 'Session rejected, re-auth required', threatDetected: 'Session IP mismatch' },
    { severity: 'Low', category: 'Authentication', threatType: 'FAILED_LOGIN', sourceIp: '192.168.1.77', country: 'Philippines', city: 'Makati', latitude: 14.5547, longitude: 121.0244, module: 'SYSTEM_SETTINGS', status: 'DETECTED', result: 'ALLOWED', blocked: false, daysAgo: 0, userEmail: 'test@onesystems.com', userRole: 'UNKNOWN', systemResponse: 'Logged failed attempt', threatDetected: 'Single failed login' },
    { severity: 'High', category: 'AI', threatType: 'AI_OVERRIDE_ATTEMPT', sourceIp: '192.168.1.110', country: 'Philippines', city: 'Cebu', latitude: 10.3157, longitude: 123.8854, module: 'AI_VALIDATION', status: 'BLOCKED', result: 'BLOCKED', blocked: true, daysAgo: 0, userEmail: 'purchasing@onesystems.com', userRole: 'PURCHASING_OFFICER', systemResponse: 'Action blocked, Director notified', threatDetected: 'PURCHASING_OFFICER attempted AI override approval' },
  ];

  let eventCount = 0;
  for (const evt of baselineEvents) {
    const ts = new Date();
    ts.setDate(ts.getDate() - evt.daysAgo);
    ts.setHours(Math.floor(Math.random() * 8) + 8); // 8AM-4PM
    
    await prisma.securityEvent.create({
      data: {
        timestamp: ts,
        severity: evt.severity,
        category: evt.category,
        threatType: evt.threatType,
        sourceIp: evt.sourceIp,
        country: evt.country,
        city: evt.city,
        latitude: evt.latitude,
        longitude: evt.longitude,
        module: evt.module,
        status: evt.status,
        result: evt.result,
        blocked: evt.blocked,
        userEmail: evt.userEmail,
        userRole: evt.userRole,
        userId: user?.id,
        systemResponse: evt.systemResponse,
        threatDetected: evt.threatDetected,
        simulated: false,
        endpoint: '/simulated/baseline',
        actionAttempted: evt.threatType,
      }
    });
    eventCount++;
  }

  console.log(`✅ Seeded ${eventCount} baseline security events.`);

  // ──────────────────────────────────────────────────────────────
  // 3. Create 2 Active Incidents from Critical Events
  // ──────────────────────────────────────────────────────────────
  await prisma.securityIncident.createMany({
    data: [
      {
        title: 'Critical: Privilege Escalation from External IP',
        description: 'A GUEST_USER account was detected attempting role parameter tampering from a Chinese IP (203.0.113.99). The attempt was blocked but warrants investigation into whether this was a compromised guest account.',
        severity: 'Critical',
        status: 'Open',
        affectedModule: 'SYSTEM_SETTINGS',
        sourceIp: '203.0.113.99',
        countermeasure: 'Account temporarily restricted. Password reset forced.',
        result: 'Mitigated',
        assignedTo: user?.id,
        timelineJson: JSON.stringify([
          { time: new Date(Date.now() - 2 * 86400000).toISOString(), event: 'Threat Detected', details: 'Role parameter tampering detected from external IP' },
          { time: new Date(Date.now() - 2 * 86400000 + 30000).toISOString(), event: 'Countermeasure Applied', details: 'Escalation blocked, account flagged' },
          { time: new Date(Date.now() - 86400000).toISOString(), event: 'Under Investigation', details: 'SOC team investigating account origin' },
        ]),
        evidenceJson: JSON.stringify({ sourceIp: '203.0.113.99', country: 'China', threatType: 'PRIVILEGE_ESCALATION_ATTEMPT' }),
      },
      {
        title: 'High: AI Override Unauthorized Approval Attempt',
        description: 'A PURCHASING_OFFICER attempted to directly approve an AI validation override — a privilege reserved for PROJECT_DIRECTOR and SUPER_ADMIN only. The action was blocked, but this indicates possible role misunderstanding or intentional bypass attempt.',
        severity: 'High',
        status: 'Open',
        affectedModule: 'AI_VALIDATION',
        sourceIp: '192.168.1.110',
        countermeasure: 'Action blocked. Director alerted via system notification.',
        result: 'Mitigated',
        assignedTo: user?.id,
        timelineJson: JSON.stringify([
          { time: new Date().toISOString(), event: 'Threat Detected', details: 'PURCHASING_OFFICER attempted AI override approval' },
          { time: new Date().toISOString(), event: 'Countermeasure Applied', details: 'Action blocked, Director notified' },
        ]),
        evidenceJson: JSON.stringify({ sourceIp: '192.168.1.110', country: 'Philippines', threatType: 'AI_OVERRIDE_ATTEMPT', userRole: 'PURCHASING_OFFICER' }),
      },
    ]
  });
  console.log('✅ Seeded 2 active security incidents.');

  console.log('--- SOC SEED COMPLETED SUCCESSFULLY ---');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
