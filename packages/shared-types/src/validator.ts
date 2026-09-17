import { Player, Role, SQUAD_CONSTRAINTS, SquadValidationResult } from './index';

export interface ValidateSquadOptions {
  matchTeamAId?: string;
  matchTeamBId?: string;
  /**
   * If true, allows partial squads (<11 players) without failing the total count check,
   * useful for real-time form validation as the user picks players one by one.
   */
  allowPartial?: boolean;
}

/**
 * Pure, deterministic constraint checker validating all 5 squad composition rules.
 * Isomorphic: runs identically on React frontend (instant UI feedback) and Express backend (security gate).
 * Follows PRD §8.3 specification.
 */
export function validateSquad(
  players: Player[],
  captainId?: string,
  viceCaptainId?: string,
  options: ValidateSquadOptions = {}
): SquadValidationResult {
  const errors: string[] = [];

  const roleCounts: Record<Role, number> = {
    WK: 0,
    BAT: 0,
    ALL: 0,
    BOWL: 0
  };

  const teamCounts: Record<string, number> = {};
  let totalCredits = 0;

  // 1. Accumulate player stats & check duplicates
  const seenPlayerIds = new Set<string>();

  for (const player of players) {
    // Check duplicate player
    if (seenPlayerIds.has(player.id)) {
      errors.push(`Duplicate player detected: ${player.name} (${player.id})`);
    }
    seenPlayerIds.add(player.id);

    // Accumulate role
    if (player.role in roleCounts) {
      roleCounts[player.role]++;
    } else {
      errors.push(`Invalid player role "${player.role}" for ${player.name}`);
    }

    // Accumulate team
    if (player.teamId) {
      teamCounts[player.teamId] = (teamCounts[player.teamId] || 0) + 1;
    }

    // Accumulate credits
    totalCredits += player.creditValue || 0;
  }

  // Round credits to 1 decimal place to prevent floating point inaccuracies (e.g. 99.99999999999999)
  totalCredits = Math.round(totalCredits * 10) / 10;

  // 2. Total player count check
  if (!options.allowPartial) {
    if (players.length !== SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
      errors.push(
        `Squad must contain exactly ${SQUAD_CONSTRAINTS.TOTAL_PLAYERS} players. Current: ${players.length}.`
      );
    }
  } else {
    if (players.length > SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
      errors.push(
        `Squad cannot exceed ${SQUAD_CONSTRAINTS.TOTAL_PLAYERS} players. Current: ${players.length}.`
      );
    }
  }

  // 3. Total credit budget check (<= 100.0 credits)
  if (totalCredits > SQUAD_CONSTRAINTS.MAX_CREDITS) {
    errors.push(
      `Total credits used (${totalCredits} cr) exceeds salary cap budget of ${SQUAD_CONSTRAINTS.MAX_CREDITS} cr.`
    );
  }

  // 4. Role composition limits check
  (Object.keys(SQUAD_CONSTRAINTS.ROLE_LIMITS) as Role[]).forEach(role => {
    const count = roleCounts[role];
    const limits = SQUAD_CONSTRAINTS.ROLE_LIMITS[role];

    if (!options.allowPartial) {
      if (count < limits.min) {
        errors.push(`Requires at least ${limits.min} ${role}(s). Current: ${count}.`);
      }
    }
    if (count > limits.max) {
      errors.push(`Cannot exceed ${limits.max} ${role}(s). Current: ${count}.`);
    }
  });

  // 5. Team of origin limit (max 7 per team)
  for (const [teamId, count] of Object.entries(teamCounts)) {
    if (count > SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) {
      errors.push(
        `Cannot select more than ${SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM} players from the same team (${teamId}). Current: ${count}.`
      );
    }
  }

  // 6. Captain and Vice-Captain assignment checks (required for complete squads)
  if (!options.allowPartial) {
    if (!captainId) {
      errors.push('A Captain must be designated.');
    } else if (!seenPlayerIds.has(captainId)) {
      errors.push(`Designated Captain (${captainId}) is not in the squad.`);
    }

    if (!viceCaptainId) {
      errors.push('A Vice-Captain must be designated.');
    } else if (!seenPlayerIds.has(viceCaptainId)) {
      errors.push(`Designated Vice-Captain (${viceCaptainId}) is not in the squad.`);
    }

    if (captainId && viceCaptainId && captainId === viceCaptainId) {
      errors.push('Captain and Vice-Captain must be different players.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    roleCounts,
    teamCounts,
    totalCredits,
    playerCount: players.length
  };
}
