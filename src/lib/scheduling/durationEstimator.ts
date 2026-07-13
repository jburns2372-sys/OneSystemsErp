/**
 * Universal Duration Estimator
 * Calculates deterministic activity durations based on quantities, units, and industry-standard productivity rates.
 */

interface ProductivityRate {
  unit: string;
  dailyOutput: number; // Output per standard crew per day
  standardCrewSize: number;
}

// Industry standard heuristics for construction productivity
const PRODUCTIVITY_HEURISTICS: Record<string, ProductivityRate> = {
  // Civil / Structural
  'cu.m': { unit: 'cu.m', dailyOutput: 20, standardCrewSize: 5 }, // Concrete pouring
  'sq.m': { unit: 'sq.m', dailyOutput: 50, standardCrewSize: 3 }, // Forms, painting, tiles
  'kg': { unit: 'kg', dailyOutput: 200, standardCrewSize: 4 }, // Rebar installation
  'ton': { unit: 'ton', dailyOutput: 0.5, standardCrewSize: 4 }, // Structural steel
  'lm': { unit: 'lm', dailyOutput: 30, standardCrewSize: 3 }, // Piping, gutter
  
  // Electrical / Mechanical
  'set': { unit: 'set', dailyOutput: 2, standardCrewSize: 2 }, // Panelboards, equipment
  'lot': { unit: 'lot', dailyOutput: 0.1, standardCrewSize: 5 }, // 10 days for a lot
  'pcs': { unit: 'pcs', dailyOutput: 15, standardCrewSize: 2 }, // Fixtures
  'nos': { unit: 'nos', dailyOutput: 15, standardCrewSize: 2 },
  
  // Default fallback
  'default': { unit: 'any', dailyOutput: 1, standardCrewSize: 2 }
};

export interface DurationEstimate {
  durationDays: number;
  assumedDailyOutput: number;
  assumedCrewSize: number;
  rationale: string;
}

/**
 * Calculates the duration of an activity based on its quantity and unit.
 * Applies the formula: Ceiling(Work Quantity / Approved Daily Productivity / Number of Crews)
 * Clamps to a minimum of 1 day.
 */
export function estimateDuration(quantity: number, unit: string, crewCount?: number): DurationEstimate {
  const normalizedUnit = unit.toLowerCase().trim();
  
  const rate = PRODUCTIVITY_HEURISTICS[normalizedUnit] || PRODUCTIVITY_HEURISTICS['default'];
  
  // If quantity is 0 or invalid, default to 1 day
  if (!quantity || quantity <= 0) {
    return {
      durationDays: 1,
      assumedDailyOutput: rate.dailyOutput,
      assumedCrewSize: rate.standardCrewSize,
      rationale: `Quantity is zero or invalid, defaulting to 1 day.`
    };
  }

  // If the unit is 'lot', duration is inverse (0.1 output means 10 days)
  if (normalizedUnit === 'lot' || normalizedUnit === 'l.s' || normalizedUnit === 'ls') {
    const days = Math.max(1, Math.ceil(1 / rate.dailyOutput));
    return {
      durationDays: days,
      assumedDailyOutput: rate.dailyOutput,
      assumedCrewSize: rate.standardCrewSize,
      rationale: `Lump sum/lot item estimated at fixed ${days} days.`
    };
  }

  const finalCrewCount = crewCount && crewCount > 0 ? crewCount : 1; // Default to 1 crew if not specified
  
  const rawDays = quantity / rate.dailyOutput / finalCrewCount;
  const durationDays = Math.max(1, Math.ceil(rawDays));

  return {
    durationDays,
    assumedDailyOutput: rate.dailyOutput,
    assumedCrewSize: finalCrewCount,
    rationale: `Calculated ${durationDays} days based on ${quantity} ${unit} at ${rate.dailyOutput} ${unit}/day with ${finalCrewCount} crew(s).`
  };
}
