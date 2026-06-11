import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { prisma } from '@/lib/prisma';
import { getDashboardStats } from '@/app/actions/project';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Fetch live ERP statistics
  const stats = await getDashboardStats();
  const erpStatsContext = `
--- LIVE ERP STATISTICS ---
Total Active Projects: ${stats.totalProjects}
Total Contract Budget: ₱${stats.totalBudget.toLocaleString()}
Total Expenses: ₱${stats.totalExpenses.toLocaleString()}
Outstanding Payables: ₱${stats.totalPayables.toLocaleString()}
System Users: ${stats.totalUsers}
Pending Material Requests: ${stats.pendingMRs}
Expected Deliveries: ${stats.expectedDeliveries}
Pending AI Overrides: ${stats.pendingAIOverrides}
`;

  // 2. Fetch Active Master Policies
  const references = await prisma.notebookReference.findMany({
    where: { status: 'ACTIVE' },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
  });
  let policyContext = '--- MANDATORY COMPANY POLICIES ---\n';
  for (const ref of references) {
    if (ref.versions && ref.versions.length > 0) {
       policyContext += `[Policy: ${ref.title}]\n${ref.versions[0].extractedText?.substring(0, 3000)}\n\n`;
    }
  }

  // 3. Fetch Active Inventory Stocks
  const stocks = await prisma.consolidatedBOQItem.findMany({ take: 50 });
  let inventoryContext = '--- SITE STOCKS & INVENTORY ---\n';
  if (stocks.length === 0) {
    inventoryContext += 'No delivered materials in stock.\n';
  } else {
    for (const stock of stocks) {
      if (stock.deliveredQty > 0) {
        inventoryContext += `- ${stock.description}: Awarded=${stock.quantity} ${stock.unit}, Delivered=${stock.deliveredQty}, Consumed=${stock.consumedQty}, OnHand=${stock.deliveredQty - stock.consumedQty}\n`;
      }
    }
  }

  // 4. Fetch Payroll / Workers
  const workers = await prisma.worker.findMany({ take: 50 });
  let payrollContext = '--- ACTIVE WORKERS & PAYROLL ---\n';
  if (workers.length === 0) {
    payrollContext += 'No active workers found.\n';
  } else {
    for (const w of workers) {
      payrollContext += `- ${w.firstName} ${w.lastName} (${w.designation || 'Worker'}): Rate=₱${w.dailyRate}/day, Status=${w.employmentStatus}\n`;
    }
  }

  // 5. Fetch Finance (Petty Cash & Projects)
  const projects = await prisma.project.findMany({ take: 10 });
  let projectContext = '--- ACTIVE PROJECTS ---\n';
  for (const p of projects) {
    projectContext += `- ${p.name} (${p.status}): Budget=₱${p.contractBudget}\n`;
  }

  const systemPrompt = `You are the specialized AI Command Center Autonomous Agent for the company's Enterprise Resource Planning (ERP) system.
You have real-time access to the company's operational statistics, inventory, payroll, and policies.
Your job is to answer questions directly, accurately, and professionally.

${erpStatsContext}

${inventoryContext}

${payrollContext}

${projectContext}

${policyContext}

INSTRUCTIONS:
1. If the user asks about the status of the company (e.g., "What is our budget?"), use the LIVE ERP STATISTICS to answer.
2. If the user asks about policies, use the MANDATORY COMPANY POLICIES to answer.
3. If the user asks about inventory, workers, or projects, use the injected tables above.
4. Keep your answers concise, professional, and formatted in markdown.
`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
