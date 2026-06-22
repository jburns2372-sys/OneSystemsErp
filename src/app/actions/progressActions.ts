// @ts-nocheck
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const PDFParse = require('pdf-parse');

export async function parseAccomplishmentReport(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const arrayBuffer = await file.arrayBuffer();
    
    let text = "";
    
    // Check if it's a plain text file or PDF
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      text = new TextDecoder("utf-8").decode(arrayBuffer);
    } else {
      // Extract text from PDF using PDFParse class
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      text = textResult.text;
    }

    // Search for percentage patterns like "90%" or "Accomplishment: 90%"
    // We'll look for any percentage and return the first realistic one, or the max one.
    const percentMatches = text.match(/(\d+(?:\.\d+)?)\s*%/g);
    
    if (percentMatches && percentMatches.length > 0) {
      // Clean up matches and convert to numbers
      const percentages = percentMatches.map(m => parseFloat(m.replace('%', '').trim()));
      // Filter out invalid or 100% if we want to be safe, but let's just grab the max percentage found
      const validPercentages = percentages.filter(p => !isNaN(p) && p <= 100);
      
      if (validPercentages.length > 0) {
        // Return the highest percentage found in the document (assuming it's the final accomplishment)
        const extractedPercent = Math.max(...validPercentages);
        return { success: true, percent: extractedPercent };
      }
    }

    // Fallback if no percentage found
    return { success: false, error: 'Could not extract accomplishment percentage from the document.' };
  } catch (error: any) {
    console.error("Parse Report Error:", error);
    return { success: false, error: error.message };
  }
}
import { cookies } from 'next/headers';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function getPackageProgressHubData(packageId: string) {
  try {
    const pkg = await prisma.subcontractPackage.findUnique({
      where: { id: packageId },
      include: {
        subcontractor: {
          include: {
            subcontractorBOQItems: {
              include: { awardedBoqItem: true }
            }
          }
        },
        accomplishments: {
          orderBy: { createdAt: 'desc' }
        },
        billings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    return { success: true, data: pkg };
  } catch (error: any) {
    console.error('Error fetching progress hub data:', error);
    return { success: false, error: error.message };
  }
}

export async function getJobOrderProgressHubData(jobOrderId: string) {
  try {
    const jo = await prisma.jobOrder.findUnique({
      where: { id: jobOrderId },
      include: {
        subcontractor: true,
        subcontractAccomplishments: {
          orderBy: { createdAt: 'desc' }
        },
        subcontractBillings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!jo) {
      return { success: false, error: 'Job Order not found' };
    }

    return { success: true, data: jo };
  } catch (error: any) {
    console.error('Error fetching job order progress hub data:', error);
    return { success: false, error: error.message };
  }
}

export async function createAccomplishment(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;
    let inspectionReport = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'accomplishments');
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      inspectionReport = `/uploads/accomplishments/${fileName}`;
    }

    const packageId = formData.get('packageId') as string | null;
    const jobOrderId = formData.get('jobOrderId') as string | null;
    const isJobOrder = formData.get('isJobOrder') === 'true';
    const workDescription = formData.get('workDescription') as string;
    const prevPercent = parseFloat(formData.get('prevPercent') as string) || 0;
    const currentPercent = parseFloat(formData.get('currentPercent') as string) || 0;
    const cumulativePercent = parseFloat(formData.get('cumulativePercent') as string) || 0;
    const itemBreakdown = formData.get('itemBreakdown') ? JSON.parse(formData.get('itemBreakdown') as string) : null;

    const result = await prisma.subcontractAccomplishment.create({
      data: {
        ...(packageId ? { packageId } : {}),
        ...(jobOrderId ? { jobOrderId } : {}),
        workDescription,
        location: '',
        prevPercent,
        currentPercent,
        cumulativePercent,
        prevQty: 0,
        currentQty: 0,
        totalQty: 0,
        remainingQty: 0,
        // itemBreakdown,
        inspectionReport,
        status: 'FOR_REVIEW'
      }
    });
    
    if (isJobOrder && jobOrderId) {
      revalidatePath(`/job-orders/${jobOrderId}/progress-hub`);
    } else if (packageId) {
      revalidatePath(`/subcontracting/progress-hub/${packageId}`);
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function approveAccomplishment(id: string, targetId: string, isJobOrder: boolean = false) {
  try {
    const res = await prisma.subcontractAccomplishment.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
    
    if (isJobOrder) {
      revalidatePath(`/job-orders/${targetId}/progress-hub`);
    } else {
      revalidatePath(`/subcontracting/progress-hub/${targetId}`);
    }
    
    return { success: true, data: res };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function createBilling(data: any) {
  try {
    const billingNumber = `INV-${Date.now()}`;
    const result = await prisma.subcontractBilling.create({
      data: {
        billingNumber,
        projectId: data.projectId,
        subcontractorId: data.subcontractorId,
        ...(data.packageId ? { packageId: data.packageId } : {}),
        ...(data.jobOrderId ? { jobOrderId: data.jobOrderId } : {}),
        contractAmount: data.contractAmount,
        previousGross: data.previousGross || 0,
        currentGross: data.currentGross || 0,
        totalGross: data.totalGross || 0,
        remainingBalance: data.remainingBalance || 0,
        netPayable: data.netPayable || 0,
        retentionDeduction: data.retentionDeduction || 0,
        whtDeduction: data.whtDeduction || 0,
        mobilizationDeduction: data.mobilizationDeduction || 0,
        status: 'DRAFT', // Starts as draft per new workflow
      }
    });
    
    if (data.isJobOrder && data.jobOrderId) {
      revalidatePath(`/job-orders/${data.jobOrderId}/progress-hub`);
    } else if (data.packageId) {
      revalidatePath(`/subcontracting/progress-hub/${data.packageId}`);
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Create billing error:', error);
    return { success: false, error: error.message };
  }
}

export async function processPayment(billingId: string, packageId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) throw new Error('Unauthorized');
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!user) throw new Error('Unauthorized');

    const result = await prisma.$transaction(async (tx) => {
      const billing = await tx.subcontractBilling.update({
        where: { id: billingId },
        data: {
          paymentStatus: 'PAID',
          status: 'APPROVED'
        },
        include: {
          subcontractor: true,
          package: true
        }
      }) as any;

      // Create Expense Ledger Entry
      await tx.expense.create({
        data: {
          projectId: billing.projectId,
          amount: billing.netPayable,
          totalBreakdownAmount: billing.netPayable,
          date: new Date(),
          category: 'SUBCONTRACT_PAYMENT',
          description: `Subcontract Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`,
          receiptRef: billing.billingNumber,
          supplierName: billing.subcontractor?.name || 'Subcontractor',
          isAccrued: false,
          netAmount: billing.netPayable,
          vatAmount: 0, // Assuming simplified VAT handling for subcons
          billingEligibility: 'BILLABLE',
          status: 'APPROVED',
          loggedById: user.id,
          costType: 'DIRECT',
          breakdownItems: {
            create: [{
              description: `Subcontract Billing ${billing.billingNumber}`,
              quantity: 1,
              unit: 'lot',
              unitCost: billing.netPayable,
              totalCost: billing.netPayable,
              supplierName: billing.subcontractor?.name || 'Subcontractor',
            }]
          }
        }
      });

      // Update Package Status to FULLY_PAID
      if (billing.packageId) {
        await tx.subcontractPackage.update({
          where: { id: billing.packageId },
          data: { status: 'FULLY_PAID' }
        });
      }

      return billing;
    });

    revalidatePath(`/subcontracting/progress-hub/${packageId}`);
    revalidatePath('/supplier-payables');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Process payment error:', error);
    return { success: false, error: error.message };
  }
}

export async function submitBillingToPM(id: string, targetId: string, isJobOrder: boolean = false) {
  try {
    const res = await prisma.subcontractBilling.update({
      where: { id },
      data: { status: 'SUBMITTED' }
    });
    
    if (isJobOrder) {
      revalidatePath(`/job-orders/${targetId}/progress-hub`);
    } else {
      revalidatePath(`/subcontracting/progress-hub/${targetId}`);
    }
    
    return { success: true, data: res };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function endorseBillingToPD(id: string, targetId: string, isJobOrder: boolean = false) {
  try {
    const res = await prisma.subcontractBilling.update({
      where: { id },
      data: { status: 'FOR_VALIDATION' }
    });
    
    if (isJobOrder) {
      revalidatePath(`/job-orders/${targetId}/progress-hub`);
    } else {
      revalidatePath(`/subcontracting/progress-hub/${targetId}`);
    }
    
    return { success: true, data: res };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function approvePaymentRequest(id: string, targetId: string, isJobOrder: boolean = false) {
  try {
    const res = await prisma.subcontractBilling.update({
      where: { id },
      data: { status: 'APPROVED_FOR_PAYMENT' }
    });
    
    if (!isJobOrder && targetId) {
      await prisma.subcontractPackage.update({
        where: { id: targetId },
        data: { status: 'BILLED' }
      });
      revalidatePath(`/subcontracting/progress-hub/${targetId}`);
    } else if (isJobOrder && targetId) {
      // For now, job orders might not have a strict BILLED status enum, but if they do:
      // await prisma.jobOrder.update({ where: { id: targetId }, data: { status: 'BILLED' } });
      revalidatePath(`/job-orders/${targetId}/progress-hub`);
    }

    return { success: true, data: res };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function endorseSubcontractPayment(
  billingId: string,
  paymentData: { amount: number; paymentMethod: string; paymentRef: string; paidAt: string }
) {
  try {
    const result = await prisma.subcontractBilling.update({
      where: { id: billingId },
      data: {
        // paymentMethod: paymentData.paymentMethod,
        // paymentRef: paymentData.paymentRef,
        // paidAt: new Date(paymentData.paidAt),
        // endorsedForPayment: true,
      } as any,
    });

    revalidatePath('/supplier-payables');
    revalidatePath(`/supplier-payables/subcontract/${billingId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Endorse Subcontract Payment error:', error);
    return { success: false, error: error.message };
  }
}

export async function approveSubcontractPayment(billingId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) throw new Error('Unauthorized');
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!user) throw new Error('Unauthorized');

    const billing: any = await prisma.subcontractBilling.findUnique({
      where: { id: billingId },
      include: { 
        subcontractor: true,
        package: true,
        jobOrder: true
      }
    });
    if (!billing) throw new Error('Billing record not found');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Billing Status to PAID
      const updatedBilling = await tx.subcontractBilling.update({
        where: { id: billingId },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID',
          // endorsedForPayment: false
        } as any
      });

      // 2. Create Payment Record
      await tx.paymentRecord.create({
        data: {
          billingId,
          amountPaid: billing.netPayable,
          paymentDate: billing.paidAt || new Date(),
          method: billing.paymentMethod || 'BANK_TRANSFER',
          referenceNumber: billing.paymentRef
        }
      });

      // 3. Create Expense Ledger Entry
      const expenseCategory = billing.jobOrderId ? 'JOB_ORDER_PAYMENT' : 'SUBCONTRACT_PAYMENT';
      const expenseDesc = billing.jobOrderId
        ? `Job Order Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`
        : `Subcontract Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`;

      await tx.expense.create({
        data: {
          projectId: billing.projectId,
          amount: billing.netPayable,
          totalBreakdownAmount: billing.netPayable,
          date: billing.paidAt || new Date(),
          category: expenseCategory,
          description: expenseDesc,
          receiptRef: billing.billingNumber,
          supplierName: billing.subcontractor?.name || 'Subcontractor',
          isAccrued: false,
          netAmount: billing.netPayable,
          vatAmount: 0,
          billingEligibility: 'BILLABLE',
          status: 'APPROVED',
          loggedById: user.id,
          costType: 'DIRECT',
          breakdownItems: {
            create: [{
              description: `${expenseCategory} Billing ${billing.billingNumber}`,
              quantity: 1,
              unit: 'lot',
              unitCost: billing.netPayable,
              totalCost: billing.netPayable,
              supplierName: billing.subcontractor?.name || 'Subcontractor',
            }]
          }
        }
      });

      // [HOOK] Create ProjectCostLedger Entry for Actual Subcontract Cost
      const consolidatedBoqItemId = billing.jobOrder?.consolidatedBoqItemId || billing.package?.consolidatedBoqItemId;
      if (consolidatedBoqItemId) {
        await tx.projectCostLedger.create({
          data: {
            projectId: billing.projectId,
            consolidatedBoqItemId: consolidatedBoqItemId,
            type: 'SUBCONTRACT',
            referenceId: billing.id,
            referenceNumber: billing.billingNumber,
            supplierId: billing.subcontractorId,
            amount: billing.netPayable,
            status: 'RECORDED'
          }
        });

        await tx.consolidatedBOQItem.update({
          where: { id: consolidatedBoqItemId },
          data: {
            actualCost: { increment: billing.netPayable }
          }
        });
      }

      if (billing.jobOrderId) {
        const allBillings = await tx.subcontractBilling.findMany({
          where: { jobOrderId: billing.jobOrderId, paymentStatus: 'PAID' }
        });
        const totalGrossPaid = allBillings.reduce((sum, b) => sum + (b.currentGross || 0), 0);
        
        const jobOrder = await tx.jobOrder.findUnique({ where: { id: billing.jobOrderId } });
        if (jobOrder && totalGrossPaid >= (jobOrder.contractAmount || 0) - 0.01) {
          await tx.jobOrder.update({
            where: { id: jobOrder.id },
            data: { status: 'PAID' as any }
          });
        }
      }

      // 4. Update Package Status to FULLY_PAID
      if (billing.packageId) {
        await tx.subcontractPackage.update({
          where: { id: billing.packageId },
          data: { status: 'FULLY_PAID' }
        });
      }

      return updatedBilling;
    });

    const targetId = billing.packageId || billing.jobOrderId || '';
    revalidatePath(`/subcontracting/progress-hub/${targetId}`);
    revalidatePath('/supplier-payables');
    revalidatePath(`/supplier-payables/subcontract/${billingId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Approve Subcontract Payment error:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectSubcontractPayment(billingId: string) {
  try {
    const result = await prisma.subcontractBilling.update({
      where: { id: billingId },
      data: {
        // endorsedForPayment: false,
        // paymentMethod: null,
        // paymentRef: null,
        // paidAt: null
      } as any
    });

    revalidatePath('/supplier-payables');
    revalidatePath(`/supplier-payables/subcontract/${billingId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Reject Subcontract Payment error:', error);
    return { success: false, error: error.message };
  }
}


