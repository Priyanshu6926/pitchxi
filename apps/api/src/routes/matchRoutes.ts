import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../services/authService';

const router = Router();

/**
 * GET /api/matches
 * Returns a list of IPL matches, optionally filtered by status (HISTORICAL, UPCOMING, LIVE, COMPLETED).
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status && typeof status === 'string') {
      whereClause.status = status.toUpperCase();
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        teamA: {
          select: { id: true, name: true, shortCode: true, primaryColor: true, logoUrl: true }
        },
        teamB: {
          select: { id: true, name: true, shortCode: true, primaryColor: true, logoUrl: true }
        }
      },
      orderBy: { matchDate: 'asc' }
    });

    res.json({ matches });
  } catch (error) {
    console.error('Fetch matches error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve matches.' });
  }
});

/**
 * GET /api/matches/:id
 * Returns single match details.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        teamA: true,
        teamB: true
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Not Found', message: `Match with ID "${id}" was not found.` });
      return;
    }

    res.json({ match });
  } catch (error) {
    console.error('Fetch match details error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve match details.' });
  }
});

/**
 * GET /api/matches/:id/players
 * Returns the pool of available players from both participating teams for squad selection.
 */
router.get('/:id/players', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      select: { teamAId: true, teamBId: true }
    });

    if (!match) {
      res.status(404).json({ error: 'Not Found', message: `Match with ID "${id}" was not found.` });
      return;
    }

    // Fetch players belonging to team A or team B
    const players = await prisma.player.findMany({
      where: {
        teamId: {
          in: [match.teamAId, match.teamBId]
        }
      },
      include: {
        team: {
          select: { id: true, name: true, shortCode: true, primaryColor: true }
        }
      },
      orderBy: [
        { creditValue: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      matchId: id,
      totalAvailable: players.length,
      players
    });
  } catch (error) {
    console.error('Fetch match players error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve match player pool.' });
  }
});

/**
 * GET /api/matches/:id/leaderboard
 * Returns ranked standings for the specified match.
 */
router.get('/:id/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Optional auth token to highlight current user's entry
    let requestingUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        requestingUserId = payload.userId;
      } catch {
        // Ignore invalid token for public leaderboard reading
      }
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        teamA: { select: { id: true, name: true, shortCode: true, primaryColor: true } },
        teamB: { select: { id: true, name: true, shortCode: true, primaryColor: true } }
      }
    });

    if (!match) {
      res.status(404).json({ error: 'Not Found', message: `Match with ID "${id}" was not found.` });
      return;
    }

    const entries = await prisma.leaderboardEntry.findMany({
      where: { matchId: id },
      include: {
        user: { select: { id: true, displayName: true } },
        squad: {
          include: {
            players: {
              include: {
                player: {
                  select: { id: true, name: true, role: true, creditValue: true, teamId: true }
                }
              }
            }
          }
        }
      },
      orderBy: { rank: 'asc' }
    });

    const formattedEntries = entries.map((entry) => {
      const captainPlayer = entry.squad.players.find(p => p.playerId === entry.squad.captainPlayerId)?.player;
      const viceCaptainPlayer = entry.squad.players.find(p => p.playerId === entry.squad.viceCaptainPlayerId)?.player;

      return {
        id: entry.id,
        rank: entry.rank,
        totalPoints: entry.totalPoints,
        squadId: entry.squadId,
        userId: entry.userId,
        displayName: entry.user.displayName,
        isCurrentUser: requestingUserId ? entry.userId === requestingUserId : false,
        totalCreditsUsed: entry.squad.totalCreditsUsed,
        captain: captainPlayer ? {
          id: captainPlayer.id,
          name: captainPlayer.name,
          role: captainPlayer.role
        } : null,
        viceCaptain: viceCaptainPlayer ? {
          id: viceCaptainPlayer.id,
          name: viceCaptainPlayer.name,
          role: viceCaptainPlayer.role
        } : null
      };
    });

    res.json({
      matchId: id,
      match: {
        id: match.id,
        status: match.status,
        venue: match.venue,
        teamA: match.teamA,
        teamB: match.teamB
      },
      totalParticipants: formattedEntries.length,
      entries: formattedEntries
    });
  } catch (error) {
    console.error('Fetch match leaderboard error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve match leaderboard.' });
  }
});

/**
 * POST /api/matches/:id/score
 * Triggers match scoring recalculation and broadcasts leaderboard update via Socket.io.
 */
router.post('/:id/score', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scoreMatch } = await import('../services/matchScoringService');

    const result = await scoreMatch(id);

    res.json({
      message: 'Match scored successfully.',
      ...result
    });
  } catch (error: any) {
    console.error('Trigger match scoring error:', error);
    res.status(400).json({ error: 'Scoring Error', message: error.message || 'Failed to score match.' });
  }
});

export default router;
