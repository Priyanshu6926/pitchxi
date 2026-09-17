import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

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

export default router;
