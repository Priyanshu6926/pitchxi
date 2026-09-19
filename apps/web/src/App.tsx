import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import MatchList from './components/MatchList';
import PlayerPool from './components/PlayerPool';
import SquadBuilder2D from './components/SquadBuilder2D';
import { StadiumScene } from './components/3d/StadiumScene';
import { isWebGLAvailable } from './lib/webgl';
import { useAuthStore } from './store/useAuthStore';
import { useSquadStore } from './store/useSquadStore';
import { Layers, Calendar, AlertCircle, Sparkles, Send, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export default function App() {
  const { initialize: initAuth } = useAuthStore();
  const {
    fetchMatches,
    selectedMatch,
    selectMatch,
    viewMode,
    setViewMode,
    getValidation,
    submitCurrentSquad,
    isSubmitting,
    submitSuccessMessage,
    error,
    clearError,
    clearSuccessMessage,
    autoPickCurrentSquad,
    isOptimizing,
    optimizerExecutionTime
  } = useSquadStore();

  const [activeTab, setActiveTab] = useState<'pitch' | 'matches'>('pitch');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    initAuth();
    fetchMatches();
    const hasWebGL = isWebGLAvailable();
    setWebGLSupported(hasWebGL);
    if (!hasWebGL && viewMode === '3D') {
      setViewMode('2D');
    }
  }, [initAuth, fetchMatches, viewMode, setViewMode]);

  const validation = getValidation();

  return (
    <div className="min-h-screen flex flex-col bg-pitch-900 text-slate-100 selection:bg-pitch-accent selection:text-pitch-900">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'matches' ? (
          <div className="space-y-6 animate-fade-in">
            <MatchList
              onSelectMatch={(match) => {
                selectMatch(match);
                setActiveTab('pitch');
              }}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* WebGL Fallback Notification if 3D chosen but unsupported */}
            {!webGLSupported && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  WebGL hardware acceleration is not supported in this environment. PitchXI is running in high-performance 2D progressive fallback mode.
                </span>
              </div>
            )}

            {/* Error & Success Banner */}
            {error && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-400 hover:text-red-200 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {submitSuccessMessage && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{submitSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSuccessMessage}
                  className="text-emerald-400 hover:text-emerald-200 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Match Context Banner */}
            {selectedMatch && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl glass-panel border border-slate-800 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md border-2 border-pitch-900"
                      style={{ backgroundColor: selectedMatch.teamA?.primaryColor || '#1f2e47' }}
                    >
                      {selectedMatch.teamA?.shortCode}
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md border-2 border-pitch-900"
                      style={{ backgroundColor: selectedMatch.teamB?.primaryColor || '#1f2e47' }}
                    >
                      {selectedMatch.teamB?.shortCode}
                    </div>
                  </div>

                  <div>
                    <h1 className="text-base sm:text-lg font-display font-extrabold text-white">
                      {selectedMatch.teamA?.name} <span className="text-slate-500 font-normal">vs</span> {selectedMatch.teamB?.name}
                    </h1>
                    <p className="text-xs text-slate-400">{selectedMatch.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-pitch-accent" />
                    <span>Change Match</span>
                  </button>
                </div>
              </div>
            )}

            {/* Split Screen Layout: 3D/2D Pitch (Left) & Player Pool (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: 3D Interactive Stadium or 2D Progressive Fallback */}
              <div className="lg:col-span-7 space-y-6">
                {viewMode === '3D' && webGLSupported ? (
                  <div className="space-y-4">
                    {/* 3D Canvas Scene */}
                    <StadiumScene />

                    {/* 3D Mode Squad Action Bar */}
                    <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>3D Lineup Controls</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Rotate the camera to inspect fielding angles. Assign C (2×) and VC (1.5×) on player cards.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={autoPickCurrentSquad}
                          disabled={isOptimizing || !selectedMatch}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-display font-extrabold text-xs flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                          title="Auto-Pick optimal squad using constrained knapsack algorithm"
                        >
                          {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>Auto-Pick</span>
                          {optimizerExecutionTime !== null && (
                            <span className="text-[9px] bg-slate-950/40 px-1 py-0.2 rounded text-slate-900 font-extrabold">
                              {optimizerExecutionTime}ms
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={!validation.valid || isSubmitting}
                          onClick={submitCurrentSquad}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-display font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                            validation.valid && !isSubmitting
                              ? 'bg-gradient-to-r from-pitch-accent to-emerald-400 text-pitch-900 hover:shadow-emerald-500/25 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Locking Lineup...' : 'Lock & Submit 3D Squad'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <SquadBuilder2D onOpenAuth={() => setIsAuthOpen(true)} />
                )}
              </div>

              {/* Right Column: Filterable Player Pool */}
              <div className="lg:col-span-5 p-5 rounded-3xl glass-panel border border-slate-800 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-pitch-accent" />
                    <h2 className="font-display font-extrabold text-white text-sm">Match Player Pool</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {viewMode === '3D' ? 'Tap slot in 3D or + here' : 'Tap + to assign to pitch'}
                  </span>
                </div>

                <PlayerPool />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-pitch-900 mt-12">
        <p>PitchXI — Fantasy IPL Team Builder with 3D Squad Selector · Portfolio Project</p>
      </footer>
    </div>
  );
}
