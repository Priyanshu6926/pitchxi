import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { Role, Player } from '@pitchxi/shared-types';
import { useSquadStore } from '../../store/useSquadStore';
import { Crown, Star, X, Plus } from 'lucide-react';

export interface SlotConfig {
  slotIndex: number;
  role: Role;
  label: string;
  position: [number, number, number];
}

export const FIELD_SLOTS: SlotConfig[] = [
  // 1 Wicketkeeper
  { slotIndex: 0, role: 'WK', label: 'Wicketkeeper', position: [0, 0.06, 5.8] },
  // 4 Batters
  { slotIndex: 1, role: 'BAT', label: 'Opener (Striker)', position: [0, 0.06, 2.6] },
  { slotIndex: 2, role: 'BAT', label: 'Top Order', position: [0, 0.06, -2.6] },
  { slotIndex: 3, role: 'BAT', label: 'Cover Drive', position: [-4.2, 0.06, 1.2] },
  { slotIndex: 4, role: 'BAT', label: 'Mid-Wicket', position: [4.2, 0.06, 1.2] },
  // 2 All-Rounders
  { slotIndex: 5, role: 'ALL', label: 'All-Rounder (Point)', position: [-5.8, 0.06, -1.8] },
  { slotIndex: 6, role: 'ALL', label: 'All-Rounder (Mid-On)', position: [3.8, 0.06, -4.6] },
  // 4 Bowlers
  { slotIndex: 7, role: 'BOWL', label: 'Pace Bowler', position: [0, 0.06, -6.2] },
  { slotIndex: 8, role: 'BOWL', label: 'Death Bowler', position: [-9.5, 0.06, -7.5] },
  { slotIndex: 9, role: 'BOWL', label: 'Lead Spinner', position: [9.5, 0.06, -7.5] },
  { slotIndex: 10, role: 'BOWL', label: 'Strike Bowler', position: [-7.8, 0.06, 9.2] },
];

const ROLE_COLORS: Record<Role, { primary: string; bg: string; text: string; hex: string }> = {
  WK: { primary: 'from-sky-500 to-blue-600', bg: 'bg-sky-500/20', text: 'text-sky-400', hex: '#38bdf8' },
  BAT: { primary: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-400', hex: '#f59e0b' },
  ALL: { primary: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500/20', text: 'text-purple-400', hex: '#a855f7' },
  BOWL: { primary: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/20', text: 'text-emerald-400', hex: '#10b981' }
};

interface FieldSlotProps {
  slot: SlotConfig;
  player?: Player;
}

export const FieldSlot: React.FC<FieldSlotProps> = ({ slot, player }) => {
  const [hovered, setHovered] = useState(false);
  const {
    captainId,
    viceCaptainId,
    setCaptain,
    setViceCaptain,
    unassignSlot,
    setActiveSlotIndex
  } = useSquadStore();

  const isCaptain = player && captainId === player.id;
  const isViceCaptain = player && viceCaptainId === player.id;
  const roleTheme = ROLE_COLORS[slot.role];

  return (
    <group position={slot.position}>
      {/* 3D Ground Beacon Cylinder */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          setActiveSlotIndex(slot.slotIndex);
        }}
        position={[0, 0.02, 0]}
      >
        <cylinderGeometry args={[0.75, 0.85, 0.06, 24]} />
        <meshStandardMaterial
          color={player ? (isCaptain ? '#fbbf24' : isViceCaptain ? '#38bdf8' : '#1e293b') : roleTheme.hex}
          emissive={hovered ? roleTheme.hex : '#000000'}
          emissiveIntensity={hovered ? 0.6 : 0.1}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Outer Pulse / Ring Target */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.95, 24]} />
        <meshBasicMaterial
          color={player ? '#ffffff' : roleTheme.hex}
          transparent
          opacity={hovered ? 0.9 : 0.45}
        />
      </mesh>

      {/* Miniature 3D Jersey Pedestal if player assigned */}
      {player && (
        <group position={[0, 0.4, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.45, 0.55, 0.12]} />
            <meshStandardMaterial
              color={player.team?.primaryColor || '#1e293b'}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
          {/* Jersey Shoulder Pad Details */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.06, 0.14, 0.08, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      )}

      {/* HTML Overlay Pin */}
      <Html
        center
        distanceFactor={13}
        position={[0, player ? 0.95 : 0.45, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        {player ? (
          /* ASSIGNED PLAYER CARD */
          <div
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlotIndex(slot.slotIndex);
            }}
            className="group flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-105"
          >
            <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md whitespace-nowrap">
              {/* Franchise Accent Dot */}
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30 flex-shrink-0"
                style={{ backgroundColor: player.team?.primaryColor || '#38bdf8' }}
              />

              {/* Player Name and Cost */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white max-w-[90px] truncate">
                    {player.name.split(' ').pop()}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {player.creditValue}cr
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                  <span>{player.team?.shortCode}</span>
                  <span>•</span>
                  <span className={`font-semibold ${roleTheme.text}`}>{player.role}</span>
                </div>
              </div>

              {/* C / VC Controls */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                <button
                  type="button"
                  title="Make Captain (2x pts)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCaptain(player.id);
                  }}
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black transition-colors ${
                    isCaptain
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-amber-400/20 hover:text-amber-300'
                  }`}
                >
                  C
                </button>
                <button
                  type="button"
                  title="Make Vice-Captain (1.5x pts)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViceCaptain(player.id);
                  }}
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-black transition-colors ${
                    isViceCaptain
                      ? 'bg-sky-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-sky-400/20 hover:text-sky-300'
                  }`}
                >
                  VC
                </button>
                <button
                  type="button"
                  title="Remove Player"
                  onClick={(e) => {
                    e.stopPropagation();
                    unassignSlot(slot.slotIndex);
                  }}
                  className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Captain / VC Crown Badges on Card Top */}
              {isCaptain && (
                <div className="absolute -top-3.5 left-2 px-1.5 py-0.2 flex items-center gap-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] shadow">
                  <Crown className="w-2.5 h-2.5" /> 2×
                </div>
              )}
              {isViceCaptain && (
                <div className="absolute -top-3.5 left-2 px-1.5 py-0.2 flex items-center gap-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[9px] shadow">
                  <Star className="w-2.5 h-2.5" /> 1.5×
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EMPTY SLOT BADGE */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlotIndex(slot.slotIndex);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${roleTheme.bg} border border-slate-700/60 shadow-lg backdrop-blur-sm transition-transform duration-150 hover:scale-110 active:scale-95 group cursor-pointer whitespace-nowrap`}
          >
            <Plus className={`w-3 h-3 ${roleTheme.text} group-hover:rotate-90 transition-transform`} />
            <span className={`text-[11px] font-bold ${roleTheme.text}`}>{slot.role}</span>
          </button>
        )}
      </Html>
    </group>
  );
};
