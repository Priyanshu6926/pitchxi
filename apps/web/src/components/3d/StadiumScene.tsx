import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PitchModel } from './PitchModel';
import { FieldSlot, FIELD_SLOTS } from './FieldSlot';
import { SlotAssignmentDrawer } from './SlotAssignmentDrawer';
import { useSquadStore } from '../../store/useSquadStore';
import { RotateCcw, Eye, Compass, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export const StadiumScene: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const {
    selectedPlayers,
    assignedSlots,
    assignPlayerToSlot,
    selectedMatch,
    getValidation,
    getTotalCredits
  } = useSquadStore();

  const validation = getValidation();
  const totalCredits = getTotalCredits();

  // If user had picked players in 2D view that are not yet assigned to 3D slots,
  // automatically auto-assign them to suitable empty role slots so switching views is seamless!
  useEffect(() => {
    if (selectedPlayers.length === 0) return;

    const assignedPlayerIds = new Set(Object.values(assignedSlots));
    const unassignedPlayers = selectedPlayers.filter((p) => !assignedPlayerIds.has(p.id));

    if (unassignedPlayers.length > 0) {
      unassignedPlayers.forEach((player) => {
        // Find first empty slot that matches player role
        const emptySlot = FIELD_SLOTS.find(
          (s) => s.role === player.role && !assignedSlots[s.slotIndex]
        );
        if (emptySlot) {
          assignPlayerToSlot(emptySlot.slotIndex, player);
        } else {
          // If all default role slots filled, find any free slot
          const anyEmptySlot = FIELD_SLOTS.find((s) => !assignedSlots[s.slotIndex]);
          if (anyEmptySlot) {
            assignPlayerToSlot(anyEmptySlot.slotIndex, player);
          }
        }
      });
    }
  }, [selectedPlayers, assignedSlots, assignPlayerToSlot]);

  // Camera presets
  const resetCamera = () => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, 17, 21);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const setTopDownView = () => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, 26, 3);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const setPitchLevelView = () => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.set(0, 6, 14);
    controlsRef.current.target.set(0, 0.5, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[700px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D R3F Canvas Container */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 17, 21], fov: 42 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Lights */}
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[12, 22, 14]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-12, 15, -12]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 8, 0]} intensity={0.4} color="#fef08a" />

        {/* Procedural Cricket Pitch & Ground */}
        <PitchModel />

        {/* 11 Spatial Role Field Slots */}
        {FIELD_SLOTS.map((slot) => {
          const playerId = assignedSlots[slot.slotIndex];
          const player = playerId ? selectedPlayers.find((p) => p.id === playerId) : undefined;
          return <FieldSlot key={slot.slotIndex} slot={slot} player={player} />;
        })}

        {/* Bounded OrbitControls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minPolarAngle={Math.PI / 6} // ~30 deg
          maxPolarAngle={Math.PI / 2.3} // ~78 deg (never clip below ground)
          minDistance={10}
          maxDistance={32}
        />
      </Canvas>

      {/* Top Left Floating HUD: Match Info & Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            {selectedMatch
              ? `${selectedMatch.teamA?.shortCode} vs ${selectedMatch.teamB?.shortCode}`
              : 'Match Select'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
            3D Stadium
          </span>
        </div>

        {/* Squad Budget & Constraint Pill */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md text-xs pointer-events-auto">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Squad</div>
            <div className="font-extrabold text-white">
              {selectedPlayers.length} <span className="text-slate-500 font-normal">/ 11</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Credits</div>
            <div className={`font-extrabold ${totalCredits > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
              {totalCredits} <span className="text-slate-500 font-normal">/ 100</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Status</div>
            <div className="flex items-center gap-1 font-bold">
              {validation.valid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Incomplete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Floating Camera Presets & Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          type="button"
          onClick={setTopDownView}
          title="Tactical Aerial View"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tactical</span>
        </button>
        <button
          type="button"
          onClick={setPitchLevelView}
          title="Pitch Level Action View"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pitch</span>
        </button>
      </div>

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md pointer-events-none">
        <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Tap any field slot to assign or replace a player. Drag to orbit stadium.</span>
        </p>
      </div>

      {/* Floating Player Drawer when a slot is tapped */}
      <SlotAssignmentDrawer />
    </div>
  );
};
