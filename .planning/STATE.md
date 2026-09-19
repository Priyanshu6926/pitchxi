# Project State: PitchXI

## Current Status
- **Milestone**: MVP 1.0 (Phases 1–8)
- **Current Phase**: Phase 7: Scoring Engine & Real-Time Leaderboards (Completed)
- **Last Action**: Implemented idempotent match scoring service, Captain (2x) & VC (1.5x) multipliers, Socket.io real-time broadcast, LeaderboardView with top 3 podium & live standings, and 17 integration tests.
- **Next Action**: Plan Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment (`/gsd-plan-phase 8`)

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
| **Real-Time Updates** | Socket.io WebSockets | Instant room-based broadcast of rank standings upon scoring calculations without client polling. |
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
- [x] **Phase 7: Scoring Engine & Real-Time Leaderboards** *(Completed)*
- [ ] **Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment** *(Next)*
- [ ] **Phase 9: (Stretch) CricAPI Live Match Overlay & ILP Benchmark**

---

## Quick Reference Commands
- **Start Next Phase**: `/gsd-plan-phase 2`
- **Check Progress**: `/gsd-progress`
- **Validate Planning Health**: `/gsd-health`
