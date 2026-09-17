import { Role } from '@pitchxi/shared-types';

export interface PlayerStatsForValuation {
  id: string;
  name: string;
  role: Role;
  recentPoints: number[]; // Points in recent matches (up to 5)
  careerAveragePoints: number;
}

export interface PlayerValuationResult {
  playerId: string;
  formScore: number;
  creditValue: number;
}

const ROLE_SCARCITY_BONUS: Record<Role, number> = {
  ALL: 8.0,  // All-rounders are rare & dual-contributing
  WK: 5.0,   // Wicketkeepers with top-order batting
  BAT: 2.0,  // Specialist batsmen
  BOWL: 2.0  // Specialist bowlers
};

const MIN_CREDIT = 6.0;
const MAX_CREDIT = 11.0;
const DEFAULT_FORM_SCORE = 35.0;

/**
 * Calculates raw form score for a single player based on:
 * - Recent 5 matches average (weight 0.5)
 * - Career average fantasy points (weight 0.3)
 * - Role scarcity bonus (weight 0.2)
 */
export function calculatePlayerFormScore(player: PlayerStatsForValuation): number {
  const recentAvg =
    player.recentPoints.length > 0
      ? player.recentPoints.reduce((sum, pt) => sum + pt, 0) / player.recentPoints.length
      : player.careerAveragePoints || DEFAULT_FORM_SCORE;

  const careerAvg = player.careerAveragePoints || recentAvg;
  const scarcity = ROLE_SCARCITY_BONUS[player.role] ?? 0;

  const formScore = 0.5 * recentAvg + 0.3 * careerAvg + 0.2 * (scarcity * 5.0);
  return Math.max(0, formScore);
}

/**
 * Normalizes a pool of players' form scores into credit values within [6.0, 11.0],
 * rounded to the nearest 0.5 step.
 */
export function calculatePlayerCredits(players: PlayerStatsForValuation[]): PlayerValuationResult[] {
  if (players.length === 0) return [];

  const rawScores = players.map(p => ({
    player: p,
    formScore: calculatePlayerFormScore(p)
  }));

  const scores = rawScores.map(r => r.formScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  return rawScores.map(({ player, formScore }) => {
    let credit: number;

    if (range <= 0.001) {
      // If all scores are identical, assign median credit 8.5
      credit = 8.5;
    } else {
      const normalizedRatio = (formScore - minScore) / range;
      const rawCredit = MIN_CREDIT + normalizedRatio * (MAX_CREDIT - MIN_CREDIT);
      // Round to nearest 0.5
      credit = Math.round(rawCredit * 2) / 2;
    }

    // Clamp strictly within bounds
    credit = Math.max(MIN_CREDIT, Math.min(MAX_CREDIT, credit));

    return {
      playerId: player.id,
      formScore: Math.round(formScore * 10) / 10,
      creditValue: credit
    };
  });
}
