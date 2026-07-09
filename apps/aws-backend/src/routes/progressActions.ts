// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Adjust path to your prisma client

const router = Router();

// Helper for common try/catch
const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch((error: any) => {
    console.error(`Error in ${req.originalUrl}:`, error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  });

router.post('/getPackageProgressHubData', asyncHandler(async (req, res) => {
  const { packageId } = req.body;
  if (!packageId) {
    throw new Error('Package ID is required');
  }
  const pkg = await prisma.subcontractPackage.findUnique({
    where: { id: packageId },
    include: {
      subcontractor: {
        include: { subcontractorBOQItems: { include: { awardedBoqItem: true } } }
      },
      accomplishments: { orderBy: { createdAt: 'desc' } },
      billings: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!pkg) {
    throw new Error('Package not found');
  }
  return res.json({ success: true, data: pkg });
}));

router.post('/getJobOrderProgressHubData', asyncHandler(async (req, res) => {
  const { jobOrderId } = req.body;
  if (!jobOrderId) {
    throw new Error('Job Order ID is required');
  }
  const jo = await prisma.jobOrder.findUnique({
    where: { id: jobOrderId },
    include: {
      subcontractor: true,
      subcontractAccomplishments: { orderBy: { createdAt: 'desc' } },
      subcontractBillings: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!jo) {
    throw new Error('Job Order not found');
  }
  return res.json({ success: true, data: jo });
}));

router.post('/createAccomplishment', asyncHandler(async (req, res) => {
  const data = req.body; // This 'data' object should already contain the `inspectionReport` path if a file was uploaded.
  const result = await prisma.subcontractAccomplishment.create({ data });
  return res.json({ success: true, data: result });
}));

router.post('/approveAccomplishment', asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new Error('Accomplishment ID is required');
  }
  const result = await prisma.subcontractAccomplishment.update({
    where: { id },
    data: { status: 'APPROVED' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/createBilling', asyncHandler(async (req, res) => {
  let data = req.body;
  if (!data.billingNumber) data.billingNumber = `INV-${Date.now()}`;
  const result = await prisma.subcontractBilling.create({ data });
  return res.json({ success: true, data: result });
}));

router.post('/processPayment', asyncHandler(async (req, res) => {
  const { billingId } = req.body;
  if (!billingId) {
    throw new Error('Billing ID is required');
  }
  const result = await prisma.subcontractBilling.update({
    where: { id: billingId },
    data: { status: 'PAID' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/submitBillingToPM', asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new Error('Billing ID is required');
  }
  const result = await prisma.subcontractBilling.update({
    where: { id },
    data: { status: 'SUBMITTED_TO_PM' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/endorseBillingToPD', asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new Error('Billing ID is required');
  }
  const result = await prisma.subcontractBilling.update({
    where: { id },
    data: { status: 'ENDORSED_TO_PD' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/approvePaymentRequest', asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    throw new Error('Billing ID is required');
  }
  const result = await prisma.subcontractBilling.update({
    where: { id },
    data: { status: 'APPROVED_BY_PD' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/endorseSubcontractPayment', asyncHandler(async (req, res) => {
  const { billingId, paymentData } = req.body;
  if (!billingId || !paymentData) {
    throw new Error('Billing ID and payment data are required');
  }
  const newPayment = await prisma.subcontractPayment.create({
    data: {
      ...paymentData,
      billingId,
      status: 'ENDORSED_BY_FINANCE'
    }
  });
  await prisma.subcontractBilling.update({
    where: { id: billingId },
    data: { status: 'ENDORSED_FOR_PAYMENT' }
  });
  return res.json({ success: true, data: newPayment });
}));

router.post('/approveSubcontractPayment', asyncHandler(async (req, res) => {
  const { billingId } = req.body;
  if (!billingId) {
    throw new Error('Billing ID is required');
  }
  await prisma.subcontractPayment.updateMany({
    where: { billingId, status: 'ENDORSED_BY_FINANCE' },
    data: { status: 'APPROVED_BY_MANAGEMENT' }
  });
  const result = await prisma.subcontractBilling.update({
    where: { id: billingId },
    data: { status: 'APPROVED_FOR_PAYMENT' }
  });
  return res.json({ success: true, data: result });
}));

router.post('/rejectSubcontractPayment', asyncHandler(async (req, res) => {
  const { billingId } = req.body;
  if (!billingId) {
    throw new Error('Billing ID is required');
  }
  await prisma.subcontractPayment.updateMany({
    where: { billingId, status: 'ENDORSED_BY_FINANCE' },
    data: { status: 'REJECTED_BY_MANAGEMENT' }
  });
  const result = await prisma.subcontractBilling.update({
    where: { id: billingId },
    data: { status: 'REJECTED_PAYMENT' }
  });
  return res.json({ success: true, data: result });
}));

export default router;
