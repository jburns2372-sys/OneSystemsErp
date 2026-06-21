'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

/**
 * Validates that the current user has access to Executive Validation module
 */
async function checkValidationAccess() {
  const userId = await getUserId();
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView'); // Base requirement
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized');

  // Support role simulation
  const cookieStore = await cookies();
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  
  const effectiveRole = (simulatedRole && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS')) 
    ? simulatedRole 
    : user.role;

  // Removed hardcoded allowedRoles check to rely on the database permission matrix
  // via requirePermission above.

  return user;
}

/**
 * Retrieves all Billing records for a project to populate the Accomplishment Selector
 */
export async function getProjectBillings(projectId: string) {
  await checkValidationAccess();

  const billings = await prisma.billing.findMany({
    where: { projectId },
    orderBy: { billingDate: 'desc' },
    select: {
      id: true,
      billingNumber: true,
      status: true,
      billingDate: true,
      currentBillingAmount: true
    }
  });

  return billings;
}

/**
 * Fetches all validation records for a specific billing ID, grouped by module source
 */
export async function getBillingValidationMatrix(projectId: string, billingId: string) {
  await checkValidationAccess();

  const records = await prisma.aIValidationRecord.findMany({
    where: { projectId, relatedBillingId: billingId },
    orderBy: { createdAt: 'desc' }
  });

  // Group records by moduleSource
  const matrix: Record<string, any[]> = {
    'BOQ': [],
    'BILLING': [],
    'PHOTO': [],
    'DRONE': [],
    'CCTV': [],
    'SATELLITE': [],
    'PLAN': []
  };

  records.forEach(record => {
    if (matrix[record.moduleSource]) {
      matrix[record.moduleSource].push(record);
    } else {
      matrix[record.moduleSource] = [record];
    }
  });

  return matrix;
}

/**
 * Helper to determine risk level from score
 */
function determineRiskLevel(score: number): string {
  if (score >= 90) return 'GREEN';
  if (score >= 80) return 'YELLOW';
  if (score >= 65) return 'ORANGE';
  return 'RED'; // Below 65 is Red/High Risk
}

/**
 * Simulates an AI Engine processing an evidence file (e.g., photo, drone video)
 * In a real-world scenario, this would call a Multimodal LLM (like Gemini 1.5 Pro Vision)
 */
export async function runAIEvidenceEngine(projectId: string, evidenceType: string, fileUrl: string, moduleSource: string) {
  const user = await checkValidationAccess();

  // Simulated AI Processing Delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulated AI Response based on the type of evidence
  let aiConfidenceScore = 85;
  let aiFindings = '';
  let riskLevel = 'YELLOW';
  let recommendation = 'Recommended for Conditional Approval';
  let findingsData = '{}';

  switch (moduleSource) {
    case 'PHOTO':
      aiFindings = 'Metadata matches project timeframe and location. No tampering detected. BOQ item (Rebar Installation) visible.';
      aiConfidenceScore = 92;
      riskLevel = 'GREEN';
      recommendation = 'Recommended for Approval';
      findingsData = JSON.stringify({ detectedItems: ['rebar', 'formwork'], gpsMatch: true, tampering: false });
      break;
    case 'DRONE':
      aiFindings = 'Drone capture aligns with Site Development Plan. Computed excavation volume matches billing claim. No idle zones detected.';
      aiConfidenceScore = 88;
      riskLevel = 'YELLOW';
      findingsData = JSON.stringify({ estimatedVolume: 450, coveredAreaPercent: 95 });
      break;
    case 'SATELLITE':
      aiFindings = 'Satellite imagery shows active staging area inside project boundary. Consistent with reported phase.';
      aiConfidenceScore = 78;
      riskLevel = 'ORANGE';
      recommendation = 'Acceptable but Requires Site Validation';
      break;
    case 'CCTV':
      aiFindings = 'Activity detected during reported work hours. 12 workers visible, PPE compliance low (missing hardhats). Heavy equipment active.';
      aiConfidenceScore = 75;
      riskLevel = 'ORANGE';
      recommendation = 'Hold for Safety Review';
      findingsData = JSON.stringify({ safetyViolations: ['PPE'], equipmentActive: true });
      break;
    case 'PLAN':
      aiFindings = 'Submitted plan differs from awarded BOQ. Wall area increased by 15%. Variation Order required.';
      aiConfidenceScore = 60;
      riskLevel = 'RED';
      recommendation = 'Require Variation Order Processing';
      break;
    default:
      aiFindings = 'Evidence analyzed successfully. General consistency verified.';
      aiConfidenceScore = 80;
  }

  // Create the validation record
  const record = await prisma.aIValidationRecord.create({
    data: {
      projectId,
      moduleSource,
      evidenceType,
      evidenceFileUrl: fileUrl,
      aiFindings,
      aiConfidenceScore,
      riskLevel,
      recommendation,
      status: 'REVIEWED',
      createdById: user.id,
      findingsData
    }
  });

  // Log in audit trail
  await prisma.validationAuditLog.create({
    data: {
      projectId,
      userId: user.id,
      userRole: user.role,
      actionType: 'UPLOAD_EVIDENCE',
      validationRecordId: record.id,
      aiScoreAtTime: aiConfidenceScore,
      aiFindingsAtTime: aiFindings
    }
  });

  // Update Project Validation Score Aggregation
  await aggregateProjectValidationScore(projectId);

  revalidatePath('/executive/validation');
  return record;
}

/**
 * Aggregates all validation records for a project into a single ProjectValidationScore
 */
export async function aggregateProjectValidationScore(projectId: string) {
  // Get validation settings (weights)
  const settings = await prisma.validationSettings.findFirst() || {
    boqWeight: 20, plansWeight: 15, photoWeight: 15, droneWeight: 15,
    cctvWeight: 10, satelliteWeight: 10, deliveryWeight: 5, scheduleWeight: 5, approvalWeight: 5
  };

  const records = await prisma.aIValidationRecord.findMany({
    where: { projectId }
  });

  if (records.length === 0) return null;

  // Group by moduleSource to average scores per category
  const scoresByCategory: Record<string, number[]> = {};
  records.forEach(r => {
    if (!scoresByCategory[r.moduleSource]) scoresByCategory[r.moduleSource] = [];
    scoresByCategory[r.moduleSource].push(r.aiConfidenceScore);
  });

  const getAvg = (source: string) => {
    const arr = scoresByCategory[source];
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  // Calculate weighted score
  let totalScore = 0;
  let totalWeightUsed = 0;

  const addWeight = (source: string, weight: number) => {
    const avg = getAvg(source);
    if (avg > 0) {
      totalScore += (avg * (weight / 100));
      totalWeightUsed += weight;
    }
  };

  addWeight('BOQ', settings.boqWeight);
  addWeight('PLAN', settings.plansWeight);
  addWeight('PHOTO', settings.photoWeight);
  addWeight('DRONE', settings.droneWeight);
  addWeight('CCTV', settings.cctvWeight);
  addWeight('SATELLITE', settings.satelliteWeight);
  addWeight('DELIVERY', settings.deliveryWeight);

  // Normalize score if not all evidence types are present
  const finalValidationScore = totalWeightUsed > 0 ? (totalScore / (totalWeightUsed / 100)) : 0;
  
  // Completeness score is simply how many of the expected evidence types have at least one record
  const expectedTypesCount = 7; // boq, plan, photo, drone, cctv, satellite, delivery
  const presentTypesCount = Object.keys(scoresByCategory).length;
  const evidenceCompletenessScore = (presentTypesCount / expectedTypesCount) * 100;

  const riskLevel = determineRiskLevel(finalValidationScore);

  // Upsert the project score
  return await prisma.projectValidationScore.upsert({
    where: { projectId },
    update: {
      validationConfidenceScore: finalValidationScore,
      riskLevel,
      evidenceCompletenessScore,
      latestValidationDate: new Date()
    },
    create: {
      projectId,
      validationConfidenceScore: finalValidationScore,
      riskLevel,
      evidenceCompletenessScore,
      latestValidationDate: new Date()
    }
  });
}
