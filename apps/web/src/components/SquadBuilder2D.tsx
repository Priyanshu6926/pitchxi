import { useState } from 'react';
import { Shield, Sparkles, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useSquadStore } from '../store/useSquadStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role, SQUAD_CONSTRAINTS, Player } from '@pitchxi/shared-types';

interface SquadBuilder2DProps {
  onOpenAuth: () => void;
}

export default function SquadBuilder2D({ onOpenAuth }: SquadBuilder2DProps) {
  const {
    selectedPlayers,
    captainId,
    viceCaptainId,
    setCaptain,
    setViceCaptain,
    removePlayer,
    resetSquad,
    selectedMatch,
    getValidation,
    getTotalCredits,
    submitCurrentSquad,
    isSubmitting,
    submitSuccessMessage,
    clearSuccessMessage
  } = useSquadStore();

  const { isAuthenticated } = useAuthStore();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const totalCredits = getTotalCredits();
  const creditsRemaining = Math.round((SQUAD_CONSTRAINTS.MAX_CREDITS - totalCredits) * 10) / 10;
  const validation = getValidation();

  // Group selected players by role for tactical pitch zones
  const groupedPlayers: Record<Role, Player[]> = {
    WK: selectedPlayers.filter(p => p.role === 'WK'),
    BAT: selectedPlayers.filter(p => p.role === 'BAT'),
    ALL: selectedPlayers.filter(p => p.role === 'ALL'),
    BOWL: selectedPlayers.filter(p => p.role === 'BOWL')
  };

  // Team counts
  const teamACount = selectedMatch
    ? selectedPlayers.filter(p => p.teamId === selectedMatch.teamAId).length
    : 0;
  const teamBCount = selectedMatch
    ? selectedPlayers.filter(p => p.teamId === selectedMatch.teamBId).length
    : 0;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    await submitCurrentSquad();
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Constraint Metric Bar */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-black text-white">2D Squad Builder</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pitch-700 text-emerald-400 border border-emerald-500/30">
                Accessible Fallback
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pick 11 players respecting role bounds, team caps, and the 100-credit budget.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetSquad}
              disabled={selectedPlayers.length === 0}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-40"
            >
              Reset Roster
            </button>

            <button
              onClick={handleSubmit}
              disabled={selectedPlayers.length !== 11 || totalCredits > 100 || !captainId || !viceCaptainId || isSubmitting}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-pitch-accent text-pitch-900 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isAuthenticated ? 'Submit Lineup' : 'Sign In to Submit'}</span>
            </button>
          </div>
        </div>

        {/* Live Gauges: Credits, Roles, Teams */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          {/* Credit Budget Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Salary Budget</span>
              <span className={creditsRemaining < 0 ? 'text-red-400 font-bold' : 'text-slate-200 font-bold'}>
                {totalCredits} / 100 cr ({creditsRemaining >= 0 ? `${creditsRemaining} left` : 'OVER BUDGET'})
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalCredits > 100 ? 'bg-red-500' : totalCredits >= 90 ? 'bg-amber-400' : 'bg-pitch-accent'
                }`}
                style={{ width: `${Math.min(100, (totalCredits / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* Role Quota Badges */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-wrap text-[11px]">
            {(['WK', 'BAT', 'ALL', 'BOWL'] as const).map(role => {
              const count = groupedPlayers[role].length;
              const limits = SQUAD_CONSTRAINTS.ROLE_LIMITS[role];
              const isSatisfied = count >= limits.min && count <= limits.max;
              const isViolated = count > limits.max;

              return (
                <div
                  key={role}
                  className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
                    isViolated
                      ? 'bg-red-950/80 border-red-500/50 text-red-300'
                      : isSatisfied
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                      : 'bg-pitch-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>{role}:</span>
                  <span className="font-bold">{count}</span>
                  <span className="text-[9px] opacity-70">({limits.min}-{limits.max})</span>
                </div>
              );
            })}
          </div>

          {/* Team Quota Badges */}
          {selectedMatch && (
            <div className="flex items-center justify-end gap-2 text-xs">
              <div
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${
                  teamACount > 7
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-pitch-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>{selectedMatch.teamA?.shortCode}:</span>
                <span className="font-bold">{teamACount}/7</span>
              </div>

              <div
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 ${
                  teamBCount > 7
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-pitch-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>{selectedMatch.teamB?.shortCode}:</span>
                <span className="font-bold">{teamBCount}/7</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Validation Alert Notice */}
        {validation.errors.length > 0 ? (
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Lineup Constraints Incomplete:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                {validation.errors.slice(0, 3).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : selectedPlayers.length === 11 ? (
          <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Squad satisfies all 5 constraints! Designate your C & VC to submit.</span>
          </div>
        ) : null}
      </div>

      {/* 2. Tactical Cricket Pitch Visual Board */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-pitch-800/90 to-pitch-900 border border-emerald-900/40 shadow-2xl overflow-hidden">
        {/* Subtle Pitch Markings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-[300px] h-[550px] border-2 border-dashed border-white rounded-[150px]" />
          <div className="absolute w-[100px] h-[280px] bg-emerald-900/50 border-2 border-white rounded-lg" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Zone 1: Wicketkeepers (Near Stumps) */}
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400/90 px-3 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30">
                Wicket-Keepers (1 – 4)
              </span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-3 min-h-[90px] p-2 rounded-2xl border border-dashed border-amber-500/20 bg-pitch-900/40">
              {groupedPlayers.WK.map(p => (
                <PlayerCard2D
                  key={p.id}
                  player={p}
                  isCaptain={captainId === p.id}
                  isViceCaptain={viceCaptainId === p.id}
                  onSelectCaptain={() => setCaptain(p.id)}
                  onSelectViceCaptain={() => setViceCaptain(p.id)}
                  onRemove={() => removePlayer(p.id)}
                />
              ))}
              {groupedPlayers.WK.length === 0 && (
                <div className="text-xs text-slate-500 italic">Select at least 1 Wicketkeeper from the player pool</div>
              )}
            </div>
          </div>

          {/* Zone 2: Batters (Arc) */}
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-cyan-400/90 px-3 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                Batters (3 – 6)
              </span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-3 min-h-[90px] p-2 rounded-2xl border border-dashed border-cyan-500/20 bg-pitch-900/40">
              {groupedPlayers.BAT.map(p => (
                <PlayerCard2D
                  key={p.id}
                  player={p}
                  isCaptain={captainId === p.id}
                  isViceCaptain={viceCaptainId === p.id}
                  onSelectCaptain={() => setCaptain(p.id)}
                  onSelectViceCaptain={() => setViceCaptain(p.id)}
                  onRemove={() => removePlayer(p.id)}
                />
              ))}
              {groupedPlayers.BAT.length === 0 && (
                <div className="text-xs text-slate-500 italic">Select at least 3 Batters from the player pool</div>
              )}
            </div>
          </div>

          {/* Zone 3: All-Rounders (Mid-field) */}
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400/90 px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                All-Rounders (1 – 4)
              </span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-3 min-h-[90px] p-2 rounded-2xl border border-dashed border-emerald-500/20 bg-pitch-900/40">
              {groupedPlayers.ALL.map(p => (
                <PlayerCard2D
                  key={p.id}
                  player={p}
                  isCaptain={captainId === p.id}
                  isViceCaptain={viceCaptainId === p.id}
                  onSelectCaptain={() => setCaptain(p.id)}
                  onSelectViceCaptain={() => setViceCaptain(p.id)}
                  onRemove={() => removePlayer(p.id)}
                />
              ))}
              {groupedPlayers.ALL.length === 0 && (
                <div className="text-xs text-slate-500 italic">Select at least 1 All-Rounder from the player pool</div>
              )}
            </div>
          </div>

          {/* Zone 4: Bowlers (Bowling Crease) */}
          <div className="space-y-2">
            <div className="text-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-indigo-400/90 px-3 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30">
                Bowlers (3 – 6)
              </span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-3 min-h-[90px] p-2 rounded-2xl border border-dashed border-indigo-500/20 bg-pitch-900/40">
              {groupedPlayers.BOWL.map(p => (
                <PlayerCard2D
                  key={p.id}
                  player={p}
                  isCaptain={captainId === p.id}
                  isViceCaptain={viceCaptainId === p.id}
                  onSelectCaptain={() => setCaptain(p.id)}
                  onSelectViceCaptain={() => setViceCaptain(p.id)}
                  onRemove={() => removePlayer(p.id)}
                />
              ))}
              {groupedPlayers.BOWL.length === 0 && (
                <div className="text-xs text-slate-500 italic">Select at least 3 Bowlers from the player pool</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Submission Confirmation Modal */}
      {showSuccessModal && submitSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/50 bg-pitch-900 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-display font-black text-white">Lineup Locked & Submitted!</h3>
              <p className="text-sm text-slate-300">{submitSuccessMessage}</p>
            </div>

            <div className="p-4 rounded-2xl bg-pitch-800/80 border border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Match:</span>
                <span className="font-bold text-white">
                  {selectedMatch?.teamA?.shortCode} vs {selectedMatch?.teamB?.shortCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Credits Used:</span>
                <span className="font-bold text-emerald-400">{totalCredits} / 100 cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Captain (2x):</span>
                <span className="font-bold text-amber-400">
                  {selectedPlayers.find(p => p.id === captainId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vice-Captain (1.5x):</span>
                <span className="font-bold text-cyan-400">
                  {selectedPlayers.find(p => p.id === viceCaptainId)?.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                clearSuccessMessage();
              }}
              className="w-full py-3 rounded-xl bg-pitch-accent text-pitch-900 font-bold text-sm hover:bg-emerald-400 transition"
            >
              Back to Squad Builder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 2D Tactical Jersey Card Component
function PlayerCard2D({
  player,
  isCaptain,
  isViceCaptain,
  onSelectCaptain,
  onSelectViceCaptain,
  onRemove
}: {
  player: Player;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onSelectCaptain: () => void;
  onSelectViceCaptain: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group w-36 p-3 rounded-2xl bg-pitch-800/95 border border-slate-700 hover:border-emerald-500/50 transition duration-200 shadow-md">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white flex items-center justify-center transition shadow"
        title="Remove player"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Badges: Captain / Vice-Captain */}
      {isCaptain && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-amber-400 text-pitch-900 text-[10px] font-black shadow-md flex items-center gap-0.5">
          <span>C</span>
          <span className="text-[8px] opacity-80">2x</span>
        </div>
      )}

      {isViceCaptain && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-cyan-400 text-pitch-900 text-[10px] font-black shadow-md flex items-center gap-0.5">
          <span>VC</span>
          <span className="text-[8px] opacity-80">1.5x</span>
        </div>
      )}

      {/* Jersey Crest Icon */}
      <div className="flex justify-center mb-1.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm"
          style={{ backgroundColor: player.team?.primaryColor || '#1f2e47' }}
        >
          <Shield className="w-4 h-4" />
        </div>
      </div>

      {/* Player Name & Cost */}
      <div className="text-center space-y-0.5">
        <div className="text-xs font-bold text-white truncate">{player.name}</div>
        <div className="text-[10px] text-slate-400">{player.creditValue} cr</div>
      </div>

      {/* Captain / VC Selector Buttons */}
      <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-slate-700/60">
        <button
          type="button"
          onClick={onSelectCaptain}
          className={`py-0.5 rounded text-[10px] font-extrabold transition ${
            isCaptain
              ? 'bg-amber-400 text-pitch-900'
              : 'bg-pitch-700/60 text-slate-400 hover:text-white hover:bg-pitch-700'
          }`}
          title="Make Captain (2x points)"
        >
          C
        </button>

        <button
          type="button"
          onClick={onSelectViceCaptain}
          className={`py-0.5 rounded text-[10px] font-extrabold transition ${
            isViceCaptain
              ? 'bg-cyan-400 text-pitch-900'
              : 'bg-pitch-700/60 text-slate-400 hover:text-white hover:bg-pitch-700'
          }`}
          title="Make Vice-Captain (1.5x points)"
        >
          VC
        </button>
      </div>
    </div>
  );
}
