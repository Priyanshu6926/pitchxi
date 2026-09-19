# Phase 6: Auto-Pick Knapsack Optimizer

## Objective
Build the algorithmic Auto-Pick engine solving the constrained knapsack problem via a two-stage greedy heuristic and local search hill-climbing solver. Expose a dedicated backend endpoint `POST /api/squads/auto-pick` and integrate a high-appeal "Auto-Pick Squad" UI control on the frontend supporting player pinning/locking. Guarantee execution time < 25 ms with near-optimal projected fantasy points.

---

## Requirements Covered
- **OPT-01**: Constrained knapsack solver combining greedy ratio initialization + local search hill climbing.
- **OPT-02**: Backend endpoint `POST /api/squads/auto-pick` supporting user-locked players.
- **TEST-01 (Part 2)**: Unit test suite for optimizer verifying zero constraint violations and benchmark performance.
- **UI-01**: Frontend "Auto-Pick Squad" action with locked player pin support, instant squad populate, and 2D/3D state sync.

---

## Technical Design & Tasks

### 1. Core Optimizer Algorithm (`apps/api/src/services/optimizer.ts`)
- Implement `autoPickSquad(pool: Player[], lockedPlayerIds: string[] = []): AutoPickResult`:
  - **Pre-validation**: Verify locked players don't already exceed 11 players, 100 credits, role maximums, or team limits.
  - **Stage 1 (Greedy Ratio Initialization)**:
    - Sort candidate players in each role bucket by efficiency ratio:
      $$\text{Ratio} = \frac{\text{Projected Points}}{\text{Credit Value}}$$
    - Greedily pick minimum role requirements (1 WK, 3 BAT, 1 ALL, 3 BOWL = 8 players) while accounting for locked picks and ensuring sufficient budget headroom ($\ge 6.0$ credits per remaining spot).
    - Greedily fill the remaining 3 spots to reach 11 players from eligible unpicked players maximizing points-per-credit without exceeding $\le 100$ credits, $\le 7$ per team, or role max limits.
  - **Stage 2 (Local Search Hill-Climbing Swaps)**:
    - Iterate through picked non-locked players.
    - Test 1-for-1 swaps with unpicked players of the *same role*.
    - If a swap strictly increases total projected points while maintaining $\text{credits} \le 100.0$ and $\text{team count} \le 7$, execute the swap immediately.
    - Continue until no improving swap exists (local optimum) or max iterations reached.
  - **Stage 3 (Captain & Vice-Captain Designation)**:
    - Assign Captain ($2\times$) to the highest projected scorer.
    - Assign Vice-Captain ($1.5\times$) to the second highest projected scorer.
  - **Stage 4 (Verification & Metrics)**:
    - Pass squad through `validateSquad` from `@pitchxi/shared-types`.
    - Record execution time in milliseconds ($\Delta t < 25$ ms).

### 2. Backend Endpoint (`apps/api/src/routes/squadRoutes.ts`)
- Add `POST /api/squads/auto-pick`:
  - Request body: `{ matchId: string, lockedPlayerIds?: string[] }`.
  - Authenticate via `authenticateJwt` (or optional for preview).
  - Query database for the match's player pool.
  - Execute `autoPickSquad`.
  - Return `{ squad: Player[], captainId: string, viceCaptainId: string, totalCredits: number, projectedPoints: number, executionTimeMs: number }`.

### 3. Unit Tests & Benchmark (`apps/api/src/services/optimizer.test.ts`)
- Vitest suite testing:
  - Valid squad generation: Always produces exactly 11 players satisfying all 5 rules.
  - Budget cap: Total credits strictly $\le 100.0$.
  - Role bounds: WK (1–4), BAT (3–6), ALL (1–4), BOWL (3–6).
  - Franchise cap: $\le 7$ players from either team.
  - Player locking: Respects and retains all user-locked player selections.
  - Unique C & VC: Distributes $2\times$ and $1.5\times$ to top scorers.
  - Performance benchmark: Execution time strictly $< 25$ ms across repeated trials.

### 4. Shared Types & API Client Updates
- Add `AutoPickResult` and request types in `packages/shared-types` or `apps/web/src/lib/api.ts`.
- Add `api.squads.autoPick(matchId, lockedPlayerIds)` in `apps/web/src/lib/api.ts`.

### 5. Frontend Store & UI Integration (`apps/web`)
- Update `apps/web/src/store/useSquadStore.ts`:
  - Add `lockedPlayerIds: string[]` state.
  - Add `toggleLockPlayer: (playerId: string) => void`.
  - Add `autoPickSquad: () => Promise<void>`.
  - Add `isOptimizing: boolean`.
- Update `apps/web/src/components/PlayerPool.tsx`:
  - Add pin/lock button on player cards so users can lock their star players before clicking Auto-Pick.
- Update `SquadBuilder2D.tsx` & `StadiumScene.tsx` & `App.tsx`:
  - Add prominent "Auto-Pick Squad" button with magic wand / sparkles icon and execution time badge.
  - When auto-pick completes, play subtle highlight animation and auto-populate all slots on both 2D and 3D pitch views.

---

## Verification Plan
1. **Automated Unit Tests**:
   - Run `npm test` to execute `optimizer.test.ts` (validate 100% adherence to constraints and $<25$ ms latency).
2. **Build Validation**:
   - `npm run build` across all workspaces (`shared-types`, `api`, `web`).
3. **Manual Browser Verification**:
   - Pin 1 or 2 players (e.g. Virat Kohli + MS Dhoni).
   - Click "Auto-Pick Squad".
   - Verify all 11 slots populate instantly with valid role distribution, $\le 100$ credits, and C/VC designated.
   - Verify pinned players remain in squad.
   - Verify identical squad displayed in both 2D and 3D views.
