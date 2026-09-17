import { useState, useEffect } from 'react';
import { Trophy, Cpu, Activity, Database, CheckCircle2, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface SystemHealth {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}

interface DBStats {
  appName: string;
  version: string;
  entities: {
    teams: number;
    players: number;
    matches: number;
  };
}

export default function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<DBStats | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const healthRes = await fetch('/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }

        const statsRes = await fetch('/api/info');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (e) {
        console.log('API not reachable yet, local fallback mode');
      }
    }

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pitch-900 text-slate-100">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-pitch-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pitch-accent to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-pitch-900 font-bold" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Pitch<span className="text-pitch-accent">XI</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-pitch-700 text-pitch-accent border border-pitch-accent/30">
                IPL 2024
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg glass-panel">
              <div className={`w-2 h-2 rounded-full ${health?.database === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                {health?.database === 'connected' ? 'Postgres/SQLite Live' : 'Phase 1 Ready'}
              </span>
            </div>
            <button className="text-xs font-semibold px-4 py-2 rounded-lg bg-pitch-accent text-pitch-900 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5">
              <span>Enter Pitch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-panel border border-slate-800 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 1: Foundation & Data Pipeline Established</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white leading-tight">
              Fantasy IPL Engine with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pitch-accent via-emerald-400 to-cyan-400">3D Squad Selector</span> & Optimization
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Construct high-performance 11-player squads under real salary cap constraints. Place players onto an interactive 3D WebGL pitch, auto-optimize squads via constrained knapsack algorithms, and benchmark against genuine IPL ball-by-ball match data.
            </p>

            {/* Quick Metrics from Seeded DB */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-pitch-800/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">IPL Franchises</div>
                <div className="text-2xl font-bold font-display text-white mt-1">
                  {stats?.entities.teams ?? 6} <span className="text-xs font-normal text-slate-500">Teams</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-pitch-800/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Seeded Players</div>
                <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
                  {stats?.entities.players ?? 48} <span className="text-xs font-normal text-slate-500">Active</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-pitch-800/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Salary Cap Rule</div>
                <div className="text-2xl font-bold font-display text-cyan-400 mt-1">
                  100 <span className="text-xs font-normal text-slate-500">Credits Max</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-pitch-800/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Player Credits</div>
                <div className="text-2xl font-bold font-display text-amber-400 mt-1">
                  6.0 – 11.0 <span className="text-xs font-normal text-slate-500">cr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-pitch-accent" />
              <span>Core Engineering Pillars</span>
            </h2>
            <span className="text-xs text-slate-400">Architected for placement portfolio excellence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl glass-panel glass-panel-hover transition duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Constrained Knapsack DSA</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Solves a multi-choice multi-dimensional knapsack optimization problem under role bounds (WK, BAT, ALL, BOWL), salary cap (≤100 cr), and team limits (≤7 per franchise) in &lt;25ms via greedy heuristics and local search hill climbing.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-cyan-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phase 6 Algorithm Feature</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl glass-panel glass-panel-hover transition duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">3D React Three Fiber Pitch</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Spatial squad builder rendering a stylized 3D low-poly cricket pitch. Strict WebGL budget (&lt;50k triangles, 60 FPS desktop / 30 FPS mobile) with an automatic progressive enhancement fallback to an accessible 2D grid.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phase 5 WebGL Feature</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl glass-panel glass-panel-hover transition duration-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Seeded Historical ETL</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ingests Kaggle IPL ball-by-ball records into PostgreSQL via Prisma. Calculates fair player credits from rolling form and career stats. Completely independent of fragile live third-party APIs during interview demos.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-amber-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phase 1 Completed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-pitch-900">
        <p>PitchXI — Fantasy IPL Team Builder · B.Tech Placement Portfolio Project</p>
      </footer>
    </div>
  );
}
