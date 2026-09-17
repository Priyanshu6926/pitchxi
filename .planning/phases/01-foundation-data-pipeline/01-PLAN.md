# Phase 1: Foundation & Data Pipeline

## Objective
Establish the full-stack monorepo foundation, define the relational database models using Prisma, build the player credit valuation formula engine, and create an automated seed pipeline ingesting historical IPL ball-by-ball and match data to populate teams, players, matches, and performances.

## Targeted Requirements
- **DATA-01**: PostgreSQL Relational Schema via Prisma (with zero-config SQLite support for local dev/testing).
- **DATA-02**: Kaggle IPL Ball-by-Ball Seed Pipeline & ETL script.
- **DATA-03**: Player Valuation & Credit Assignment Formula ($[6.0, 11.0]$ credits).

---

## Waves & Implementation Tasks

### Wave 1: Monorepo Architecture & Shared Types
- [ ] Initialize root `package.json` with npm workspaces (`apps/*`, `packages/*`, `scripts/*`).
- [ ] Setup base TypeScript configuration (`tsconfig.base.json`).
- [ ] Build `packages/shared-types`:
  - Enums and types for `Role` (`WK`, `BAT`, `ALL`, `BOWL`), `MatchStatus` (`UPCOMING`, `LIVE`, `COMPLETED`, `HISTORICAL`).
  - Core interfaces: `Team`, `Player`, `Match`, `PlayerMatchPerformance`, `FantasySquad`, `LeaderboardEntry`.
  - Constraint interfaces: `SquadValidationResult`, `AutoPickRequest`, `AutoPickResponse`.

### Wave 2: Prisma Relational Schema & Credit Valuation Engine
- [ ] Setup `apps/api` with TypeScript, Prisma, and Express dependencies.
- [ ] Create `prisma/schema.prisma` with models:
  - `User`, `Team`, `Player`, `Match`, `PlayerMatchPerformance`, `FantasySquad`, `FantasySquadPlayer`, `LeaderboardEntry`.
  - Proper foreign keys, composite unique constraints, indexes for match and player queries.
- [ ] Configure `DATABASE_URL` (SQLite for instantaneous local dev/testing + PostgreSQL production readiness).
- [ ] Implement `apps/api/src/services/creditCalculator.ts`:
  - Weighted average form score: $0.5 \times \text{recent 5 avg} + 0.3 \times \text{career avg} + 0.2 \times \text{role scarcity}$.
  - Min-max scaling to range $[6.0, 11.0]$ rounded to nearest $0.5$.

### Wave 3: Seed Pipeline & Historical IPL Dataset
- [ ] Create `scripts/seed` package with historical IPL data:
  - Curated real IPL matches (CSK, MI, RCB, KKR, RR, etc.) with verified ball-by-ball performances for key players (Kohli, Rohit, Dhoni, Bumrah, Russell, Pandya, etc.).
  - CSV parser support for full Kaggle ball-by-ball dataset ingestion.
- [ ] Implement `scripts/seed/seed.ts` ETL script:
  - Seeds franchise teams with logos, colors, and short codes.
  - Seeds players with assigned roles and photos.
  - Seeds historical matches with stadium venues and dates.
  - Ingests performance statistics and runs `creditCalculator` to update player credit values in the database.
- [ ] Provide npm script `npm run db:seed` and verify database hydration.

### Wave 4: Frontend Scaffolding & Verification
- [ ] Initialize `apps/web` with Vite, React 18, TypeScript, and Tailwind CSS.
- [ ] Setup Tailwind color palette (dark theme, cricket green accents, team color tokens) and base styles (`src/index.css`).
- [ ] Verify monorepo builds (`npm run build`), Prisma migrations apply cleanly, and seed script executes idempotently.

---

## Verification Plan
1. `npm run db:generate` generates Prisma Client without errors.
2. `npm run db:push` / `npm run db:migrate` applies schema successfully.
3. `npm run db:seed` populates at least 4 franchise teams, 40+ players, 5+ historical matches, and 100+ player-match performances.
4. Verify player credits are bounded in $[6.0, 11.0]$ with 0.5 increments.
5. Automated test verifies `calculatePlayerCredits` behavior and edge cases.
