export type Role = 'WK' | 'BAT' | 'ALL' | 'BOWL';

export type MatchStatus = 'HISTORICAL' | 'UPCOMING' | 'LIVE' | 'COMPLETED';

export type MatchSource = 'SEED' | 'LIVE_API';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  shortCode: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  team?: Team;
  role: Role;
  creditValue: number;
  photoUrl?: string;
  projectedPoints?: number;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  teamA?: Team;
  teamB?: Team;
  venue: string;
  matchDate: string;
  status: MatchStatus;
  source: MatchSource;
}

export interface PlayerMatchPerformance {
  id: string;
  playerId: string;
  player?: Player;
  matchId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens?: number;
  catches: number;
  stumpings: number;
  runOuts?: number;
  fantasyPoints: number;
}

export interface FantasySquadPlayerSelection {
  playerId: string;
  player?: Player;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface FantasySquad {
  id: string;
  userId: string;
  matchId: string;
  match?: Match;
  captainPlayerId: string;
  viceCaptainPlayerId: string;
  totalCreditsUsed: number;
  totalPoints?: number;
  lockedAt: string;
  players?: Player[];
}

export interface LeaderboardEntry {
  id: string;
  matchId: string;
  squadId: string;
  userId: string;
  user?: User;
  rank: number;
  totalPoints: number;
  updatedAt: string;
}

export interface SquadConstraints {
  TOTAL_PLAYERS: number;
  MAX_CREDITS: number;
  MAX_PLAYERS_PER_TEAM: number;
  ROLE_LIMITS: Record<Role, { min: number; max: number }>;
}

export const SQUAD_CONSTRAINTS: SquadConstraints = {
  TOTAL_PLAYERS: 11,
  MAX_CREDITS: 100.0,
  MAX_PLAYERS_PER_TEAM: 7,
  ROLE_LIMITS: {
    WK: { min: 1, max: 4 },
    BAT: { min: 3, max: 6 },
    ALL: { min: 1, max: 4 },
    BOWL: { min: 3, max: 6 }
  }
};

export interface SquadValidationResult {
  valid: boolean;
  errors: string[];
  roleCounts: Record<Role, number>;
  teamCounts: Record<string, number>;
  totalCredits: number;
  playerCount: number;
}

export interface AutoPickRequest {
  matchId: string;
  lockedPlayerIds?: string[];
}

export interface AutoPickResponse {
  playerIds: string[];
  captainId: string;
  viceCaptainId: string;
  totalCredits: number;
  projectedPoints: number;
  valid: boolean;
  errors?: string[];
}

export interface AutoPickResult {
  squad: Player[];
  captainId: string;
  viceCaptainId: string;
  totalCredits: number;
  projectedPoints: number;
  executionTimeMs: number;
}

