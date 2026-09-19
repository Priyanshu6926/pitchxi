import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { validateSquad, Player as SharedPlayer, Role } from '@pitchxi/shared-types';
import { autoPickSquad } from '../services/optimizer';

const router = Router();

/**
 * POST /api/squads
 * Server-side squad submission gate.
 * Re-queries true player stats from the database, executes validateSquad,
 * and atomically persists the 11-player lineup within a Prisma transaction.
 */
router.post('/', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { matchId, playerIds, captainId, viceCaptainId } = req.body;

    // 1. Basic payload validations
    if (!matchId || typeof matchId !== 'string') {
      res.status(400).json({ error: 'Validation Error', message: 'matchId is required.' });
      return;
    }

    if (!Array.isArray(playerIds)) {
      res.status(400).json({ error: 'Validation Error', message: 'playerIds must be an array of player IDs.' });
      return;
    }

    if (!captainId || !viceCaptainId) {
      res.status(400).json({ error: 'Validation Error', message: 'Both captainId and viceCaptainId are required.' });
      return;
    }

    // 2. Fetch match to verify existence and participating teams
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      res.status(404).json({ error: 'Not Found', message: `Match with ID "${matchId}" does not exist.` });
      return;
    }

    // 3. Fetch real player records from DB (Never trust client-sent credits or roles)
    const dbPlayers = await prisma.player.findMany({
      where: {
        id: { in: playerIds }
      },
      include: {
        team: true
      }
    });

    if (dbPlayers.length !== playerIds.length) {
      res.status(400).json({
        error: 'Invalid Squad',
        message: 'One or more player IDs do not exist in the database.'
      });
      return;
    }

    // 4. Verify all players belong to either team A or team B of this match
    const invalidTeamPlayers = dbPlayers.filter(
      p => p.teamId !== match.teamAId && p.teamId !== match.teamBId
    );

    if (invalidTeamPlayers.length > 0) {
      res.status(400).json({
        error: 'Invalid Squad',
        message: `Players [${invalidTeamPlayers.map(p => p.name).join(', ')}] do not belong to either competing team for this match.`
      });
      return;
    }

    // 5. Convert to SharedPlayer interface for universal constraint validator
    const sharedPlayers: SharedPlayer[] = dbPlayers.map(p => ({
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      role: p.role as Role,
      creditValue: p.creditValue,
      projectedPoints: p.projectedPoints
    }));

    // 6. Run universal isomorphic constraint validator
    const validationResult = validateSquad(sharedPlayers, captainId, viceCaptainId);

    if (!validationResult.valid) {
      res.status(400).json({
        error: 'Constraint Violation',
        message: 'Squad failed composition constraints.',
        errors: validationResult.errors,
        details: validationResult
      });
      return;
    }

    // 7. Atomic persistence using prisma.$transaction
    // Check if user already submitted a squad for this match
    const existingSquad = await prisma.fantasySquad.findFirst({
      where: {
        userId,
        matchId
      }
    });

    const savedSquad = await prisma.$transaction(async tx => {
      let squad;

      if (existingSquad) {
        // Remove previous player associations
        await tx.fantasySquadPlayer.deleteMany({
          where: { squadId: existingSquad.id }
        });

        // Update squad metadata
        squad = await tx.fantasySquad.update({
          where: { id: existingSquad.id },
          data: {
            captainPlayerId: captainId,
            viceCaptainPlayerId: viceCaptainId,
            totalCreditsUsed: validationResult.totalCredits,
            lockedAt: new Date()
          }
        });
      } else {
        // Create new squad
        squad = await tx.fantasySquad.create({
          data: {
            userId,
            matchId,
            captainPlayerId: captainId,
            viceCaptainPlayerId: viceCaptainId,
            totalCreditsUsed: validationResult.totalCredits
          }
        });
      }

      // Create 11 join table rows
      await tx.fantasySquadPlayer.createMany({
        data: playerIds.map(pid => ({
          squadId: squad.id,
          playerId: pid
        }))
      });

      return squad;
    });

    // 8. Fetch complete populated squad to return
    const completeSquad = await prisma.fantasySquad.findUnique({
      where: { id: savedSquad.id },
      include: {
        players: {
          include: {
            player: {
              include: { team: true }
            }
          }
        },
        match: {
          include: {
            teamA: true,
            teamB: true
          }
        }
      }
    });

    res.status(existingSquad ? 200 : 201).json({
      message: existingSquad ? 'Squad updated successfully.' : 'Squad submitted successfully.',
      squad: completeSquad
    });
  } catch (error) {
    console.error('Squad submission error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process squad submission.' });
  }
});

/**
 * GET /api/squads/mine
 * Returns all fantasy squads created by the currently authenticated user.
 */
router.get('/mine', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const squads = await prisma.fantasySquad.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            teamA: true,
            teamB: true
          }
        },
        _count: {
          select: { players: true }
        }
      },
      orderBy: { lockedAt: 'desc' }
    });

    res.json({ squads });
  } catch (error) {
    console.error('Fetch my squads error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve user squads.' });
  }
});

/**
 * GET /api/matches/:id/my-squad
 * Returns user's squad for a specific match, if already submitted.
 */
router.get('/match/:matchId/my-squad', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { matchId } = req.params;

    const squad = await prisma.fantasySquad.findFirst({
      where: {
        userId,
        matchId
      },
      include: {
        players: {
          include: {
            player: {
              include: { team: true }
            }
          }
        }
      }
    });

    res.json({ squad });
  } catch (error) {
    console.error('Fetch match my-squad error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to check user squad.' });
  }
});

/**
 * POST /api/squads/auto-pick
 * Runs constrained knapsack optimization to generate an optimal legal squad.
 * Supports optional lockedPlayerIds array.
 */
router.post('/auto-pick', async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId, lockedPlayerIds = [] } = req.body;

    if (!matchId || typeof matchId !== 'string') {
      res.status(400).json({ error: 'Validation Error', message: 'matchId is required.' });
      return;
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      res.status(404).json({ error: 'Not Found', message: `Match with ID "${matchId}" does not exist.` });
      return;
    }

    // Fetch all players for this match
    const dbPlayers = await prisma.player.findMany({
      where: {
        teamId: { in: [match.teamAId, match.teamBId] }
      },
      include: {
        team: true
      }
    });

    if (dbPlayers.length < 11) {
      res.status(400).json({
        error: 'Insufficient Players',
        message: 'Insufficient players available for this match to compute an 11-player squad.'
      });
      return;
    }

    // Convert to SharedPlayer
    const pool: SharedPlayer[] = dbPlayers.map(p => ({
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      team: p.team ? {
        id: p.team.id,
        name: p.team.name,
        shortCode: p.team.shortCode,
        logoUrl: p.team.logoUrl || undefined,
        primaryColor: p.team.primaryColor || undefined
      } : undefined,
      role: p.role as Role,
      creditValue: p.creditValue,
      projectedPoints: p.projectedPoints
    }));

    const result = autoPickSquad(pool, lockedPlayerIds);

    res.json({
      message: 'Optimal squad computed successfully.',
      ...result
    });
  } catch (error: any) {
    console.error('Auto-pick optimization error:', error);
    res.status(400).json({
      error: 'Optimization Error',
      message: error.message || 'Failed to auto-pick optimal squad.'
    });
  }
});

/**
 * GET /api/squads/:id
 * Returns squad details by squad ID.
 */
router.get('/:id', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const squad = await prisma.fantasySquad.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              include: { team: true }
            }
          }
        },
        match: {
          include: {
            teamA: true,
            teamB: true
          }
        },
        user: {
          select: { id: true, displayName: true }
        }
      }
    });

    if (!squad) {
      res.status(404).json({ error: 'Not Found', message: `Squad with ID "${id}" was not found.` });
      return;
    }

    res.json({ squad });
  } catch (error) {
    console.error('Fetch squad error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to retrieve squad.' });
  }
});

export default router;
