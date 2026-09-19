import { prisma } from '../lib/prisma';
import { calculateFantasyPoints } from './scoringEngine';
import { broadcastLeaderboardUpdate } from '../lib/socket';

export interface ScoredSquadSummary {
  rank: number;
  squadId: string;
  userId: string;
  displayName: string;
  captainId: string;
  viceCaptainId: string;
  totalCreditsUsed: number;
  totalPoints: number;
}

export interface MatchScoringResult {
  matchId: string;
  squadsScored: number;
  topEntries: ScoredSquadSummary[];
}

/**
 * Evaluates and scores all fantasy squads submitted for a given match.
 * Idempotent: Can be run repeatedly without creating duplicate rows or corrupting ranks.
 */
export async function scoreMatch(matchId: string): Promise<MatchScoringResult> {
  // 1. Verify match existence
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: true,
      teamB: true
    }
  });

  if (!match) {
    throw new Error(`Match with ID "${matchId}" was not found.`);
  }

  // 2. Fetch all recorded player match performances for this match
  const performances = await prisma.playerMatchPerformance.findMany({
    where: { matchId },
    include: {
      player: true
    }
  });

  // Map each player's fantasy points
  const performanceMap = new Map<string, number>();
  for (const perf of performances) {
    let points = perf.fantasyPoints;
    // If fantasyPoints was uncalculated or 0, compute via pure scoringEngine
    if (points === 0 && (perf.runs > 0 || perf.wickets > 0 || perf.catches > 0)) {
      points = calculateFantasyPoints({
        runs: perf.runs,
        ballsFaced: perf.ballsFaced,
        fours: perf.fours,
        sixes: perf.sixes,
        wickets: perf.wickets,
        oversBowled: perf.oversBowled,
        runsConceded: perf.runsConceded,
        maidens: perf.maidens,
        catches: perf.catches,
        stumpings: perf.stumpings,
        runOutsDirect: perf.runOuts
      });
    }
    performanceMap.set(perf.playerId, points);
  }

  // 3. Fetch all squads for this match
  const squads = await prisma.fantasySquad.findMany({
    where: { matchId },
    include: {
      user: {
        select: { id: true, displayName: true }
      },
      players: {
        include: {
          player: true
        }
      }
    }
  });

  if (squads.length === 0) {
    return {
      matchId,
      squadsScored: 0,
      topEntries: []
    };
  }

  // 4. Calculate total fantasy points for each squad
  const scoredSquads = squads.map((squad) => {
    let totalPoints = 0;

    for (const sp of squad.players) {
      const basePoints = performanceMap.get(sp.playerId) || 0;
      let multiplier = 1.0;

      if (sp.playerId === squad.captainPlayerId) {
        multiplier = 2.0; // Captain receives 2x
      } else if (sp.playerId === squad.viceCaptainPlayerId) {
        multiplier = 1.5; // Vice-Captain receives 1.5x
      }

      totalPoints += basePoints * multiplier;
    }

    return {
      squadId: squad.id,
      userId: squad.userId,
      displayName: squad.user.displayName,
      captainId: squad.captainPlayerId,
      viceCaptainId: squad.viceCaptainPlayerId,
      totalCreditsUsed: squad.totalCreditsUsed,
      totalPoints: Math.round(totalPoints * 10) / 10,
      lockedAt: squad.lockedAt
    };
  });

  // 5. Sort squads by total points descending (tie-breaker: earlier lockedAt submission)
  scoredSquads.sort((a, b) => {
    if (Math.abs(b.totalPoints - a.totalPoints) > 0.001) {
      return b.totalPoints - a.totalPoints;
    }
    return new Date(a.lockedAt).getTime() - new Date(b.lockedAt).getTime();
  });

  // Assign 1-indexed ranks
  const rankedSquads: ScoredSquadSummary[] = scoredSquads.map((s, idx) => ({
    rank: idx + 1,
    squadId: s.squadId,
    userId: s.userId,
    displayName: s.displayName,
    captainId: s.captainId,
    viceCaptainId: s.viceCaptainId,
    totalCreditsUsed: s.totalCreditsUsed,
    totalPoints: s.totalPoints
  }));

  // 6. Persist points and ranks atomically inside a Prisma transaction
  await prisma.$transaction(async (tx) => {
    for (const item of rankedSquads) {
      // Update FantasySquad totalPoints
      await tx.fantasySquad.update({
        where: { id: item.squadId },
        data: { totalPoints: item.totalPoints }
      });

      // Upsert LeaderboardEntry
      await tx.leaderboardEntry.upsert({
        where: {
          matchId_squadId: {
            matchId,
            squadId: item.squadId
          }
        },
        create: {
          matchId,
          squadId: item.squadId,
          userId: item.userId,
          rank: item.rank,
          totalPoints: item.totalPoints
        },
        update: {
          rank: item.rank,
          totalPoints: item.totalPoints
        }
      });
    }

    // Mark match as COMPLETED if it was UPCOMING/LIVE
    if (match.status !== 'COMPLETED') {
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' }
      });
    }
  });

  // 7. Broadcast real-time update via Socket.io
  broadcastLeaderboardUpdate(matchId, {
    matchId,
    totalParticipants: rankedSquads.length,
    topEntries: rankedSquads.slice(0, 50)
  });

  return {
    matchId,
    squadsScored: rankedSquads.length,
    topEntries: rankedSquads
  };
}
