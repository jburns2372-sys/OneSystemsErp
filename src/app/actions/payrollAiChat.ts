'use server';

import { prisma } from '@/lib/prisma';

export async function askPayrollAssistant(question: string) {
  try {
    // Basic AI intent recognition & data retrieval simulation.
    // In a production app, we would pass the question and the database schema to an LLM.

    const lowerQuestion = question.toLowerCase();
    
    // Simulate network delay for AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (lowerQuestion.includes('cash advance') || lowerQuestion.includes('advances')) {
      const ledgers = await prisma.deductionLedger.findMany({
        where: { type: 'CASH_ADVANCE', status: 'ACTIVE' },
        include: { worker: true }
      });
      
      if (ledgers.length === 0) return "Currently, there are no workers with active cash advances in the system.";
      
      let response = `There are ${ledgers.length} active cash advances:\n\n`;
      ledgers.forEach(l => {
        response += `- **${l.worker.firstName} ${l.worker.lastName}**: ₱${l.balance.toFixed(2)} remaining (deducting ₱${l.deductionPerPayroll}/cutoff).\n`;
      });
      return response;
    }

    if (lowerQuestion.includes('worker') || lowerQuestion.includes('employee')) {
      const activeWorkers = await prisma.worker.count({ where: { employmentStatus: 'ACTIVE' } });
      const inactiveWorkers = await prisma.worker.count({ where: { employmentStatus: 'INACTIVE' } });
      return `We currently have **${activeWorkers} active workers** in the directory, and ${inactiveWorkers} inactive workers.`;
    }

    if (lowerQuestion.includes('cutoff') || lowerQuestion.includes('period')) {
      const periods = await prisma.payrollPeriod.findMany({
        where: { status: 'FOR_REVIEW' }
      });
      if (periods.length === 0) return "There are no payroll periods currently pending review.";
      return `There is ${periods.length} payroll period currently pending your review and approval.`;
    }

    // Default fallback
    return `I am your AI Payroll Assistant. Based on the database, I can answer questions about active cash advances, worker counts, cutoff statuses, and specific payslip computations. How can I help you?`;

  } catch (error) {
    return "I'm sorry, I encountered an error connecting to the database.";
  }
}
