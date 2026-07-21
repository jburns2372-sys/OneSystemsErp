import { ConsolidatedBOQItem, Project } from '@prisma/client';

export type ProjectClassification = 
  | 'GENERAL_CIVIL'
  | 'VERTICAL_BUILDING'
  | 'STRUCTURAL'
  | 'ARCHITECTURAL'
  | 'ROAD_AND_HIGHWAY'
  | 'BRIDGE'
  | 'DRAINAGE_AND_FLOOD_CONTROL'
  | 'WATER_SUPPLY'
  | 'SEWERAGE'
  | 'LAND_DEVELOPMENT'
  | 'ELECTRICAL'
  | 'MECHANICAL'
  | 'HVAC_REFRIGERATION'
  | 'PLUMBING_SANITARY'
  | 'FIRE_PROTECTION'
  | 'ICT_TELECOMMUNICATIONS'
  | 'SECURITY_SURVEILLANCE'
  | 'RENEWABLE_ENERGY'
  | 'INDUSTRIAL_INSTALLATION'
  | 'MARINE_AND_PORT'
  | 'EQUIPMENT_SUPPLY_INSTALLATION'
  | 'REPAIR_REHABILITATION'
  | 'MIXED_MULTIDISCIPLINARY'
  | 'OTHER_SPECIALIZED_WORK';

export interface ClassificationResult {
  primaryType: ProjectClassification;
  secondaryDisciplines: string[];
  confidenceScore: number;
  recommendedTemplate: string;
  evidence: string[];
  rationale: string;
}

/**
 * Universal Classification Engine
 * Analyzes the complete Awarded BOQ to determine the project type,
 * disciplines, and appropriate phase templates.
 */
export async function classifyProject(project: Project, boqItems: ConsolidatedBOQItem[]): Promise<ClassificationResult> {
  // 1. Gather all descriptions and categories
  const descriptions = boqItems.map(item => item.description.toLowerCase());
  const categories = boqItems.map(item => item.category?.toLowerCase() || '');
  
  const allText = [...descriptions, ...categories].join(' ');

  // 2. Keyword Heuristics
  const evidence: string[] = [];
  let primaryType: ProjectClassification = 'OTHER_SPECIALIZED_WORK';
  const secondaryDisciplines = new Set<string>();
  let confidenceScore = 0;
  let recommendedTemplate = 'GENERAL_CIVIL';

  const isVRF = allText.includes('vrf') || allText.includes('accu') || allText.includes('refrigerant');
  const isElectrical = allText.includes('conduit') || allText.includes('wire') || allText.includes('panelboard') || allText.includes('breaker');
  const isPlumbing = allText.includes('pipe') && (allText.includes('pvc') || allText.includes('water') || allText.includes('sanitary'));
  const isCivil = allText.includes('concrete') || allText.includes('excavation') || allText.includes('rebar');
  const isRoad = allText.includes('asphalt') || allText.includes('subbase') || allText.includes('highway');

  // Multi-Disciplinary Check
  const disciplinesDetected = [isVRF, isElectrical, isPlumbing, isCivil].filter(Boolean).length;
  
  if (disciplinesDetected > 2) {
    primaryType = 'MIXED_MULTIDISCIPLINARY';
    confidenceScore = 0.9;
    recommendedTemplate = 'MIXED_MULTIDISCIPLINARY';
    evidence.push('Detected multiple major disciplines (civil, electrical, mechanical, plumbing).');
    if (isElectrical) secondaryDisciplines.add('ELECTRICAL');
    if (isVRF) secondaryDisciplines.add('MECHANICAL');
    if (isPlumbing) secondaryDisciplines.add('PLUMBING');
    if (isCivil) secondaryDisciplines.add('CIVIL');
  } else if (isVRF) {
    primaryType = 'HVAC_REFRIGERATION';
    confidenceScore = 0.95;
    recommendedTemplate = 'MECHANICAL_HVAC_REFRIGERATION';
    evidence.push('Detected VRF, ACCU, or refrigerant piping keywords.');
    if (isElectrical) secondaryDisciplines.add('ELECTRICAL');
  } else if (isRoad) {
    primaryType = 'ROAD_AND_HIGHWAY';
    confidenceScore = 0.85;
    recommendedTemplate = 'ROAD_AND_HIGHWAY';
    evidence.push('Detected road construction keywords (asphalt, subbase).');
  } else if (isElectrical) {
    primaryType = 'ELECTRICAL';
    confidenceScore = 0.8;
    recommendedTemplate = 'ELECTRICAL_WORKS';
    evidence.push('Detected electrical components (conduits, wires, panels).');
  } else if (isCivil) {
    primaryType = 'VERTICAL_BUILDING';
    confidenceScore = 0.7;
    recommendedTemplate = 'GENERAL_CIVIL_AND_VERTICAL_BUILDING';
    evidence.push('Detected general civil/structural components (concrete, rebar).');
  }

  // AI Classification Fallback
  // If confidence is low, we would ideally call the AI here to confirm.
  // For now, this serves as the rapid deterministic pre-classifier.

  return {
    primaryType,
    secondaryDisciplines: Array.from(secondaryDisciplines),
    confidenceScore,
    recommendedTemplate,
    evidence,
    rationale: `Based on BOQ keyword analysis, classified as ${primaryType} with confidence ${confidenceScore}.`
  };
}
