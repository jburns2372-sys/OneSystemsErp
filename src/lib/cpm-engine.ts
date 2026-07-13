/**
 * Critical Path Method (CPM) Engine
 * 
 * Deterministic scheduling engine that computes:
 * - Forward Pass: Early Start (ES), Early Finish (EF)
 * - Backward Pass: Late Start (LS), Late Finish (LF)
 * - Total Float, Free Float
 * - Critical Path identification
 * 
 * Supports dependency types: FS, SS, FF, SF with lag/lead days
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CPMActivity {
  id: string;
  name: string;
  duration: number; // in working days
  plannedStart?: Date | null;
  plannedFinish?: Date | null;
  metadata?: any;
}

export interface CPMDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, Finish-Finish, Start-Finish
  lagDays: number; // positive = lag, negative = lead
}

export interface CPMResult {
  activityId: string;
  earlyStart: number;  // working day offset from project start
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  // Date-resolved values
  earlyStartDate?: Date;
  earlyFinishDate?: Date;
  lateStartDate?: Date;
  lateFinishDate?: Date;
}

export interface CPMScheduleOutput {
  results: Map<string, CPMResult>;
  criticalPath: string[]; // ordered activity IDs on the critical path
  projectDuration: number; // total working days
  hasCircularDependency: boolean;
  errors: string[];
}

// ─── Topological Sort ─────────────────────────────────────────────────────────

function topologicalSort(
  activityIds: string[],
  dependencies: CPMDependency[]
): { sorted: string[]; hasCycle: boolean } {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of activityIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const dep of dependencies) {
    // For topological ordering, predecessor must come before successor
    if (adjacency.has(dep.predecessorId) && inDegree.has(dep.successorId)) {
      adjacency.get(dep.predecessorId)!.push(dep.successorId);
      inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return {
    sorted,
    hasCycle: sorted.length !== activityIds.length
  };
}

// ─── Dependency Resolution Helpers ────────────────────────────────────────────

function getSuccessorConstraint(
  depType: string,
  predES: number,
  predEF: number,
  lag: number
): { constraintOnStart: number | null; constraintOnFinish: number | null } {
  switch (depType) {
    case 'FS': // Finish-to-Start: successor starts after predecessor finishes + lag
      return { constraintOnStart: predEF + lag, constraintOnFinish: null };
    case 'SS': // Start-to-Start: successor starts after predecessor starts + lag
      return { constraintOnStart: predES + lag, constraintOnFinish: null };
    case 'FF': // Finish-to-Finish: successor finishes after predecessor finishes + lag
      return { constraintOnStart: null, constraintOnFinish: predEF + lag };
    case 'SF': // Start-to-Finish: successor finishes after predecessor starts + lag
      return { constraintOnStart: null, constraintOnFinish: predES + lag };
    default:
      return { constraintOnStart: predEF + lag, constraintOnFinish: null }; // default FS
  }
}

// ─── Main CPM Calculator ──────────────────────────────────────────────────────

export function calculateCPM(
  activities: CPMActivity[],
  dependencies: CPMDependency[]
): CPMScheduleOutput {
  const errors: string[] = [];
  const activityMap = new Map<string, CPMActivity>();
  const results = new Map<string, CPMResult>();

  for (const act of activities) {
    activityMap.set(act.id, act);
    results.set(act.id, {
      activityId: act.id,
      earlyStart: 0,
      earlyFinish: act.duration,
      lateStart: 0,
      lateFinish: 0,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false
    });
  }

  const activityIds = activities.map(a => a.id);

  // Build predecessor and successor maps indexed by successor and predecessor
  const predecessorsOf = new Map<string, CPMDependency[]>(); // key = successorId
  const successorsOf = new Map<string, CPMDependency[]>();   // key = predecessorId

  for (const id of activityIds) {
    predecessorsOf.set(id, []);
    successorsOf.set(id, []);
  }

  for (const dep of dependencies) {
    if (predecessorsOf.has(dep.successorId)) {
      predecessorsOf.get(dep.successorId)!.push(dep);
    }
    if (successorsOf.has(dep.predecessorId)) {
      successorsOf.get(dep.predecessorId)!.push(dep);
    }
  }

  // ── Topological Sort ──
  const { sorted, hasCycle } = topologicalSort(activityIds, dependencies);

  if (hasCycle) {
    return {
      results,
      criticalPath: [],
      projectDuration: 0,
      hasCircularDependency: true,
      errors: ['Circular dependency detected! The schedule cannot be computed.']
    };
  }

  // ── Forward Pass ──
  // Process activities in topological order
  for (const actId of sorted) {
    const activity = activityMap.get(actId)!;
    const result = results.get(actId)!;
    const preds = predecessorsOf.get(actId) || [];

    let maxEarlyStart = 0;

    for (const dep of preds) {
      const predResult = results.get(dep.predecessorId);
      if (!predResult) continue;

      const constraints = getSuccessorConstraint(
        dep.type,
        predResult.earlyStart,
        predResult.earlyFinish,
        dep.lagDays
      );

      if (constraints.constraintOnStart !== null) {
        maxEarlyStart = Math.max(maxEarlyStart, constraints.constraintOnStart);
      }

      if (constraints.constraintOnFinish !== null) {
        // If the constraint is on finish, derive the start
        const impliedStart = constraints.constraintOnFinish - activity.duration;
        maxEarlyStart = Math.max(maxEarlyStart, impliedStart);
      }
    }

    result.earlyStart = maxEarlyStart;
    result.earlyFinish = maxEarlyStart + activity.duration;
  }

  // ── Determine Project Duration ──
  let projectDuration = 0;
  for (const result of results.values()) {
    projectDuration = Math.max(projectDuration, result.earlyFinish);
  }

  // ── Backward Pass ──
  // Process activities in reverse topological order
  // Initialize all late finishes to project duration
  for (const result of results.values()) {
    result.lateFinish = projectDuration;
    result.lateStart = projectDuration - (activityMap.get(result.activityId)?.duration || 0);
  }

  const reverseSorted = [...sorted].reverse();

  for (const actId of reverseSorted) {
    const activity = activityMap.get(actId)!;
    const result = results.get(actId)!;
    const succs = successorsOf.get(actId) || [];

    let minLateFinish = projectDuration;

    for (const dep of succs) {
      const succResult = results.get(dep.successorId);
      if (!succResult) continue;

      const succActivity = activityMap.get(dep.successorId);
      if (!succActivity) continue;

      switch (dep.type) {
        case 'FS': // Finish-to-Start
          minLateFinish = Math.min(minLateFinish, succResult.lateStart - dep.lagDays);
          break;
        case 'SS': // Start-to-Start
          // Predecessor's start constrains successor's start
          const impliedLF_SS = succResult.lateStart - dep.lagDays + activity.duration;
          minLateFinish = Math.min(minLateFinish, impliedLF_SS);
          break;
        case 'FF': // Finish-to-Finish
          minLateFinish = Math.min(minLateFinish, succResult.lateFinish - dep.lagDays);
          break;
        case 'SF': // Start-to-Finish
          const impliedLF_SF = succResult.lateFinish - dep.lagDays + activity.duration;
          minLateFinish = Math.min(minLateFinish, impliedLF_SF);
          break;
      }
    }

    result.lateFinish = minLateFinish;
    result.lateStart = minLateFinish - activity.duration;
  }

  // ── Calculate Floats and Critical Path ──
  const criticalPath: string[] = [];

  for (const actId of sorted) {
    const result = results.get(actId)!;
    result.totalFloat = result.lateStart - result.earlyStart;
    
    // Free Float: difference between ES of earliest successor and EF of current
    const succs = successorsOf.get(actId) || [];
    if (succs.length > 0) {
      let minSuccessorES = Infinity;
      for (const dep of succs) {
        const succResult = results.get(dep.successorId);
        if (succResult) {
          switch (dep.type) {
            case 'FS':
              minSuccessorES = Math.min(minSuccessorES, succResult.earlyStart - dep.lagDays);
              break;
            case 'SS':
              minSuccessorES = Math.min(minSuccessorES, succResult.earlyStart - dep.lagDays + (activityMap.get(actId)?.duration || 0));
              break;
            case 'FF':
              minSuccessorES = Math.min(minSuccessorES, succResult.earlyFinish - dep.lagDays);
              break;
            case 'SF':
              minSuccessorES = Math.min(minSuccessorES, succResult.earlyFinish - dep.lagDays + (activityMap.get(actId)?.duration || 0));
              break;
          }
        }
      }
      result.freeFloat = Math.max(0, minSuccessorES - result.earlyFinish);
    } else {
      // Terminal activity: free float = project duration - EF
      result.freeFloat = projectDuration - result.earlyFinish;
    }

    // Critical if total float is 0 (or negative in edge cases)
    result.isCritical = result.totalFloat <= 0;

    if (result.isCritical) {
      criticalPath.push(actId);
    }
  }

  return {
    results,
    criticalPath,
    projectDuration,
    hasCircularDependency: false,
    errors
  };
}

// ─── Date Resolution Helpers ──────────────────────────────────────────────────

/**
 * Convert working-day offsets to calendar dates, respecting a work-day configuration
 */
export function resolveWorkingDayDates(
  cpmOutput: CPMScheduleOutput,
  projectStartDate: Date,
  workDays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  holidays: Date[] = []
): CPMScheduleOutput {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const holidaySet = new Set(holidays.map(d => d.toISOString().split('T')[0]));

  function addWorkingDays(startDate: Date, workDaysCount: number): Date {
    const date = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < workDaysCount) {
      date.setDate(date.getDate() + 1);
      const dayName = dayNames[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];

      if (workDays.includes(dayName) && !holidaySet.has(dateStr)) {
        daysAdded++;
      }
    }

    return date;
  }

  function getWorkingDayDate(offset: number): Date {
    if (offset <= 0) return new Date(projectStartDate);
    return addWorkingDays(projectStartDate, offset);
  }

  for (const [actId, result] of cpmOutput.results) {
    result.earlyStartDate = getWorkingDayDate(result.earlyStart);
    result.earlyFinishDate = getWorkingDayDate(result.earlyFinish);
    result.lateStartDate = getWorkingDayDate(result.lateStart);
    result.lateFinishDate = getWorkingDayDate(result.lateFinish);
  }

  return cpmOutput;
}

// ─── Circular Dependency Detection ───────────────────────────────────────────

export function wouldCreateCycle(
  existingDependencies: CPMDependency[],
  newPredecessorId: string,
  newSuccessorId: string,
  allActivityIds: string[]
): boolean {
  // Build adjacency from existing + proposed new
  const adjacency = new Map<string, Set<string>>();
  for (const id of allActivityIds) {
    adjacency.set(id, new Set());
  }

  for (const dep of existingDependencies) {
    adjacency.get(dep.predecessorId)?.add(dep.successorId);
  }

  // Add the proposed dependency
  adjacency.get(newPredecessorId)?.add(newSuccessorId);

  // DFS from newSuccessorId to see if we can reach newPredecessorId
  const visited = new Set<string>();
  const stack = [newSuccessorId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === newPredecessorId) return true; // Cycle detected!

    if (visited.has(current)) continue;
    visited.add(current);

    for (const neighbor of adjacency.get(current) || []) {
      if (!visited.has(neighbor)) stack.push(neighbor);
    }
  }

  return false;
}
