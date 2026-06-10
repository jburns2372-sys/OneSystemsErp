const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const account = await prisma.pettyCashAccount.findFirst();
    if (!account) {
      console.log('No account found');
      return;
    }
    const user = await prisma.user.findFirst();

    console.log('Testing with account:', account.id, 'and user:', user?.id);

    const data = {
      accountId: account.id,
      date: new Date(),
      payee: 'Test Payee',
      purpose: 'Test Purpose',
      category: 'MATERIALS',
      amount: 1500,
      isVat: false,
      netAmount: 1500,
      vatAmount: 0,
      billingEligibility: 'BILLABLE',
      isNoReceipt: true,
      remarks: 'lost',
      createGeneralExpense: true,
      projectId: account.projectId,
      issuedById: user?.id
    };

    const res = await prisma.$transaction(async (tx) => {
      let generalExpenseId = null;
      if (data.createGeneralExpense && data.projectId && data.issuedById) {
        const genExp = await tx.expense.create({
          data: {
            project: { connect: { id: data.projectId } },
            receiptRef: `PC-${Date.now()}`,
            date: data.date,
            category: data.category,
            description: data.purpose,
            loggedBy: { connect: { id: data.issuedById } },
            supplierName: data.payee,
            netAmount: data.netAmount,
            vatAmount: data.vatAmount,
            amount: data.amount,
            isAccrued: false,
            breakdownItems: {
              create: [{
                description: data.purpose,
                quantity: 1,
                unit: 'lot',
                unitPrice: data.netAmount,
                supplierName: data.payee,
                isVat: data.isVat
              }]
            }
          }
        });
        generalExpenseId = genExp.id;
      }

      const pcExpense = await tx.pettyCashExpense.create({
        data: {
          account: { connect: { id: data.accountId } },
          date: data.date,
          payee: data.payee,
          purpose: data.purpose,
          category: data.category,
          amount: data.amount,
          isVat: data.isVat,
          netAmount: data.netAmount,
          vatAmount: data.vatAmount,
          billingEligibility: data.billingEligibility,
          receiptNumber: data.receiptNumber || null,
          attachmentUrl: data.attachmentUrl || null,
          isNoReceipt: data.isNoReceipt,
          remarks: data.remarks || null,
          status: 'PENDING',
          ...(generalExpenseId ? { expense: { connect: { id: generalExpenseId } } } : {})
        }
      });

      await tx.pettyCashAccount.update({
        where: { id: data.accountId },
        data: { currentBalance: { decrement: data.amount } }
      });
      return pcExpense;
    });

    console.log('Success:', res);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
