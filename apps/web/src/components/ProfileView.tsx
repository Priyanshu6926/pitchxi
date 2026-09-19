import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Flame, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronRight, 
  RefreshCw, 
  LogOut
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

interface ProfileData {
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
  };
  careerStats: {
    totalSquads: number;
    totalCareerPoints: number;
    highestMatchScore: number;
    averagePoints: number;
    bestRank: number | null;
  };
  squadHistory: Array<{
    id: string;
    matchId: string;
    match: {
      id: string;
      venue: string;
      status: string;
      teamA: { id: string; name: string; shortCode: string; primaryColor: string };
      teamB: { id: string; name: string; shortCode: string; primaryColor: string };
    };
    totalPoints: number | null;
    totalCreditsUsed: number;
    lockedAt: string;
    rank: number | null;
    captain: { id: string; name: string; role: string } | null;
    viceCaptain: { id: string; name: string; role: string } | null;
    playerCount: number;
  }>;
}

interface ProfileViewProps {
  onNavigateToMatch?: (matchId: string) => void;
  onNavigateToLeaderboard?: (matchId: string) => void;
  onOpenAuth?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigateToMatch,
  onNavigateToLeaderboard,
  onOpenAuth
}) => {
  const { isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.squads.getProfile();
      setProfile(data as ProfileData);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load manager profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-xl">
          <UserIcon className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Manager Authentication Required</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Log in or create a PitchXI manager account to track your fantasy career statistics, historical squad submissions, and leaderboard rankings.
          </p>
        </div>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
          >
            Sign In / Register
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading manager career dashboard...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-rose-400 text-sm font-medium">{error || 'Could not load profile data'}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { user, careerStats, squadHistory } = profile;
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'XI';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-pitch-900 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-400/40 flex items-center justify-center text-slate-950 font-black text-2xl sm:text-3xl shadow-xl shadow-emerald-500/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.displayName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  Verified Manager
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                <span>{user.email}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Career Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Career Points */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Career Points</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {careerStats.totalCareerPoints.toFixed(1)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Across {careerStats.totalSquads} match{careerStats.totalSquads === 1 ? '' : 'es'}
          </p>
        </div>

        {/* Best Rank */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Best Rank</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Medal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300 tracking-tight">
            {careerStats.bestRank ? `#${careerStats.bestRank}` : '—'}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {careerStats.bestRank === 1 ? '🥇 Champion Standing' : 'Peak leaderboard position'}
          </p>
        </div>

        {/* Highest Match Score */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Peak Score</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-300 tracking-tight">
            {careerStats.highestMatchScore.toFixed(1)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Single match record
          </p>
        </div>

        {/* Average Points */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Average Score</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-300 tracking-tight">
            {careerStats.averagePoints.toFixed(1)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Points per squad
          </p>
        </div>
      </div>

      {/* Squad History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Squad Submission History</h2>
            <p className="text-xs text-slate-400">Past fantasy squads and performance records.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {squadHistory.length} Record{squadHistory.length === 1 ? '' : 's'}
          </span>
        </div>

        {squadHistory.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Squads Submitted Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select an upcoming or historical IPL match to build your first 11-player squad!
            </p>
            {onNavigateToMatch && (
              <button
                onClick={() => onNavigateToMatch('')}
                className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
              >
                Explore Matches
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {squadHistory.map((squad) => (
              <div
                key={squad.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-md"
              >
                {/* Match Info & Teams */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-extrabold text-sm text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                        {squad.match.teamA?.shortCode || 'T1'}
                      </span>
                      <span className="text-slate-500 text-xs font-normal">vs</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                        {squad.match.teamB?.shortCode || 'T2'}
                      </span>
                    </div>

                    {/* Rank Badge */}
                    {squad.rank && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                        squad.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : squad.rank === 2
                          ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                          : squad.rank === 3
                          ? 'bg-amber-800/20 text-amber-400 border border-amber-800/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <Medal className="w-3 h-3" />
                        Rank #{squad.rank}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 truncate max-w-md">
                    {squad.match.venue.split(',')[0]} • Locked {new Date(squad.lockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Captain & VC info */}
                <div className="flex items-center gap-4 text-xs">
                  {squad.captain && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center">C</span>
                      <span className="font-semibold">{squad.captain.name}</span>
                    </div>
                  )}

                  {squad.viceCaptain && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
                      <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 font-black text-[9px] flex items-center justify-center">VC</span>
                      <span className="font-semibold">{squad.viceCaptain.name}</span>
                    </div>
                  )}

                  <div className="text-slate-400 text-right">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Credits</span>
                    <span className="font-semibold text-slate-200">{squad.totalCreditsUsed} / 100</span>
                  </div>
                </div>

                {/* Points & Leaderboard Link */}
                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Fantasy Points</span>
                    <span className="text-xl font-black text-emerald-400 tracking-tight">
                      {squad.totalPoints !== null ? squad.totalPoints.toFixed(1) : 'Pending'}
                    </span>
                  </div>

                  {onNavigateToLeaderboard && (
                    <button
                      onClick={() => onNavigateToLeaderboard(squad.matchId)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="View Match Leaderboard"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
