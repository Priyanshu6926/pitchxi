# Phase 7: Scoring Engine & Real-Time Leaderboards

## Objective
Implement the match scoring batch service and real-time leaderboards. Accurately evaluate submitted fantasy squads against actual player match performances using the Dream11 scoring engine (with Captain 2x and Vice-Captain 1.5x multipliers), calculate competitive rankings, persist idempotent `LeaderboardEntry` records, broadcast real-time standing updates via Socket.io, and provide an interactive frontend Leaderboard interface with live rank inspection.

---

## Requirements Covered
- **SCOR-02**: Idempotent match completion scoring service evaluating squads against actual match performance stats.
- **LEAD-01**: Match leaderboard endpoint (`GET /api/matches/:id/leaderboard`) returning ranked squads and points.
- **LEAD-02**: Real-time standing updates over WebSockets (Socket.io) upon score calculation.
- **UI-02**: Frontend Leaderboard view with rank tiers, user squad highlighting, captaincy badges, and interactive match score simulation.

---

## Technical Design & Tasks

### 1. Match Scoring Service (`apps/api/src/services/matchScoringService.ts`)
- Implement `scoreMatch(matchId: string): Promise<MatchScoringResult>`:
  - Fetch all `PlayerMatchPerformance` records for `matchId`.
  - Fetch all `FantasySquad` entries submitted for `matchId` including their 11 players.
  - For each squad:
    - Sum player fantasy points: Captain receives $2.0\times$, Vice-Captain receives $1.5\times$, other 9 players receive $1.0\times$.
    - Atomically update `fantasySquad.totalPoints`.
  - Sort all squads by `totalPoints` descending (secondary tie-break: `lockedAt` ascending).
  - Assign ranks $1, 2, \dots, N$.
  - Atomically upsert `LeaderboardEntry` rows (`matchId`, `squadId`, `userId`, `rank`, `totalPoints`).
  - Broadcast `leaderboard:update` event over Socket.io to the `match:${matchId}` room.
  - Guarantee **idempotency**: Multiple executions produce identical results with zero duplicate rows.

### 2. Socket.io Server Setup (`apps/api/src/lib/socket.ts` & `apps/api/src/index.ts`)
- Install `socket.io` in `apps/api` and `socket.io-client` in `apps/web`.
- Create `apps/api/src/lib/socket.ts`:
  - Initialize Socket.io server with CORS support.
  - Room management: client joins room `match:${matchId}` and leaves when changing match.
  - Helper `broadcastLeaderboardUpdate(matchId: string, payload: any)`.
- Wrap Express `app` with `http.createServer(app)`.

### 3. API Endpoints (`apps/api/src/routes/leaderboardRoutes.ts` & `matchRoutes.ts`)
- `GET /api/matches/:id/leaderboard`:
  - Returns leaderboard standings (rank, points, user display name, squadId, captain/vice-captain, total credits used).
  - Identifies the authenticated requesting user's squad and rank.
- `POST /api/matches/:id/score`:
  - Triggers match scoring recalculation (ideal for interview demos and completed match finalization).
  - Returns updated leaderboard entries and processing metrics.

### 4. Unit & Integration Tests (`apps/api/src/services/matchScoringService.test.ts`)
- Vitest suite testing:
  - Exact math verification with Captain 2x and Vice-Captain 1.5x multipliers.
  - Ranks assigned correctly in descending order of points.
  - Idempotency test: calling `scoreMatch` consecutively yields identical point totals and ranks.
  - Integration test for `GET /api/matches/:id/leaderboard` and `POST /api/matches/:id/score`.

### 5. Frontend Leaderboard Interface & Socket.io Live Updates (`apps/web`)
- Add `socket.ts` in `apps/web/src/lib/socket.ts` connecting to the backend.
- Create `apps/web/src/components/LeaderboardView.tsx`:
  - Tab in navigation bar ("Standings" or "Leaderboard").
  - Table of top squads with gold/silver/bronze podium badges for top 3.
  - Highlights current user's rank.
  - Shows Captain and Vice-Captain for each squad with their individual scores.
  - "Simulate / Recalculate Scoring" button triggering `POST /api/matches/:id/score` with live Socket.io re-sort animation.

---

## Verification Plan
1. **Automated Tests**:
   - Run `npm test` across all workspaces to verify `matchScoringService.test.ts` and API integration tests.
2. **Build Validation**:
   - `npm run build` across all workspaces.
3. **Manual Browser Verification**:
   - Submit a squad for an IPL match.
   - Navigate to the Leaderboard tab.
   - Click "Simulate Match Scoring" -> verify Socket.io broadcasts update -> ranks and fantasy points calculate in real-time -> user squad reflects Captain 2x and VC 1.5x points.
