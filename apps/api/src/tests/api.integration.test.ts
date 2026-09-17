import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';

describe('PitchXI Backend API Integration Tests (Phase 3)', () => {
  let authToken = '';
  let testUserId = '';
  let matchId = '';
  let samplePlayers: any[] = [];

  const testUser = {
    email: `tester_${Date.now()}@pitchxi.test`,
    password: 'securePassword123!',
    displayName: 'Test Manager'
  };

  beforeAll(async () => {
    // Fetch a sample match and its players for squad tests
    const match = await prisma.match.findFirst({
      include: { teamA: true, teamB: true }
    });

    if (match) {
      matchId = match.id;
      samplePlayers = await prisma.player.findMany({
        where: {
          teamId: { in: [match.teamAId, match.teamBId] }
        }
      });
    }
  });

  afterAll(async () => {
    // Clean up test user & squads
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId }
      }).catch(() => {});
    }
  });

  describe('1. Authentication Endpoints (/api/auth)', () => {
    it('registers a new user and returns JWT tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');

      testUserId = res.body.user.id;
      authToken = res.body.tokens.accessToken;
    });

    it('rejects registration with existing email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
    });

    it('rejects registration with short password (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'shortpass@test.com',
          password: '123',
          displayName: 'Short'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 6 characters');
    });

    it('logs in with correct credentials and returns fresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.tokens).toHaveProperty('accessToken');
      authToken = res.body.tokens.accessToken;
    });

    it('rejects login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
    });

    it('fetches authenticated user profile via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.id).toBe(testUserId);
    });

    it('rejects unauthenticated request to /api/auth/me (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('2. Match & Player Discovery Endpoints (/api/matches)', () => {
    it('returns a list of seeded matches', async () => {
      const res = await request(app)
        .get('/api/matches');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0]).toHaveProperty('teamA');
      expect(res.body.matches[0]).toHaveProperty('teamB');
    });

    it('returns player pool for a specific match', async () => {
      const res = await request(app)
        .get(`/api/matches/${matchId}/players`);

      expect(res.status).toBe(200);
      expect(res.body.matchId).toBe(matchId);
      expect(Array.isArray(res.body.players)).toBe(true);
      expect(res.body.players.length).toBeGreaterThanOrEqual(14);
      expect(res.body.players[0]).toHaveProperty('creditValue');
      expect(res.body.players[0]).toHaveProperty('role');
    });

    it('returns 404 for non-existent match players query', async () => {
      const res = await request(app)
        .get('/api/matches/non-existent-id/players');

      expect(res.status).toBe(404);
    });
  });

  describe('3. Squad Submission & Security Gate (/api/squads)', () => {
    it('rejects squad submission without auth token (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/squads')
        .send({ matchId, playerIds: [] });

      expect(res.status).toBe(401);
    });

    it('rejects squad with invalid composition (e.g. fewer than 11 players)', async () => {
      const shortPool = samplePlayers.slice(0, 5).map(p => p.id);

      const res = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matchId,
          playerIds: shortPool,
          captainId: shortPool[0],
          viceCaptainId: shortPool[1]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Constraint Violation');
      expect(res.body.errors.some((e: string) => e.includes('exactly 11 players'))).toBe(true);
    });

    it('accepts and persists a valid legal 11-player squad (201 Created)', async () => {
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      });
      const teamAId = match!.teamAId;
      const teamBId = match!.teamBId;

      const teamAPlayers = samplePlayers.filter(p => p.teamId === teamAId);
      const teamBPlayers = samplePlayers.filter(p => p.teamId === teamBId);

      // Team A: 1 WK, 2 BAT, 1 ALL, 2 BOWL = 6 players
      const aWk = teamAPlayers.filter(p => p.role === 'WK').slice(0, 1);
      const aBat = teamAPlayers.filter(p => p.role === 'BAT').slice(0, 2);
      const aAll = teamAPlayers.filter(p => p.role === 'ALL').slice(0, 1);
      const aBowl = teamAPlayers.filter(p => p.role === 'BOWL').slice(0, 2);

      // Team B: 2 BAT, 1 ALL, 2 BOWL = 5 players
      const bBat = teamBPlayers.filter(p => p.role === 'BAT').slice(0, 2);
      const bAll = teamBPlayers.filter(p => p.role === 'ALL').slice(0, 1);
      const bBowl = teamBPlayers.filter(p => p.role === 'BOWL').slice(0, 2);

      const legal11 = [...aWk, ...aBat, ...aAll, ...aBowl, ...bBat, ...bAll, ...bBowl];
      const legalIds = legal11.map(p => p.id);
      const captainId = legalIds[0];
      const viceCaptainId = legalIds[1];

      const res = await request(app)
        .post('/api/squads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matchId,
          playerIds: legalIds,
          captainId,
          viceCaptainId
        });

      if (res.status !== 201) {
        console.error('Squad submission errors:', res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body.squad).toHaveProperty('id');
      expect(res.body.squad.players).toHaveLength(11);
      expect(res.body.squad.captainPlayerId).toBe(captainId);
      expect(res.body.squad.viceCaptainPlayerId).toBe(viceCaptainId);

      // Verify retrieval via /api/squads/mine
      const mineRes = await request(app)
        .get('/api/squads/mine')
        .set('Authorization', `Bearer ${authToken}`);

      expect(mineRes.status).toBe(200);
      expect(mineRes.body.squads.length).toBeGreaterThanOrEqual(1);
      expect(mineRes.body.squads[0].matchId).toBe(matchId);
    });
  });
});
