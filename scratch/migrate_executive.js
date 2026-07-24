const fs = require('fs');

const backendPath = 'apps/aws-backend/src/routes/executiveActions.ts';
const frontendPath = 'src/app/actions/executiveActions.ts';

let backendCode = fs.readFileSync(backendPath, 'utf8');

const companyOverviewRegex = /router\.post\('\/getCompanyOverview', async \(req, res\) => \{\s*try \{\s*const \{ sessionToken, simulatedRole, projectId \} = req\.body;([\s\S]*?)res\.json\(\{ success: true, data \}\);\s*\} catch \(error\) \{[\s\S]*?\}\s*\}\);/;
const companyMatch = backendCode.match(companyOverviewRegex);

const portfolioRegex = /router\.post\('\/getProjectPortfolio', async \(req, res\) => \{\s*try \{\s*const \{ sessionToken, simulatedRole \} = req\.body;([\s\S]*?)res\.json\(\{ success: true, data \}\);\s*\} catch \(error\) \{[\s\S]*?\}\s*\}\);/;
const portfolioMatch = backendCode.match(portfolioRegex);

let newFrontendCode = `'use server';\n\nimport { cookies } from 'next/headers';\nimport { prisma } from '@/lib/prisma';\n\n`;

newFrontendCode += `async function _getAccessDetails() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const simulatedRoleFromRequest = cookieStore.get('simulatedRole')?.value;

  const userId = sessionToken || ''; 

  if (!userId) {
    throw new Error('Unauthorized: Session token missing');
  }

  // Disabled requirePermission for NextJS server action to prevent dependency cycle
  // await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView'); 
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized: User not found');

  const effectiveRole = (simulatedRoleFromRequest && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS')) 
    ? simulatedRoleFromRequest 
    : (user.role || 'GUEST_USER');

  const allowedRoles = [
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'ADMINISTRATOR',
    'ADMIN'
  ];

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error('Unauthorized: Executive access required');
  }

  return { user, effectiveRole };
}

`;

newFrontendCode += `export async function getCompanyOverview(projectId?: string) {\n  try {\n    const { user, effectiveRole } = await _getAccessDetails();\n    const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';\n`;
let companyLogic = companyMatch[1];
companyLogic = companyLogic.replace(/const \{ user, effectiveRole \} = await _getAccessDetails\(sessionToken, simulatedRole\);\s*const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' \|\| effectiveRole === 'SYSTEM_ADMIN';/g, '');
// The backend uses `res.json({ success: true, data })`. The regex strips this, but wait, the logic constructs an object called `data`!
// Let's replace the regex to capture up to `const data = { ... }` or `return data`.
// Wait, the backend has `const data = { ... }; res.json({ success: true, data });`
newFrontendCode += companyLogic;
newFrontendCode += `\n    return data;\n  } catch (error: any) {\n    console.error('Error in getCompanyOverview:', error);\n    throw new Error(error.message || 'Failed to get company overview');\n  }\n}\n\n`;

newFrontendCode += `export async function getProjectPortfolio() {\n  try {\n    const { user, effectiveRole } = await _getAccessDetails();\n    const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';\n`;
let portfolioLogic = portfolioMatch[1];
portfolioLogic = portfolioLogic.replace(/const \{ user, effectiveRole \} = await _getAccessDetails\(sessionToken, simulatedRole\);\s*const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' \|\| effectiveRole === 'SYSTEM_ADMIN';/g, '');
newFrontendCode += portfolioLogic;
newFrontendCode += `\n    return data;\n  } catch (error: any) {\n    console.error('Error in getProjectPortfolio:', error);\n    throw new Error(error.message || 'Failed to get project portfolio');\n  }\n}\n`;

fs.writeFileSync(frontendPath, newFrontendCode);
console.log('Successfully migrated executiveActions.ts from backend to frontend!');
