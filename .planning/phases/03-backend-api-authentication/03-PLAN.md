# Phase 3: Backend API & Authentication

## Objective
Build the secure, modular Express TypeScript REST API with JWT authentication (access and refresh tokens), password hashing via bcrypt, match/player discovery endpoints, and a robust server-side squad submission gate that re-validates all 5 composition constraints against genuine database records within an atomic transaction.

## Targeted Requirements
- **AUTH-01**: JWT Authentication & Password Security (register, login, refresh, me).
- **API-01**: REST API Endpoints (Matches, Players, Squads).
- **API-02**: Server-Side Squad Submission Gate & Validation Middleware.
- **TEST-01**: Integration test coverage for authentication and squad submission.

---

## Waves & Implementation Tasks

### Wave 1: Authentication Engine & JWT Middleware
- [ ] Implement `apps/api/src/services/authService.ts`:
  - Password hashing with bcrypt (salt rounds = 10).
  - Access token generation (expires in 1h).
  - Refresh token generation (expires in 7d).
  - Token verification and payload extraction.
- [ ] Implement `apps/api/src/middleware/authMiddleware.ts`:
  - `authenticateJwt`: extracts bearer token, validates signature, attaches user context to request (`req.user = { userId, email, displayName }`).
- [ ] Implement auth routes in `apps/api/src/routes/authRoutes.ts`:
  - `POST /api/auth/register`: input validation (email, password, displayName), checks duplicate email, creates user, issues tokens.
  - `POST /api/auth/login`: verifies email & password hash, issues tokens.
  - `POST /api/auth/refresh`: verifies refresh token and issues new access token.
  - `GET /api/auth/me`: returns authenticated user profile.

### Wave 2: Matches & Player Pool Discovery Endpoints
- [ ] Implement `apps/api/src/routes/matchRoutes.ts`:
  - `GET /api/matches`: supports query filters (`status=HISTORICAL|UPCOMING|COMPLETED`), returns matches with team names, shortCodes, colors, and logos.
  - `GET /api/matches/:id`: returns match details with team rosters and venue info.
  - `GET /api/matches/:id/players`: returns available player pool (~22 players) with role, credits, team shortCode, and projected points.

### Wave 3: Server-Side Squad Submission Gate
- [ ] Implement `apps/api/src/routes/squadRoutes.ts`:
  - `POST /api/squads` (protected by `authenticateJwt`):
    - Payload: `{ matchId: string, playerIds: string[], captainId: string, viceCaptainId: string }`.
    - Server-side verification pipeline:
      1. Check match exists.
      2. Lock check: reject submission if match is already `COMPLETED` (or past start time unless in demo/test mode).
      3. Re-fetch real players from the database matching `playerIds`.
      4. Verify all 11 player IDs exist and belong to the match's two competing teams.
      5. Run `validateSquad(dbPlayers, captainId, viceCaptainId)`.
      6. Reject with HTTP 400 and itemized error array if validation fails.
      7. Atomic persistence: inside `prisma.$transaction`, create `FantasySquad` and 11 `FantasySquadPlayer` rows.
  - `GET /api/squads/:id` (protected): returns detailed squad with populated players, captain, and vice-captain.
  - `GET /api/squads/mine` (protected): returns all squads created by the authenticated user with match metadata.
  - `GET /api/matches/:id/my-squad` (protected): checks if current user already submitted a squad for the specified match.

### Wave 4: Integration Test Suite & Verification
- [ ] Create `apps/api/src/tests/api.integration.test.ts`:
  - Auth flow: register new user -> login -> fetch `/api/auth/me`.
  - Fetch matches and player pool.
  - Submit valid 11-player squad -> returns 201 with squad ID.
  - Submit invalid squad (>100 credits, missing captain, wrong player count) -> returns 400 with itemized errors.
  - Submit without token -> returns 401 Unauthorized.
- [ ] Wire all routes into `apps/api/src/index.ts`.
- [ ] Run full test suite and build check.
- [ ] Sync code to `/Users/priyanshu/Desktop/projects/pitchxi`.

---

## Verification Plan
1. Integration test suite passes (`npm run test --workspace=apps/api`).
2. Manual curl / fetch verification of auth endpoints and squad submission.
3. Server cleanly handles invalid JSON and unauthorized tokens.
4. Database transactions roll back cleanly on errors.
