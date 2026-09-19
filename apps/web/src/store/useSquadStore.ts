import { create } from 'zustand';
import { Player, Match, Role, FantasySquad, validateSquad, SquadValidationResult, SQUAD_CONSTRAINTS } from '@pitchxi/shared-types';
import { api } from '../lib/api';
import { FIELD_SLOTS } from '../components/3d/FieldSlot';

interface SquadState {
  matches: Match[];
  selectedMatch: Match | null;
  playerPool: Player[];
  selectedPlayers: Player[];
  captainId: string | null;
  viceCaptainId: string | null;
  mySquad: FantasySquad | null;

  // Filters
  roleFilter: 'ALL' | Role;
  teamFilter: string | null;
  searchQuery: string;

  // View Mode & 3D Slot Management
  viewMode: '2D' | '3D';
  activeSlotIndex: number | null;
  assignedSlots: Record<number, string>; // slotIndex -> playerId

  // Auto-Pick Knapsack State
  lockedPlayerIds: string[];
  isOptimizing: boolean;
  optimizerExecutionTime: number | null;

  // UI state
  isLoadingMatches: boolean;
  isLoadingPlayers: boolean;
  isSubmitting: boolean;
  submitSuccessMessage: string | null;
  error: string | null;

  // Actions
  fetchMatches: () => Promise<void>;
  selectMatch: (match: Match) => Promise<void>;
  setViewMode: (mode: '2D' | '3D') => void;
  setActiveSlotIndex: (index: number | null) => void;
  assignPlayerToSlot: (slotIndex: number, player: Player) => void;
  unassignSlot: (slotIndex: number) => void;
  toggleLockPlayer: (playerId: string) => void;
  autoPickCurrentSquad: () => Promise<void>;
  togglePlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setCaptain: (playerId: string) => void;
  setViceCaptain: (playerId: string) => void;
  setRoleFilter: (role: 'ALL' | Role) => void;
  setTeamFilter: (teamId: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetSquad: () => void;
  submitCurrentSquad: () => Promise<void>;
  clearSuccessMessage: () => void;
  clearError: () => void;

  // Computed helper getters
  getValidation: () => SquadValidationResult;
  getTotalCredits: () => number;
}

export const useSquadStore = create<SquadState>((set, get) => ({
  matches: [],
  selectedMatch: null,
  playerPool: [],
  selectedPlayers: [],
  captainId: null,
  viceCaptainId: null,
  mySquad: null,

  roleFilter: 'ALL',
  teamFilter: null,
  searchQuery: '',

  viewMode: '2D',
  activeSlotIndex: null,
  assignedSlots: {},

  lockedPlayerIds: [],
  isOptimizing: false,
  optimizerExecutionTime: null,

  isLoadingMatches: false,
  isLoadingPlayers: false,
  isSubmitting: false,
  submitSuccessMessage: null,
  error: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveSlotIndex: (index) => set({ activeSlotIndex: index }),

  toggleLockPlayer: (playerId: string) => {
    const { lockedPlayerIds, selectedPlayers, playerPool } = get();
    const isLocked = lockedPlayerIds.includes(playerId);
    if (isLocked) {
      set({ lockedPlayerIds: lockedPlayerIds.filter(id => id !== playerId) });
    } else {
      const player = playerPool.find(p => p.id === playerId);
      if (player && !selectedPlayers.some(p => p.id === playerId)) {
        if (selectedPlayers.length < SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
          get().togglePlayer(player);
        }
      }
      set({ lockedPlayerIds: [...lockedPlayerIds, playerId] });
    }
  },

  autoPickCurrentSquad: async () => {
    const { selectedMatch, lockedPlayerIds } = get();
    if (!selectedMatch) {
      set({ error: 'Please select a match before running Auto-Pick.' });
      return;
    }

    set({ isOptimizing: true, error: null });

    try {
      const result = await api.squads.autoPick(selectedMatch.id, lockedPlayerIds);

      // Map squad to 3D field slots based on role
      const newAssignedSlots: Record<number, string> = {};
      const usedPlayerIds = new Set<string>();

      // First map default roles to matching slots
      FIELD_SLOTS.forEach(slot => {
        const matchingPlayer = result.squad.find(
          p => p.role === slot.role && !usedPlayerIds.has(p.id)
        );
        if (matchingPlayer) {
          newAssignedSlots[slot.slotIndex] = matchingPlayer.id;
          usedPlayerIds.add(matchingPlayer.id);
        }
      });

      // Then fill any unmapped slots with remaining players
      const unassignedSquadPlayers = result.squad.filter(p => !usedPlayerIds.has(p.id));
      FIELD_SLOTS.forEach(slot => {
        if (!newAssignedSlots[slot.slotIndex] && unassignedSquadPlayers.length > 0) {
          const nextPlayer = unassignedSquadPlayers.shift()!;
          newAssignedSlots[slot.slotIndex] = nextPlayer.id;
        }
      });

      set({
        selectedPlayers: result.squad,
        captainId: result.captainId,
        viceCaptainId: result.viceCaptainId,
        assignedSlots: newAssignedSlots,
        optimizerExecutionTime: result.executionTimeMs,
        isOptimizing: false,
        submitSuccessMessage: `Auto-Pick solved optimal squad in ${result.executionTimeMs} ms! ⚡`
      });
    } catch (err: any) {
      set({
        isOptimizing: false,
        error: err.message || 'Failed to auto-pick optimal squad.'
      });
    }
  },

  assignPlayerToSlot: (slotIndex: number, player: Player) => {
    const { selectedPlayers, assignedSlots, captainId, viceCaptainId } = get();

    // Check if player is already assigned to a different slot
    const existingSlotIndex = Object.entries(assignedSlots).find(([_, pId]) => pId === player.id)?.[0];
    if (existingSlotIndex !== undefined && parseInt(existingSlotIndex, 10) !== slotIndex) {
      set({ error: `${player.name} is already placed in another field position.` });
      return;
    }

    // Check if slot currently has a player
    const currentPlayerIdInSlot = assignedSlots[slotIndex];
    let newSelected = [...selectedPlayers];

    if (currentPlayerIdInSlot) {
      // Replace
      newSelected = newSelected.filter(p => p.id !== currentPlayerIdInSlot);
    }

    // Check squad size limit (if adding new player)
    if (!currentPlayerIdInSlot && newSelected.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
      set({ error: 'Squad is full (11 players max). Remove a player to add another.' });
      return;
    }

    // Check credit limit
    const currentCredits = newSelected.reduce((sum, p) => sum + p.creditValue, 0);
    const newTotalCredits = Math.round((currentCredits + player.creditValue) * 10) / 10;
    if (newTotalCredits > SQUAD_CONSTRAINTS.MAX_CREDITS) {
      set({ error: `Selecting ${player.name} (${player.creditValue} cr) exceeds 100 cr budget.` });
      return;
    }

    // Check team count
    const teamCount = newSelected.filter(p => p.teamId === player.teamId).length;
    if (teamCount >= SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) {
      set({ error: `Cannot select more than 7 players from the same team.` });
      return;
    }

    // Add player
    newSelected.push(player);

    const updatedAssigned = {
      ...assignedSlots,
      [slotIndex]: player.id
    };

    set({
      selectedPlayers: newSelected,
      assignedSlots: updatedAssigned,
      activeSlotIndex: null, // close drawer upon pick
      error: null
    });

    // Auto-assign Captain / VC if 11th player
    if (newSelected.length === 11 && (!captainId || !viceCaptainId)) {
      const sortedByProj = [...newSelected].sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
      set({
        captainId: captainId || sortedByProj[0]?.id || null,
        viceCaptainId: viceCaptainId || sortedByProj[1]?.id || null
      });
    }
  },

  unassignSlot: (slotIndex: number) => {
    const { assignedSlots, selectedPlayers, captainId, viceCaptainId } = get();
    const playerId = assignedSlots[slotIndex];
    if (!playerId) return;

    const newAssigned = { ...assignedSlots };
    delete newAssigned[slotIndex];

    set({
      assignedSlots: newAssigned,
      selectedPlayers: selectedPlayers.filter(p => p.id !== playerId),
      captainId: captainId === playerId ? null : captainId,
      viceCaptainId: viceCaptainId === playerId ? null : viceCaptainId,
      error: null
    });
  },

  fetchMatches: async () => {
    set({ isLoadingMatches: true, error: null });
    try {
      const { matches } = await api.matches.getAll();
      set({ matches, isLoadingMatches: false });
      if (matches.length > 0 && !get().selectedMatch) {
        get().selectMatch(matches[0]);
      }
    } catch (err: any) {
      set({ error: err.message, isLoadingMatches: false });
    }
  },

  selectMatch: async (match: Match) => {
    set({
      selectedMatch: match,
      selectedPlayers: [],
      captainId: null,
      viceCaptainId: null,
      mySquad: null,
      isLoadingPlayers: true,
      teamFilter: null,
      error: null
    });

    try {
      const [{ players }, mySquadRes] = await Promise.all([
        api.matches.getPlayers(match.id),
        api.squads.getMyMatchSquad(match.id).catch(() => ({ squad: null }))
      ]);

      set({
        playerPool: players,
        mySquad: mySquadRes.squad,
        isLoadingPlayers: false
      });

      // If user previously submitted a squad, restore their picks
      if (mySquadRes.squad && mySquadRes.squad.players) {
        const existingPickedPlayers = mySquadRes.squad.players
          .map((sp: any) => sp.player || players.find(p => p.id === sp.playerId))
          .filter(Boolean) as Player[];

        if (existingPickedPlayers.length === 11) {
          set({
            selectedPlayers: existingPickedPlayers,
            captainId: mySquadRes.squad.captainPlayerId,
            viceCaptainId: mySquadRes.squad.viceCaptainPlayerId
          });
        }
      }
    } catch (err: any) {
      set({ error: err.message, isLoadingPlayers: false });
    }
  },

  togglePlayer: (player: Player) => {
    const { selectedPlayers, captainId, viceCaptainId } = get();
    const isSelected = selectedPlayers.some(p => p.id === player.id);

    if (isSelected) {
      // Remove
      const updated = selectedPlayers.filter(p => p.id !== player.id);
      set({
        selectedPlayers: updated,
        captainId: captainId === player.id ? null : captainId,
        viceCaptainId: viceCaptainId === player.id ? null : viceCaptainId,
        error: null
      });
    } else {
      // Check 11 max count
      if (selectedPlayers.length >= SQUAD_CONSTRAINTS.TOTAL_PLAYERS) {
        set({ error: 'Squad is full (11 players max). Remove a player to add another.' });
        return;
      }

      // Check credit budget
      const currentCredits = selectedPlayers.reduce((sum, p) => sum + p.creditValue, 0);
      const newTotalCredits = Math.round((currentCredits + player.creditValue) * 10) / 10;
      if (newTotalCredits > SQUAD_CONSTRAINTS.MAX_CREDITS) {
        set({ error: `Adding ${player.name} (${player.creditValue} cr) exceeds 100 cr budget.` });
        return;
      }

      // Check team count
      const currentTeamCount = selectedPlayers.filter(p => p.teamId === player.teamId).length;
      if (currentTeamCount >= SQUAD_CONSTRAINTS.MAX_PLAYERS_PER_TEAM) {
        set({ error: `Cannot select more than 7 players from the same team.` });
        return;
      }

      // Check role maximum
      const currentRoleCount = selectedPlayers.filter(p => p.role === player.role).length;
      const roleLimit = SQUAD_CONSTRAINTS.ROLE_LIMITS[player.role].max;
      if (currentRoleCount >= roleLimit) {
        set({ error: `Cannot select more than ${roleLimit} ${player.role}s.` });
        return;
      }

      // Add player
      const updated = [...selectedPlayers, player];
      set({
        selectedPlayers: updated,
        error: null
      });

      // Auto-assign Captain / VC if 11th player and not yet picked
      if (updated.length === 11 && (!captainId || !viceCaptainId)) {
        const sortedByProj = [...updated].sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
        set({
          captainId: captainId || sortedByProj[0]?.id || null,
          viceCaptainId: viceCaptainId || sortedByProj[1]?.id || null
        });
      }
    }
  },

  removePlayer: (playerId: string) => {
    const { selectedPlayers, assignedSlots, captainId, viceCaptainId } = get();
    const newAssigned = { ...assignedSlots };
    for (const [slotKey, pId] of Object.entries(newAssigned)) {
      if (pId === playerId) {
        delete newAssigned[Number(slotKey)];
      }
    }

    set({
      selectedPlayers: selectedPlayers.filter(p => p.id !== playerId),
      assignedSlots: newAssigned,
      captainId: captainId === playerId ? null : captainId,
      viceCaptainId: viceCaptainId === playerId ? null : viceCaptainId,
      error: null
    });
  },

  setCaptain: (playerId: string) => {
    const { viceCaptainId } = get();
    set({
      captainId: playerId,
      // If same as Vice-Captain, clear Vice-Captain
      viceCaptainId: viceCaptainId === playerId ? null : viceCaptainId,
      error: null
    });
  },

  setViceCaptain: (playerId: string) => {
    const { captainId } = get();
    set({
      viceCaptainId: playerId,
      // If same as Captain, clear Captain
      captainId: captainId === playerId ? null : captainId,
      error: null
    });
  },

  setRoleFilter: (role) => set({ roleFilter: role }),
  setTeamFilter: (teamId) => set({ teamFilter: teamId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  resetSquad: () => set({
    selectedPlayers: [],
    assignedSlots: {},
    activeSlotIndex: null,
    lockedPlayerIds: [],
    optimizerExecutionTime: null,
    captainId: null,
    viceCaptainId: null,
    error: null
  }),

  submitCurrentSquad: async () => {
    const { selectedMatch, selectedPlayers, captainId, viceCaptainId } = get();

    if (!selectedMatch) {
      set({ error: 'No match selected.' });
      return;
    }

    if (!captainId || !viceCaptainId) {
      set({ error: 'Please select both a Captain and a Vice-Captain.' });
      return;
    }

    const validation = validateSquad(selectedPlayers, captainId, viceCaptainId);
    if (!validation.valid) {
      set({ error: validation.errors[0] || 'Squad does not satisfy all constraints.' });
      return;
    }

    set({ isSubmitting: true, error: null });

    try {
      const res = await api.squads.submit({
        matchId: selectedMatch.id,
        playerIds: selectedPlayers.map(p => p.id),
        captainId,
        viceCaptainId
      });

      set({
        mySquad: res.squad,
        isSubmitting: false,
        submitSuccessMessage: 'Your squad has been locked and submitted successfully! 🏏'
      });
    } catch (err: any) {
      set({
        isSubmitting: false,
        error: err.message || 'Failed to submit squad.'
      });
    }
  },

  clearSuccessMessage: () => set({ submitSuccessMessage: null }),
  clearError: () => set({ error: null }),

  getValidation: () => {
    const { selectedPlayers, captainId, viceCaptainId } = get();
    return validateSquad(
      selectedPlayers,
      captainId || undefined,
      viceCaptainId || undefined,
      { allowPartial: true }
    );
  },

  getTotalCredits: () => {
    const { selectedPlayers } = get();
    const sum = selectedPlayers.reduce((acc, p) => acc + p.creditValue, 0);
    return Math.round(sum * 10) / 10;
  }
}));
