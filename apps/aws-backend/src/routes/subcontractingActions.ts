// @ts-nocheck
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Assuming prisma is accessible like this in an AWS context

const router = Router();

// Helper for consistent error handling
const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).json({ success: false, error: error.message || 'An unexpected error occurred' });
};

// --- SUBCONTRACTOR READ --- 

router.post('/getSubcontractors', async (req: Request, res: Response) => {
  try {
    const subcontractors = await prisma.subcontractor.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: subcontractors });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getSubcontractors:');
  }
});

router.post('/getSubcontractorById', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontractor ID is required' });
    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id },
      include: {
        packages: true,
        jobOrders: true,
        subcontractBillings: true,
        backCharges: true
      }
    });
    res.json({ success: true, data: subcontractor });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getSubcontractorById:');
  }
});

router.post('/getSubcontractPackages', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const pkgFilter: any = {};
    if (projectId) pkgFilter.projectId = projectId;
  
    const packages = await prisma.subcontractPackage.findMany({
      where: pkgFilter,
      include: {
        subcontractor: {
          include: { subcontractorBOQItems: true }
        },
        project: true,
        accomplishments: true,
        billings: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Preserve original serialization behavior for consistency
    res.json({ success: true, data: JSON.parse(JSON.stringify(packages)) });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getSubcontractPackages:');
  }
});

router.post('/getAccomplishments', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;
    const accomplishments = await prisma.subcontractAccomplishment.findMany({
      where: packageId ? { packageId } : undefined,
      include: {
        package: {
          include: { subcontractor: true, project: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: accomplishments });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getAccomplishments:');
  }
});

router.post('/getBillings', async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;
    const billings = await prisma.subcontractBilling.findMany({
      where: packageId ? { packageId } : undefined,
      include: {
        subcontractor: true,
        package: true,
        jobOrder: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: billings });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getBillings:');
  }
});

router.post('/getAwardedBoqItemsByProjectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ success: false, error: 'Project ID is required' });
    const items = await prisma.awardedBOQItem.findMany({
      where: { projectId },
      select: { id: true, itemCode: true, category: true, description: true, unit: true, quantity: true, totalCost: true, combinedUnitCost: true }
    });
    res.json({ success: true, items });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getAwardedBoqItemsByProjectId:');
  }
});

router.post('/getSubcontractPackageById', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    const pkg = await prisma.subcontractPackage.findUnique({
      where: { id },
      include: {
        project: true,
        subcontractor: {
          include: { subcontractorBOQItems: { include: { awardedBoqItem: true } } }
        },
        programOfWorks: true,
        accomplishments: true,
        billings: true,
        jobOrders: true,
      }
    });
    res.json({ success: true, data: pkg });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in getSubcontractPackageById:');
  }
});

// --- MUTATIONS ---

router.post('/createSubcontractor', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const result = await prisma.subcontractor.create({ data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in createSubcontractor:');
  }
});

router.post('/updateSubcontractor', async (req: Request, res: Response) => {
  try {
    const { id, data } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontractor ID is required' });
    const result = await prisma.subcontractor.update({ where: { id }, data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in updateSubcontractor:');
  }
});

router.post('/deleteSubcontractor', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontractor ID is required' });
    await prisma.subcontractor.delete({ where: { id } });
    res.json({ success: true, message: 'Subcontractor deleted successfully' });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in deleteSubcontractor:');
  }
});

router.post('/createSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const result = await prisma.subcontractPackage.create({ data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in createSubcontractPackage:');
  }
});

router.post('/updateSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { id, data } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    const result = await prisma.subcontractPackage.update({ where: { id }, data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in updateSubcontractPackage:');
  }
});

router.post('/createAccomplishment', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const result = await prisma.subcontractAccomplishment.create({ data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in createAccomplishment:');
  }
});

router.post('/createBilling', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const result = await prisma.subcontractBilling.create({ data });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in createBilling:');
  }
});

router.post('/createFullSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { packageData, boqItems, powData } = req.body;
    // This complex logic would typically be a Prisma transaction.
    // Replicating a simplified version here, but in a real app, ensure atomicity.
    const result = await prisma.$transaction(async (tx) => {
      const newPackage = await tx.subcontractPackage.create({ data: packageData });
      // Assuming boqItems is an array of objects directly insertable or requiring transformation
      const createdBoqItems = await Promise.all(boqItems.map(item => 
        tx.subcontractorBOQItem.create({ 
          data: { 
            ...item, 
            packageId: newPackage.id, 
            awardedBoqItemId: item.awardedBoqItemId || null // Handle optional awardedBoqItemId
          }
        })
      ));
      // Assuming powData is an array of objects
      const createdPowItems = await Promise.all(powData.map(item => 
        tx.subcontractProgramOfWork.create({ 
          data: { 
            ...item, 
            packageId: newPackage.id, 
            awardedBoqItemId: item.awardedBoqItemId || null // Handle optional awardedBoqItemId
          }
        })
      ));
      return { newPackage, createdBoqItems, createdPowItems };
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in createFullSubcontractPackage:');
  }
});

router.post('/deleteSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    await prisma.subcontractPackage.delete({ where: { id } });
    res.json({ success: true, message: 'Subcontract package deleted successfully' });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in deleteSubcontractPackage:');
  }
});

router.post('/updateFullSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { id, packageData, boqItems, powData } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    const result = await prisma.$transaction(async (tx) => {
      const updatedPackage = await tx.subcontractPackage.update({ where: { id }, data: packageData });

      // For boqItems and powData, a common strategy is to delete existing and re-create
      // or iterate and update/create as needed. For simplicity, assuming delete all then re-create.

      // Delete existing related BOQ items
      await tx.subcontractorBOQItem.deleteMany({ where: { packageId: id } });
      // Re-create BOQ items
      const createdBoqItems = await Promise.all(boqItems.map(item => 
        tx.subcontractorBOQItem.create({ 
          data: { 
            ...item, 
            packageId: id, 
            awardedBoqItemId: item.awardedBoqItemId || null
          }
        })
      ));

      // Delete existing related Program of Work items
      await tx.subcontractProgramOfWork.deleteMany({ where: { packageId: id } });
      // Re-create Program of Work items
      const createdPowItems = await Promise.all(powData.map(item => 
        tx.subcontractProgramOfWork.create({ 
          data: { 
            ...item, 
            packageId: id, 
            awardedBoqItemId: item.awardedBoqItemId || null
          }
        })
      ));

      return { updatedPackage, createdBoqItems, createdPowItems };
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in updateFullSubcontractPackage:');
  }
});

router.post('/updateSubcontractPackageStatus', async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    if (!status) return res.status(400).json({ success: false, error: 'Status is required' });
    const result = await prisma.subcontractPackage.update({ where: { id }, data: { status } });
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in updateSubcontractPackageStatus:');
  }
});

router.post('/unlockSubcontractPackage', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Subcontract Package ID is required' });
    const result = await prisma.subcontractPackage.update({ where: { id }, data: { isLocked: false } }); // Assuming 'isLocked' field exists
    res.json({ success: true, data: result });
  } catch (error: any) {
    handleError(res, error, 'Prisma Error in unlockSubcontractPackage:');
  }
});

export default router;
