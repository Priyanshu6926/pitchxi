import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { scoreMatch } from './matchScoringService';

describe('Match Scoring Service & Leaderboard Engine (Phase 7)', () => {
  let testMatchId: string;
  let user1Id: string;
  let user2Id: string;
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;
  let squad1Id: string;
  let squad2Id: string;

  beforeAll(async () => {
    // 1. Create 2 test users
    const u1 = await prisma.user.create({
      data: {
        email: `scoring-test-1-${Date.now()}@example.com`,
        passwordHash: 'hash123',
        displayName: 'Test User Alpha'
      }
    });
    user1Id = u1.id;

    const u2 = await prisma.user.create({
      data: {
        email: `scoring-test-2-${Date.now()}@example.com`,
        passwordHash: 'hash123',
        displayName: 'Test User Beta'
      }
    });
    user2Id = u2.id;

    // 2. Fetch or create teams
    let teamA = await prisma.team.findFirst();
    let teamB = await prisma.team.findFirst({ where: { id: { not: teamA?.id } } });

    if (!teamA || !teamB) {
      teamA = await prisma.team.create({ data: { name: 'Score Team A', shortCode: 'STA' } });
      teamB = await prisma.team.create({ data: { name: 'Score Team B', shortCode: 'STB' } });
    }

    // 3. Create test match
    const match = await prisma.match.create({
      data: {
        teamAId: teamA.id,
        teamBId: teamB.id,
        venue: 'Wankhede Stadium, Mumbai',
        matchDate: new Date(),
        status: 'UPCOMING'
      }
    });
    testMatchId = match.id;

    // 4. Create 3 test players
    const p1 = await prisma.player.create({
      data: { name: 'Score Star Batsman', teamId: teamA.id, role: 'BAT', creditValue: 10.0 }
    });
    player1Id = p1.id;

    const p2 = await prisma.player.create({
      data: { name: 'Score Lead Bowler', teamId: teamB.id, role: 'BOWL', creditValue: 9.5 }
    });
    player2Id = p2.id;

    const p3 = await prisma.player.create({
      data: { name: 'Score All-Rounder', teamId: teamA.id, role: 'ALL', creditValue: 8.5 }
    });
    player3Id = p3.id;

    // 5. Create player performances:
    // Player 1: 50 fantasy points
    // Player 2: 40 fantasy points
    // Player 3: 20 fantasy points
    await prisma.playerMatchPerformance.createMany({
      data: [
        { matchId: testMatchId, playerId: player1Id, fantasyPoints: 50.0 },
        { matchId: testMatchId, playerId: player2Id, fantasyPoints: 40.0 },
        { matchId: testMatchId, playerId: player3Id, fantasyPoints: 20.0 }
      ]
    });

    // 6. Create Squad 1 (User Alpha):
    // Captain: Player 1 (50 * 2 = 100)
    // Vice-Captain: Player 2 (40 * 1.5 = 60)
    // Regular: Player 3 (20 * 1 = 20)
    // Total Expected = 100 + 60 + 20 = 180 points
    const s1 = await prisma.fantasySquad.create({
      data: {
        userId: user1Id,
        matchId: testMatchId,
        captainPlayerId: player1Id,
        viceCaptainPlayerId: player2Id,
        totalCreditsUsed: 28.0,
        players: {
          create: [
            { playerId: player1Id },
            { playerId: player2Id },
            { playerId: player3Id }
          ]
        }
      }
    });
    squad1Id = s1.id;

    // 7. Create Squad 2 (User Beta):
    // Captain: Player 3 (20 * 2 = 40)
    // Vice-Captain: Player 1 (50 * 1.5 = 75)
    // Regular: Player 2 (40 * 1 = 40)
    // Total Expected = 40 + 75 + 40 = 155 points
    const s2 = await prisma.fantasySquad.create({
      data: {
        userId: user2Id,
        matchId: testMatchId,
        captainPlayerId: player3Id,
        viceCaptainPlayerId: player1Id,
        totalCreditsUsed: 28.0,
        players: {
          create: [
            { playerId: player1Id },
            { playerId: player2Id },
            { playerId: player3Id }
          ]
        }
      }
    });
    squad2Id = s2.id;
  });

  afterAll(async () => {
    // Cleanup test fixtures
    await prisma.leaderboardEntry.deleteMany({ where: { matchId: testMatchId } });
    await prisma.fantasySquadPlayer.deleteMany({ where: { squadId: { in: [squad1Id, squad2Id] } } });
    await prisma.fantasySquad.deleteMany({ where: { id: { in: [squad1Id, squad2Id] } } });
    await prisma.playerMatchPerformance.deleteMany({ where: { matchId: testMatchId } });
    await prisma.player.deleteMany({ where: { id: { in: [player1Id, player2Id, player3Id] } } });
    await prisma.match.delete({ where: { id: testMatchId } });
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
  });

  it('1. Correctly computes points with Captain (2x) and Vice-Captain (1.5x) multipliers', async () => {
    const result = await scoreMatch(testMatchId);

    expect(result.squadsScored).toBe(2);

    // Squad 1: 50*2 + 40*1.5 + 20*1 = 180
    const rank1 = result.topEntries.find(e => e.squadId === squad1Id);
    expect(rank1).toBeDefined();
    expect(rank1!.totalPoints).toBe(180.0);
    expect(rank1!.rank).toBe(1);

    // Squad 2: 20*2 + 50*1.5 + 40*1 = 155
    const rank2 = result.topEntries.find(e => e.squadId === squad2Id);
    expect(rank2).toBeDefined();
    expect(rank2!.totalPoints).toBe(155.0);
    expect(rank2!.rank).toBe(2);
  });

  it('2. Persists LeaderboardEntry records in database', async () => {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { matchId: testMatchId },
      orderBy: { rank: 'asc' }
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].squadId).toBe(squad1Id);
    expect(entries[0].rank).toBe(1);
    expect(entries[0].totalPoints).toBe(180.0);

    expect(entries[1].squadId).toBe(squad2Id);
    expect(entries[1].rank).toBe(2);
    expect(entries[1].totalPoints).toBe(155.0);
  });

  it('3. Guarantees idempotency: multiple executions produce identical state with no duplicate rows', async () => {
    // Run second time
    const result2 = await scoreMatch(testMatchId);
    expect(result2.squadsScored).toBe(2);

    const entriesAfterSecondRun = await prisma.leaderboardEntry.findMany({
      where: { matchId: testMatchId }
    });

    // Still exactly 2 entries (no duplicates created)
    expect(entriesAfterSecondRun).toHaveLength(2);

    // Points and ranks remain identical
    const entry1 = entriesAfterSecondRun.find(e => e.squadId === squad1Id);
    expect(entry1?.totalPoints).toBe(180.0);
    expect(entry1?.rank).toBe(1);
  });

  it('4. Updates match status to COMPLETED upon scoring', async () => {
    const updatedMatch = await prisma.match.findUnique({
      where: { id: testMatchId }
    });

    expect(updatedMatch?.status).toBe('COMPLETED');
  });
});
