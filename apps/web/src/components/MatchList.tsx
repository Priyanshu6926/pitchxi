import { useState } from 'react';
import { Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useSquadStore } from '../store/useSquadStore';
import { Match } from '@pitchxi/shared-types';

interface MatchListProps {
  onSelectMatch: (match: Match) => void;
}

export default function MatchList({ onSelectMatch }: MatchListProps) {
  const { matches, selectedMatch, isLoadingMatches } = useSquadStore();
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'UPCOMING'>('ALL');

  const filteredMatches = matches.filter(m => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white">IPL Match Fixtures</h2>
          <p className="text-xs text-slate-400">Select a historical or upcoming match to build your squad</p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 bg-pitch-800 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-medium">
          {(['ALL', 'COMPLETED', 'UPCOMING'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === tab
                  ? 'bg-pitch-accent text-pitch-900 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Matches' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoadingMatches && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-pitch-800/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      )}

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMatches.map(match => {
          const isSelected = selectedMatch?.id === match.id;
          const matchDate = new Date(match.matchDate);
          const formattedDate = matchDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className={`relative cursor-pointer p-6 rounded-2xl transition duration-200 glass-panel ${
                isSelected
                  ? 'border-pitch-accent ring-1 ring-pitch-accent shadow-lg shadow-emerald-500/10'
                  : 'hover:border-slate-700'
              }`}
            >
              {/* Active Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <CheckCircle className="w-3 h-3" />
                  <span>Selected</span>
                </div>
              )}

              {/* Match Status Pill */}
              <div className="flex items-center space-x-2 text-[11px] mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                    match.status === 'COMPLETED'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {match.status === 'COMPLETED' ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Historical (Scored)</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Upcoming</span>
                    </>
                  )}
                </span>
              </div>

              {/* Teams Matchup Header */}
              <div className="flex items-center justify-between py-2 border-y border-slate-800/80 my-3">
                {/* Team A */}
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md"
                    style={{ backgroundColor: match.teamA?.primaryColor || '#1f2e47' }}
                  >
                    {match.teamA?.shortCode || 'A'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-snug">{match.teamA?.shortCode}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[90px]">{match.teamA?.name}</div>
                  </div>
                </div>

                <div className="font-display font-bold text-xs text-slate-500 px-2 py-1 rounded bg-pitch-800 border border-slate-700">
                  VS
                </div>

                {/* Team B */}
                <div className="flex items-center space-x-2.5 text-right">
                  <div>
                    <div className="text-sm font-bold text-white leading-snug">{match.teamB?.shortCode}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[90px]">{match.teamB?.name}</div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md"
                    style={{ backgroundColor: match.teamB?.primaryColor || '#1f2e47' }}
                  >
                    {match.teamB?.shortCode || 'B'}
                  </div>
                </div>
              </div>

              {/* Venue & Date */}
              <div className="space-y-1 pt-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{match.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
