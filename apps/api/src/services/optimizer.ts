import { Player, Role, AutoPickResult, SQUAD_CONSTRAINTS, validateSquad } from '@pitchxi/shared-types';

/**
 * Auto-Pick Optimization Engine for PitchXI
 * 
 * Solves the Multi-dimensional Constrained Knapsack Problem:
 * - Exactly 11 players
 * - Total credits <= 100.0
 * - Role bounds: WK (1-4), BAT (3-6), ALL (1-4), BOWL (3-6)
 * - Franchise cap: <= 7 players from any single IPL team
 * - User locked player preservation
 * - Distinct Captain (2x) and Vice-Captain (1.5x)
 * 
 * Strategy:
 * 1. Greedy Points-per-Credit ratio initialization with role minimum guarantees and budget headroom
 * 2. Local Search Hill-Climbing 1-for-1 intra-role swaps to reach local optimum
 */
export function autoPickSquad(pool: Player[], lockedPlayerIds: string[] = []): AutoPickResult {
  const startTime = performance.now();

  if (!pool || pool.length < SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
    throw new Error(`Insufficient players in pool (${pool?.length || 0}) to assemble an 11-player squad.`);
  }

  // 1. Process and validate locked players
  const lockedPlayers = pool.filter(p => lockedPlayerIds.includes(p.id));
  if (lockedPlayers.length > SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
    throw new Error(`Cannot lock more than ${SQUAD_CONSTRAINTS.TOTAL_PLAYERS} players.`);
  }

  // Verify locked players don't violate initial limits
  const lockedCredits = lockedPlayers.reduce((sum, p) => sum + p.creditValue, 0);
  const remainingSlots = SQUAD_CONSTRAINTS.TOTAL_PLAYERS - lockedPlayers.length;
  if (lockedCredits + (remainingSlots * 6.0) > SQUAD_CONSTRAINTS.MAX_CREDITS) {
    throw new Error(`Locked players use ${lockedCredits.toFixed(1)} cr, leaving insufficient budget to fill remaining ${remainingSlots} slots (min 6.0 cr/player).`);
  }

  // Team counts for locked players
  const lockedTeamCounts: Record<string, number> = {};
  const lockedRoleCounts: Record<Role, number> = { WK: 0, BAT: 0, ALL: 0, BOWL: 0 };
  for (const lp of lockedPlayers) {
    lockedTeamCounts[lp.teamId] = (lockedTeamCounts[lp.teamId] || 0) + 1;
    if (lockedTeamCounts[lp.teamId] > SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) {
      throw new Error(`Locked picks contain more than 7 players from team ${lp.team?.shortCode || lp.teamId}.`);
    }
    lockedRoleCounts[lp.role]++;
    if (lockedRoleCounts[lp.role] > SQUAD_CONSTRAINTS.ROLE_LIMITS[lp.role].max) {
      throw new Error(`Locked picks exceed maximum allowed ${lp.role}s (${SQUAD_CONSTRAINTS.ROLE_LIMITS[lp.role].max}).`);
    }
  }

  // Helper to score efficiency ratio
  const getRatio = (p: Player): number => {
    const points = p.projectedPoints || 0;
    return points > 0 ? points / p.creditValue : 0.01 / p.creditValue;
  };

  // Group unpicked candidates by role sorted by ratio descending
  const unpickedPool = pool.filter(p => !lockedPlayers.some(lp => lp.id === p.id));
  const candidatesByRole: Record<Role, Player[]> = {
    WK: [],
    BAT: [],
    ALL: [],
    BOWL: []
  };

  for (const player of unpickedPool) {
    candidatesByRole[player.role].push(player);
  }

  for (const role of Object.keys(candidatesByRole) as Role[]) {
    candidatesByRole[role].sort((a, b) => {
      const ratioDiff = getRatio(b) - getRatio(a);
      if (Math.abs(ratioDiff) > 0.001) return ratioDiff;
      return (b.projectedPoints || 0) - (a.projectedPoints || 0);
    });
  }

  const minCreditInPool = pool.length > 0 ? Math.min(...pool.map(p => p.creditValue)) : 6.0;

  // Stage 1: Greedy Allocation
  const squad: Player[] = [...lockedPlayers];
  const teamCounts: Record<string, number> = { ...lockedTeamCounts };
  const roleCounts: Record<Role, number> = { ...lockedRoleCounts };

  const canAddPlayer = (p: Player): boolean => {
    if (squad.some(sp => sp.id === p.id)) return false;
    if (squad.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) return false;
    if ((teamCounts[p.teamId] || 0) >= SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) return false;
    if (roleCounts[p.role] >= SQUAD_CONSTRAINTS.ROLE_LIMITS[p.role].max) return false;

    const currentTotalCredits = squad.reduce((sum, sp) => sum + sp.creditValue, 0);
    const slotsAfterThis = SQUAD_CONSTRAINTS.TOTAL_PLAYERS - (squad.length + 1);
    const minRequiredForRemaining = slotsAfterThis * minCreditInPool;

    if (currentTotalCredits + p.creditValue + minRequiredForRemaining > SQUAD_CONSTRAINTS.MAX_CREDITS) {
      return false;
    }
    return true;
  };

  const addPlayerToSquad = (p: Player) => {
    squad.push(p);
    teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
    roleCounts[p.role]++;
  };

  // A. Fulfill Role Minimums (WK: 1, BAT: 3, ALL: 1, BOWL: 3)
  const roleMinimums: Record<Role, number> = {
    WK: SQUAD_CONSTRAINTS.ROLE_LIMITS.WK.min,
    BAT: SQUAD_CONSTRAINTS.ROLE_LIMITS.BAT.min,
    ALL: SQUAD_CONSTRAINTS.ROLE_LIMITS.ALL.min,
    BOWL: SQUAD_CONSTRAINTS.ROLE_LIMITS.BOWL.min
  };

  for (const role of ['WK', 'BAT', 'ALL', 'BOWL'] as Role[]) {
    const needed = roleMinimums[role] - roleCounts[role];
    if (needed > 0) {
      let addedForRole = 0;
      for (const candidate of candidatesByRole[role]) {
        if (canAddPlayer(candidate)) {
          addPlayerToSquad(candidate);
          addedForRole++;
          if (addedForRole >= needed) break;
        }
      }
    }
  }

  // B. Fill remaining spots (up to 11) with best ratio available
  const allRemaining = pool
    .filter(p => !squad.some(sp => sp.id === p.id))
    .sort((a, b) => getRatio(b) - getRatio(a));

  for (const candidate of allRemaining) {
    if (squad.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) break;
    if (canAddPlayer(candidate)) {
      addPlayerToSquad(candidate);
    }
  }

  // C. Fallback: If greedy ratio was too ambitious and left insufficient budget for remaining spots,
  // iteratively downgrade the most expensive non-locked player to a cheaper alternative of the same role
  const isLocked = (pId: string) => lockedPlayerIds.includes(pId);

  while (squad.length < SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
    let downgraded = false;
    const nonLocked = squad
      .map((p, idx) => ({ p, idx }))
      .filter(item => !isLocked(item.p.id))
      .sort((a, b) => b.p.creditValue - a.p.creditValue);

    for (const item of nonLocked) {
      const cheaperCandidates = pool
        .filter(cp => cp.role === item.p.role && cp.creditValue < item.p.creditValue && !squad.some(sp => sp.id === cp.id))
        .sort((a, b) => a.creditValue - b.creditValue);

      if (cheaperCandidates.length > 0) {
        const replacement = cheaperCandidates[0];
        teamCounts[item.p.teamId]--;
        teamCounts[replacement.teamId] = (teamCounts[replacement.teamId] || 0) + 1;
        squad[item.idx] = replacement;
        downgraded = true;
        break;
      }
    }

    if (!downgraded) break;

    // Try filling remaining slots again
    for (const candidate of allRemaining) {
      if (squad.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) break;
      if (canAddPlayer(candidate)) {
        addPlayerToSquad(candidate);
      }
    }
  }

  if (squad.length < SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
    throw new Error(`Unable to find a valid 11-player combination meeting constraints. Try unlocking some players.`);
  }

  // Stage 2: Local Search Hill-Climbing Swaps
  // We explore 1-for-1 swaps of non-locked players with unpicked players of the same role
  // to maximize projected points while preserving budget <= 100 and team <= 7
  let improved = true;
  let iterations = 0;
  const MAX_ITERATIONS = 150;

  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;

    const currentTotalCredits = squad.reduce((sum, p) => sum + p.creditValue, 0);

    for (let i = 0; i < squad.length; i++) {
      const picked = squad[i];
      if (isLocked(picked.id)) continue;

      // Find eligible unpicked players of the same role
      const unpickedSameRole = pool.filter(
        p => p.role === picked.role && !squad.some(sp => sp.id === p.id)
      );

      for (const candidate of unpickedSameRole) {
        // Swap must strictly increase projected points
        const pointsDiff = (candidate.projectedPoints || 0) - (picked.projectedPoints || 0);
        if (pointsDiff <= 0.05) continue;

        // Check credit limit
        const creditDiff = candidate.creditValue - picked.creditValue;
        const newCredits = Math.round((currentTotalCredits + creditDiff) * 10) / 10;
        if (newCredits > SQUAD_CONSTRAINTS.MAX_CREDITS) continue;

        // Check team cap
        if (candidate.teamId !== picked.teamId) {
          const candidateTeamCount = squad.filter(p => p.teamId === candidate.teamId).length;
          if (candidateTeamCount >= SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) continue;
        }

        // Valid improving swap found! Apply it immediately
        squad[i] = candidate;
        improved = true;
        break; // break candidate loop to recalculate squad
      }

      if (improved) break; // break squad loop
    }
  }

  // Stage 3: Multiplier Designation (Captain 2x, Vice-Captain 1.5x)
  const sortedByProjected = [...squad].sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
  const captainId = sortedByProjected[0].id;
  const viceCaptainId = sortedByProjected[1].id;

  // Stage 4: Universal Validation Verification
  const validation = validateSquad(squad, captainId, viceCaptainId);
  if (!validation.valid) {
    throw new Error(`Optimizer produced an invalid squad: ${validation.errors.join(', ')}`);
  }

  // Compute final projected points including C (2x) and VC (1.5x)
  let totalProjectedPoints = 0;
  for (const p of squad) {
    const basePts = p.projectedPoints || 0;
    if (p.id === captainId) {
      totalProjectedPoints += basePts * 2.0;
    } else if (p.id === viceCaptainId) {
      totalProjectedPoints += basePts * 1.5;
    } else {
      totalProjectedPoints += basePts;
    }
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    squad,
    captainId,
    viceCaptainId,
    totalCredits: validation.totalCredits,
    projectedPoints: Math.round(totalProjectedPoints * 10) / 10,
    executionTimeMs
  };
}
