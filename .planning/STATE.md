# Project State: PitchXI

## Current Status
- **Milestone**: MVP 1.0 (Phases 1–8)
- **Current Phase**: Phase 6: Auto-Pick Knapsack Optimizer (Completed)
- **Last Action**: Implemented greedy points-per-credit heuristic + local search hill climbing optimizer (<1ms latency), POST /api/squads/auto-pick endpoint, player pinning/locking, and dual 2D/3D UI integration.
- **Next Action**: Plan Phase 7: Scoring Engine & Real-Time Leaderboards (`/gsd-plan-phase 7`)

---

## Architectural Decisions Locked

| Decision | Selection | Rationale |
|---|---|---|
| **Database** | PostgreSQL + Prisma ORM (SQLite for local dev) | Relational constraints (join tables, role counts, credit caps) fit domain vastly better than NoSQL/Firestore. Zero-config SQLite for dev. |
| **Data Strategy** | Seeded Kaggle Historical IPL DB (2008–2024) | Deterministic, zero-dependency demo that never fails in an interview due to rate limits or off-season. |
| **Isomorphic Validation**| Shared TypeScript Validator | Identical constraint rules executed on client (UX) and server (security). |
| **Server Security Gate** | Re-fetch DB players & atomic transaction | Never trust client-sent values; prevent manipulation via devtools or tampering. |
| **Scoring Engine** | Pure function `calculateFantasyPoints` | Fully testable Dream11-style rules with zero DB dependency. |
| **3D Rendering** | React Three Fiber + Drei | React-declarative WebGL; Drei provides camera controls and `<Html>`-in-3D pins. |
| **3D Interaction** | Tap-to-assign with 2D picker | High visual appeal without fragile physics drag-and-drop complexity in WebGL. |
| **Progressive Enhancement** | WebGL detection + 2D fallback | Ensures accessibility and reliability across all devices/browsers. |
| **Auto-Pick Algorithm** | Greedy Ratio + Local Search Hill Climbing | Real-world engineering trade-off: $<25$ ms latency with near-optimal point yield for multi-dimensional knapsack. |
| **State Management** | Zustand | Lightweight, clean selector ergonomics, zero boilerplate compared to Redux. |
| **Authentication** | JWT (Access + Refresh) + bcrypt | Demonstrates deep understanding of stateful/stateless auth security. |

---

## Roadmap Progression

- [x] **Phase 1: Foundation & Data Pipeline** *(Completed)*
- [x] **Phase 2: Core Algorithm Engine & Tests** *(Completed)*
- [x] **Phase 3: Backend API & Authentication** *(Completed)*
- [x] **Phase 4: Frontend Core & 2D Squad Builder** *(Completed)*
- [x] **Phase 5: 3D Interactive Pitch Selector** *(Completed)*
- [x] **Phase 6: Auto-Pick Knapsack Optimizer** *(Completed)*
- [ ] **Phase 7: Scoring Engine & Real-Time Leaderboards** *(Next)*
- [ ] **Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment**
- [ ] **Phase 9: (Stretch) CricAPI Live Match Overlay & ILP Benchmark**

---

## Quick Reference Commands
- **Start Next Phase**: `/gsd-plan-phase 2`
- **Check Progress**: `/gsd-progress`
- **Validate Planning Health**: `/gsd-health`
