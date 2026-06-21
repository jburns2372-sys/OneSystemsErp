'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

async function verifyAccess() {
  const userId = await getUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  
  const effectiveRole = (simulatedRole && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS')) 
    ? simulatedRole 
    : user.role;

  const allowedRoles = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'PROJECT_DIRECTOR', 'DIRECTORS'];

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error('Unauthorized: Executive Intelligence access required');
  }
  return user;
}

export async function processExecutiveQuery(query: string): Promise<string> {
  await verifyAccess();
  
  const cookieStore = await cookies();
  const currentProjectId = cookieStore.get('executive_projectId')?.value || 'ALL';

  const q = query.toLowerCase();

  // Keyword Matching Logic

  // 1. Contract / Budget Queries
  if (q.includes('contract') || q.includes('budget') || q.includes('how much') || q.includes('amount')) {
    const projectFilter: any = { status: { in: ['ACTIVE', 'ONGOING', 'STARTED'] } };
    if (currentProjectId !== 'ALL') {
      projectFilter.id = currentProjectId;
    }

    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: { name: true, contractAmount: true }
    });
    
    if (projects.length === 0) return 'There are currently no active projects with recorded contract amounts in the database.';
    
    let total = 0;
    let response = 'Here are the contract amounts for the active projects in the database:\n\n';
    
    projects.forEach(p => {
      total += p.contractAmount;
      response += `- **${p.name}**: ₱${p.contractAmount.toLocaleString()}\n`;
    });
    
    response += `\n**Total Active Portfolio Value:** ₱${total.toLocaleString()}`;
    return response;
  }

  // 2. Risk / Delays / Validation Queries
  if (q.includes('risk') || q.includes('delay') || q.includes('validate') || q.includes('overbilling') || q.includes('validation')) {
    const scoreFilter: any = {};
    if (currentProjectId !== 'ALL') {
      scoreFilter.projectId = currentProjectId;
    }

    const scores = await prisma.projectValidationScore.findMany({
      where: scoreFilter,
      include: { project: { select: { name: true } } },
      orderBy: { validationConfidenceScore: 'asc' } // Lowest score first
    });

    if (scores.length === 0) return 'I could not find any AI validation records in the database.';

    const highRisk = scores.filter(s => s.riskLevel === 'RED' || s.riskLevel === 'ORANGE' || s.riskLevel === 'YELLOW');
    
    if (highRisk.length === 0) {
      return 'All projects are currently maintaining a GREEN validation status with no immediate risks detected in the system.';
    }

    let response = 'Based on the latest database validation runs, here are the projects with notable risk levels:\n\n';
    highRisk.forEach(s => {
      response += `- **${s.project.name}**: Risk Level **${s.riskLevel}**. AI Confidence Score: **${s.validationConfidenceScore.toFixed(1)}%**. Evidence completeness is at ${s.evidenceCompletenessScore.toFixed(0)}%.\n`;
    });

    if (q.includes('overbilling')) {
      response += '\nIf there is a high variance between reported progress and AI validated progress with a YELLOW or RED risk level, there is a risk of overbilling. I recommend holding further disbursements for these specific projects pending a site inspection.';
    }
    return response;
  }

  // Fallback for unrelated queries to prevent hallucination
  return "I cannot find factual data related to your query in the ERP database. As an AI strictly integrated with this project management system, I only provide answers based on recorded budgets, validations, and project statuses.";
}
