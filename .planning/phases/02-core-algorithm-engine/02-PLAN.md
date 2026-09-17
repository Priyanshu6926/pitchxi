# Phase 2: Core Algorithm Engine & Tests

## Objective
Implement the pure, deterministic business logic algorithms powering PitchXI:
1. **Fantasy Scoring Engine** (`calculateFantasyPoints`): Dream11-style scoring rules covering batting, bowling, fielding, strike rate tiers, economy rates, haul bonuses, and captain/vice-captain multipliers.
2. **Squad Constraint Validator** (`validateSquad`): Universal isomorphic constraint validator verifying all 5 roster rules (11 players, $\le 100$ credits, role limits, team-of-origin $\le 7$, unique C and VC).
3. **Comprehensive Unit Test Suite**: Thorough Vitest coverage across all boundary conditions, penalties, edge cases, and invalid permutations.

## Targeted Requirements
- **SCOR-01**: Deterministic Fantasy Points Calculation Engine (`calculateFantasyPoints`).
- **SQUAD-01**: Comprehensive Squad Validation Constraint Checker (`validateSquad`).
- **TEST-01**: Full unit test coverage for scoring and constraint validation rules.

---

## Waves & Implementation Tasks

### Wave 1: Pure Scoring Calculation Engine
- [ ] Create `apps/api/src/services/scoringEngine.ts`:
  - Batting rules: run points (+1), boundary bonus (+4), six bonus (+8), 50-run (+8), 100-run (+16), duck penalty (-2), strike rate bonus/penalty tiers (min 10 balls).
  - Bowling rules: wicket points (+25), 3-wicket haul (+8), 4-wicket haul (+12), 5-wicket haul (+16), maiden over (+12), economy rate bonus/penalty tiers (min 2 overs).
  - Fielding rules: catch (+8), 3 catches bonus (+4), stumping (+12), direct run-out (+12).
  - Multiplier support: Captain ($2\times$) and Vice-Captain ($1.5\times$).
- [ ] Implement unit tests in `apps/api/src/services/scoringEngine.test.ts`:
  - Milestones: half-century, century, ducks for batters vs bowlers.
  - Economy and strike rate edge cases (exactly 10 balls, exactly 2.0 overs).
  - Haul bonuses (3, 4, 5 wickets).

### Wave 2: Isomorphic Squad Constraint Validator
- [ ] Create `packages/shared-types/src/validator.ts`:
  - Pure function `validateSquad(players: Player[], captainId: string, viceCaptainId: string, matchTeamAId?: string, matchTeamBId?: string): SquadValidationResult`.
  - Enforces:
    1. Exactly 11 players.
    2. Total credits $\le 100.0$.
    3. Role counts within bounds: WK 1–4, BAT 3–6, ALL 1–4, BOWL 3–6.
    4. Maximum 7 players from either franchise team.
    5. Exactly 1 Captain and 1 Vice-Captain ($C \ne VC$), both present in the 11-player squad.
  - Returns detailed object: `{ valid: boolean, errors: string[], roleCounts, teamCounts, totalCredits, playerCount }`.
- [ ] Export `validateSquad` from `packages/shared-types/src/index.ts`.
- [ ] Implement unit tests in `packages/shared-types/src/validator.test.ts`:
  - Valid legal squad test.
  - Exceeding budget (>100 credits).
  - Incorrect player counts (<11 or >11).
  - Role bound violations (e.g. 0 WK, 7 BAT, 0 ALL, 7 BOWL).
  - Team quota violation (>7 players from CSK).
  - Invalid Captain/Vice-Captain (same player, or C not in squad).

### Wave 3: Integration & Test Runner Verification
- [ ] Configure Vitest across workspace so `npm run test` executes all test suites.
- [ ] Verify 100% of algorithm unit tests pass.
- [ ] Synchronize updated code to `/Users/priyanshu/Desktop/projects/pitchxi`.

---

## Verification Plan
1. `npm run test --workspace=packages/shared-types` passes with 100% coverage on all constraint violations.
2. `npm run test --workspace=apps/api` passes with 100% coverage on scoring calculation rules.
3. Root `npm run test` runs both test suites cleanly.
