import React, { useState, useMemo } from 'react';
import { useSquadStore } from '../../store/useSquadStore';
import { FIELD_SLOTS } from './FieldSlot';
import type { Role } from '@pitchxi/shared-types';
import { X, Search, ShieldAlert, Check, TrendingUp } from 'lucide-react';

export const SlotAssignmentDrawer: React.FC = () => {
  const {
    activeSlotIndex,
    setActiveSlotIndex,
    playerPool,
    selectedPlayers,
    assignedSlots,
    assignPlayerToSlot,
    getTotalCredits
  } = useSquadStore();

  const [query, setQuery] = useState('');
  const [activeRoleOverride, setActiveRoleOverride] = useState<Role | null>(null);

  if (activeSlotIndex === null) return null;

  const currentSlot = FIELD_SLOTS[activeSlotIndex];
  if (!currentSlot) return null;

  const targetRole = activeRoleOverride || currentSlot.role;
  const currentAssignedPlayerId = assignedSlots[activeSlotIndex];
  const totalCredits = getTotalCredits();

  // Filter player pool for this slot
  const candidatePlayers = useMemo(() => {
    return playerPool.filter((p) => {
      const matchesRole = p.role === targetRole;
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
                           p.team?.shortCode.toLowerCase().includes(query.toLowerCase());
      return matchesRole && matchesQuery;
    }).sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
  }, [playerPool, targetRole, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Slot #{currentSlot.slotIndex + 1}
              </span>
              <h3 className="font-extrabold text-base text-white">
                Assign {currentSlot.label}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a player to take position on the 3D pitch
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSlotIndex(null);
              setActiveRoleOverride(null);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs (Allows user flex assignment if needed) */}
        <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {(['WK', 'BAT', 'ALL', 'BOWL'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRoleOverride(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                targetRole === r
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-400 flex items-center gap-1.5">
            <span>Budget left:</span>
            <span className="font-bold text-emerald-400">
              {(100 - totalCredits).toFixed(1)} cr
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player or team..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Candidate Player List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {candidatePlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No available players found for this role matching query.
            </div>
          ) : (
            candidatePlayers.map((player) => {
              const isAssignedToThisSlot = currentAssignedPlayerId === player.id;
              const isAssignedElsewhere = selectedPlayers.some((p) => p.id === player.id) && !isAssignedToThisSlot;
              
              // Validate if budget allows
              const currentSlotPlayer = selectedPlayers.find((p) => p.id === currentAssignedPlayerId);
              const creditDelta = player.creditValue - (currentSlotPlayer ? currentSlotPlayer.creditValue : 0);
              const exceedsBudget = (totalCredits + creditDelta) > 100;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isAssignedToThisSlot
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                      : isAssignedElsewhere
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Team Color Pill */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-inner"
                      style={{ backgroundColor: player.team?.primaryColor || '#1e293b' }}
                    >
                      {player.team?.shortCode || 'IPL'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {player.name}
                        </span>
                        {isAssignedToThisSlot && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{player.team?.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                          <TrendingUp className="w-3 h-3" />
                          {player.projectedPoints || 0} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white">
                        {player.creditValue} <span className="text-[10px] text-slate-400">cr</span>
                      </div>
                    </div>

                    {isAssignedToThisSlot ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/40">
                        <Check className="w-3.5 h-3.5" /> Assigned
                      </div>
                    ) : isAssignedElsewhere ? (
                      <span className="text-[11px] text-slate-500 font-medium italic">
                        In another slot
                      </span>
                    ) : exceedsBudget ? (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                        title="Adding this player exceeds 100 credit budget"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Over Budget
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          assignPlayerToSlot(currentSlot.slotIndex, player);
                          setActiveRoleOverride(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-transform active:scale-95 shadow-md hover:shadow-emerald-500/20"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
