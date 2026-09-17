# Phase 5: 3D Interactive Pitch Selector

## Objective
Build the flagship 3D pitch squad builder using React Three Fiber (R3F) and Drei. Enable users to inspect an interactive low-poly 3D cricket stadium, tap 11 spatial role-marked field slots to assign players, view 3D jersey cards with Drei `<Html>` labels, and manage Captain/Vice-Captain designations. Guarantee high performance (<50k triangles, 60fps desktop / 30fps mobile, clamped DPR <= 1.5) and provide automatic progressive fallback to the 2D squad builder if WebGL is unavailable.

---

## Requirements Covered
- **3D-01**: Stylized low-poly 3D cricket stadium and pitch model with 11 role-marked slot targets.
- **3D-02**: Bounded OrbitControls preventing ground flip and tap-to-assign slot interaction opening player drawer.
- **3D-03**: WebGL performance budget (<50k triangles, <2MB asset payload, clamped DPR, 60fps/30fps targets).
- **UI-01**: Seamless 2D/3D mode switcher in navigation bar + automatic WebGL capability detection fallback.

---

## Tasks

### 1. WebGL Dependencies & Capability Detection
- Install `three@^0.165.0`, `@types/three@^0.165.0`, `@react-three/fiber@^8.18.0`, `@react-three/drei@^9.122.0` in `apps/web`.
- Implement `apps/web/src/lib/webgl.ts`:
  - `isWebGLAvailable()`: checks WebGL 1/2 context creation.
  - Expose fallback detection state in app UI.
- Update `apps/web/src/store/useSquadStore.ts` with `viewMode: '2D' | '3D'`, `toggleViewMode()`, `activeSlotIndex: number | null`, `setActiveSlotIndex()`.

### 2. Procedural Low-Poly Cricket Stadium & Pitch Components
- Create `apps/web/src/components/3d/PitchModel.tsx`:
  - Oval grass field (`CylinderGeometry` with emerald green turf shading).
  - Rectangular central pitch strip (tan/khaki clay wicket with crease lines).
  - 3D Wickets & Bails at bowling and batting ends (golden cedar wood cylinders).
  - Inner 30-yard fielding circle demarcation.
  - Outer boundary rope and stylized low-poly stadium embankment / floodlight poles.
  - Triangle count: strictly <15,000 triangles (well under the 50,000 PRD budget).

### 3. Spatial Field Slots & 3D Player Cards
- Create `apps/web/src/components/3d/FieldSlot.tsx`:
  - 11 strategic 3D field coordinates mapping to cricket field positions:
    - 1 WK: Behind stumps.
    - 4 BAT: Striker's crease, cover, mid-wicket, mid-on.
    - 2 ALL: Point, extra cover.
    - 4 BOWL: Bowling crease, fine leg, deep square leg, long off.
  - Empty Slot: Glowing beacon ring with role badge and hover scale effect.
  - Filled Slot: 3D miniature jersey stand with team color accent and Drei `<Html>` tag showing player name, credit value, role, and C/VC buttons.
  - Click interaction: Triggers player selection drawer for the clicked slot's role or opens player details.

### 4. Interactive R3F Canvas Container & Camera Constraints
- Create `apps/web/src/components/3d/StadiumScene.tsx`:
  - R3F `<Canvas>` setup with clamped DPR `dpr={[1, 1.5]}` and ACESFilmic tone mapping.
  - Lighting: balanced `ambientLight` + `directionalLight` (warm sunlight) with subtle shadows.
  - Drei `<OrbitControls>` configured with bounds:
    - `minPolarAngle={Math.PI / 6}` (30 deg)
    - `maxPolarAngle={Math.PI / 2.3}` (78 deg, preventing camera clipping through ground)
    - `minDistance={10}`, `maxDistance={32}`
    - `enableDamping={true}`, `dampingFactor={0.05}`.
  - Camera presets (Tactical Aerial view vs Pitch-level view).

### 5. Tap-to-Assign Floating Player Drawer
- Create `apps/web/src/components/3d/SlotAssignmentDrawer.tsx`:
  - When an empty or filled slot is clicked in 3D, a floating modal/drawer displays available players matching the slot's role.
  - Shows player stats, credits, projected points, and instant "Assign" action.
  - Once selected, 3D card updates instantly with state synchronized to `useSquadStore`.

### 6. App Integration & Progressive Fallback
- Update `apps/web/src/App.tsx`:
  - Switch between `SquadBuilder2D` and `StadiumScene` based on `viewMode` toggle.
  - If `isWebGLAvailable()` returns false, automatically force 2D mode with an explanatory alert.
- Update `Navbar.tsx`:
  - Wire up the 2D / 3D segmented toggle buttons.

---

## Verification Plan
1. **Build Validation**:
   - `npm run build` in `apps/web` (TypeScript check + Vite production build without bundle errors).
2. **WebGL Budget Verification**:
   - Total geometry triangle count < 20,000 (well under 50k budget).
   - Zero external multi-megabyte GLTF assets downloaded (100% procedural Three.js primitives for <100ms initial render).
3. **Interactive 3D UX Verification**:
   - Camera orbits smoothly and stops at ground boundaries without flipping upside-down.
   - Clicking an empty slot opens the filtered player drawer for that role.
   - Selecting a player mounts their 3D jersey card and updates the global squad store.
   - Designating C and VC directly from 3D badges updates state and triggers isomorphic validation.
4. **Fallback & Accessibility Verification**:
   - Switching between 2D and 3D preserves identical squad selections and validation state.
   - Fallback trigger when WebGL is unavailable.
