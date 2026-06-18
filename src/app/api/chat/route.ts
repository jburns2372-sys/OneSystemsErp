import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import pdfParse from 'pdf-parse';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('models/gemini-2.5-flash'),
    system: `You are the OneSystems ERP AI Data Center Assistant.
Your goal is to answer questions based on the ERP database and uploaded files.
You have access to several tools to search projects, workers, and read files.
Always try to use a tool to fetch real data before answering. Do not guess information.
If a user asks about an uploaded document, list the files first to get the URL, then read the file.`,
    messages,
    tools: {
      searchProjects: tool({
        description: 'Search for projects in the database. Returns project details like name, status, and budget.',
        parameters: z.object({
          query: z.string().optional().describe('Search term for project name or location.'),
          status: z.string().optional().describe('Filter by status (e.g. PLANNING, IN_PROGRESS, COMPLETED)'),
        }),
        execute: async ({ query, status }) => {
          const projects = await prisma.project.findMany({
            where: {
              ...(query ? { name: { contains: query } } : {}),
              ...(status ? { status } : {}),
            },
            take: 10,
            select: { id: true, name: true, status: true, contractAmount: true, location: true },
          });
          return projects;
        },
      }),
      searchWorkers: tool({
        description: 'Search for workers or employees in the database.',
        parameters: z.object({
          name: z.string().optional().describe('Name of the worker to search for.'),
        }),
        execute: async ({ name }) => {
          const workers = await prisma.worker.findMany({
            where: name ? {
              OR: [
                { firstName: { contains: name } },
                { lastName: { contains: name } },
              ],
            } : {},
            take: 10,
            select: { id: true, firstName: true, lastName: true, workerCategory: true, employmentStatus: true, department: true, dailyRate: true },
          });
          return workers;
        },
      }),
      listUploadedFiles: tool({
        description: 'List recently uploaded files in the system (Worker Documents, Expense Proofs, etc).',
        parameters: z.object({
          category: z.enum(['WORKER', 'EXPENSE', 'ALL']).optional().describe('Filter by category of documents'),
        }),
        execute: async ({ category }) => {
          const results = [];
          
          if (!category || category === 'WORKER' || category === 'ALL') {
            const workerDocs = await prisma.workerDocument.findMany({
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: { id: true, title: true, fileUrl: true, category: true, worker: { select: { firstName: true, lastName: true } } },
            });
            results.push(...workerDocs.map(d => ({ type: 'Worker Document', title: d.title, url: d.fileUrl, relatedTo: d.worker?.firstName + ' ' + d.worker?.lastName })));
          }

          if (!category || category === 'EXPENSE' || category === 'ALL') {
            const expenseDocs = await prisma.expenseProofFile.findMany({
              take: 10,
              orderBy: { uploadedAt: 'desc' },
              select: { id: true, fileName: true, fileUrl: true, expense: { select: { description: true, amount: true } } },
            });
            results.push(...expenseDocs.map(d => ({ type: 'Expense Proof', title: d.fileName, url: d.fileUrl, relatedTo: d.expense?.description })));
          }

          return results;
        },
      }),
      readUploadedFile: tool({
        description: 'Read the contents of an uploaded file (PDF or Text) from its URL to answer specific questions about it.',
        parameters: z.object({
          fileUrl: z.string().describe('The full URL of the file to read'),
        }),
        execute: async ({ fileUrl }) => {
          try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
            
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/pdf') || fileUrl.toLowerCase().endsWith('.pdf')) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const data = await pdfParse(buffer);
              return { success: true, text: data.text.substring(0, 8000) };
            } else {
              const text = await response.text();
              return { success: true, text: text.substring(0, 8000) };
            }
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
