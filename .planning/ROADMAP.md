# Project Roadmap: PitchXI

## Execution Overview

The roadmap is structured into 8 core implementation phases followed by 1 stretch phase. Each phase delivers a functional, testable milestone following the tracer-first methodology.

```
Phase 1: Foundation & Data Pipeline (Prisma, Postgres, Kaggle Seed ETL, Credits)
   │
Phase 2: Core Algorithm Engine & Tests (Scoring Rules, Squad Validator, Test Suite)
   │
Phase 3: Backend API & Authentication (Express, JWT, Squad Gate, Endpoints)
   │
Phase 4: Frontend Core & 2D Squad Builder (React, Vite, Tailwind, Zustand, 2D Fallback)
   │
Phase 5: 3D Interactive Pitch Selector (R3F, Drei, 3D Pitch, Tap-to-Assign, Mobile Budget)
   │
Phase 6: Auto-Pick Knapsack Optimizer (Greedy + Local Search Engine & UI Integration)
   │
Phase 7: Scoring Engine & Real-Time Leaderboard (Idempotent Job, Leaderboard, Socket.io)
   │
Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment (Playwright, Lighthouse, Docs)
   │
Phase 9: (Stretch) CricAPI Live Match Overlay & ILP Benchmark Comparison
```

---

## Phases & Deliverables

### Phase 1: Foundation & Data Pipeline
- **Goal**: Establish the monorepo architecture, relational database schema via Prisma, and Kaggle historical IPL dataset seed pipeline with computed player credits.
- **Deliverables**:
  - Monorepo structure (`apps/web`, `apps/api`, `packages/shared-types`, `scripts/seed`).
  - Prisma schema with models: `User`, `Team`, `Player`, `Match`, `PlayerMatchPerformance`, `FantasySquad`, `FantasySquadPlayer`, `LeaderboardEntry`.
  - Kaggle IPL ball-by-ball CSV ETL script populating historical teams, matches, and player performances.
  - Valuation algorithm calculating player form scores and normalizing credits to $[6.0, 11.0]$.
- **Requirements Covered**: DATA-01, DATA-02, DATA-03.
- **Success Criteria**:
  - `pnpm db:seed` runs cleanly and populates database with verified IPL matches and scaled player credits.

---

### Phase 2: Core Algorithm Engine & Tests
- **Goal**: Implement and thoroughly test the core mathematical and business logic pure functions.
- **Deliverables**:
  - `calculateFantasyPoints(performance)` pure function covering batting, bowling, fielding, and captain/vice-captain multipliers.
  - `validateSquad(players, captainId, viceCaptainId)` constraint validator verifying all 5 composition rules.
  - Vitest test suite achieving >95% coverage over scoring milestones, duck penalties, role bounds, and edge cases.
- **Requirements Covered**: SCOR-01, SQUAD-01, TEST-01 (Part 1).
- **Success Criteria**:
  - Unit tests pass with 100% accuracy on standard Dream11 scoring specifications.

---

### Phase 3: Backend API & Authentication
- **Goal**: Build the Express TypeScript REST API with secure JWT authentication and server-side squad submission gate.
- **Deliverables**:
  - JWT auth endpoints (register, login, refresh) with bcrypt password hashing.
  - Matches API (`GET /api/matches`, `GET /api/matches/:id/players`).
  - Squads API (`POST /api/squads`, `GET /api/squads/:id`, `GET /api/squads/mine`).
  - Server-side validation middleware executing `validateSquad` before persistence.
- **Requirements Covered**: AUTH-01, API-01, API-02.
- **Success Criteria**:
  - API correctly rejects invalid squads (e.g., >100 credits, wrong role distribution) with HTTP 400.
  - Authenticated user flows succeed with valid JWT tokens.

---

### Phase 4: Frontend Core & 2D Squad Builder
- **Goal**: Build the primary React frontend with rich visual design, state management, match explorer, and 2D accessible squad builder fallback.
- **Deliverables**:
  - React 18 + Vite + Tailwind CSS application setup with curated dark-mode aesthetic and typography.
  - Zustand squad-building state store (selected players, captain, vice-captain, credits counter).
  - Match Explorer and Player Pool with role tabs, search, and sorting.
  - Complete 2D squad builder with budget bar, role counters, and full keyboard accessibility.
- **Requirements Covered**: UI-01, UI-02.
- **Success Criteria**:
  - User can browse matches, assemble an 11-player squad in 2D, designate C/VC, and submit to the backend API.

---

### Phase 5: 3D Interactive Pitch Selector
- **Goal**: Build the flagship 3D pitch squad builder using React Three Fiber and Drei with mobile optimization and progressive fallback.
- **Deliverables**:
  - Stylized 3D cricket stadium and pitch model with 11 role-marked slot targets.
  - Bounded OrbitControls preventing camera flip.
  - Tap-to-assign interaction: click slot -> open floating player picker -> animate 3D jersey card into place with Drei `<Html>` labels.
  - WebGL performance optimizations (<50k triangles, capped pixel ratio, desktop 60 FPS, mobile 30 FPS).
  - Progressive enhancement wrapper that detects WebGL support and renders 2D fallback if unavailable.
- **Requirements Covered**: 3D-01, 3D-02, 3D-03.
- **Success Criteria**:
  - Smooth 3D squad builder functioning on desktop and mobile, with seamless tap-to-assign and clear role zone layouts.

---

### Phase 6: Auto-Pick Knapsack Optimizer
- **Goal**: Build the algorithmic Auto-Pick engine solving the constrained knapsack problem via greedy heuristics and local search hill-climbing.
- **Deliverables**:
  - `autoPickSquad(pool, lockedPlayers, constraints)` engine in `apps/api/src/services/optimizer.ts`.
  - Two-stage solver: greedy points-per-credit role allocation + local search 1-for-1 swaps.
  - API endpoint `POST /api/squads/auto-pick`.
  - Frontend "Auto-Pick Squad" button with instant animation and support for user-pinned players.
- **Requirements Covered**: OPT-01, OPT-02.
- **Success Criteria**:
  - Returns a valid, high-scoring squad in $<25$ ms that satisfies all 5 constraints without violating user-locked picks.

---

### Phase 7: Scoring Engine & Real-Time Leaderboards
- **Goal**: Implement the match completion scoring batch job and real-time leaderboard with Socket.io.
- **Deliverables**:
  - Idempotent scoring service that evaluates squads against player match performances.
  - Match leaderboard endpoint (`GET /api/matches/:id/leaderboard`) with ranks and point totals.
  - Real-time leaderboard updates using Socket.io upon match score refresh.
  - Frontend Leaderboard modal/page displaying rank list and squad drill-down views.
- **Requirements Covered**: SCOR-02, LEAD-01, LEAD-02.
- **Success Criteria**:
  - Submitted squads are scored accurately when a match completes; leaderboards display immediate rank standings.

---

### Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment
- **Goal**: Finalize test coverage, ensure mobile performance, build documentation, and prepare deployment.
- **Deliverables**:
  - User Profile screen showing past squads, career fantasy points, and best rank achieved.
  - Playwright E2E test suite covering register -> select match -> build in 3D -> submit -> leaderboard.
  - WebGL fallback automated tests.
  - Lighthouse performance audit on mobile ($\ge 80$ score).
  - Professional README.md with system architecture diagrams, DSA explanation, and interview prep cheat sheet.
  - Production deployment configuration (Render/Railway backend + Vercel frontend).
- **Requirements Covered**: PROF-01, TEST-01, TEST-02, PERF-01, DEP-01.
- **Success Criteria**:
  - Clean `pnpm test` and `pnpm test:e2e` runs; production bundle builds with zero errors; link-shareable demo deployed.

---

### Phase 9: Stretch Goals (Post-MVP)
- **Goal**: Advanced capabilities for extended portfolio highlights.
- **Deliverables**:
  - CricAPI live match overlay with automated fallback to historical mode.
  - ILP Solver comparison panel (benchmark greedy heuristic vs exact ILP solver in execution time and point yield).
  - Head-to-head private contests with shareable invite codes.
- **Requirements Covered**: LIVE-01, OPT-03.
