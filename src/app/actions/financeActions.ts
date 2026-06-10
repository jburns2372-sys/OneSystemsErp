'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function issuePayment(payableId: string, paymentData: {
  amount: number;
  paymentMethod: string;
  paymentRef: string;
  paidAt: string;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!user || (user.role !== 'COST_CONTROLLER' && user.role !== 'FINANCE_OFFICER' && user.role !== 'SYSTEM_ADMIN')) {
    throw new Error('Only Cost Controller or Finance Officer can issue payments');
  }

  const payable = await prisma.accountsPayable.findUnique({
    where: { id: payableId },
    include: {
      po: {
        include: { supplier: true, mr: true }
      },
      delivery: {
        include: {
          items: {
            include: { consolidatedBoqItem: true }
          }
        }
      }
    }
  });

  if (!payable) {
    throw new Error('Payable record not found');
  }

  // Calculate new paid amount
  const newPaidAmount = payable.paidAmount + paymentData.amount;
  
  // Determine if fully paid or accrued (post-dated)
  let newStatus = 'PAID';
  let isAccrued = false;
  
  if (newPaidAmount < payable.amount) {
    newStatus = 'PARTIALLY_PAID';
  } else if (new Date(payable.dueDate) > new Date(paymentData.paidAt)) {
    // If the due date of the payable is strictly after the payment/check date, it's post-dated (Accrued)
    newStatus = 'ACCRUED';
    isAccrued = true;
  }

  // Compute VAT
  let calculatedNetAmount = newPaidAmount;
  let calculatedVatAmount = 0;
  if (payable.po.supplier.isVatable) {
    calculatedNetAmount = newPaidAmount / 1.12;
    calculatedVatAmount = newPaidAmount - calculatedNetAmount;
  }

  await prisma.$transaction(async (tx) => {
    await tx.accountsPayable.update({
      where: { id: payableId },
      data: {
        status: newStatus,
        paidAmount: newPaidAmount,
        netAmount: calculatedNetAmount,
        vatAmount: calculatedVatAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentRef: paymentData.paymentRef,
        paidAt: new Date(paymentData.paidAt)
      }
    });

    if (newStatus === 'PAID' || newStatus === 'ACCRUED') {
      await tx.expense.create({
        data: {
          amount: newPaidAmount,
          totalBreakdownAmount: newPaidAmount,
          date: new Date(paymentData.paidAt),
          category: 'MATERIALS',
          description: `Payment to ${payable.po.supplier.name} for PO: ${payable.po.poNumber} | DR: ${payable.delivery.receiptNumber || 'N/A'}`,
          receiptRef: payable.voucherNumber || paymentData.paymentRef,
          supplierName: payable.po.supplier.name,
          isAccrued: isAccrued,
          netAmount: calculatedNetAmount,
          vatAmount: calculatedVatAmount,
          billingEligibility: 'BILLABLE',
          status: 'APPROVED',
          projectId: payable.po.mr.projectId,
          loggedById: user.id,
          costType: 'DIRECT',
          breakdownItems: {
            create: payable.delivery.items.map(item => ({
              description: `${item.consolidatedBoqItem.itemCode}\n${item.consolidatedBoqItem.category ? item.consolidatedBoqItem.category.trim() + ' ' : ''}${item.consolidatedBoqItem.description}`.trim(),
              quantity: item.quantity,
              unit: item.consolidatedBoqItem.unit,
              unitCost: item.consolidatedBoqItem.unitCost,
              totalCost: item.quantity * item.consolidatedBoqItem.unitCost,
              supplierName: payable.po.supplier.name,
              purchaseReferenceNo: payable.po.poNumber,
              receiptInvoiceNo: paymentData.paymentRef,
              purchaseDate: payable.delivery.createdAt
            }))
          }
        }
      });
    }
  });

  revalidatePath('/supplier-payables');
  revalidatePath(`/supplier-payables/${payableId}`);
  revalidatePath('/finance');
  
  return { success: true };
}

export async function clearAccruedPayment(payableId: string) {
  const session = await cookies();
  const userStr = session.get('user')?.value;
  if (!userStr) throw new Error('Unauthorized');

  const payable = await prisma.accountsPayable.findUnique({
    where: { id: payableId }
  });

  if (!payable || payable.status !== 'ACCRUED') {
    throw new Error('Only accrued payables can be cleared');
  }

  await prisma.accountsPayable.update({
    where: { id: payableId },
    data: { status: 'PAID' }
  });

  revalidatePath('/supplier-payables');
  revalidatePath('/finance');
}

export async function getConsolidatedItemsForProject(projectId: string) {
  const items = await prisma.consolidatedBOQItem.findMany({
    where: { 
      projectId,
      unit: {
        contains: 'lot'
      }
    },
    orderBy: { itemCode: 'asc' }
  });
  return items;
}

export async function logDirectExpense(data: {
  projectId: string;
  consolidatedBoqItemId?: string;
  voucherNo: string;
  date: string;
  category: string;
  description: string;
  issuedById: string;
  supplierName: string;
  netAmount: number;
  vatAmount: number;
  isAccrued: boolean;
  breakdowns: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    supplierName: string;
    isVat: boolean;
  }>;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Unauthorized');

  const totalBreakdownAmount = data.breakdowns.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const totalAmount = data.netAmount + data.vatAmount;

  const expense = await prisma.expense.create({
    data: {
      projectId: data.projectId,
      amount: totalAmount,
      totalBreakdownAmount: totalBreakdownAmount || totalAmount,
      date: new Date(data.date),
      category: data.category,
      description: data.description,
      receiptRef: data.voucherNo,
      supplierName: data.supplierName,
      isAccrued: data.isAccrued,
      netAmount: data.netAmount,
      vatAmount: data.vatAmount,
      status: 'LOGGED',
      loggedById: data.issuedById,
      breakdownItems: {
        create: data.breakdowns.map(bd => ({
          description: bd.description,
          quantity: bd.quantity,
          unit: bd.unit,
          unitCost: bd.unitPrice,
          totalCost: bd.quantity * bd.unitPrice,
          supplierName: bd.supplierName,
        }))
      }
    }
  });

  // If logging as a single item, we still create one generic breakdown item for consistency
  if (data.breakdowns.length === 0) {
     await prisma.expenseBreakdownItem.create({
        data: {
           expenseId: expense.id,
           description: data.description,
           quantity: 1,
           unit: 'lot',
           unitCost: data.netAmount,
           totalCost: data.netAmount,
           supplierName: data.supplierName
        }
     });
  }

  revalidatePath('/expenses');
  return expense.id;
}
