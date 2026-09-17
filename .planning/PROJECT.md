# Project Brief: PitchXI

## 1. Executive Summary
**PitchXI** is an interactive fantasy cricket platform focused on the Indian Premier League (IPL). Users build an 11-player squad under a 100-credit budget, role composition limits (WK, BAT, ALL, BOWL), and franchise limits (max 7 per IPL team). Squads are scored against real historical IPL match performances (2008–2024 ball-by-ball data) and ranked on competitive match leaderboards.

The project features two flagship differentiators:
1. **Interactive 3D Squad Builder**: An optimized React Three Fiber (R3F) + Drei 3D pitch where players are assigned into spatial role zones, with responsive mobile adaptations and progressive enhancement (WebGL feature-detected 2D fallback).
2. **Auto-Pick Optimization Engine**: A constrained knapsack algorithm combining a greedy points-to-credit heuristic with local search hill-climbing to compute optimal legal squads under multi-dimensional constraints.

Target Audience & Intent: Final-year B.Tech IT placement portfolio flagship, designed to showcase deep problem-solving in DSA/Optimization, Data Engineering, and WebGL Frontend engineering with zero reliance on fragile third-party live APIs during interview demos.

---

## 2. Core Value Proposition & Portfolio Stories

| Domain | Resume / Interview Story | Implementation Detail |
|---|---|---|
| **Algorithms & DSA** | Multi-dimensional Constrained Knapsack Problem | Heuristic greedy ratio initialization + role minimum satisfaction + local search hill climbing swap iterations (plus ILP benchmark comparison). |
| **Data Engineering** | Seeded Ball-by-Ball Historical ETL Pipeline | Ingesting 2008–2024 Kaggle IPL CSV data into PostgreSQL, computing player form scores and normalising salary credits ($[6.0, 11.0]$). |
| **Frontend & Graphics** | WebGL Performance Budgeting & Progressive Fallback | R3F 3D pitch (<50k triangles, <2MB assets, 60fps desktop / 30fps mobile), orbit constraints, tap-to-assign UX, and 2D accessible fallback. |
| **Resilient Architecture** | Zero-downtime Demo Strategy | Core gameplay operates deterministically on seeded historical matches; stretch live CricAPI overlay gracefully degrades if rate-limited or off-season. |

---

## 3. Goals and Scope Boundaries

### In-Scope (MVP)
- **Authentication**: JWT-based auth (access + refresh tokens) with bcrypt password hashing.
- **Match Explorer**: List of historical and upcoming IPL matches with team crests and venue info.
- **Player Pool**: Match-specific 22-player pool with role, credits, stats, and filters.
- **Squad Builder (3D & 2D)**:
  - 3D low-poly pitch using React Three Fiber with 11 role-marked slot targets.
  - Tap-to-assign player picker overlay.
  - Visual designation of Captain ($2\times$) and Vice-Captain ($1.5\times$).
  - Real-time budget and constraint validation.
  - Complete 2D grid fallback for devices without WebGL or upon user preference.
- **Auto-Pick Engine**: Algorithmic suggestion of the highest projected point valid squad.
- **Scoring Engine**: Dream11-style scoring rules implemented as an idempotent batch job.
- **Leaderboards**: Match-level leaderboard ranking user squads by actual match fantasy points.
- **User Profile**: Career statistics, squads submitted, and best rank achieved.

### Out of Scope (Explicit Non-Goals for MVP)
- Real money gambling or payment gateway integrations (points-only fantasy).
- Native mobile applications (responsive web only).
- Formats other than IPL T20 (keeps rules and data models strictly bounded).
- Complex multi-provider social OAuth (email/password first; Google OAuth only as optional stretch).
- Uncapped real-time live scraping during core loop.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React Frontend (apps/web)                   │
│   Vite + TypeScript + Tailwind CSS + Zustand + R3F / Drei   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST
                               │ WebSocket (Socket.io)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend (apps/api)                  │
│       TypeScript + Prisma ORM + JWT Auth + node-cron        │
└──────────────┬──────────────────────────────┬───────────────┘
               │ SQL Queries                  │ Polling (Stretch only)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PostgreSQL Database     │ │   CricAPI / cricketdata    │
│  (Users, Matches, Players,   │ │   (Optional live overlay   │
│   Squads, Leaderboards)      │ │    with graceful fallback) │
└──────────────────────────────┘ └────────────────────────────┘
               ▲
               │ Seed ETL Script (scripts/seed)
┌──────────────┴──────────────┐
│ Kaggle IPL Ball-by-Ball CSV │
│ (Seeded 2008-2024 match DB) │
└─────────────────────────────┘
```

---

## 5. Data Model (Relational Schema)

- **`User`**: `id`, `email`, `passwordHash`, `displayName`, `createdAt`, `updatedAt`
- **`Team`**: `id`, `name`, `shortCode` (e.g. CSK, MI, RCB), `logoUrl`
- **`Player`**: `id`, `name`, `teamId`, `role` (`WK` | `BAT` | `ALL` | `BOWL`), `creditValue`, `photoUrl`
- **`Match`**: `id`, `teamAId`, `teamBId`, `venue`, `matchDate`, `status` (`HISTORICAL` | `UPCOMING` | `LIVE` | `COMPLETED`), `source` (`SEED` | `LIVE_API`)
- **`PlayerMatchPerformance`**: `id`, `playerId`, `matchId`, `runs`, `ballsFaced`, `fours`, `sixes`, `wickets`, `oversBowled`, `runsConceded`, `catches`, `stumpings`, `fantasyPoints`
- **`FantasySquad`**: `id`, `userId`, `matchId`, `captainPlayerId`, `viceCaptainPlayerId`, `totalCreditsUsed`, `lockedAt`, `totalPoints`
- **`FantasySquadPlayer`**: `squadId`, `playerId` (composite primary key; 11 rows per squad)
- **`LeaderboardEntry`**: `id`, `matchId`, `squadId`, `userId`, `rank`, `totalPoints`, `updatedAt`

---

## 6. Core Algorithms & Logic

### 6.1 Dynamic Credit Calculation
To establish fair, market-like salary caps without proprietary Dream11 APIs:
$$\text{Form Score} = 0.5 \times \text{AvgPoints}_{\text{recent 5}} + 0.3 \times \text{AvgPoints}_{\text{career}} + 0.2 \times \text{RoleScarcity}$$
$$\text{Credits} = 6.0 + \left( \frac{\text{Form Score} - \min(\text{Form Score})}{\max(\text{Form Score}) - \min(\text{Form Score})} \right) \times 5.0$$
Credits are normalized to $[6.0, 11.0]$ in steps of $0.5$.

### 6.2 Fantasy Point Scoring (Standard T20 Rules)
- **Batting**: $+1$/run, $+4$ boundary bonus, $+8$ six bonus, $+8$ for 50 runs, $+16$ for 100 runs, $-2$ for duck (dismissed on 0 for non-bowlers).
- **Bowling**: $+25$/wicket, $+8$ bonus for 3-wicket haul, $+16$ for 5-wicket haul, economy rate bonuses/penalties ($<6$ rpo: $+6$; $>11$ rpo: $-6$).
- **Fielding**: $+8$/catch, $+12$/stumping or direct run-out.
- **Multipliers**: Captain = $2\times$, Vice-Captain = $1.5\times$.
- Pure, deterministic function `calculateFantasyPoints(performance)` with unit test coverage.

### 6.3 Squad Validation Contract
A squad is valid if and only if:
1. Total players $= 11$.
2. Total credits used $\le 100.0$.
3. Role composition constraints satisfied:
   - Wicketkeepers (`WK`): $1 \le count \le 4$
   - Batters (`BAT`): $3 \le count \le 6$
   - All-rounders (`ALL`): $1 \le count \le 4$
   - Bowlers (`BOWL`): $3 \le count \le 6$
4. Franchise team limit: $\le 7$ players from either team.
5. Exactly 1 Captain and 1 Vice-Captain designated from within the 11 selected players ($C \ne VC$).

### 6.4 Auto-Pick Optimizer (Constrained Knapsack)
- **Problem**: Multi-choice Multi-dimensional 0-1 Knapsack Problem (NP-hard).
- **Strategy**:
  1. **Phase A - Role Minimums**: Sort players by projected points-per-credit within each role bucket; greedily pick minimum required players (1 WK, 3 BAT, 1 ALL, 3 BOWL = 8 players).
  2. **Phase B - Greedy Fill**: Fill remaining 3 spots from eligible unpicked players maximizing points-per-credit while respecting credit $\le 100$, team $\le 7$, and max role caps.
  3. **Phase C - Local Search Hill-Climbing**: For $K$ iterations, explore 1-for-1 swaps within the same role. If a swap strictly increases projected points and remains valid, apply it.
  4. **Phase D - Multiplier Assignment**: Highest projected scorer becomes Captain ($2\times$), second highest becomes Vice-Captain ($1.5\times$).

---

## 7. 3D Squad Builder Specifications

- **Scene**: Stylized low-poly cricket stadium and pitch created with procedural Three.js meshes and lighting.
- **Camera**: Controlled with Drei `OrbitControls` locked to a comfortable polar and azimuth range, preventing ground clipping or disorienting angles.
- **Interaction**: Tap-to-assign. Tapping an empty slot opens a 2D floating drawer with filtered candidate players. Selected player mounts a 3D jersey card with Drei `<Html>` labels.
- **Performance Budget**:
  - Max draw calls $< 50$, total triangles $< 50,000$.
  - Asset payload $< 2$MB total.
  - 60 FPS on desktop, $\ge 30$ FPS on mobile devices.
- **Responsive Adapters**:
  - Desktop ($\ge 1024$px): Full interactive 3D pitch with right-hand squad summary sidebar.
  - Tablet ($768$–$1023$px): 3D canvas with drawer below.
  - Mobile ($< 768$px): Pixel ratio clamped to $\le 1.5$, top-down camera, simplified geometry, touch-friendly UI.
- **Progressive Enhancement / Fallback**: Automatic detection via `WebGL.isWebGLAvailable()`. If WebGL is unavailable or fails, renders an identical 2D pitch board with full keyboard and screen-reader accessibility.

---

## 8. Technology Stack Summary

- **Monorepo Root**: `pnpm` or `npm` workspaces.
- **Frontend (`apps/web`)**: React 18, TypeScript, Vite, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), Tailwind CSS, Zustand, TanStack Query, Framer Motion, Lucide Icons.
- **Backend (`apps/api`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, bcryptjs, jsonwebtoken, Socket.io, node-cron.
- **Shared (`packages/shared-types`)**: TypeScript interfaces for Match, Player, Squad, Constraints, Scoring, Leaderboard.
- **Seed Pipeline (`scripts/seed`)**: Node.js streaming CSV parser for Kaggle IPL ball-by-ball dataset.
- **Testing**: Vitest, React Testing Library, Playwright for E2E user journey testing.

---

## 9. Interview Narrative Cheat Sheet

1. **Relational vs NoSQL**: Relational schema selected because fantasy cricket is fundamentally relational (strict join integrity between players, squads, matches, and performances; atomic transaction writes on squad lock).
2. **Defensible Credit Modeling**: Real fantasy systems guard credit algorithms; PitchXI calculates market values using an open, mathematically justifiable form-weighted formula.
3. **Constrained Knapsack & Heuristic Choice**: Real-world engineering requires balancing theoretical optimality with latency. Greedy + local search executes in $<15$ms with near-optimal point yields, perfectly suited for interactive web UX.
4. **Resilient Data Strategy**: Avoiding live API reliance ensures placement interview demos never suffer downtime, rate limits, or off-season dormancy.
5. **Mobile WebGL Optimization**: Proactively budgeted draw calls, clamped device pixel ratios, and implemented accessible 2D fallbacks.
