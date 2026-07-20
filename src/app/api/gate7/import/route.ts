import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || user.role !== 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Requires PROJECT_MANAGER' }, { status: 403 });
    }

    const { manifest, preview } = await req.json();

    // 5. Prevent Duplicate Reconstruction
    const existingProject = await prisma.project.findFirst({
      where: { name: manifest.projectMetadata.title }
    });
    if (existingProject) {
      return NextResponse.json({ error: 'DUPLICATE_RECONSTRUCTED_PROJECT_DETECTED', existingProject }, { status: 400 });
    }

    // 4. Create Reconstructed Project
    const project = await prisma.project.create({
      data: {
        name: manifest.projectMetadata.title,
        description: 'Authoritative reconstruction from validated awarded BOQ evidence following loss of the historical execution database.',
        location: manifest.projectMetadata.location,
        contractAmount: manifest.projectMetadata.awardedTotal,
        status: 'ACTIVE',
        managerId: session.id,
        startDate: new Date(manifest.projectMetadata.startDate),
        endDate: new Date(manifest.projectMetadata.completionDate),
        originalCompletionDate: new Date(manifest.projectMetadata.completionDate)
      }
    });

    // Auto-assign project manager
    await prisma.projectUserAssignment.create({
      data: {
        userId: session.id,
        projectId: project.id,
        projectRole: 'PROJECT_MANAGER',
        accessLevel: 'READ_WRITE',
        assignmentStatus: 'active',
        assignedBy: 'SYSTEM',
      }
    });

    // Create a mock uploaded file record to satisfy relations
    const mockFile = await prisma.uploadedWorkbookFile.create({
      data: {
        projectId: project.id,
        originalFilename: "Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        storagePath: "gate7/mock/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx",
        fileSize: 0,
        uploadedBy: session.id,
        extractionStatus: "EXTRACTED",
        validationStatus: "VALIDATED",
        commitStatus: "COMMITTED",
        fileHash: manifest.boqMetadata.sourceFileHashes['Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx']
      }
    });

    // 6. Create the Awarded BOQ Version
    const boqVersion = await prisma.projectBOQVersion.create({
      data: {
        projectId: project.id,
        sourceUploadedWorkbookFileId: mockFile.id,
        versionNumber: 1,
        versionLabel: 'Awarded BOQ (Reconstructed)',
        status: 'IMPORTED_PENDING_VALIDATION',
        sourceProvenance: manifest.boqMetadata.provenanceClassification
      }
    });

    // 7. Import the 326 BOQ Lines
    const itemsToInsert = preview.map((p: any) => ({
      uploadedWorkbookFileId: 'RECONSTRUCTION_MOCK', // Required by schema but we don't have a file id. Wait, the schema requires it. Let's create a mock file.
      projectId: project.id,
      sourceRowNumber: parseInt(p.sourceRow),
      itemNumber: p.itemRef || p.seq,
      description: p.description,
      unit: p.unit,
      quantity: p.qty ? new Prisma.Decimal(p.qty).toNumber() : 0,
      unitCost: p.unitCost ? new Prisma.Decimal(p.unitCost).toNumber() : 0,
      amount: p.amount ? new Prisma.Decimal(p.amount).toNumber() : 0,
    }));

    // Update with actual ID
    itemsToInsert.forEach((item: any) => item.uploadedWorkbookFileId = mockFile.id);

    await prisma.bOQExtractedItem.createMany({
      data: itemsToInsert
    });

    // 8, 9, 10, 11: Application Validation Service
    const extracted = await prisma.bOQExtractedItem.findMany({
      where: { uploadedWorkbookFileId: mockFile.id },
      orderBy: [
        { itemNumber: 'asc' }, // Sequence equivalent mapping (it might sort strings badly, so we will recalculate checksum precisely as in Gate 6)
        { sourceRowNumber: 'asc' }
      ]
    });

    let totalAmount = new Prisma.Decimal(0);
    const checksumData: any[] = [];
    extracted.forEach(e => {
       const amount = new Prisma.Decimal(e.amount || 0);
       totalAmount = totalAmount.add(amount);
       // We map it back to the checksum format
       const origPreview = preview.find((p: any) => p.sourceRow == e.sourceRowNumber);
       if (origPreview) {
         checksumData.push({
            seq: origPreview.seq,
            sourceRow: origPreview.sourceRow,
            itemRef: origPreview.itemRef,
            section: origPreview.section,
            subsection: origPreview.subsection,
            description: origPreview.description,
            unit: origPreview.unit,
            qty: String(origPreview.qty),
            unitCost: String(origPreview.unitCost),
            amount: origPreview.amount,
            isLot: origPreview.isLot,
            breakdownRequired: origPreview.breakdownRequired
         });
       }
    });

    checksumData.sort((a, b) => {
      if (a.seq !== b.seq) return a.seq.localeCompare(b.seq);
      return a.sourceRow.localeCompare(b.sourceRow);
    });
    const checksumStr = JSON.stringify(checksumData);
    const canonicalChecksum = crypto.createHash('sha256').update(checksumStr).digest('hex');

    if (canonicalChecksum !== manifest.boqMetadata.canonicalChecksum) {
      return NextResponse.json({ error: 'RECONSTRUCTED_BOQ_CHECKSUM_MISMATCH', checksum: canonicalChecksum }, { status: 400 });
    }
    if (!totalAmount.equals(new Prisma.Decimal(manifest.projectMetadata.awardedTotal))) {
      return NextResponse.json({ error: 'RECONSTRUCTED_BOQ_FINANCIAL_MISMATCH' }, { status: 400 });
    }
    if (extracted.length !== manifest.boqMetadata.pricedDetailCount) {
      return NextResponse.json({ error: 'RECONSTRUCTED_BOQ_LINE_MISMATCH' }, { status: 400 });
    }

    // Set to VALIDATED_PENDING_LOCK
    await prisma.projectBOQVersion.update({
      where: { id: boqVersion.id },
      data: {
        status: 'VALIDATED_PENDING_LOCK',
        checksum: canonicalChecksum,
        totalAmount: totalAmount.toNumber()
      }
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      boqVersionId: boqVersion.id,
      mockFileId: mockFile.id,
      checksum: canonicalChecksum
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
