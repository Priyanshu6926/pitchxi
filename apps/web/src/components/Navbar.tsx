import { Trophy, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSquadStore } from '../store/useSquadStore';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: 'pitch' | 'matches' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'pitch' | 'matches' | 'leaderboard' | 'profile') => void;
}

export default function Navbar({ onOpenAuth, activeTab, setActiveTab }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { selectedPlayers, selectedMatch, viewMode, setViewMode } = useSquadStore();

  const totalCredits = selectedPlayers.reduce((sum, p) => sum + p.creditValue, 0);

  return (
    <header className="border-b border-slate-800/80 bg-pitch-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pitch')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pitch-accent to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-pitch-900 font-bold" />
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                Pitch<span className="text-pitch-accent">XI</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-pitch-700 text-pitch-accent border border-pitch-accent/30">
                IPL
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('pitch')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === 'pitch'
                  ? 'bg-pitch-800 text-pitch-accent border border-pitch-accent/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Squad Builder
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === 'matches'
                  ? 'bg-pitch-800 text-pitch-accent border border-pitch-accent/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-pitch-800 text-pitch-accent border border-pitch-accent/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Leaderboard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-pitch-800 text-pitch-accent border border-pitch-accent/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Center Active Match Info (if selected) */}
        {selectedMatch && (
          <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-pitch-800/80 border border-slate-800 text-xs">
            <span className="font-bold text-white">{selectedMatch.teamA?.shortCode || 'Team A'}</span>
            <span className="text-slate-500">vs</span>
            <span className="font-bold text-white">{selectedMatch.teamB?.shortCode || 'Team B'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 truncate max-w-[150px]">{selectedMatch.venue.split(',')[0]}</span>
          </div>
        )}

        {/* Right Status & Auth */}
        <div className="flex items-center space-x-3">
          {/* 2D / 3D View Switcher */}
          {activeTab === 'pitch' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('2D')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === '2D'
                    ? 'bg-pitch-800 text-pitch-accent border border-pitch-accent/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2D Pitch
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3D')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === '3D'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>3D Stadium</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
            </div>
          )}

          {/* Live Squad Quick Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-pitch-800 border border-slate-800 text-xs">
            <span className="text-slate-400">Squad:</span>
            <span className={`font-bold ${selectedPlayers.length === 11 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {selectedPlayers.length}/11
            </span>
            <span className="text-slate-600">|</span>
            <span className={`font-bold ${totalCredits > 100 ? 'text-red-400' : 'text-slate-200'}`}>
              {Math.round(totalCredits * 10) / 10} cr
            </span>
          </div>

          {/* User Auth Profile */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2">
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg glass-panel border border-slate-700 hover:border-emerald-500/40 text-xs cursor-pointer transition-colors"
                title="View Manager Profile"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200 font-medium max-w-[100px] truncate">{user.displayName}</span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-pitch-accent text-pitch-900 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
