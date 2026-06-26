-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PROJECT_ENGINEER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "passwordHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "defaultRole" TEXT,
    "department" TEXT,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "SystemRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "contractAmountVATInclusive" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" REAL NOT NULL DEFAULT 12.0,
    "retentionPercentage" REAL NOT NULL DEFAULT 10.0,
    "withholdingTaxPercentage" REAL NOT NULL DEFAULT 2.0,
    "mobilizationAdvanceAmount" REAL NOT NULL DEFAULT 0,
    "advanceRecoupmentMethod" TEXT NOT NULL DEFAULT 'PRO_RATA',
    "liquidatedDamagesRate" REAL NOT NULL DEFAULT 0.1,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "boqLocked" BOOLEAN NOT NULL DEFAULT false,
    "consolidatedBOQLocked" BOOLEAN NOT NULL DEFAULT false,
    "procurementBenchmarkLocked" BOOLEAN NOT NULL DEFAULT false,
    "contractNumber" TEXT,
    "client" TEXT,
    "contractor" TEXT,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "acceptableGeotagRadius" REAL NOT NULL DEFAULT 100,
    "projectCategory" TEXT,
    "fundingSource" TEXT,
    "contractAmount" REAL NOT NULL DEFAULT 0,
    "originalContractDuration" INTEGER,
    "noticeToProceedDate" DATETIME,
    "originalCompletionDate" DATETIME,
    "revisedCompletionDate" DATETIME,
    "implementingOffice" TEXT,
    "managerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectUserAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectRole" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "assignmentStatus" TEXT NOT NULL DEFAULT 'active',
    "assignedBy" TEXT,
    "dateAssigned" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRemoved" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectUserAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectUserAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AwardedBOQItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "directCost" REAL NOT NULL DEFAULT 0,
    "indirectCost" REAL NOT NULL DEFAULT 0,
    "combinedUnitCost" REAL NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL,
    "previousQuantityAccomplished" REAL NOT NULL DEFAULT 0,
    "currentQuantityAccomplished" REAL NOT NULL DEFAULT 0,
    "totalQuantityAccomplished" REAL NOT NULL DEFAULT 0,
    "remainingQuantity" REAL NOT NULL DEFAULT 0,
    "percentageAccomplished" REAL NOT NULL DEFAULT 0,
    "amountAccomplished" REAL NOT NULL DEFAULT 0,
    "balanceAmount" REAL NOT NULL DEFAULT 0,
    "approvedClientVoQuantity" REAL NOT NULL DEFAULT 0,
    "revisedContractQuantity" REAL NOT NULL DEFAULT 0,
    "revisedContractUnitPrice" REAL NOT NULL DEFAULT 0,
    "revisedContractAmount" REAL NOT NULL DEFAULT 0,
    "previousBilledQuantity" REAL NOT NULL DEFAULT 0,
    "currentBillingQuantity" REAL NOT NULL DEFAULT 0,
    "totalBilledQuantity" REAL NOT NULL DEFAULT 0,
    "revenueRecognized" REAL NOT NULL DEFAULT 0,
    "actualOrderedQuantity" REAL NOT NULL DEFAULT 0,
    "actualDeliveredQuantity" REAL NOT NULL DEFAULT 0,
    "actualInstalledQuantity" REAL NOT NULL DEFAULT 0,
    "finalApprovedInstalledQuantity" REAL,
    "materialSavingsQuantity" REAL NOT NULL DEFAULT 0,
    "materialSavingsAmount" REAL NOT NULL DEFAULT 0,
    "wastageQuantity" REAL NOT NULL DEFAULT 0,
    "actualCost" REAL NOT NULL DEFAULT 0,
    "costVariance" REAL NOT NULL DEFAULT 0,
    "aiValidationRequired" BOOLEAN NOT NULL DEFAULT true,
    "requiredEvidenceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processingType" TEXT NOT NULL DEFAULT 'MATERIAL_EQUIPMENT',
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AwardedBOQItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcurementBenchmarkItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    CONSTRAINT "ProcurementBenchmarkItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsolidatedBOQItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "deliveredQty" REAL NOT NULL DEFAULT 0,
    "consumedQty" REAL NOT NULL DEFAULT 0,
    "voAdditiveQty" REAL NOT NULL DEFAULT 0,
    "voDeductiveQty" REAL NOT NULL DEFAULT 0,
    "revisedQuantity" REAL NOT NULL DEFAULT 0,
    "voAdditiveCost" REAL NOT NULL DEFAULT 0,
    "voDeductiveCost" REAL NOT NULL DEFAULT 0,
    "revisedTotalCost" REAL NOT NULL DEFAULT 0,
    "wasteAllowance" REAL NOT NULL DEFAULT 0,
    "revisedBenchmarkUnitCost" REAL NOT NULL DEFAULT 0,
    "requestedQuantity" REAL NOT NULL DEFAULT 0,
    "purchasedQuantity" REAL NOT NULL DEFAULT 0,
    "issuedQuantity" REAL NOT NULL DEFAULT 0,
    "subcontractedQuantity" REAL NOT NULL DEFAULT 0,
    "jobOrderQuantity" REAL NOT NULL DEFAULT 0,
    "subcontractorVoQuantity" REAL NOT NULL DEFAULT 0,
    "remainingBenchmarkQuantity" REAL NOT NULL DEFAULT 0,
    "actualUnitCost" REAL NOT NULL DEFAULT 0,
    "actualCost" REAL NOT NULL DEFAULT 0,
    "committedCost" REAL NOT NULL DEFAULT 0,
    "quantityVariance" REAL NOT NULL DEFAULT 0,
    "costVariance" REAL NOT NULL DEFAULT 0,
    "savings" REAL NOT NULL DEFAULT 0,
    "overrun" REAL NOT NULL DEFAULT 0,
    "valueEngineeringSavings" REAL NOT NULL DEFAULT 0,
    "isVariationItem" BOOLEAN NOT NULL DEFAULT false,
    "sourceVoNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsolidatedBOQItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BOQMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mappingType" TEXT NOT NULL,
    "allocationPercentage" REAL,
    "allocationQuantity" REAL,
    "remarks" TEXT,
    "aiConfidenceScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "awardedBoqItemId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BOQMapping_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BOQMapping_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tin" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "paymentTerms" TEXT,
    "website" TEXT,
    "plantLocation" TEXT,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "preparerId" TEXT,
    "checkerId" TEXT,
    "approverId" TEXT,
    "purpose" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "locationOfUse" TEXT,
    "remarks" TEXT,
    "aiValidationRisk" TEXT,
    "aiValidationNotes" TEXT,
    "dateNeeded" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_preparerId_fkey" FOREIGN KEY ("preparerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialRequestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "approvedQuantity" REAL,
    "mrId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "breakdownData" JSONB,
    CONSTRAINT "MaterialRequestItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequestItem_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MaterialRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "supplierId" TEXT NOT NULL,
    "mrId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "deliveryDate" DATETIME,
    "paymentTermsDays" INTEGER,
    "dueDate" DATETIME,
    "preparerId" TEXT,
    "reviewerId" TEXT,
    "approverId" TEXT,
    "aiValidationRisk" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "canvassFormId" TEXT,
    CONSTRAINT "PurchaseOrder_canvassFormId_fkey" FOREIGN KEY ("canvassFormId") REFERENCES "CanvassForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_preparerId_fkey" FOREIGN KEY ("preparerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MaterialRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "poId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    CONSTRAINT "PurchaseOrderItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "totalBreakdownAmount" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "receiptRef" TEXT,
    "supplierName" TEXT,
    "isAccrued" BOOLEAN NOT NULL DEFAULT false,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "billingEligibility" TEXT NOT NULL DEFAULT 'BILLABLE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "aiValidationStatus" TEXT,
    "approvalStatus" TEXT,
    "aiValidationRisk" TEXT,
    "projectId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "costType" TEXT NOT NULL DEFAULT 'DIRECT',
    "awardedBoqItemId" TEXT,
    "consolidatedBoqItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewerId" TEXT,
    "approverId" TEXT,
    CONSTRAINT "Expense_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseBreakdownItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "supplierName" TEXT,
    "purchaseReferenceNo" TEXT,
    "receiptInvoiceNo" TEXT,
    "purchaseDate" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpenseBreakdownItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseProofFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "breakdownItemId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileHash" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT,
    "verifiedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    CONSTRAINT "ExpenseProofFile_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseProofFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseProofFile_breakdownItemId_fkey" FOREIGN KEY ("breakdownItemId") REFERENCES "ExpenseBreakdownItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseProofFile_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseAIValidation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL,
    "validationScore" REAL,
    "findings" TEXT,
    "recommendations" TEXT,
    "duplicateWarning" BOOLEAN NOT NULL DEFAULT false,
    "budgetWarning" BOOLEAN NOT NULL DEFAULT false,
    "scopeAlignmentResult" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseAIValidation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseApprovalLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionByUserId" TEXT NOT NULL,
    "comments" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseApprovalLog_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpenseApprovalLog_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PettyCashAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountName" TEXT NOT NULL,
    "department" TEXT,
    "fundLimit" REAL NOT NULL,
    "replenishmentTrigger" REAL,
    "currentBalance" REAL NOT NULL,
    "projectId" TEXT,
    "custodianId" TEXT NOT NULL,
    "approverId" TEXT,
    "reviewerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PettyCashAccount_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PettyCashAccount_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PettyCashAccount_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PettyCashAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PettyCashExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "payee" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "isVat" BOOLEAN NOT NULL DEFAULT false,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "billingEligibility" TEXT NOT NULL DEFAULT 'BILLABLE',
    "receiptNumber" TEXT,
    "attachmentUrl" TEXT,
    "isNoReceipt" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expenseId" TEXT,
    "accountId" TEXT NOT NULL,
    "projectId" TEXT,
    "replenishmentId" TEXT,
    "costType" TEXT NOT NULL DEFAULT 'DIRECT',
    "awardedBoqItemId" TEXT,
    "consolidatedBoqItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PettyCashExpense_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PettyCashExpense_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PettyCashExpense_replenishmentId_fkey" FOREIGN KEY ("replenishmentId") REFERENCES "PettyCashReplenishment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PettyCashExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PettyCashAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PettyCashExpense_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PettyCashReplenishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fundLimit" REAL NOT NULL,
    "beginningBalance" REAL NOT NULL,
    "totalExpenses" REAL NOT NULL,
    "cashOnHand" REAL NOT NULL,
    "amountRequested" REAL NOT NULL,
    "reviewerAction" TEXT,
    "reviewerRemarks" TEXT,
    "approverId" TEXT,
    "approvalDate" DATETIME,
    "releaseDate" DATETIME,
    "releaseMode" TEXT,
    "releaseRefNo" TEXT,
    "receiverId" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PettyCashReplenishment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PettyCashAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "suffix" TEXT,
    "nickname" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "civilStatus" TEXT,
    "mobileNumber" TEXT,
    "emailAddress" TEXT,
    "completeAddress" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactNumber" TEXT,
    "emergencyContactRelation" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'PROJECT_BASED',
    "workerCategory" TEXT NOT NULL DEFAULT 'SKILLED',
    "designation" TEXT,
    "department" TEXT,
    "dateHired" DATETIME,
    "engagementStartDate" DATETIME,
    "contractEndDate" DATETIME,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "restDay" TEXT,
    "standardWorkHours" REAL DEFAULT 8,
    "overtimeEligible" BOOLEAN NOT NULL DEFAULT true,
    "nightDifferentialEligible" BOOLEAN NOT NULL DEFAULT true,
    "holidayPayEligible" BOOLEAN NOT NULL DEFAULT true,
    "subjectToAttendance" BOOLEAN NOT NULL DEFAULT true,
    "subjectToPayrollCutoff" BOOLEAN NOT NULL DEFAULT true,
    "rateType" TEXT NOT NULL DEFAULT 'DAILY_RATE',
    "basicMonthlySalary" REAL NOT NULL DEFAULT 0,
    "dailyRate" REAL NOT NULL DEFAULT 0,
    "hourlyRate" REAL NOT NULL DEFAULT 0,
    "pieceRate" REAL NOT NULL DEFAULT 0,
    "unitDescription" TEXT,
    "contractAmount" REAL NOT NULL DEFAULT 0,
    "professionalFee" REAL NOT NULL DEFAULT 0,
    "paymentBasis" TEXT,
    "billingFrequency" TEXT,
    "prorationMethod" TEXT,
    "retentionPercentage" REAL NOT NULL DEFAULT 0,
    "withholdingTaxRate" REAL NOT NULL DEFAULT 0,
    "allowance" REAL NOT NULL DEFAULT 0,
    "tinNumber" TEXT,
    "sssNumber" TEXT,
    "philHealthNumber" TEXT,
    "pagIbigNumber" TEXT,
    "umidNumber" TEXT,
    "nationalIdNumber" TEXT,
    "validIdType" TEXT,
    "validIdNumber" TEXT,
    "validIdExpiryDate" DATETIME,
    "withholdingTaxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sssDeductionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "philHealthDeductionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pagibigDeductionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otherGovernmentDeductionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxClassification" TEXT NOT NULL DEFAULT 'COMPENSATION_EMPLOYEE',
    "withholdingTaxType" TEXT NOT NULL DEFAULT 'COMPENSATION_WITHHOLDING_TAX',
    "taxExemptionReason" TEXT,
    "birFormType" TEXT,
    "registeredBusinessName" TEXT,
    "officialReceiptRequired" BOOLEAN NOT NULL DEFAULT false,
    "taxStatus" TEXT NOT NULL DEFAULT 'SINGLE',
    "payrollMode" TEXT NOT NULL DEFAULT 'CASH',
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "gcashAccountName" TEXT,
    "gcashNumber" TEXT,
    "checkPayeeName" TEXT,
    "billingPayeeName" TEXT,
    "billingAddress" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "allowedPaymentMethod" TEXT DEFAULT 'Manual Hold',
    "bankAccountType" TEXT,
    "bankApprovedBy" TEXT,
    "bankBranch" TEXT,
    "bankLastUpdatedDate" DATETIME,
    "bankSupportingAttachment" TEXT,
    "bankUpdatedBy" TEXT,
    "bankVerificationStatus" TEXT DEFAULT 'Pending',
    "gcashApprovedBy" TEXT,
    "gcashLastUpdatedDate" DATETIME,
    "gcashSupportingAttachment" TEXT,
    "gcashUpdatedBy" TEXT,
    "gcashVerificationStatus" TEXT DEFAULT 'Pending',
    "paymentHoldReason" TEXT,
    "paymentProfileStatus" TEXT DEFAULT 'Pending',
    "paymentRemarks" TEXT,
    "payrollCategory" TEXT DEFAULT 'Other',
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Worker_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIWorkerValidationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fieldRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ignoreReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIWorkerValidationResult_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiryDate" DATETIME,
    "remarks" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerDocument_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyTimeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "projectId" TEXT,
    "timeIn" DATETIME,
    "timeOut" DATETIME,
    "regularHours" REAL NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "nightDiffHours" REAL NOT NULL DEFAULT 0,
    "restDayHours" REAL NOT NULL DEFAULT 0,
    "holidayHours" REAL NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "undertimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "absenceStatus" TEXT,
    "sourceFile" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "encodedById" TEXT,
    "payrollPeriodId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyTimeRecord_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyTimeRecord_encodedById_fkey" FOREIGN KEY ("encodedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyTimeRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyTimeRecord_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollBatchNumber" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "calendarRule" TEXT NOT NULL DEFAULT 'SEMI_MONTHLY',
    "periodType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "payrollDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "cancelledAt" DATETIME,
    "dateApproved" DATETIME,
    "dateReleased" DATETIME,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "lockedById" TEXT,
    "dummyField" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "destinationAddress" TEXT,
    "destinationLat" REAL,
    "destinationLng" REAL,
    CONSTRAINT "PayrollPeriod_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollPeriod_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "projectId" TEXT,
    "compensationType" TEXT NOT NULL DEFAULT 'DAILY',
    "rate" REAL NOT NULL DEFAULT 0,
    "daysWorked" REAL NOT NULL DEFAULT 0,
    "regularHours" REAL NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "basicPay" REAL NOT NULL DEFAULT 0,
    "overtimePay" REAL NOT NULL DEFAULT 0,
    "nightDiffPay" REAL NOT NULL DEFAULT 0,
    "holidayPay" REAL NOT NULL DEFAULT 0,
    "restDayPay" REAL NOT NULL DEFAULT 0,
    "allowances" REAL NOT NULL DEFAULT 0,
    "nonTaxableAllowances" REAL NOT NULL DEFAULT 0,
    "otherEarnings" REAL NOT NULL DEFAULT 0,
    "grossPay" REAL NOT NULL DEFAULT 0,
    "grossTaxablePay" REAL NOT NULL DEFAULT 0,
    "sssDeduction" REAL NOT NULL DEFAULT 0,
    "sssEmployerShare" REAL NOT NULL DEFAULT 0,
    "sssEcEmployerShare" REAL NOT NULL DEFAULT 0,
    "sssWispDeduction" REAL NOT NULL DEFAULT 0,
    "sssWispEmployerShare" REAL NOT NULL DEFAULT 0,
    "philhealthDeduction" REAL NOT NULL DEFAULT 0,
    "philhealthEmployerShare" REAL NOT NULL DEFAULT 0,
    "pagibigDeduction" REAL NOT NULL DEFAULT 0,
    "pagibigEmployerShare" REAL NOT NULL DEFAULT 0,
    "taxableCompensation" REAL NOT NULL DEFAULT 0,
    "birPayrollFrequency" TEXT,
    "birEffectiveYear" INTEGER,
    "birBracketNo" INTEGER,
    "birBaseTax" REAL,
    "birTaxRatePercent" REAL,
    "birExcessOver" REAL,
    "withholdingTax" REAL NOT NULL DEFAULT 0,
    "manualTaxAdjustment" REAL NOT NULL DEFAULT 0,
    "finalWithholdingTax" REAL NOT NULL DEFAULT 0,
    "cashAdvance" REAL NOT NULL DEFAULT 0,
    "loanDeduction" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "lateUndertimeAmount" REAL NOT NULL DEFAULT 0,
    "totalDeductions" REAL NOT NULL DEFAULT 0,
    "netPay" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentHoldReason" TEXT,
    "paymentBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "transactionReference" TEXT,
    CONSTRAINT "Payroll_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payroll_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payroll_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollEarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollId" TEXT NOT NULL,
    "earningType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "taxableStatus" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    CONSTRAINT "PayrollEarning_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollDeduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollId" TEXT NOT NULL,
    "deductionType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "recurringStatus" BOOLEAN NOT NULL DEFAULT false,
    "governmentMandatedStatus" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    CONSTRAINT "PayrollDeduction_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollPeriodId" TEXT NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalDate" DATETIME,
    "remarks" TEXT,
    CONSTRAINT "PayrollApproval_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollApproval_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeductionLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "principalAmount" REAL NOT NULL,
    "deductionPerPayroll" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeductionLedger_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeductionLedger_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeductionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerId" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "amountDeducted" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeductionLog_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeductionLog_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "DeductionLedger" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Allowance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "isTaxable" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'PER_PAYROLL',
    "effectiveDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allowance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovernmentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phEmployeeRate" REAL NOT NULL DEFAULT 2.5,
    "phEmployerRate" REAL NOT NULL DEFAULT 2.5,
    "phSalaryFloor" REAL NOT NULL DEFAULT 10000,
    "phSalaryCeiling" REAL NOT NULL DEFAULT 100000,
    "pagibigEmployeeRate" REAL NOT NULL DEFAULT 2.0,
    "pagibigEmployerRate" REAL NOT NULL DEFAULT 2.0,
    "pagibigMaxSalary" REAL NOT NULL DEFAULT 10000,
    "deductionSchedule" TEXT NOT NULL DEFAULT 'SPLIT',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SSSTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveYear" INTEGER NOT NULL DEFAULT 2025,
    "minCompensation" REAL NOT NULL,
    "maxCompensation" REAL NOT NULL,
    "monthlySalaryCredit" REAL NOT NULL,
    "regularSsEmployer" REAL NOT NULL,
    "regularSsEmployee" REAL NOT NULL,
    "ecEmployer" REAL NOT NULL,
    "wispEmployer" REAL NOT NULL,
    "wispEmployee" REAL NOT NULL,
    "totalEmployer" REAL NOT NULL,
    "totalEmployee" REAL NOT NULL,
    "totalContribution" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BIRWithholdingTaxTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveYear" INTEGER NOT NULL DEFAULT 2025,
    "payrollFrequency" TEXT NOT NULL,
    "bracketNo" INTEGER,
    "compensationFrom" REAL NOT NULL,
    "compensationTo" REAL,
    "baseTax" REAL NOT NULL,
    "taxRatePercent" REAL NOT NULL,
    "excessOver" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PayrollAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "actionType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "remarks" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "projectId" TEXT,
    "uploaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "poId" TEXT NOT NULL,
    "receivedById" TEXT,
    "verifierId" TEXT,
    "reviewerId" TEXT,
    "approverId" TEXT,
    "proofFileUrl" TEXT,
    "hasProof" BOOLEAN NOT NULL DEFAULT true,
    "isMismatch" BOOLEAN NOT NULL DEFAULT false,
    "mismatchNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Delivery_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Delivery_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "remarks" TEXT,
    "drQuantity" REAL,
    CONSTRAINT "DeliveryItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsumptionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsumptionLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsumptionLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsumptionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "logId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    CONSTRAINT "ConsumptionItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsumptionItem_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ConsumptionLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialIssuance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "misNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "activity" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "foremanId" TEXT NOT NULL,
    "warehousemanId" TEXT,
    "accountantId" TEXT,
    "releasedById" TEXT,
    "releaseDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialIssuance_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialIssuance_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialIssuance_warehousemanId_fkey" FOREIGN KEY ("warehousemanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialIssuance_foremanId_fkey" FOREIGN KEY ("foremanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialIssuance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssuanceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedQty" REAL NOT NULL,
    "releasedQty" REAL NOT NULL DEFAULT 0,
    "issuanceId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    CONSTRAINT "IssuanceItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssuanceItem_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "MaterialIssuance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrsNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "issuanceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "foremanId" TEXT NOT NULL,
    "warehousemanId" TEXT,
    "receiveDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialReturn_warehousemanId_fkey" FOREIGN KEY ("warehousemanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialReturn_foremanId_fkey" FOREIGN KEY ("foremanId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialReturn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialReturn_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "MaterialIssuance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnedQty" REAL NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "returnId" TEXT NOT NULL,
    "issuanceItemId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    CONSTRAINT "ReturnItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnItem_issuanceItemId_fkey" FOREIGN KEY ("issuanceItemId") REFERENCES "IssuanceItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "MaterialReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountsPayable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "paidAt" DATETIME,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "deliveryId" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "voucherNumber" TEXT,
    CONSTRAINT "AccountsPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccountsPayable_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccountsPayable_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BOQLotBreakdown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "weightPercentage" REAL NOT NULL,
    "boqItemId" TEXT NOT NULL,
    CONSTRAINT "BOQLotBreakdown_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Accomplishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billingPeriod" TEXT NOT NULL,
    "accomplishmentDate" DATETIME NOT NULL,
    "remarks" TEXT,
    "preparedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedAmount" REAL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Accomplishment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccomplishmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workCategory" TEXT,
    "descriptionOfWork" TEXT,
    "previousQuantity" REAL NOT NULL DEFAULT 0,
    "currentQuantityClaimed" REAL NOT NULL DEFAULT 0,
    "approvedQuantity" REAL,
    "totalQuantityToDate" REAL NOT NULL DEFAULT 0,
    "contractQuantity" REAL NOT NULL DEFAULT 0,
    "remainingQuantity" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "currentAccomplishmentAmount" REAL NOT NULL DEFAULT 0,
    "totalAccomplishmentAmount" REAL NOT NULL DEFAULT 0,
    "percentageAccomplished" REAL NOT NULL DEFAULT 0,
    "aiValidationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "inspectionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "accomplishmentId" TEXT NOT NULL,
    "boqItemId" TEXT NOT NULL,
    CONSTRAINT "AccomplishmentItem_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccomplishmentItem_accomplishmentId_fkey" FOREIGN KEY ("accomplishmentId") REFERENCES "Accomplishment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionDateRequested" DATETIME,
    "actualQuantityVerified" REAL NOT NULL DEFAULT 0,
    "approvedQuantity" REAL NOT NULL DEFAULT 0,
    "approvedPercentage" REAL NOT NULL DEFAULT 0,
    "inspectionFindings" TEXT,
    "deficiencies" TEXT,
    "punchlistItems" TEXT,
    "inspectorName" TEXT,
    "dateInspected" DATETIME,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "accomplishmentItemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inspection_accomplishmentItemId_fkey" FOREIGN KEY ("accomplishmentItemId") REFERENCES "AccomplishmentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Billing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billingNumber" TEXT NOT NULL,
    "billingPeriodFrom" DATETIME NOT NULL,
    "billingPeriodTo" DATETIME NOT NULL,
    "billingDate" DATETIME NOT NULL,
    "billingType" TEXT NOT NULL,
    "contractAmount" REAL NOT NULL,
    "revisedContractAmount" REAL NOT NULL,
    "totalPreviousBilling" REAL NOT NULL DEFAULT 0,
    "currentBillingAmount" REAL NOT NULL DEFAULT 0,
    "totalBillingToDate" REAL NOT NULL DEFAULT 0,
    "balanceContractAmount" REAL NOT NULL DEFAULT 0,
    "aiBillingRiskStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "preparedById" TEXT,
    "checkedById" TEXT,
    "approvedById" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Billing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractQuantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "contractAmount" REAL NOT NULL,
    "previousQuantityBilled" REAL NOT NULL DEFAULT 0,
    "currentQuantityForBilling" REAL NOT NULL DEFAULT 0,
    "totalQuantityBilledToDate" REAL NOT NULL DEFAULT 0,
    "previousAmountBilled" REAL NOT NULL DEFAULT 0,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "totalAmountToDate" REAL NOT NULL DEFAULT 0,
    "balanceQuantity" REAL NOT NULL DEFAULT 0,
    "balanceAmount" REAL NOT NULL DEFAULT 0,
    "percentageAccomplished" REAL NOT NULL DEFAULT 0,
    "aiStatus" TEXT,
    "aiRiskLevel" TEXT,
    "billingId" TEXT NOT NULL,
    "boqItemId" TEXT NOT NULL,
    CONSTRAINT "BillingItem_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillingItem_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillingDeduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grossBilling" REAL NOT NULL,
    "retention" REAL NOT NULL DEFAULT 0,
    "withholdingTax" REAL NOT NULL DEFAULT 0,
    "vat" REAL NOT NULL DEFAULT 0,
    "mobilizationAdvanceRecoupment" REAL NOT NULL DEFAULT 0,
    "previousOverpayment" REAL NOT NULL DEFAULT 0,
    "liquidatedDamages" REAL NOT NULL DEFAULT 0,
    "backCharges" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "netAmountDue" REAL NOT NULL,
    "billingId" TEXT NOT NULL,
    CONSTRAINT "BillingDeduction_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billingAmount" REAL NOT NULL,
    "approvedAmount" REAL NOT NULL,
    "netAmountDue" REAL NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentReferenceNumber" TEXT,
    "bankOrCheckNumber" TEXT,
    "orNumber" TEXT,
    "ewtCertificateReference" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "remarks" TEXT,
    "billingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voNumber" TEXT NOT NULL,
    "dateRequested" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedById" TEXT,
    "requestingDepartment" TEXT,
    "variationType" TEXT NOT NULL,
    "variationCategory" TEXT,
    "sourceOfVariation" TEXT,
    "reasonForVariation" TEXT,
    "detailedDescription" TEXT,
    "affectedLocation" TEXT,
    "affectedFloorZone" TEXT,
    "originalContractAmount" REAL NOT NULL DEFAULT 0,
    "totalPreviouslyApprovedAdditive" REAL NOT NULL DEFAULT 0,
    "totalPreviouslyApprovedDeductive" REAL NOT NULL DEFAULT 0,
    "currentRevisedContractAmount" REAL NOT NULL DEFAULT 0,
    "additionalAmount" REAL NOT NULL DEFAULT 0,
    "deductiveAmount" REAL NOT NULL DEFAULT 0,
    "netVariationAmount" REAL NOT NULL DEFAULT 0,
    "percentageImpact" REAL NOT NULL DEFAULT 0,
    "timeImpact" TEXT NOT NULL DEFAULT 'TO_BE_EVALUATED',
    "additionalCalendarDaysRequested" INTEGER NOT NULL DEFAULT 0,
    "effectOnCriticalPath" TEXT NOT NULL DEFAULT 'TO_BE_EVALUATED',
    "effectOnProjectCompletionDate" DATETIME,
    "technicalJustification" TEXT,
    "commercialJustification" TEXT,
    "safetyJustification" TEXT,
    "clientInstructionReference" TEXT,
    "consultantInstructionReference" TEXT,
    "drawingReference" TEXT,
    "siteInstructionReference" TEXT,
    "inspectionReportReference" TEXT,
    "quantityTakeOffReference" TEXT,
    "costEstimateReference" TEXT,
    "supplierQuotationReference" TEXT,
    "subcontractorQuotationReference" TEXT,
    "aiValidationResult" TEXT,
    "aiRiskRating" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalHistory" TEXT,
    "remarks" TEXT,
    "approvedForImplementation" BOOLEAN NOT NULL DEFAULT false,
    "approvedForProcurement" BOOLEAN NOT NULL DEFAULT false,
    "approvedForSubcontracting" BOOLEAN NOT NULL DEFAULT false,
    "approvedForJobOrder" BOOLEAN NOT NULL DEFAULT false,
    "approvedForBilling" BOOLEAN NOT NULL DEFAULT false,
    "subcontractPackageId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariationOrder_subcontractPackageId_fkey" FOREIGN KEY ("subcontractPackageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariationOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariationOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voItemNumber" TEXT NOT NULL,
    "itemClassification" TEXT NOT NULL,
    "workCategory" TEXT,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "originalQuantity" REAL NOT NULL DEFAULT 0,
    "previouslyApprovedQuantity" REAL NOT NULL DEFAULT 0,
    "currentProposedQuantity" REAL NOT NULL DEFAULT 0,
    "revisedQuantity" REAL NOT NULL DEFAULT 0,
    "originalUnitCost" REAL NOT NULL DEFAULT 0,
    "proposedUnitCost" REAL NOT NULL DEFAULT 0,
    "approvedUnitCost" REAL NOT NULL DEFAULT 0,
    "originalAmount" REAL NOT NULL DEFAULT 0,
    "additionalAmount" REAL NOT NULL DEFAULT 0,
    "deductiveAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "costSource" TEXT,
    "pricingBasis" TEXT,
    "materialCost" REAL NOT NULL DEFAULT 0,
    "laborCost" REAL NOT NULL DEFAULT 0,
    "equipmentCost" REAL NOT NULL DEFAULT 0,
    "subcontractCost" REAL NOT NULL DEFAULT 0,
    "transportationCost" REAL NOT NULL DEFAULT 0,
    "consumables" REAL NOT NULL DEFAULT 0,
    "overhead" REAL NOT NULL DEFAULT 0,
    "profitMarkup" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "otherDirectCost" REAL NOT NULL DEFAULT 0,
    "supplierQuotationReference" TEXT,
    "subcontractorQuotationReference" TEXT,
    "canvassReference" TEXT,
    "attachmentReference" TEXT,
    "procurementStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "subcontractStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "accomplishmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "billingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "variationOrderId" TEXT NOT NULL,
    "originalBoqItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariationOrderItem_originalBoqItemId_fkey" FOREIGN KEY ("originalBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariationOrderItem_variationOrderId_fkey" FOREIGN KEY ("variationOrderId") REFERENCES "VariationOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariationOrderDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentCategory" TEXT NOT NULL,
    "remarks" TEXT,
    "uploadedById" TEXT,
    "variationOrderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariationOrderDocument_variationOrderId_fkey" FOREIGN KEY ("variationOrderId") REFERENCES "VariationOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariationOrderApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionById" TEXT,
    "remarks" TEXT,
    "variationOrderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VariationOrderApproval_variationOrderId_fkey" FOREIGN KEY ("variationOrderId") REFERENCES "VariationOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIVariationOrderValidation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "validationType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "findings" TEXT,
    "missingRequirements" TEXT,
    "duplicateWarnings" TEXT,
    "recommendedAction" TEXT,
    "variationOrderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIVariationOrderValidation_variationOrderId_fkey" FOREIGN KEY ("variationOrderId") REFERENCES "VariationOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "dateTaken" DATETIME,
    "metadataStatus" TEXT,
    "description" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "projectId" TEXT NOT NULL,
    "boqItemId" TEXT,
    "accomplishmentId" TEXT,
    CONSTRAINT "EvidenceFile_accomplishmentId_fkey" FOREIGN KEY ("accomplishmentId") REFERENCES "Accomplishment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceFile_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCamera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cameraName" TEXT NOT NULL,
    "cameraLocation" TEXT,
    "cameraType" TEXT,
    "streamUrl" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "gpsLatitude" REAL,
    "gpsLongitude" REAL,
    "installationDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "ProjectCamera_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveCameraSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileUrl" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedById" TEXT,
    "cameraId" TEXT NOT NULL,
    CONSTRAINT "LiveCameraSnapshot_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "ProjectCamera" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "validationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "overallScore" REAL,
    "visualScore" REAL,
    "locationScore" REAL,
    "dateScore" REAL,
    "boqMatchScore" REAL,
    "planMatchScore" REAL,
    "duplicateRiskScore" REAL,
    "recommendation" TEXT,
    "summaryFindings" TEXT,
    "createdById" TEXT,
    "completedAt" DATETIME,
    "projectId" TEXT NOT NULL,
    "accomplishmentId" TEXT,
    "billingId" TEXT,
    "boqItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIValidationRun_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationRun_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationRun_accomplishmentId_fkey" FOREIGN KEY ("accomplishmentId") REFERENCES "Accomplishment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "capturedFromLiveCamera" BOOLEAN NOT NULL DEFAULT false,
    "cameraId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "timestamp" DATETIME,
    "metadataStatus" TEXT,
    "aiValidationRunId" TEXT NOT NULL,
    "evidenceFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIValidationEvidence_evidenceFileId_fkey" FOREIGN KEY ("evidenceFileId") REFERENCES "EvidenceFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationEvidence_aiValidationRunId_fkey" FOREIGN KEY ("aiValidationRunId") REFERENCES "AIValidationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingCategory" TEXT NOT NULL,
    "findingTitle" TEXT NOT NULL,
    "findingDescription" TEXT,
    "severity" TEXT NOT NULL,
    "confidenceScore" REAL,
    "relatedFileId" TEXT,
    "relatedBoqItemId" TEXT,
    "recommendedAction" TEXT,
    "aiValidationRunId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIValidationFinding_aiValidationRunId_fkey" FOREIGN KEY ("aiValidationRunId") REFERENCES "AIValidationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIDuplicatePhotoCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentFileId" TEXT NOT NULL,
    "matchedFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "similarityScore" REAL NOT NULL,
    "matchType" TEXT NOT NULL,
    "previousBillingId" TEXT,
    "previousAccomplishmentId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIHumanReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "remarks" TEXT,
    "overrideReason" TEXT,
    "aiValidationRunId" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIHumanReview_aiValidationRunId_fkey" FOREIGN KEY ("aiValidationRunId") REFERENCES "AIValidationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "tin" TEXT,
    "birReg" TEXT,
    "dtiSecReg" TEXT,
    "mayorPermit" TEXT,
    "pcabLicense" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "specialization" JSONB,
    "accreditation" TEXT NOT NULL DEFAULT 'PENDING',
    "contractType" TEXT NOT NULL DEFAULT 'SUBCONTRACTOR',
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocs" JSONB,
    "docExpiries" JSONB,
    "safetyRecords" JSONB,
    "evaluationRating" INTEGER,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProgramOfWorks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "activities" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramOfWorks_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractorBOQItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subcontractorId" TEXT NOT NULL,
    "awardedBoqItemId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubcontractorBOQItem_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractorBOQItem_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccomplishmentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobOrderId" TEXT NOT NULL,
    "description" TEXT,
    "quantityCompleted" REAL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photos" JSONB,
    "videos" JSONB,
    "aiValidationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccomplishmentRecord_aiValidationId_fkey" FOREIGN KEY ("aiValidationId") REFERENCES "AIValidationResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccomplishmentRecord_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billingId" TEXT NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentRecord_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "SubcontractBilling" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "score" REAL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SubcontractPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "workCategory" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "awardedBoqItemId" TEXT,
    "masterBoqItemId" TEXT,
    "scopeOfWork" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "floorBuildingZone" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "contractAmount" REAL NOT NULL,
    "internalBudget" REAL,
    "costType" TEXT NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "retentionPct" REAL,
    "whtPct" REAL,
    "mobilizationAdvance" REAL,
    "startDate" DATETIME,
    "targetCompletion" DATETIME,
    "warrantyPeriod" INTEGER,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    CONSTRAINT "SubcontractPackage_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractPackage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractPackage_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT,
    "packageId" TEXT,
    "description" TEXT NOT NULL,
    "boqReferenceId" TEXT,
    "location" TEXT NOT NULL,
    "contractAmount" REAL NOT NULL,
    "paymentBasis" TEXT NOT NULL,
    "startDate" DATETIME,
    "completionDate" DATETIME,
    "requiredOutput" TEXT,
    "materialResponsibility" TEXT NOT NULL,
    "safetyRequirements" TEXT,
    "acceptanceCriteria" TEXT,
    "attachments" JSONB,
    "preparedBy" TEXT,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    CONSTRAINT "JobOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobOrder_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobOrder_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractAccomplishment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT,
    "jobOrderId" TEXT,
    "workDescription" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "prevPercent" REAL NOT NULL,
    "currentPercent" REAL NOT NULL,
    "cumulativePercent" REAL NOT NULL,
    "prevQty" REAL NOT NULL,
    "currentQty" REAL NOT NULL,
    "totalQty" REAL NOT NULL,
    "remainingQty" REAL NOT NULL,
    "photos" JSONB,
    "videos" JSONB,
    "inspectionReport" TEXT,
    "qaQcStatus" TEXT,
    "materialIssuedRef" TEXT,
    "deliveryRef" TEXT,
    "remarks" TEXT,
    "preparedBy" TEXT,
    "verifiedBy" TEXT,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubcontractAccomplishment_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractAccomplishment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billingNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "packageId" TEXT,
    "jobOrderId" TEXT,
    "contractAmount" REAL NOT NULL,
    "previousGross" REAL NOT NULL,
    "currentGross" REAL NOT NULL,
    "totalGross" REAL NOT NULL,
    "remainingBalance" REAL NOT NULL,
    "retentionDeduction" REAL,
    "whtDeduction" REAL,
    "mobilizationDeduction" REAL,
    "backCharges" REAL,
    "materialCharges" REAL,
    "penalties" REAL,
    "otherDeductions" REAL,
    "netPayable" REAL NOT NULL,
    "billingPeriod" TEXT,
    "supportingDocs" JSONB,
    "aiValidationResult" JSONB,
    "accountingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubcontractBilling_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractBilling_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractBilling_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractBilling_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "backChargeNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "packageId" TEXT,
    "jobOrderId" TEXT,
    "description" TEXT NOT NULL,
    "incidentDate" DATETIME,
    "costComputation" REAL NOT NULL,
    "photos" JSONB,
    "inspectionReport" TEXT,
    "materialRef" TEXT,
    "manpowerRef" TEXT,
    "amount" REAL NOT NULL,
    "acknowledgment" TEXT NOT NULL DEFAULT 'PENDING',
    "disputeStatus" TEXT NOT NULL DEFAULT 'NONE',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "deductionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BackCharge_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BackCharge_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BackCharge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollCutoffSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cutoffName" TEXT NOT NULL,
    "cutoffType" TEXT NOT NULL,
    "startDay" INTEGER,
    "endDay" INTEGER,
    "payrollReleaseDay" INTEGER,
    "crossesMonth" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledgeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notebookType" TEXT NOT NULL,
    "notebookUrl" TEXT,
    "relatedModule" TEXT,
    "documentType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "owner" TEXT,
    "preparedBy" TEXT,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReviewed" DATETIME,
    "dateApproved" DATETIME,
    "tags" TEXT,
    "uploadedFileUrl" TEXT,
    "summary" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledgeRecordId" TEXT NOT NULL,
    "projectId" TEXT,
    "workerId" TEXT,
    "payrollPeriodId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeReference_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeReference_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeReference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeReference_knowledgeRecordId_fkey" FOREIGN KEY ("knowledgeRecordId") REFERENCES "KnowledgeRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeAuditTrail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledgeRecordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeAuditTrail_knowledgeRecordId_fkey" FOREIGN KEY ("knowledgeRecordId") REFERENCES "KnowledgeRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollBankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "beginningBalance" REAL NOT NULL DEFAULT 0,
    "currentAvailableBalance" REAL NOT NULL DEFAULT 0,
    "reservedPayrollBalance" REAL NOT NULL DEFAULT 0,
    "actualBankBalance" REAL NOT NULL DEFAULT 0,
    "lastBalanceSyncDate" DATETIME,
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bankApiProvider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT
);

-- CreateTable
CREATE TABLE "PayrollBankLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollBankAccountId" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "PayrollBankLedger_payrollBankAccountId_fkey" FOREIGN KEY ("payrollBankAccountId") REFERENCES "PayrollBankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollFundingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundingRequestNumber" TEXT NOT NULL,
    "payrollBatchId" TEXT,
    "payrollPeriodId" TEXT NOT NULL,
    "totalNetPay" REAL NOT NULL,
    "estimatedCharges" REAL NOT NULL,
    "totalRequiredFunding" REAL NOT NULL,
    "availablePayrollBalance" REAL NOT NULL,
    "fundingShortage" REAL NOT NULL,
    "fundingSourceAccount" TEXT,
    "destinationAccountId" TEXT NOT NULL,
    "fundingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "preparedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "dateFunded" DATETIME,
    "fundingBankReferenceNumber" TEXT,
    "proofOfTransferUrl" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollFundingRequest_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "PayrollBankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollFundingRequest_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "payrollBatchId" TEXT,
    "payrollPeriodId" TEXT NOT NULL,
    "paymentMethodType" TEXT NOT NULL,
    "transferRail" TEXT,
    "providerId" TEXT,
    "providerBatchReference" TEXT,
    "expectedSettlementDate" DATETIME,
    "payrollBankAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" REAL NOT NULL,
    "totalWorkers" INTEGER NOT NULL,
    "preparedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "releasedById" TEXT,
    "dateReleased" DATETIME,
    "reconciliationFileUrl" TEXT,
    "remarks" TEXT,
    "aiRiskLevel" TEXT,
    "aiAuditNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentBatch_payrollBankAccountId_fkey" FOREIGN KEY ("payrollBankAccountId") REFERENCES "PayrollBankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentBatch_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "PaymentProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentBatch_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentBatchRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentBatchId" TEXT NOT NULL,
    "payrollId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "transferRail" TEXT,
    "recipientBankName" TEXT,
    "recipientBankCode" TEXT,
    "recipientAccountNumber" TEXT,
    "recipientAccountName" TEXT,
    "gcashMobileNumber" TEXT,
    "gcashAccountName" TEXT,
    "remarks" TEXT,
    "senderReferenceId" TEXT,
    "idempotencyKey" TEXT,
    "originalInstaPayReference" TEXT,
    "unionBankTransactionReference" TEXT,
    "providerResponseCode" TEXT,
    "providerResponseMessage" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "expectedSettlementDate" DATETIME,
    "datePaid" DATETIME,
    "rawApiResponseReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionReference" TEXT,
    "exceptionReason" TEXT,
    "reconciledAt" DATETIME,
    CONSTRAINT "PaymentBatchRow_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentBatchRow_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentBatchRow_paymentBatchId_fkey" FOREIGN KEY ("paymentBatchId") REFERENCES "PaymentBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payrollBatchId" TEXT,
    "payrollId" TEXT,
    "workerId" TEXT NOT NULL,
    "requiredPaymentMethod" TEXT,
    "exceptionReason" TEXT NOT NULL,
    "correctiveAction" TEXT,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "approvedById" TEXT,
    "dateResolved" DATETIME,
    "reprocessedTransactionRef" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "amount" REAL,
    "apiPaymentBatchId" TEXT,
    "payslipNumber" TEXT,
    "recipientBankCode" TEXT,
    "recipientBankName" TEXT,
    "transferRail" TEXT,
    "unionBankResponseCode" TEXT,
    "unionBankResponseMessage" TEXT,
    CONSTRAINT "PaymentException_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "transferRail" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'Sandbox',
    "apiBaseUrlSandbox" TEXT,
    "apiBaseUrlProduction" TEXT,
    "oauthTokenUrl" TEXT,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "partnerId" TEXT,
    "corporateAccountNumber" TEXT,
    "debitAccountNumber" TEXT,
    "debitAccountName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "webhookUrl" TEXT,
    "webhookSigningSecret" TEXT,
    "statusCallbackUrl" TEXT,
    "singleTransactionLimit" REAL,
    "dailyTransactionLimit" REAL,
    "monthlyTransactionLimit" REAL,
    "cutOffTime" TEXT,
    "expectedSettlementTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "lastConnectionTest" DATETIME,
    "createdById" TEXT,
    "approvedById" TEXT,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateActivated" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReceivingBank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "shortName" TEXT,
    "instaPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pesonetEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rawApiReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentFallbackRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payslipNumber" TEXT,
    "workerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "originalIntendedRoute" TEXT NOT NULL DEFAULT 'InstaPay',
    "fallbackRoute" TEXT NOT NULL DEFAULT 'PESONet',
    "fallbackReason" TEXT NOT NULL,
    "originalInstaPayRef" TEXT,
    "recommendedBy" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvalDate" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentFallbackRecommendation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "parsedData" JSONB,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentTemplate_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAccomplishmentFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "billingId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalFilePath" TEXT NOT NULL,
    "workingFilePath" TEXT,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileVersion" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isLockedOriginal" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "ProjectAccomplishmentFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAccomplishmentFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAccomplishmentFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAccomplishmentFileVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "savedBy" TEXT,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    CONSTRAINT "ProjectAccomplishmentFileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ProjectAccomplishmentFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectAccomplishmentAIFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "billingId" TEXT,
    "findingType" TEXT NOT NULL,
    "sheetName" TEXT,
    "cellReference" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "recommendation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectAccomplishmentAIFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectAccomplishmentAIFinding_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ProjectAccomplishmentFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeRuleReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notebookName" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "ruleCategory" TEXT NOT NULL,
    "ruleTitle" TEXT NOT NULL,
    "ruleDescription" TEXT NOT NULL,
    "affectedProcess" TEXT,
    "validationType" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'BLOCK',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedDate" DATETIME,
    "sourceLink" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeRuleAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "moduleName" TEXT NOT NULL,
    "notebookName" TEXT NOT NULL,
    "ruleApplied" TEXT NOT NULL,
    "validationResult" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "userAction" TEXT,
    "overrideRequested" BOOLEAN NOT NULL DEFAULT false,
    "overrideApprovedBy" TEXT,
    "overrideReason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleName" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEditDraft" BOOLEAN NOT NULL DEFAULT false,
    "canSubmit" BOOLEAN NOT NULL DEFAULT false,
    "canReview" BOOLEAN NOT NULL DEFAULT false,
    "canRecommend" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canReject" BOOLEAN NOT NULL DEFAULT false,
    "canReturnForCorrection" BOOLEAN NOT NULL DEFAULT false,
    "canCancel" BOOLEAN NOT NULL DEFAULT false,
    "canRevise" BOOLEAN NOT NULL DEFAULT false,
    "canLock" BOOLEAN NOT NULL DEFAULT false,
    "canUnlockWithAuthorization" BOOLEAN NOT NULL DEFAULT false,
    "canReleasePayment" BOOLEAN NOT NULL DEFAULT false,
    "canMarkAsPaid" BOOLEAN NOT NULL DEFAULT false,
    "canUploadAttachment" BOOLEAN NOT NULL DEFAULT false,
    "canDownloadAttachment" BOOLEAN NOT NULL DEFAULT false,
    "canPrint" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteDraft" BOOLEAN NOT NULL DEFAULT false,
    "canVoidRecord" BOOLEAN NOT NULL DEFAULT false,
    "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stageName" TEXT NOT NULL,
    "requiredRole" TEXT NOT NULL,
    "actionRequired" TEXT NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "preparedBy" TEXT,
    "preparedByRole" TEXT,
    "reviewedBy" TEXT,
    "reviewedByRole" TEXT,
    "recommendedBy" TEXT,
    "recommendedByRole" TEXT,
    "approvedBy" TEXT,
    "approvedByRole" TEXT,
    "paidBy" TEXT,
    "paidByRole" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStage" TEXT NOT NULL DEFAULT 'PREPARATION',
    "nextRequiredRole" TEXT,
    "datePrepared" DATETIME,
    "dateReviewed" DATETIME,
    "dateRecommended" DATETIME,
    "dateApproved" DATETIME,
    "datePaid" DATETIME,
    "remarks" TEXT,
    "auditReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userRole" TEXT,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT,
    "actionType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "remarks" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "validationType" TEXT NOT NULL,
    "validationResult" TEXT NOT NULL,
    "riskLevel" TEXT,
    "aiFindings" TEXT,
    "aiRecommendation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIValidationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LockedRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "lockedBy" TEXT,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT
);

-- CreateTable
CREATE TABLE "RevisionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "processedBy" TEXT NOT NULL,
    "processedByRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserLoginLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserLoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoleConflictRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role1Code" TEXT NOT NULL,
    "role2Code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AINotebookReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByRole" TEXT,
    "projectAssignment" TEXT,
    "moduleAssignment" TEXT,
    "referenceCategory" TEXT NOT NULL,
    "effectiveDate" DATETIME,
    "expiryDate" DATETIME,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING_AI_INDEXING',
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "supersededById" TEXT,
    "approvedBy" TEXT,
    "approvedDate" DATETIME,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "aiIndexingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "aiSummary" TEXT,
    "keywords" TEXT,
    "validationUseCase" TEXT,
    "fileHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "moduleScope" TEXT,
    "projectScope" TEXT,
    "companyWide" BOOLEAN NOT NULL DEFAULT false,
    "mandatoryFlag" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT_UPLOAD',
    "activeVersionId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByRole" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedByRole" TEXT,
    "effectiveDate" DATETIME,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotebookReferenceVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "extractedText" TEXT,
    "aiSummary" TEXT,
    "aiKeywords" TEXT,
    "fileHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "indexedStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "effectiveDate" DATETIME,
    "supersededDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotebookReferenceVersion_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookReferenceModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    CONSTRAINT "NotebookReferenceModule_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookReferenceRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    CONSTRAINT "NotebookReferenceRole_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookReferenceProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "NotebookReferenceProject_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookReferenceApprovalLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionByUserId" TEXT NOT NULL,
    "actionByUserRole" TEXT,
    "comments" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotebookReferenceApprovalLog_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotebookReferenceIndexLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotebookReferenceIndexLog_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AITransactionValidation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "validationType" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceVersionId" TEXT,
    "validationStatus" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "aiFindings" TEXT,
    "aiRecommendation" TEXT,
    "blockingFlag" BOOLEAN NOT NULL DEFAULT false,
    "overrideAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AITransactionValidation_referenceVersionId_fkey" FOREIGN KEY ("referenceVersionId") REFERENCES "NotebookReferenceVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AITransactionValidation_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "validationResultId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "overriddenBy" TEXT NOT NULL,
    "overriddenByRole" TEXT NOT NULL,
    "overrideReason" TEXT NOT NULL,
    "supportingAttachment" TEXT,
    "approvedBy" TEXT,
    "approvedByRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIValidationOverride_validationResultId_fkey" FOREIGN KEY ("validationResultId") REFERENCES "AITransactionValidation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIRiskScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "reasons" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIModulePrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIAuditFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT,
    "moduleName" TEXT,
    "findingType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AISearchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "moduleScope" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AINotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "moduleName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIReferenceUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceId" TEXT NOT NULL,
    "transactionId" TEXT,
    "moduleName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIReferenceUsageLog_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "NotebookReference" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanvassForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canvassNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "mrId" TEXT,
    "projectId" TEXT NOT NULL,
    "preparedById" TEXT,
    "recommendedSupplierId" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CanvassForm_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvassForm_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvassForm_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "MaterialRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanvassItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantityRequired" REAL NOT NULL,
    "canvassFormId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    CONSTRAINT "CanvassItem_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanvassItem_canvassFormId_fkey" FOREIGN KEY ("canvassFormId") REFERENCES "CanvassForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierQuotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "deliveryPeriod" TEXT,
    "paymentTerms" TEXT,
    "aiRank" INTEGER,
    "aiRationale" TEXT,
    "canvassFormId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fileUrl" TEXT,
    CONSTRAINT "SupplierQuotation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierQuotation_canvassFormId_fkey" FOREIGN KEY ("canvassFormId") REFERENCES "CanvassForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitCost" REAL NOT NULL,
    "quantityAvailable" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "brand" TEXT,
    "remarks" TEXT,
    "quotationId" TEXT NOT NULL,
    "canvassItemId" TEXT NOT NULL,
    CONSTRAINT "QuotationItem_canvassItemId_fkey" FOREIGN KEY ("canvassItemId") REFERENCES "CanvassItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SupplierQuotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "plateNumber" TEXT,
    "ownershipType" TEXT NOT NULL DEFAULT 'OWNED',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "hourlyRate" REAL DEFAULT 0,
    "purchaseDate" DATETIME,
    "fmsDeviceId" TEXT,
    "fmsProvider" TEXT,
    "lastOdometer" REAL DEFAULT 0,
    "lastEngineHours" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedDepartment" TEXT,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "fuelType" TEXT DEFAULT 'DIESEL'
);

-- CreateTable
CREATE TABLE "EquipmentDeployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "driverId" TEXT,
    "targetDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" DATETIME,
    "dateDeployed" DATETIME,
    "dateReturned" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "purpose" TEXT,
    "notes" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "destinationAddress" TEXT,
    "destinationLat" REAL,
    "destinationLng" REAL,
    CONSTRAINT "EquipmentDeployment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentDeployment_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentDeployment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentDeployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentDeployment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentUtilization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hoursUsed" REAL NOT NULL DEFAULT 0,
    "fuelConsumed" REAL NOT NULL DEFAULT 0,
    "taskDescription" TEXT,
    "loggedBy" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipmentUtilization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquipmentUtilization_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentMaintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "cost" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "fmsFaultCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipmentMaintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentTelemetry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL,
    "longitude" REAL,
    "speed" REAL,
    "engineState" TEXT,
    "odometer" REAL,
    "engineHours" REAL,
    "fuelLevel" REAL,
    "faultCodes" TEXT,
    "gpsAccuracy" REAL,
    "heading" REAL,
    "ignitionStatus" BOOLEAN,
    "locationSource" TEXT,
    "rawPayloadJson" TEXT,
    "receivedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "satelliteCount" INTEGER,
    CONSTRAINT "EquipmentTelemetry_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentAIValidation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EquipmentAIValidation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HikvisionDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceName" TEXT NOT NULL,
    "deviceModel" TEXT,
    "deviceSerialNumber" TEXT NOT NULL,
    "imeiOrUniqueId" TEXT,
    "firmwareVersion" TEXT,
    "integrationType" TEXT NOT NULL DEFAULT 'DEVICE_GATEWAY',
    "ipAddress" TEXT,
    "domainName" TEXT,
    "port" INTEGER,
    "usernameEncrypted" TEXT,
    "passwordEncrypted" TEXT,
    "apiKeyReference" TEXT,
    "rtspUrlEncrypted" TEXT,
    "deviceGatewayId" TEXT,
    "hikcentralResourceId" TEXT,
    "hikconnectDeviceId" TEXT,
    "simNumber" TEXT,
    "simProvider" TEXT,
    "installationDate" DATETIME,
    "installedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" DATETIME,
    "lastGpsAt" DATETIME,
    "remarks" TEXT,
    "equipmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HikvisionDevice_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FleetEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT,
    "deviceId" TEXT,
    "driverId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "eventTime" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL,
    "longitude" REAL,
    "speedKph" REAL,
    "heading" REAL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "acknowledgedById" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "rawPayloadJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FleetEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FleetEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VideoEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fleetEventId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "deviceId" TEXT,
    "channelNo" INTEGER,
    "evidenceType" TEXT NOT NULL DEFAULT 'SNAPSHOT',
    "fileUrl" TEXT,
    "playbackStartTime" DATETIME,
    "playbackEndTime" DATETIME,
    "thumbnailUrl" TEXT,
    "storageLocation" TEXT,
    "retentionUntil" DATETIME,
    "checksum" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoEvidence_fleetEventId_fkey" FOREIGN KEY ("fleetEventId") REFERENCES "FleetEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FleetTrip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "driverId" TEXT,
    "deviceId" TEXT,
    "tripStartTime" DATETIME NOT NULL,
    "tripEndTime" DATETIME,
    "startLatitude" REAL,
    "startLongitude" REAL,
    "endLatitude" REAL,
    "endLongitude" REAL,
    "startAddress" TEXT,
    "endAddress" TEXT,
    "totalDistanceKm" REAL,
    "maxSpeedKph" REAL,
    "averageSpeedKph" REAL,
    "idleDurationMinutes" REAL,
    "tripStatus" TEXT NOT NULL DEFAULT 'ONGOING',
    "projectId" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subcontractPackageId" TEXT,
    CONSTRAINT "FleetTrip_subcontractPackageId_fkey" FOREIGN KEY ("subcontractPackageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FleetTrip_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FleetTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FleetTrip_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PROJECT_SITE',
    "polygonOrRadiusJson" TEXT NOT NULL,
    "address" TEXT,
    "projectId" TEXT,
    "alertOnEntry" BOOLEAN NOT NULL DEFAULT true,
    "alertOnExit" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subcontractPackageId" TEXT,
    CONSTRAINT "Geofence_subcontractPackageId_fkey" FOREIGN KEY ("subcontractPackageId") REFERENCES "SubcontractPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Geofence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FleetAIReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fleetEventId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "driverId" TEXT,
    "aiSummary" TEXT NOT NULL,
    "aiRiskScore" REAL,
    "aiRecommendation" TEXT,
    "aiValidationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FleetAIReview_fleetEventId_fkey" FOREIGN KEY ("fleetEventId") REFERENCES "FleetEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutiveDashboardPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'HOME',
    "defaultDateRange" TEXT NOT NULL DEFAULT 'THIS_MONTH',
    "defaultProjectFilter" TEXT,
    "visibleWidgets" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExecutiveDashboardPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutiveAlertLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertType" TEXT NOT NULL,
    "projectId" TEXT,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceModule" TEXT,
    "sourceTransactionId" TEXT,
    "financialImpact" REAL,
    "operationalImpact" TEXT,
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedTo" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ExecutiveAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "moduleAccessed" TEXT NOT NULL,
    "projectId" TEXT,
    "transactionId" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutiveAccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIExecutiveQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "scopeType" TEXT,
    "projectId" TEXT,
    "dateRangeStart" DATETIME,
    "dateRangeEnd" DATETIME,
    "aiResponse" TEXT NOT NULL,
    "sourceReferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIExecutiveQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIGeneratedReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportCode" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "projectId" TEXT,
    "departmentId" TEXT,
    "dateRangeStart" DATETIME,
    "dateRangeEnd" DATETIME,
    "generatedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "aiSummary" TEXT,
    "aiFindings" TEXT,
    "aiRecommendations" TEXT,
    "sourceReferences" TEXT,
    "filePdfUrl" TEXT,
    "fileExcelUrl" TEXT,
    "fileDocxUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIGeneratedReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIGeneratedReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIGeneratedReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIGeneratedReportVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "editedById" TEXT NOT NULL,
    "aiSummary" TEXT,
    "aiFindings" TEXT,
    "aiRecommendations" TEXT,
    "managementRemarks" TEXT,
    "sourceReferences" TEXT,
    "filePdfUrl" TEXT,
    "fileExcelUrl" TEXT,
    "fileDocxUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIGeneratedReportVersion_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIGeneratedReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AIGeneratedReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boqWeight" REAL NOT NULL DEFAULT 20,
    "plansWeight" REAL NOT NULL DEFAULT 15,
    "photoWeight" REAL NOT NULL DEFAULT 15,
    "droneWeight" REAL NOT NULL DEFAULT 15,
    "cctvWeight" REAL NOT NULL DEFAULT 10,
    "satelliteWeight" REAL NOT NULL DEFAULT 10,
    "deliveryWeight" REAL NOT NULL DEFAULT 5,
    "scheduleWeight" REAL NOT NULL DEFAULT 5,
    "approvalWeight" REAL NOT NULL DEFAULT 5,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ValidationSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIValidationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "moduleSource" TEXT NOT NULL,
    "relatedDocumentId" TEXT,
    "relatedBillingId" TEXT,
    "relatedBoqItemId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "evidenceFileUrl" TEXT,
    "aiFindings" TEXT NOT NULL,
    "aiConfidenceScore" REAL NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "approvalAction" TEXT,
    "overrideReason" TEXT,
    "auditTrailRef" TEXT,
    "findingsData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIValidationRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIValidationRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectValidationScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "reportedProgress" REAL NOT NULL DEFAULT 0,
    "aiValidatedProgress" REAL NOT NULL DEFAULT 0,
    "billingProgress" REAL NOT NULL DEFAULT 0,
    "paidProgress" REAL NOT NULL DEFAULT 0,
    "scheduleVariance" REAL NOT NULL DEFAULT 0,
    "costVariance" REAL NOT NULL DEFAULT 0,
    "validationConfidenceScore" REAL NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'GRAY',
    "evidenceCompletenessScore" REAL NOT NULL DEFAULT 0,
    "executiveRecommendation" TEXT,
    "requiredAction" TEXT,
    "latestValidationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectValidationScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationEvidencePack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "relatedBillingId" TEXT,
    "relatedAccomplishId" TEXT,
    "executiveSummary" TEXT,
    "claimedAccomplish" REAL,
    "aiValidatedAccomplish" REAL,
    "billingAmount" REAL,
    "riskFindings" TEXT,
    "finalRecommendation" TEXT,
    "filePdfUrl" TEXT,
    "fileExcelUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationEvidencePack_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValidationEvidencePack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "validationRecordId" TEXT,
    "aiScoreAtTime" REAL,
    "aiFindingsAtTime" TEXT,
    "manualOverrideReason" TEXT,
    "approvalRemarks" TEXT,
    "evidenceVersion" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCostLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "costDate" DATETIME NOT NULL,
    "costCategory" TEXT NOT NULL,
    "costType" TEXT NOT NULL DEFAULT 'DIRECT',
    "directIndirect" TEXT NOT NULL DEFAULT 'DIRECT',
    "supplierName" TEXT,
    "subcontractorName" TEXT,
    "workerName" TEXT,
    "referenceDocumentType" TEXT,
    "referenceDocumentNo" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "grossAmount" REAL NOT NULL DEFAULT 0,
    "vatAmount" REAL NOT NULL DEFAULT 0,
    "withholdingTaxAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "unpaidBalance" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "encodedById" TEXT,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    "awardedBoqItemId" TEXT,
    CONSTRAINT "ProjectCostLedger_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCostLedger_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectCostLedger_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommitmentLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "commitmentType" TEXT NOT NULL,
    "supplierName" TEXT,
    "subcontractorName" TEXT,
    "workerName" TEXT,
    "approvedAmount" REAL NOT NULL DEFAULT 0,
    "deliveredAmount" REAL NOT NULL DEFAULT 0,
    "billedAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "remainingCommitment" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    "awardedBoqItemId" TEXT,
    CONSTRAINT "CommitmentLedger_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommitmentLedger_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommitmentLedger_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractorVariationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "svoNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "originalSubcontractId" TEXT,
    "originalBenchmarkQty" REAL NOT NULL DEFAULT 0,
    "originalBenchmarkAmt" REAL NOT NULL DEFAULT 0,
    "originalSubcontractQty" REAL NOT NULL DEFAULT 0,
    "originalSubcontractAmt" REAL NOT NULL DEFAULT 0,
    "proposedAdditionalQty" REAL NOT NULL DEFAULT 0,
    "proposedAdditionalAmt" REAL NOT NULL DEFAULT 0,
    "revisedSubcontractQty" REAL NOT NULL DEFAULT 0,
    "revisedSubcontractAmt" REAL NOT NULL DEFAULT 0,
    "reason" TEXT,
    "costImpact" TEXT,
    "scheduleImpact" TEXT,
    "profitabilityImpact" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "preparedById" TEXT,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    "awardedBoqItemId" TEXT,
    CONSTRAINT "SubcontractorVariationOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractorVariationOrder_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubcontractorVariationOrder_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientVariationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cvoNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "awardedBoqItemId" TEXT,
    CONSTRAINT "ClientVariationOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientVariationOrder_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValueEngineeringRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT,
    "currentCost" REAL NOT NULL DEFAULT 0,
    "proposedCost" REAL NOT NULL DEFAULT 0,
    "estimatedSavings" REAL NOT NULL DEFAULT 0,
    "actualSavingsAchieved" REAL NOT NULL DEFAULT 0,
    "qualityImpact" TEXT,
    "safetyImpact" TEXT,
    "contractImpact" TEXT,
    "requiredApproval" TEXT,
    "aiRecommendation" TEXT,
    "humanReviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "finalApprovalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consolidatedBoqItemId" TEXT,
    "awardedBoqItemId" TEXT,
    CONSTRAINT "ValueEngineeringRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValueEngineeringRecord_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ValueEngineeringRecord_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baselineStartDate" DATETIME,
    "baselineFinishDate" DATETIME,
    "currentStartDate" DATETIME,
    "currentFinishDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualFinishDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calendarDays" INTEGER NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "holidays" TEXT,
    "workDaysConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleWBS" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleWBS_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleWBS_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ScheduleWBS" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "wbsId" TEXT,
    "activityCode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discipline" TEXT,
    "plannedStartDate" DATETIME,
    "plannedFinishDate" DATETIME,
    "plannedDuration" INTEGER NOT NULL DEFAULT 0,
    "actualStartDate" DATETIME,
    "actualFinishDate" DATETIME,
    "actualDuration" INTEGER,
    "baselineStartDate" DATETIME,
    "baselineFinishDate" DATETIME,
    "plannedQuantity" REAL NOT NULL DEFAULT 0,
    "actualQuantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "plannedWeight" REAL NOT NULL DEFAULT 0,
    "actualProgressPercent" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "criticalPath" BOOLEAN NOT NULL DEFAULT false,
    "totalFloat" INTEGER NOT NULL DEFAULT 0,
    "freeFloat" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "subcontractorId" TEXT,
    "jobOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleActivity_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleActivity_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "ScheduleWBS" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleActivity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "predecessorId" TEXT NOT NULL,
    "successorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FS',
    "lagDays" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    CONSTRAINT "ScheduleDependency_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" DATETIME NOT NULL,
    "actualDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleMilestone_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleBOQMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "awardedBoqItemId" TEXT NOT NULL,
    "mappedQuantity" REAL NOT NULL DEFAULT 0,
    "mappedWeight" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ScheduleBOQMapping_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBOQMapping_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchedulePOWMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "programOfWorksId" TEXT NOT NULL,
    CONSTRAINT "SchedulePOWMapping_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SchedulePOWMapping_programOfWorksId_fkey" FOREIGN KEY ("programOfWorksId") REFERENCES "ProgramOfWorks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleProgressUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "updateDate" DATETIME NOT NULL,
    "progressPercent" REAL NOT NULL,
    "actualQuantity" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "reportedById" TEXT,
    "accomplishmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleProgressUpdate_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleProgressUpdate_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleProgressUpdate_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleDelayRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "delayStartDate" DATETIME NOT NULL,
    "delayEndDate" DATETIME,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "cause" TEXT NOT NULL,
    "impactToCriticalPath" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reportedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleDelayRecord_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleDelayRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleDelayRecord_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleRecoveryPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "targetActivityId" TEXT,
    "delayCause" TEXT NOT NULL,
    "requiredAction" TEXT NOT NULL,
    "targetRecoveryDate" DATETIME,
    "estimatedRecoveredDays" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleRecoveryPlan_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleRevisionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "delayImpact" INTEGER NOT NULL DEFAULT 0,
    "costImpact" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleRevisionRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiKnowledgeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "moduleName" TEXT,
    "projectId" TEXT,
    "filePath" TEXT,
    "storageUrl" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "visibilityScope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "allowedRoles" TEXT,
    "allowedProjects" TEXT,
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'PUBLIC_INTERNAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "indexedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiKnowledgeSource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiKnowledgeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkSummary" TEXT,
    "moduleName" TEXT,
    "projectId" TEXT,
    "allowedRoles" TEXT,
    "visibilityScope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'PUBLIC_INTERNAL',
    "vectorEmbedding" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiKnowledgeChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AiKnowledgeSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "moduleName" TEXT,
    "sessionTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorizedContextUsed" TEXT,
    "citedSources" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAccessAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userRole" TEXT,
    "projectId" TEXT,
    "question" TEXT NOT NULL,
    "answerStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "denialReason" TEXT,
    "sourcesRetrieved" INTEGER NOT NULL DEFAULT 0,
    "sourcesDenied" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAccessAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiIndexingJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChatbotFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditLogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "correctionNote" TEXT,
    "adminAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatbotFeedback_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "AiAccessAuditLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatbotFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiRagKeywordRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "normalizedKeyword" TEXT NOT NULL,
    "keywordType" TEXT NOT NULL,
    "moduleName" TEXT,
    "relatedModule" TEXT,
    "databaseTable" TEXT,
    "databaseField" TEXT,
    "businessMeaning" TEXT,
    "synonyms" TEXT,
    "aliases" TEXT,
    "abbreviations" TEXT,
    "relatedTerms" TEXT,
    "exampleUserQuestions" TEXT,
    "requiredRoleAccess" TEXT,
    "requiredModulePermission" TEXT,
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "projectScoped" BOOLEAN NOT NULL DEFAULT false,
    "documentScoped" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourcePriority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "mergedAt" DATETIME,
    "cleanupNotes" TEXT,
    "sourceOrigin" TEXT,
    "generatedBy" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiRagKeywordRegistry_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "AiRagKeywordRegistry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiRagSchemaMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleName" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldAlias" TEXT,
    "fieldDescription" TEXT,
    "dataType" TEXT NOT NULL,
    "relationshipTable" TEXT,
    "relationshipField" TEXT,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "comparable" BOOLEAN NOT NULL DEFAULT false,
    "aggregatable" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "requiredAccessRole" TEXT,
    "requiredPermission" TEXT,
    "projectScoped" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiRagEmbedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceModule" TEXT,
    "sourceRecordId" TEXT,
    "sourceTitle" TEXT NOT NULL,
    "sourceTextChunk" TEXT NOT NULL,
    "embeddingVector" TEXT NOT NULL,
    "metadataJson" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "projectId" TEXT,
    "modulePermissionRequired" TEXT,
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiKnowledgeMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "moduleName" TEXT,
    "tableName" TEXT,
    "fieldName" TEXT,
    "fieldLabel" TEXT,
    "normalizedName" TEXT NOT NULL,
    "businessMeaning" TEXT,
    "detectedKeywords" TEXT,
    "generatedAliases" TEXT,
    "generatedSynonyms" TEXT,
    "abbreviations" TEXT,
    "relatedTerms" TEXT,
    "relatedModules" TEXT,
    "relatedTables" TEXT,
    "relatedFields" TEXT,
    "relationshipType" TEXT,
    "sampleQuestions" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "requiredRole" TEXT,
    "requiredPermission" TEXT,
    "projectScoped" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "comparable" BOOLEAN NOT NULL DEFAULT false,
    "aggregatable" BOOLEAN NOT NULL DEFAULT false,
    "sourcePriority" INTEGER NOT NULL DEFAULT 1,
    "lastScannedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiComparisonMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparisonName" TEXT NOT NULL,
    "userQuestionPattern" TEXT,
    "primaryModule" TEXT NOT NULL,
    "primaryTable" TEXT NOT NULL,
    "primaryField" TEXT NOT NULL,
    "relatedModules" TEXT,
    "relatedTables" TEXT,
    "relatedFields" TEXT,
    "comparisonLogic" TEXT NOT NULL,
    "calculationFormula" TEXT,
    "requiredPermission" TEXT,
    "projectScoped" BOOLEAN NOT NULL DEFAULT true,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiUiActionRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uiLabel" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "componentOrPage" TEXT,
    "actionType" TEXT,
    "aliases" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiSystemEnumRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enumValue" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "enumCategory" TEXT,
    "businessMeaning" TEXT,
    "aliases" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiRagNoiseExclusion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noiseTerm" TEXT NOT NULL,
    "normalizedTerm" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiRegistryCleanupReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runBy" TEXT NOT NULL,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRowsScanned" INTEGER NOT NULL,
    "duplicateGroupsFound" INTEGER NOT NULL,
    "rowsMerged" INTEGER NOT NULL,
    "aliasesMerged" INTEGER NOT NULL,
    "schemaFieldsMoved" INTEGER NOT NULL,
    "uiLabelsMoved" INTEGER NOT NULL,
    "noiseTermsExcluded" INTEGER NOT NULL,
    "acronymsFixed" INTEGER NOT NULL,
    "activeRowsRemaining" INTEGER NOT NULL,
    "rollbackSupported" BOOLEAN NOT NULL DEFAULT true,
    "rolledBackAt" DATETIME,
    "rolledBackBy" TEXT
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL,
    "riskScore" REAL,
    "category" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "sourceIp" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "isp" TEXT,
    "asn" TEXT,
    "organization" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "projectId" TEXT,
    "targetProjectId" TEXT,
    "module" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "actionAttempted" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "payloadSummary" TEXT,
    "fieldsAttempted" TEXT,
    "rbacResult" TEXT,
    "pbacResult" TEXT,
    "dataClassification" TEXT,
    "threatDetected" TEXT,
    "systemResponse" TEXT,
    "result" TEXT,
    "status" TEXT NOT NULL,
    "dataExposure" TEXT,
    "adminActionRequired" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "incidentId" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "message" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecurityEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SecurityIncident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT,
    "affectedUserId" TEXT,
    "affectedProjectId" TEXT,
    "affectedModule" TEXT,
    "sourceIp" TEXT,
    "countermeasure" TEXT,
    "result" TEXT,
    "dataExposure" TEXT,
    "relatedEventIds" TEXT,
    "rootCause" TEXT,
    "resolutionNotes" TEXT,
    "adminNotes" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdBy" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SecurityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "countermeasure" TEXT NOT NULL,
    "notifyAdmins" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSessionSecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "approximateLocation" TEXT,
    "loginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "revokedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "riskScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIQuerySecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "projectScope" TEXT,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT,
    "detectedThreat" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "retrievedDocumentIds" TEXT,
    "blockedDocumentIds" TEXT,
    "dataClassificationUsed" TEXT,
    "responseStatus" TEXT,
    "tokenUsage" INTEGER,
    "costEstimate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FileSecurityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "module" TEXT,
    "action" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "scanStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "threatDetected" TEXT,
    "countermeasure" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ThreatIp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "isp" TEXT,
    "asn" TEXT,
    "organization" TEXT,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CountermeasureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "securityEventId" TEXT,
    "countermeasureType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT,
    "performedBySystem" BOOLEAN NOT NULL DEFAULT true,
    "performedByUserId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SensitiveExportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "role" TEXT,
    "projectId" TEXT,
    "module" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "recordCount" INTEGER,
    "dataClassification" TEXT,
    "sourceIp" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SystemRole_name_key" ON "SystemRole"("name");

-- CreateIndex
CREATE INDEX "ProjectUserAssignment_userId_idx" ON "ProjectUserAssignment"("userId");

-- CreateIndex
CREATE INDEX "ProjectUserAssignment_projectId_idx" ON "ProjectUserAssignment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUserAssignment_assignmentStatus_idx" ON "ProjectUserAssignment"("assignmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectUserAssignment_userId_projectId_key" ON "ProjectUserAssignment"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequest_mrNumber_key" ON "MaterialRequest"("mrNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseAIValidation_expenseId_key" ON "ExpenseAIValidation"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashExpense_expenseId_key" ON "PettyCashExpense"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashReplenishment_requestNumber_key" ON "PettyCashReplenishment"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_workerId_key" ON "Worker"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTimeRecord_workerId_date_key" ON "DailyTimeRecord"("workerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_payrollBatchNumber_key" ON "PayrollPeriod"("payrollBatchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_workerId_payrollPeriodId_key" ON "Payroll"("workerId", "payrollPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialIssuance_misNumber_key" ON "MaterialIssuance"("misNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialReturn_mrsNumber_key" ON "MaterialReturn"("mrsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AccountsPayable_deliveryId_key" ON "AccountsPayable"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountsPayable_voucherNumber_key" ON "AccountsPayable"("voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Billing_billingNumber_key" ON "Billing"("billingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VariationOrder_voNumber_key" ON "VariationOrder"("voNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractPackage_packageNumber_key" ON "SubcontractPackage"("packageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JobOrder_jobNumber_key" ON "JobOrder"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractBilling_billingNumber_key" ON "SubcontractBilling"("billingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BackCharge_backChargeNumber_key" ON "BackCharge"("backChargeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRecord_knowledgeId_key" ON "KnowledgeRecord"("knowledgeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollFundingRequest_fundingRequestNumber_key" ON "PayrollFundingRequest"("fundingRequestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentBatch_batchNumber_key" ON "PaymentBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentBatchRow_senderReferenceId_key" ON "PaymentBatchRow"("senderReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentBatchRow_idempotencyKey_key" ON "PaymentBatchRow"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingBank_bankCode_key" ON "ReceivingBank"("bankCode");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleCode_key" ON "Role"("roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_moduleName_key" ON "Module"("moduleName");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_moduleId_key" ON "RolePermission"("roleId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_moduleName_key" ON "WorkflowTemplate"("moduleName");

-- CreateIndex
CREATE INDEX "TransactionWorkflow_moduleName_transactionId_idx" ON "TransactionWorkflow"("moduleName", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "LockedRecord_moduleName_transactionId_key" ON "LockedRecord"("moduleName", "transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "NotebookReference_referenceCode_key" ON "NotebookReference"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "AIValidationRule_ruleCode_key" ON "AIValidationRule"("ruleCode");

-- CreateIndex
CREATE UNIQUE INDEX "CanvassForm_canvassNumber_key" ON "CanvassForm"("canvassNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_fmsDeviceId_key" ON "Equipment"("fmsDeviceId");

-- CreateIndex
CREATE INDEX "EquipmentTelemetry_equipmentId_timestamp_idx" ON "EquipmentTelemetry"("equipmentId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "HikvisionDevice_deviceSerialNumber_key" ON "HikvisionDevice"("deviceSerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HikvisionDevice_imeiOrUniqueId_key" ON "HikvisionDevice"("imeiOrUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "HikvisionDevice_equipmentId_key" ON "HikvisionDevice"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveDashboardPreference_userId_key" ON "ExecutiveDashboardPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIGeneratedReport_reportCode_key" ON "AIGeneratedReport"("reportCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectValidationScore_projectId_key" ON "ProjectValidationScore"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcontractorVariationOrder_svoNumber_key" ON "SubcontractorVariationOrder"("svoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClientVariationOrder_cvoNumber_key" ON "ClientVariationOrder"("cvoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ValueEngineeringRecord_veNumber_key" ON "ValueEngineeringRecord"("veNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_projectId_key" ON "ProjectSchedule"("projectId");

-- CreateIndex
CREATE INDEX "AiRagKeywordRegistry_normalizedKeyword_idx" ON "AiRagKeywordRegistry"("normalizedKeyword");

-- CreateIndex
CREATE INDEX "AiRagKeywordRegistry_keywordType_idx" ON "AiRagKeywordRegistry"("keywordType");

-- CreateIndex
CREATE UNIQUE INDEX "AiRagKeywordRegistry_normalizedKeyword_keywordType_key" ON "AiRagKeywordRegistry"("normalizedKeyword", "keywordType");

-- CreateIndex
CREATE UNIQUE INDEX "AiRagSchemaMap_tableName_fieldName_key" ON "AiRagSchemaMap"("tableName", "fieldName");

-- CreateIndex
CREATE INDEX "AiRagEmbedding_sourceType_idx" ON "AiRagEmbedding"("sourceType");

-- CreateIndex
CREATE INDEX "AiRagEmbedding_projectId_idx" ON "AiRagEmbedding"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AiUiActionRegistry_normalizedLabel_actionType_key" ON "AiUiActionRegistry"("normalizedLabel", "actionType");

-- CreateIndex
CREATE UNIQUE INDEX "AiSystemEnumRegistry_normalizedValue_enumCategory_key" ON "AiSystemEnumRegistry"("normalizedValue", "enumCategory");

-- CreateIndex
CREATE UNIQUE INDEX "AiRagNoiseExclusion_normalizedTerm_key" ON "AiRagNoiseExclusion"("normalizedTerm");

-- CreateIndex
CREATE UNIQUE INDEX "ThreatIp_ipAddress_key" ON "ThreatIp"("ipAddress");
