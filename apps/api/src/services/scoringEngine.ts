import { Role } from '@pitchxi/shared-types';

export interface PerformanceStats {
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isDismissed?: boolean;
  playerRole?: Role;

  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens?: number;

  catches?: number;
  stumpings?: number;
  runOutsDirect?: number;
  runOutsIndirect?: number;
}

export interface ScoringBreakdown {
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  baseTotal: number;
  multiplier: number;
  finalPoints: number;
  notes: string[];
}

export interface ScoringOptions {
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

/**
 * Pure function to calculate Dream11-style fantasy points for a player match performance.
 * Follows PRD §8.2 specification.
 */
export function calculateFantasyPoints(
  perf: PerformanceStats,
  options: ScoringOptions = {}
): number {
  return calculateDetailedFantasyPoints(perf, options).finalPoints;
}

/**
 * Computes fantasy points along with an itemized scoring breakdown for full UI transparency.
 */
export function calculateDetailedFantasyPoints(
  perf: PerformanceStats,
  options: ScoringOptions = {}
): ScoringBreakdown {
  let battingPoints = 0;
  let bowlingPoints = 0;
  let fieldingPoints = 0;
  const notes: string[] = [];

  // ==================== 1. BATTING ====================
  // Runs: +1 per run
  battingPoints += perf.runs;

  // Boundary bonus: +4 per four
  if (perf.fours > 0) {
    const fourPts = perf.fours * 4;
    battingPoints += fourPts;
    notes.push(`Fours: +${fourPts} (${perf.fours}x4)`);
  }

  // Six bonus: +8 per six
  if (perf.sixes > 0) {
    const sixPts = perf.sixes * 8;
    battingPoints += sixPts;
    notes.push(`Sixes: +${sixPts} (${perf.sixes}x8)`);
  }

  // Milestone bonuses (non-cumulative)
  if (perf.runs >= 100) {
    battingPoints += 16;
    notes.push('Century Bonus: +16');
  } else if (perf.runs >= 50) {
    battingPoints += 8;
    notes.push('Half-century Bonus: +8');
  }

  // Duck penalty (-2): applicable if dismissed on 0 for non-bowlers (BAT, WK, ALL)
  const isBowler = perf.playerRole === 'BOWL';
  const isDismissedOnDuck = (perf.isDismissed !== false) && perf.runs === 0 && (perf.ballsFaced > 0);
  if (!isBowler && isDismissedOnDuck) {
    battingPoints -= 2;
    notes.push('Duck Penalty: -2');
  }

  // Strike Rate Bonus / Penalty (applicable only if min 10 balls faced)
  if (perf.ballsFaced >= 10) {
    const strikeRate = (perf.runs / perf.ballsFaced) * 100;
    if (strikeRate > 170.0) {
      battingPoints += 6;
      notes.push(`High Strike Rate (>170): +6 (${strikeRate.toFixed(1)})`);
    } else if (strikeRate > 150.0) {
      battingPoints += 4;
      notes.push(`High Strike Rate (150-170): +4 (${strikeRate.toFixed(1)})`);
    } else if (strikeRate >= 130.0) {
      battingPoints += 2;
      notes.push(`High Strike Rate (130-150): +2 (${strikeRate.toFixed(1)})`);
    } else if (strikeRate < 50.0) {
      battingPoints -= 6;
      notes.push(`Low Strike Rate (<50): -6 (${strikeRate.toFixed(1)})`);
    } else if (strikeRate < 60.0) {
      battingPoints -= 4;
      notes.push(`Low Strike Rate (50-60): -4 (${strikeRate.toFixed(1)})`);
    } else if (strikeRate <= 70.0) {
      battingPoints -= 2;
      notes.push(`Low Strike Rate (60-70): -2 (${strikeRate.toFixed(1)})`);
    }
  }

  // ==================== 2. BOWLING ====================
  // Wickets: +25 per wicket
  if (perf.wickets > 0) {
    const wktPts = perf.wickets * 25;
    bowlingPoints += wktPts;
    notes.push(`Wickets: +${wktPts} (${perf.wickets}x25)`);
  }

  // Wicket haul bonuses (non-cumulative)
  if (perf.wickets >= 5) {
    bowlingPoints += 16;
    notes.push('5-Wicket Haul Bonus: +16');
  } else if (perf.wickets === 4) {
    bowlingPoints += 12;
    notes.push('4-Wicket Haul Bonus: +12');
  } else if (perf.wickets === 3) {
    bowlingPoints += 8;
    notes.push('3-Wicket Haul Bonus: +8');
  }

  // Maiden overs: +12 per maiden
  if (perf.maidens && perf.maidens > 0) {
    const maidenPts = perf.maidens * 12;
    bowlingPoints += maidenPts;
    notes.push(`Maiden Overs: +${maidenPts} (${perf.maidens}x12)`);
  }

  // Economy Rate Bonus / Penalty (applicable only if min 2.0 overs bowled)
  if (perf.oversBowled >= 2.0) {
    const economy = perf.runsConceded / perf.oversBowled;
    if (economy < 5.0) {
      bowlingPoints += 6;
      notes.push(`Economy Rate (<5): +6 (${economy.toFixed(2)} rpo)`);
    } else if (economy < 6.0) {
      bowlingPoints += 4;
      notes.push(`Economy Rate (5-6): +4 (${economy.toFixed(2)} rpo)`);
    } else if (economy <= 7.0) {
      bowlingPoints += 2;
      notes.push(`Economy Rate (6-7): +2 (${economy.toFixed(2)} rpo)`);
    } else if (economy > 12.0) {
      bowlingPoints -= 6;
      notes.push(`Economy Rate (>12): -6 (${economy.toFixed(2)} rpo)`);
    } else if (economy > 11.0) {
      bowlingPoints -= 4;
      notes.push(`Economy Rate (11-12): -4 (${economy.toFixed(2)} rpo)`);
    } else if (economy >= 10.0) {
      bowlingPoints -= 2;
      notes.push(`Economy Rate (10-11): -2 (${economy.toFixed(2)} rpo)`);
    }
  }

  // ==================== 3. FIELDING ====================
  // Catches: +8 per catch
  const catches = perf.catches || 0;
  if (catches > 0) {
    const catchPts = catches * 8;
    fieldingPoints += catchPts;
    notes.push(`Catches: +${catchPts} (${catches}x8)`);
    if (catches >= 3) {
      fieldingPoints += 4;
      notes.push('3+ Catches Bonus: +4');
    }
  }

  // Stumpings: +12 per stumping
  if (perf.stumpings && perf.stumpings > 0) {
    const stumpingPts = perf.stumpings * 12;
    fieldingPoints += stumpingPts;
    notes.push(`Stumpings: +${stumpingPts} (${perf.stumpings}x12)`);
  }

  // Direct run-outs (+12) & Indirect run-outs (+6)
  if (perf.runOutsDirect && perf.runOutsDirect > 0) {
    const roPts = perf.runOutsDirect * 12;
    fieldingPoints += roPts;
    notes.push(`Direct Run-Outs: +${roPts}`);
  }
  if (perf.runOutsIndirect && perf.runOutsIndirect > 0) {
    const roPts = perf.runOutsIndirect * 6;
    fieldingPoints += roPts;
    notes.push(`Indirect Run-Outs: +${roPts}`);
  }

  // ==================== 4. TOTAL & MULTIPLIERS ====================
  const baseTotal = battingPoints + bowlingPoints + fieldingPoints;

  let multiplier = 1.0;
  if (options.isCaptain) {
    multiplier = 2.0;
    notes.push('Captain Multiplier: 2x');
  } else if (options.isViceCaptain) {
    multiplier = 1.5;
    notes.push('Vice-Captain Multiplier: 1.5x');
  }

  const finalPoints = baseTotal * multiplier;

  return {
    battingPoints,
    bowlingPoints,
    fieldingPoints,
    baseTotal,
    multiplier,
    finalPoints,
    notes
  };
}
