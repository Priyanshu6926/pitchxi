import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import MatchList from './components/MatchList';
import PlayerPool from './components/PlayerPool';
import SquadBuilder2D from './components/SquadBuilder2D';
import { useAuthStore } from './store/useAuthStore';
import { useSquadStore } from './store/useSquadStore';
import { Layers, Calendar } from 'lucide-react';

export default function App() {
  const { initialize: initAuth } = useAuthStore();
  const { fetchMatches, selectedMatch, selectMatch } = useSquadStore();

  const [activeTab, setActiveTab] = useState<'pitch' | 'matches'>('pitch');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    initAuth();
    fetchMatches();
  }, [initAuth, fetchMatches]);

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
              onSelectMatch={match => {
                selectMatch(match);
                setActiveTab('pitch');
              }}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
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

                <button
                  onClick={() => setActiveTab('matches')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 self-end sm:self-auto"
                >
                  <Calendar className="w-3.5 h-3.5 text-pitch-accent" />
                  <span>Change Match</span>
                </button>
              </div>
            )}

            {/* Split Screen Layout: 2D Pitch Builder (Left) & Player Pool (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: 2D Pitch Board & Budget Dashboard */}
              <div className="lg:col-span-7 space-y-6">
                <SquadBuilder2D onOpenAuth={() => setIsAuthOpen(true)} />
              </div>

              {/* Right: Filterable Player Pool */}
              <div className="lg:col-span-5 p-5 rounded-3xl glass-panel border border-slate-800 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-pitch-accent" />
                    <h2 className="font-display font-extrabold text-white text-sm">Match Player Pool</h2>
                  </div>
                  <span className="text-[11px] text-slate-400">Tap + to assign to pitch</span>
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
