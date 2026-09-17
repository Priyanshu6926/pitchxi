# Domain Research: Architecture & Optimization Algorithms

## 1. The Constrained Knapsack Problem in PitchXI

### 1.1 Formal Mathematical Formulation
PitchXI's Auto-Pick feature is a variant of the **Multi-Choice, Multi-Dimensional 0-1 Knapsack Problem (MMKP)**, which is NP-hard.

Let $N$ be the set of available players in a selected match ($|N| \approx 22$).
For each player $i \in N$:
- $v_i \in \mathbb{R}^+$: projected fantasy points (calculated from form and historical averages)
- $c_i \in [6.0, 11.0]$: credit cost of player $i$
- $r_i \in \{\text{WK}, \text{BAT}, \text{ALL}, \text{BOWL}\}$: role category
- $t_i \in \{T_A, T_B\}$: franchise team

Decision variables:
$$x_i \in \{0, 1\} \quad \forall i \in N$$
$$y_i \in \{0, 1\} \quad \text{(Captain indicator, } y_i \le x_i\text{)}$$
$$z_i \in \{0, 1\} \quad \text{(Vice-Captain indicator, } z_i \le x_i\text{)}$$

### 1.2 Objective Function
Maximize the expected squad fantasy score:
$$\max \sum_{i \in N} \left( v_i x_i + 1.0 \cdot v_i y_i + 0.5 \cdot v_i z_i \right)$$
*(Note: Captain yields $2\times v_i = v_i + v_i$; Vice-Captain yields $1.5\times v_i = v_i + 0.5 v_i$)*

### 1.3 Constraints
1. **Total Squad Size**:
   $$\sum_{i \in N} x_i = 11$$
2. **Total Salary Cap**:
   $$\sum_{i \in N} c_i x_i \le 100.0$$
3. **Role Composition Limits**:
   $$1 \le \sum_{i: r_i = \text{WK}} x_i \le 4$$
   $$3 \le \sum_{i: r_i = \text{BAT}} x_i \le 6$$
   $$1 \le \sum_{i: r_i = \text{ALL}} x_i \le 4$$
   $$3 \le \sum_{i: r_i = \text{BOWL}} x_i \le 6$$
4. **Team Franchise Limits**:
   $$\sum_{i: t_i = T_A} x_i \le 7, \quad \sum_{i: t_i = T_B} x_i \le 7$$
5. **Captaincy Assignment**:
   $$\sum_{i \in N} y_i = 1, \quad \sum_{i \in N} z_i = 1, \quad y_i + z_i \le 1 \quad \forall i \in N$$

### 1.4 Algorithmic Solution Strategy
Since $|N| \approx 22$, finding an exact solution using branch-and-bound or an ILP solver is computationally feasible, but in an interactive browser/API setting:
- **Heuristic Choice**: A two-phase hybrid approach:
  1. **Phase 1 (Greedy Ratio Initialization)**:
     - Sort each role pool by efficiency ratio $\eta_i = \frac{v_i}{c_i}$.
     - Greedily pick the minimum required quotas: 1 WK, 3 BAT, 1 ALL, 3 BOWL (8 players).
     - Fill remaining 3 spots with highest $\eta_i$ from any role while respecting upper bounds ($c_{\text{total}} \le 100$, team $\le 7$, role maxes).
  2. **Phase 2 (Local Search Hill-Climbing)**:
     - For $k = 1, \dots, K$ iterations:
       - Test 1-for-1 swaps between a picked player $p \in S$ and an unpicked player $q \in N \setminus S$ where $r_p = r_q$.
       - If $v_q > v_p$, $\sum c - c_p + c_q \le 100$, and team counts remain valid, accept the swap.
     - Assign Captain to $\arg\max_{i \in S} v_i$ and Vice-Captain to the runner-up.
- **Latency & Performance**:
  - Execution time: $<10$ms in V8.
  - Approximation quality: Empirically within $1$–$3\%$ of the optimal ILP solution.

---

## 2. WebGL & React Three Fiber Performance Budget

### 2.1 Technical Constraints & Budgets
| Metric | Desktop Target | Mobile Target | Actionable Mitigation |
|---|---|---|---|
| **Frame Rate** | 60 FPS | $\ge 30$ FPS | Adaptive pixel ratio and geometry LOD |
| **Draw Calls** | $< 50$ | $< 30$ | Instance meshes for player markers; merge stadium geometries |
| **Triangles** | $< 50,000$ | $< 25,000$ | Low-poly stylized models, low subdivision on pitch curves |
| **Asset Size** | $< 2$ MB | $< 2$ MB | Procedural textures and lightweight GLTF/Draco compression |
| **Device Pixel Ratio** | `min(window.devicePixelRatio, 2)` | `min(window.devicePixelRatio, 1.5)` | Explicit clamp on R3F `<Canvas dpr={[1, 1.5]}>` |

### 2.2 Progressive Enhancement & WebGL Fallback
- Detection logic:
  ```typescript
  export function isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }
  ```
- If unsupported, automatically mounts the 2D Pitch View component. Users also have a toggle button to switch between 3D and 2D mode at any time.

---

## 3. Data Ingestion & Valuation Formulation

### 3.1 Kaggle IPL Ball-by-Ball Data Pipeline
- Historical dataset: 2008–2024 IPL ball-by-ball matches.
- Ingestion steps:
  1. Stream CSV using `csv-parser`.
  2. Aggregate per match:
     - Batting: balls, runs, 4s, 6s, dismissal method.
     - Bowling: overs, maidens, runs conceded, wickets, dot balls.
     - Fielding: catches, stumpings, run-outs.
  3. Compute standard Dream11 points for each player-match.
  4. Compute rolling 5-match form and career average for credit valuation.
