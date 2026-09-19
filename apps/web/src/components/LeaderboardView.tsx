import React, { useEffect, useState, useCallback } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  RefreshCw, 
  Radio, 
  Users, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { api } from '../lib/api';
import { getSocket, subscribeToMatch, unsubscribeFromMatch } from '../lib/socket';
import { Match } from '@pitchxi/shared-types';

interface LeaderboardEntry {
  id: string;
  rank: number;
  totalPoints: number;
  squadId: string;
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  totalCreditsUsed: number;
  captain: { id: string; name: string; role: string } | null;
  viceCaptain: { id: string; name: string; role: string } | null;
}

interface LeaderboardViewProps {
  initialMatchId?: string;
  onNavigateToBuilder?: (matchId: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ 
  initialMatchId,
  onNavigateToBuilder 
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatchId || '');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matchDetails, setMatchDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [scoreSuccessMsg, setScoreSuccessMsg] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load matches
  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await api.matches.getAll();
        setMatches(data.matches);
        if (!selectedMatchId && data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].id);
        }
      } catch (err) {
        console.error('Failed to load matches for leaderboard:', err);
      }
    }
    loadMatches();
  }, [selectedMatchId]);

  // Load leaderboard for selected match
  const fetchLeaderboard = useCallback(async (matchId: string, showSpinner = false) => {
    if (!matchId) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await api.matches.getLeaderboard(matchId);
      setEntries(data.entries);
      setMatchDetails(data.match);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchLeaderboard(selectedMatchId, true);
    }
  }, [selectedMatchId, fetchLeaderboard]);

  // Socket.io subscription
  useEffect(() => {
    if (!selectedMatchId) return;

    const socket = getSocket();
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Join room
    subscribeToMatch(selectedMatchId);

    // Listen for live updates
    const handleLeaderboardUpdate = (data: any) => {
      console.log('⚡ Received live leaderboard update via WebSocket:', data);
      fetchLeaderboard(selectedMatchId, false);
      setScoreSuccessMsg('Leaderboard updated in real-time!');
      setTimeout(() => setScoreSuccessMsg(null), 3000);
    };

    socket.on('leaderboard:update', handleLeaderboardUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('leaderboard:update', handleLeaderboardUpdate);
      unsubscribeFromMatch(selectedMatchId);
    };
  }, [selectedMatchId, fetchLeaderboard]);

  // Trigger match scoring calculation
  const handleScoreMatch = async () => {
    if (!selectedMatchId) return;
    setScoringLoading(true);
    setScoreSuccessMsg(null);
    try {
      const result = await api.matches.scoreMatch(selectedMatchId);
      setScoreSuccessMsg(`Scored ${result.squadsScored} squad${result.squadsScored === 1 ? '' : 's'} with Captain (2x) and VC (1.5x) multipliers!`);
      await fetchLeaderboard(selectedMatchId, false);
      setTimeout(() => setScoreSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to score match:', err);
      setScoreSuccessMsg(err.message || 'Scoring calculation failed');
      setTimeout(() => setScoreSuccessMsg(null), 4000);
    } finally {
      setScoringLoading(false);
    }
  };

  const currentMatch = matches.find(m => m.id === selectedMatchId) || matchDetails;
  const top1 = entries.find(e => e.rank === 1);
  const top2 = entries.find(e => e.rank === 2);
  const top3 = entries.find(e => e.rank === 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Match Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Match Standings & Leaderboard
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time fantasy points leaderboard evaluated against historical match performance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Match selector */}
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.teamA?.shortCode || 'T1'} vs {m.teamB?.shortCode || 'T2'} · {m.venue.split(',')[0]}
              </option>
            ))}
          </select>

          {/* Socket status badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{socketConnected ? 'Live Socket.io' : 'Disconnected'}</span>
          </div>

          {/* Score Calculation / Recalculation Button */}
          <button
            onClick={handleScoreMatch}
            disabled={scoringLoading || !selectedMatchId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            title="Idempotently calculates fantasy points and broadcasts standings to all connected clients"
          >
            <RefreshCw className={`w-4 h-4 ${scoringLoading ? 'animate-spin' : ''}`} />
            <span>{scoringLoading ? 'Calculating...' : 'Simulate Match Scoring'}</span>
          </button>
        </div>
      </div>

      {/* Success / Info Notification */}
      {scoreSuccessMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{scoreSuccessMsg}</span>
        </div>
      )}

      {/* Match Overview Bar */}
      {currentMatch && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                {currentMatch.teamA?.shortCode || 'Team A'}
              </span>
              <span className="text-slate-500 font-normal">vs</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                {currentMatch.teamB?.shortCode || 'Team B'}
              </span>
            </div>
            <span className="text-xs text-slate-400 border-l border-slate-700 pl-3">
              {currentMatch.venue}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Participants: <strong className="text-slate-200">{entries.length}</strong></span>
            </div>
            {lastUpdated && (
              <span className="text-slate-500">
                Last scored: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading standings...</p>
        </div>
      ) : entries.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Squads Submitted Yet</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Be the first fantasy manager to build and lock an 11-player squad for this match!
          </p>
          {onNavigateToBuilder && (
            <button
              onClick={() => onNavigateToBuilder(selectedMatchId)}
              className="mt-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Build Squad Now
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
            {/* 2nd Place (Silver) */}
            <div className="order-2 md:order-1">
              {top2 ? (
                <div className={`relative p-6 rounded-2xl bg-slate-900/90 border ${top2.isCurrentUser ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700/80'} shadow-xl flex flex-col items-center text-center backdrop-blur-md`}>
                  <div className="w-12 h-12 rounded-full bg-slate-700/80 border-2 border-slate-400 flex items-center justify-center text-slate-200 font-black text-lg mb-3 shadow-inner">
                    2
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-2">
                    <Medal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Silver Rank</span>
                  </div>
                  <h3 className="font-bold text-white text-lg truncate max-w-full">
                    {top2.displayName}
                    {top2.isCurrentUser && <span className="ml-2 text-xs text-emerald-400 font-black">(YOU)</span>}
                  </h3>
                  <div className="mt-3 text-3xl font-black text-slate-200 tracking-tight">
                    {top2.totalPoints.toFixed(1)} <span className="text-xs font-medium text-slate-400">pts</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 w-full flex justify-around text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Captain</span>
                      <span className="font-semibold text-slate-300 truncate max-w-[100px] block">
                        {top2.captain?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Credits</span>
                      <span className="font-semibold text-slate-300">{top2.totalCreditsUsed} / 100</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600">
                  Uncontested
                </div>
              )}
            </div>

            {/* 1st Place (Gold) - Elevated Center */}
            <div className="order-1 md:order-2 transform md:-translate-y-4">
              {top1 && (
                <div className={`relative p-8 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900/90 border-2 ${top1.isCurrentUser ? 'border-emerald-400 ring-4 ring-emerald-500/20' : 'border-amber-400/70'} shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center backdrop-blur-xl`}>
                  <div className="absolute -top-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
                      <Crown className="w-7 h-7 fill-slate-950" />
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 mb-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Match Champion</span>
                  </div>
                  <h3 className="font-extrabold text-white text-xl truncate max-w-full">
                    {top1.displayName}
                    {top1.isCurrentUser && <span className="ml-2 text-xs text-emerald-400 font-black">(YOU)</span>}
                  </h3>
                  <div className="mt-3 text-4xl font-black text-amber-300 tracking-tight">
                    {top1.totalPoints.toFixed(1)} <span className="text-sm font-medium text-amber-400/80">pts</span>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-800 w-full grid grid-cols-3 text-center text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Captain (2x)</span>
                      <span className="font-semibold text-emerald-400 truncate block">
                        {top1.captain?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">VC (1.5x)</span>
                      <span className="font-semibold text-teal-400 truncate block">
                        {top1.viceCaptain?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Credits</span>
                      <span className="font-semibold text-slate-300">{top1.totalCreditsUsed}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="order-3">
              {top3 ? (
                <div className={`relative p-6 rounded-2xl bg-slate-900/90 border ${top3.isCurrentUser ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700/80'} shadow-xl flex flex-col items-center text-center backdrop-blur-md`}>
                  <div className="w-12 h-12 rounded-full bg-amber-900/60 border-2 border-amber-700 flex items-center justify-center text-amber-200 font-black text-lg mb-3 shadow-inner">
                    3
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 mb-2">
                    <Medal className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bronze Rank</span>
                  </div>
                  <h3 className="font-bold text-white text-lg truncate max-w-full">
                    {top3.displayName}
                    {top3.isCurrentUser && <span className="ml-2 text-xs text-emerald-400 font-black">(YOU)</span>}
                  </h3>
                  <div className="mt-3 text-3xl font-black text-slate-200 tracking-tight">
                    {top3.totalPoints.toFixed(1)} <span className="text-xs font-medium text-slate-400">pts</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 w-full flex justify-around text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Captain</span>
                      <span className="font-semibold text-slate-300 truncate max-w-[100px] block">
                        {top3.captain?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Credits</span>
                      <span className="font-semibold text-slate-300">{top3.totalCreditsUsed} / 100</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600">
                  Uncontested
                </div>
              )}
            </div>
          </div>

          {/* Full Standings Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Complete Standings</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {entries.length} squad{entries.length === 1 ? '' : 's'} ranked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-5">Manager</th>
                    <th className="py-3.5 px-5">Captain (2x)</th>
                    <th className="py-3.5 px-5">Vice-Captain (1.5x)</th>
                    <th className="py-3.5 px-5 text-center">Credits Used</th>
                    <th className="py-3.5 px-5 text-right">Fantasy Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {entries.map((entry) => (
                    <tr 
                      key={entry.squadId}
                        className={`transition-colors ${
                          entry.isCurrentUser 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/15' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 && (
                              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-xs">
                                1
                              </span>
                            )}
                            {entry.rank === 2 && (
                              <span className="w-7 h-7 rounded-full bg-slate-600/30 text-slate-300 border border-slate-500/40 flex items-center justify-center font-black text-xs">
                                2
                              </span>
                            )}
                            {entry.rank === 3 && (
                              <span className="w-7 h-7 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/40 flex items-center justify-center font-black text-xs">
                                3
                              </span>
                            )}
                            {entry.rank > 3 && (
                              <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-semibold text-xs">
                                {entry.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Manager Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{entry.displayName}</span>
                            {entry.isCurrentUser && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Captain */}
                        <td className="py-4 px-5">
                          {entry.captain ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center">C</span>
                              {entry.captain.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">None</span>
                          )}
                        </td>

                        {/* Vice Captain */}
                        <td className="py-4 px-5">
                          {entry.viceCaptain ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
                              <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 font-black text-[9px] flex items-center justify-center">VC</span>
                              {entry.viceCaptain.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">None</span>
                          )}
                        </td>

                        {/* Credits */}
                        <td className="py-4 px-5 text-center font-medium text-slate-300">
                          {entry.totalCreditsUsed.toFixed(1)} / 100
                        </td>

                        {/* Total Points */}
                        <td className="py-4 px-5 text-right font-black text-base text-emerald-400">
                          {entry.totalPoints.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView;
