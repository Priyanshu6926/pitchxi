import { useMemo } from 'react';
import { Search, Plus, Check, UserCheck, AlertCircle } from 'lucide-react';
import { useSquadStore } from '../store/useSquadStore';
import { Role, Player, SQUAD_CONSTRAINTS } from '@pitchxi/shared-types';

export default function PlayerPool() {
  const {
    playerPool,
    selectedPlayers,
    togglePlayer,
    roleFilter,
    setRoleFilter,
    teamFilter,
    setTeamFilter,
    searchQuery,
    setSearchQuery,
    selectedMatch,
    isLoadingPlayers,
    error
  } = useSquadStore();

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return playerPool.filter(p => {
      // Role filter
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      // Team filter
      if (teamFilter && p.teamId !== teamFilter) return false;
      // Search query
      if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [playerPool, roleFilter, teamFilter, searchQuery]);

  // Selected player IDs set
  const selectedIds = useMemo(() => new Set(selectedPlayers.map(p => p.id)), [selectedPlayers]);

  // Current squad totals
  const currentTotalCredits = selectedPlayers.reduce((acc, p) => acc + p.creditValue, 0);

  // Helper checking if player can be added
  const canAddPlayer = (p: Player): { allowed: boolean; reason?: string } => {
    if (selectedIds.has(p.id)) return { allowed: true }; // Removal is always allowed
    if (selectedPlayers.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
      return { allowed: false, reason: '11 players reached' };
    }
    const newCredits = Math.round((currentTotalCredits + p.creditValue) * 10) / 10;
    if (newCredits > SQUAD_CONSTRAINTS.MAX_CREDITS) {
      return { allowed: false, reason: 'Exceeds 100 cr' };
    }
    const teamCount = selectedPlayers.filter(sp => sp.teamId === p.teamId).length;
    if (teamCount >= SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) {
      return { allowed: false, reason: 'Max 7 per team' };
    }
    const roleCount = selectedPlayers.filter(sp => sp.role === p.role).length;
    if (roleCount >= SQUAD_CONSTRAINTS.ROLE_LIMITS[p.role].max) {
      return { allowed: false, reason: `Max ${SQUAD_CONSTRAINTS.ROLE_LIMITS[p.role].max} ${p.role}s` };
    }
    return { allowed: true };
  };

  const roleBadgeColors: Record<Role, string> = {
    WK: 'bg-amber-950/70 text-amber-400 border-amber-500/30',
    BAT: 'bg-cyan-950/70 text-cyan-400 border-cyan-500/30',
    ALL: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30',
    BOWL: 'bg-indigo-950/70 text-indigo-400 border-indigo-500/30'
  };

  return (
    <div className="space-y-4">
      {/* Search & Team Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search player name..."
            className="w-full pl-10 pr-4 py-2 bg-pitch-800/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pitch-accent"
          />
        </div>

        {/* Competing Teams Filter */}
        {selectedMatch && (
          <div className="flex items-center space-x-1.5 p-1 bg-pitch-800 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setTeamFilter(null)}
              className={`px-3 py-1 rounded-lg transition ${
                teamFilter === null ? 'bg-pitch-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Both Teams
            </button>
            <button
              onClick={() => setTeamFilter(selectedMatch.teamAId)}
              className={`px-3 py-1 rounded-lg transition ${
                teamFilter === selectedMatch.teamAId ? 'bg-pitch-accent text-pitch-900 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {selectedMatch.teamA?.shortCode}
            </button>
            <button
              onClick={() => setTeamFilter(selectedMatch.teamBId)}
              className={`px-3 py-1 rounded-lg transition ${
                teamFilter === selectedMatch.teamBId ? 'bg-pitch-accent text-pitch-900 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {selectedMatch.teamB?.shortCode}
            </button>
          </div>
        )}
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-pitch-800/80 rounded-xl border border-slate-800 text-xs">
        {(['ALL', 'WK', 'BAT', 'ALL', 'BOWL'] as const).map((r, i) => {
          // If second ALL, show All-Rounders role
          const roleKey = i === 3 ? 'ALL' : r;
          const label = i === 0 ? 'All Roles' : i === 3 ? 'ALL' : r;
          const isActive = i === 0 ? roleFilter === 'ALL' : roleFilter === roleKey;

          return (
            <button
              key={`${label}-${i}`}
              onClick={() => setRoleFilter(roleKey)}
              className={`py-2 rounded-lg font-semibold transition text-center ${
                isActive
                  ? 'bg-pitch-accent text-pitch-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Global Error Notice if any */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingPlayers && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl bg-pitch-800/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      )}

      {/* Player List */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filteredPlayers.map(player => {
          const isSelected = selectedIds.has(player.id);
          const addCheck = canAddPlayer(player);
          const isDisabled = !isSelected && !addCheck.allowed;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition duration-150 ${
                isSelected
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : isDisabled
                  ? 'bg-pitch-800/40 border-slate-800/60 opacity-60'
                  : 'bg-pitch-800/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center space-x-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                  style={{ backgroundColor: player.team?.primaryColor || '#1f2e47' }}
                >
                  {player.team?.shortCode || 'IPL'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{player.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeColors[player.role]}`}>
                      {player.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{player.team?.name}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Proj: {player.projectedPoints || 45} pts</span>
                  </div>
                </div>
              </div>

              {/* Right Credits & Button */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-display font-extrabold text-white">
                    {player.creditValue} <span className="text-[10px] font-normal text-slate-400">cr</span>
                  </div>
                  {isDisabled && (
                    <div className="text-[10px] text-amber-400 font-medium">{addCheck.reason}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => togglePlayer(player)}
                  disabled={isDisabled}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-emerald-500 text-pitch-900 font-bold hover:bg-red-500 hover:text-white shadow-md'
                      : isDisabled
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-pitch-700 text-slate-200 hover:bg-pitch-accent hover:text-pitch-900 shadow-sm'
                  }`}
                  title={isSelected ? 'Remove from squad' : isDisabled ? addCheck.reason : 'Add to squad'}
                >
                  {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}

        {filteredPlayers.length === 0 && !isLoadingPlayers && (
          <div className="text-center py-12 text-slate-500 text-xs">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No players found matching current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
