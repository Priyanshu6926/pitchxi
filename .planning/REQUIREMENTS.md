# Requirements Specification: PitchXI

## Traceability & Status Overview

| ID | Title | Priority | Phase | Status |
|---|---|---|---|---|
| **DATA-01** | PostgreSQL Relational Schema via Prisma | P0 | Phase 1 | Planned |
| **DATA-02** | Kaggle IPL CSV Seed Pipeline & ETL | P0 | Phase 1 | Planned |
| **DATA-03** | Player Valuation & Credit Assignment Formula | P0 | Phase 1 | Planned |
| **SCOR-01** | Deterministic Fantasy Points Calculation Engine | P0 | Phase 2 | Planned |
| **SQUAD-01** | Comprehensive Squad Validation Constraint Checker | P0 | Phase 2 | Planned |
| **AUTH-01** | JWT Authentication & Password Security | P0 | Phase 3 | Planned |
| **API-01** | REST API Endpoints (Auth, Matches, Players, Squads) | P0 | Phase 3 | Planned |
| **API-02** | Server-Side Squad Submission & Validation Gate | P0 | Phase 3 | Planned |
| **UI-01** | Responsive Navigation, Match Explorer & Player Pool | P0 | Phase 4 | Planned |
| **UI-02** | 2D Progressive Enhancement Fallback Squad Builder | P0 | Phase 4 | Planned |
| **3D-01** | React Three Fiber Stylized Low-Poly Pitch & Zones | P0 | Phase 5 | Planned |
| **3D-02** | Tap-to-Assign Player Interaction & 3D Cards | P0 | Phase 5 | Planned |
| **3D-03** | WebGL Performance Budget & Mobile Adaptation | P0 | Phase 5 | Planned |
| **OPT-01** | Auto-Pick Constrained Knapsack Optimizer Engine | P0 | Phase 6 | Planned |
| **OPT-02** | Auto-Pick Frontend Integration & Instant Squad Fill | P0 | Phase 6 | Planned |
| **SCOR-02** | Idempotent Match Scoring Batch Job | P0 | Phase 7 | Planned |
| **LEAD-01** | Match Leaderboard & User Rank Calculation | P0 | Phase 7 | Planned |
| **LEAD-02** | Socket.io Real-Time Leaderboard Update Events | P1 | Phase 7 | Planned |
| **PROF-01** | User Profile, Squad History & Career Points | P1 | Phase 8 | Planned |
| **TEST-01** | Comprehensive Unit & Integration Test Suite | P0 | Phase 2, 8 | Planned |
| **TEST-02** | Playwright E2E User Journey & WebGL Fallback Tests | P0 | Phase 8 | Planned |
| **DEP-01** | Production Build & Deployment Setup | P0 | Phase 8 | Planned |
| **LIVE-01** | (Stretch) CricAPI Live Match Overlay with Historical Fallback | P2 | Phase 9 | Deferred |
| **OPT-03** | (Stretch) ILP vs Greedy Benchmark Comparison Panel | P2 | Phase 9 | Deferred |

---

## Detailed Requirement Specifications

### 1. Data Engineering & Schema (DATA)

#### DATA-01: PostgreSQL Relational Schema via Prisma
- **Description**: Define clean Prisma schema representing Users, Teams, Players, Matches, PlayerMatchPerformances, FantasySquads, FantasySquadPlayers, and LeaderboardEntries.
- **Acceptance Criteria**:
  - Enforces foreign keys and unique constraints (e.g. unique user email, composite unique squad-match).
  - Migrations run deterministically with Prisma CLI.

#### DATA-02: Kaggle IPL Ball-by-Ball Seed Pipeline
- **Description**: Seed script (`scripts/seed`) that reads IPL historical match and ball-by-ball CSV data (2008–2024), aggregates raw events per match per player, and writes records to Postgres.
- **Acceptance Criteria**:
  - Populates at least 50+ matches, 10 franchise teams, and all active IPL players.
  - Script is idempotent and re-runnable without duplicate key violations.

#### DATA-03: Player Valuation & Credit Assignment Formula
- **Description**: Calculate credit costs for all players within $[6.0, 11.0]$ with 0.5 increments based on recent form, career averages, and role scarcity.
- **Acceptance Criteria**:
  - Star players (e.g., Kohli, Bumrah) scale close to 10.5–11.0 credits.
  - Emerging/bench players scale to 6.0–7.5 credits.
  - Squads require genuine tactical trade-offs to stay under 100 credits.

---

### 2. Scoring & Squad Constraints (SCOR & SQUAD)

#### SCOR-01: Fantasy Points Calculation Engine
- **Description**: Pure function `calculateFantasyPoints(performance: PlayerMatchPerformance): number`.
- **Rules**:
  - Batting: $+1$/run, $+4$/boundary, $+8$/six, $+8$ bonus for $\ge 50$ runs, $+16$ bonus for $\ge 100$ runs, $-2$ for duck.
  - Bowling: $+25$/wicket, $+8$ bonus for 3-wicket haul, $+16$ bonus for 5-wicket haul, economy rate bonuses/penalties.
  - Fielding: $+8$/catch, $+12$/stumping or run-out.
  - Multipliers: Captain ($2\times$), Vice-Captain ($1.5\times$).
- **Acceptance Criteria**:
  - 100% unit test coverage over edge cases (milestone runs, ducks, maidens, economy rates).

#### SQUAD-01: Squad Validation Constraint Checker
- **Description**: Function `validateSquad(players: Player[], captainId: string, viceCaptainId: string): { valid: boolean; errors: string[] }`.
- **Rules**:
  - Exactly 11 players.
  - Total credits $\le 100.0$.
  - Role bounds: WK (1–4), BAT (3–6), ALL (1–4), BOWL (3–6).
  - Franchise team cap: $\le 7$ players from either team.
  - Exactly 1 Captain and 1 Vice-Captain ($C \ne VC$).
- **Acceptance Criteria**:
  - Returns clear, actionable validation error messages.
  - Used symmetrically on both client (instant UX feedback) and backend (security gate).

---

### 3. Authentication & API (AUTH & API)

#### AUTH-01: JWT Authentication & Password Security
- **Description**: User registration and login issuing signed JWT access and refresh tokens.
- **Acceptance Criteria**:
  - Passwords hashed with bcrypt (salt rounds $\ge 10$).
  - Authenticated routes protected by middleware.
  - Tokens expire appropriately and refresh endpoint provides seamless session continuation.

#### API-01: Core REST Endpoints
- **Description**: Express REST API providing:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
  - `GET /api/matches`, `GET /api/matches/:id/players`
  - `POST /api/squads`, `GET /api/squads/:id`, `GET /api/squads/mine`
  - `GET /api/matches/:id/leaderboard`
  - `POST /api/squads/auto-pick`
- **Acceptance Criteria**:
  - Structured JSON response formats with consistent error handling.

#### API-02: Server-Side Squad Submission Gate
- **Description**: Validate squad rules server-side upon `POST /api/squads`.
- **Acceptance Criteria**:
  - Rejects invalid squads with HTTP 400 and itemized error array.
  - Rejects submissions after match lock time.
  - Stores valid squad and linked players in transaction.

---

### 4. 2D Frontend & Progressive Enhancement (UI)

#### UI-01: Match Explorer & Player Pool
- **Description**: Modern, high-aesthetic web interface (Vite + React + Tailwind CSS) featuring match selection with team logos and player pool inspection.
- **Acceptance Criteria**:
  - Role tabs (ALL, WK, BAT, BOWL) and team filters.
  - Real-time search by player name.
  - Rich dark-mode visual design.

#### UI-02: 2D Squad Builder Fallback
- **Description**: Clean 2D pitch and list view for squad construction.
- **Acceptance Criteria**:
  - Full keyboard accessibility and responsive design.
  - Active budget tracker (Credits Remaining / 100) and role counters.
  - Rendered when WebGL is unavailable or toggled by the user.

---

### 5. 3D Squad Builder (3D)

#### 3D-01: React Three Fiber Stylized Low-Poly Pitch
- **Description**: 3D cricket stadium and pitch rendered via R3F and Drei.
- **Acceptance Criteria**:
  - Stylized pitch markings, wickets, boundary crease, and stadium ambient lighting.
  - 11 slot markers distributed across strategic field zones (WK behind stumps, Batters arc, All-rounders inner ring, Bowlers boundary/crease).
  - Bounded OrbitControls preventing camera inversion or ground clipping.

#### 3D-02: Tap-to-Assign Interaction & 3D Jersey Cards
- **Description**: Clicking an empty slot opens a 2D floating drawer of eligible players. Clicking a player assigns them into the 3D slot, rendering a 3D jersey card with Drei `<Html>` labels.
- **Acceptance Criteria**:
  - Slot shows player name, team tag, and credit cost.
  - Captain and Vice-Captain badges ($C$ / $VC$) visually emphasized.
  - Click on filled slot allows replacing or removing player.

#### 3D-03: WebGL Performance Budgeting & Mobile Adaptation
- **Description**: Strict performance budget ensuring smooth rendering across devices.
- **Acceptance Criteria**:
  - Triangle count $< 50,000$, draw calls $< 50$.
  - Desktop 60 FPS, mobile $\ge 30$ FPS.
  - Device pixel ratio clamped to $\min(\text{devicePixelRatio}, 1.5)$.
  - Mobile viewport switches to fixed top-down camera with touch-optimized target sizes.
  - Graceful fallback to 2D view on `WebGL.isWebGLAvailable() === false`.

---

### 6. Auto-Pick Optimization Engine (OPT)

#### OPT-01: Multi-Dimensional Knapsack Algorithm
- **Description**: Algorithmic engine that produces the highest projected fantasy points squad satisfying all 5 constraints.
- **Acceptance Criteria**:
  - Greedy points-per-credit initialization satisfying role minimums.
  - Local search hill-climbing swap phase exploring single-player substitutions.
  - Assigns Captain to highest projected scorer, Vice-Captain to second highest.
  - Generates valid squad in $< 25$ ms.

#### OPT-02: Frontend Auto-Pick Integration
- **Description**: "Auto-Pick Squad" button on the squad builder interface that invokes the optimizer and populates the 3D pitch instantly with animation.
- **Acceptance Criteria**:
  - Supports "Lock Player" feature where user-pinned players are preserved while remaining slots are auto-picked.
  - Visual toast summary of credits used and projected squad points.

---

### 7. Match Scoring, Leaderboard & Real-Time (SCOR & LEAD)

#### SCOR-02: Idempotent Batch Scoring Job
- **Description**: Background/admin job that scores all submitted squads once a match reaches `COMPLETED` status.
- **Acceptance Criteria**:
  - Calculates each squad's total score including Captain ($2\times$) and Vice-Captain ($1.5\times$) bonuses.
  - Idempotent: safe to re-run without duplicating or corrupting scores.

#### LEAD-01: Match Leaderboard & Rankings
- **Description**: Rank all user squads for a match by points descending, with tie-breaking logic.
- **Acceptance Criteria**:
  - Displays rank, user name, squad points, and full 11-player breakdown on row click.
  - Highlights current user's entry.

#### LEAD-02: Socket.io Real-Time Leaderboard Updates
- **Description**: Broadcasts leaderboard and match score updates to active clients.
- **Acceptance Criteria**:
  - UI updates live without requiring manual page refreshes.

---

### 8. Testing & Portfolio Polish (TEST, PROF, DEP)

#### PROF-01: User Profile & Match History
- **Description**: User profile showing career stats, total fantasy points, squad history, and highest rank.

#### TEST-01: Unit & Integration Tests
- **Description**: Vitest test suite verifying:
  - `calculateFantasyPoints` with all edge cases.
  - `validateSquad` with all 5 constraint violations.
  - Auto-Pick optimizer validity and performance benchmarks.
  - API endpoint authentication and squad submission validation.

#### TEST-02: Playwright E2E Test Suite
- **Description**: Automated end-to-end test validating the complete user journey:
  - User registration $\to$ match selection $\to$ 3D squad builder $\to$ submission $\to$ scoring $\to$ leaderboard view.
  - WebGL fallback test verifying 2D functionality when WebGL is disabled.

#### DEP-01: Production Build & Deployment Documentation
- **Description**: Container/Vite production build configurations, environment variable templates, and complete README documentation featuring architecture diagrams and interview answers.
