# Project State: PitchXI

## Current Status
- **Milestone**: MVP 1.0 (Phases 1–8)
- **Current Phase**: Phase 1: Foundation & Data Pipeline (Plan created, pending approval)
- **Last Action**: Created Phase 1 plan (`.planning/phases/01-foundation-data-pipeline/01-PLAN.md`)
- **Next Action**: Execute Phase 1 implementation upon approval

---

## Architectural Decisions Locked

| Decision | Selection | Rationale |
|---|---|---|
| **Database** | PostgreSQL + Prisma ORM | Relational constraints (join tables, role counts, credit caps) fit domain vastly better than NoSQL/Firestore. |
| **Data Strategy** | Seeded Kaggle Historical IPL DB (2008–2024) | Deterministic, zero-dependency demo that never fails in an interview due to rate limits or off-season. |
| **3D Rendering** | React Three Fiber + Drei | React-declarative WebGL; Drei provides camera controls and `<Html>`-in-3D pins. |
| **3D Interaction** | Tap-to-assign with 2D picker | High visual appeal without fragile physics drag-and-drop complexity in WebGL. |
| **Progressive Enhancement** | WebGL detection + 2D fallback | Ensures accessibility and reliability across all devices/browsers. |
| **Auto-Pick Algorithm** | Greedy Ratio + Local Search Hill Climbing | Real-world engineering trade-off: $<25$ ms latency with near-optimal point yield for multi-dimensional knapsack. |
| **State Management** | Zustand | Lightweight, clean selector ergonomics, zero boilerplate compared to Redux. |
| **Authentication** | JWT (Access + Refresh) + bcrypt | Demonstrates deep understanding of stateful/stateless auth security. |

---

## Roadmap Progression

- [ ] **Phase 1: Foundation & Data Pipeline** *(Next)*
- [ ] **Phase 2: Core Algorithm Engine & Tests**
- [ ] **Phase 3: Backend API & Authentication**
- [ ] **Phase 4: Frontend Core & 2D Squad Builder**
- [ ] **Phase 5: 3D Interactive Pitch Selector**
- [ ] **Phase 6: Auto-Pick Knapsack Optimizer**
- [ ] **Phase 7: Scoring Engine & Real-Time Leaderboards**
- [ ] **Phase 8: Hardening, E2E Testing, Portfolio Polish & Deployment**
- [ ] **Phase 9: (Stretch) CricAPI Live Match Overlay & ILP Benchmark**

---

## Quick Reference Commands
- **Start Next Phase**: `/gsd-plan-phase 1`
- **Check Progress**: `/gsd-progress`
- **Validate Planning Health**: `/gsd-health`
