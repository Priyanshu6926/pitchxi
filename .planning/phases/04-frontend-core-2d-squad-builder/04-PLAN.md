# Phase 4: Frontend Core & 2D Squad Builder

## Objective
Build the client-side user experience for PitchXI with rich aesthetics, robust state management via Zustand, responsive match selection, player pool discovery with multi-criteria filtering, and the 2D accessible fallback squad builder featuring live budget tracking, role quotas, captaincy assignment, and real-time isomorphic constraint validation.

## Targeted Requirements
- **UI-01**: Responsive Navigation, Match Explorer & Player Pool filtering.
- **UI-02**: 2D Progressive Enhancement Fallback Squad Builder with live constraint feedback and submission.

---

## Waves & Implementation Tasks

### Wave 1: Frontend State Stores & API Client
- [ ] Install `zustand` in `apps/web`.
- [ ] Create `apps/web/src/lib/api.ts`:
  - Typed API client communicating with `/api/auth`, `/api/matches`, and `/api/squads`.
  - Automatic injection of Bearer token from local storage.
  - Consistent error handling and response unwrapping.
- [ ] Create `apps/web/src/store/useAuthStore.ts`:
  - Current user state, login, register, logout, token persistence, and automatic session restoration via `GET /api/auth/me`.
- [ ] Create `apps/web/src/store/useSquadStore.ts`:
  - Selected match state, available player pool.
  - Selected players list (up to 11 players).
  - Captain and Vice-Captain player IDs.
  - Actions: `addPlayer`, `removePlayer`, `togglePlayer`, `setCaptain`, `setViceCaptain`, `clearSquad`.
  - Computed state: live credit total, role counts, team counts, and live validation output via isomorphic `validateSquad`.

### Wave 2: Match Explorer & Auth Modal
- [ ] Create `apps/web/src/components/Navbar.tsx`:
  - Logo, IPL tag, active match indicator, auth status button, Login/Register modal trigger, and squad drawer toggle.
- [ ] Create `apps/web/src/components/AuthModal.tsx`:
  - Modern glassmorphism dialog for user registration and login with error display.
- [ ] Create `apps/web/src/components/MatchList.tsx`:
  - Match cards displaying franchise logos, team colors, venue, formatted date, and status tags (`COMPLETED`, `UPCOMING`).
  - Selection handler loading match players into the store.

### Wave 3: Player Pool Filter & Selector
- [ ] Create `apps/web/src/components/PlayerPool.tsx`:
  - Role filter tabs: `ALL`, `WK`, `BAT`, `ALL`, `BOWL` with count badges.
  - Team filter toggles (e.g. CSK vs MI).
  - Search input filtering players by name.
  - Player cards showing name, role, team badge, form score, credit cost, and Add/Remove button.
  - Disabled state for players who cannot be added without violating max role caps or budget.

### Wave 4: 2D Squad Builder & Pitch View
- [ ] Create `apps/web/src/components/SquadBuilder2D.tsx`:
  - Visual 2D pitch board with 11 tactical slots grouped by role (WK, BAT, ALL, BOWL).
  - Credit budget progress bar: Live credit tracker ($X / 100.0$ cr) with danger styling if $>100$.
  - Role quota indicator pills: `WK (1–4)`, `BAT (3–6)`, `ALL (1–4)`, `BOWL (3–6)`.
  - Team quota indicator pills: `Team A (X/7)`, `Team B (Y/7)`.
  - Captain ($2\times$) and Vice-Captain ($1.5\times$) toggles with prominent badges.
  - Live constraint violation alert banner displaying real-time feedback.
  - Submit Squad button connected to `POST /api/squads` with loading state, success modal, and submission summary.

### Wave 5: Integration, Verification & Sync
- [ ] Update `apps/web/src/App.tsx` assembling Navbar, Match Explorer, Player Pool, and 2D Squad Builder with responsive grid layout.
- [ ] Verify complete build (`npm run build`).
- [ ] Verify interactive user flow: Register/Login -> select Match -> pick 11 players in 2D -> assign C & VC -> submit squad.
- [ ] Sync all files to `/Users/priyanshu/Desktop/projects/pitchxi` and commit to Git.

---

## Verification Plan
1. `npm run build` succeeds across all workspaces without type or bundling errors.
2. User can seamlessly register/login and receive JWT tokens stored in localStorage.
3. User can select any match (e.g. CSK vs MI) and view the populated 22-player pool.
4. User can assemble an 11-player squad in 2D, assign C and VC, observe live budget and constraint warnings, and submit to `POST /api/squads`.
5. Re-check `npm run test` to guarantee all 39 backend tests continue to pass.
