import { Match, Player, FantasySquad, User, AutoPickResult } from '@pitchxi/shared-types';

const BASE_URL = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('pitchxi_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.details = data.details || data.errors;
    throw error;
  }
  return data;
}

export const api = {
  auth: {
    async register(email: string, password: string, displayName: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password, displayName })
      });
      return handleResponse(res);
    },

    async login(email: string, password: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },

    async getMe(): Promise<{ user: User }> {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  matches: {
    async getAll(status?: string): Promise<{ matches: Match[] }> {
      const url = status ? `${BASE_URL}/matches?status=${status}` : `${BASE_URL}/matches`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getById(id: string): Promise<{ match: Match }> {
      const res = await fetch(`${BASE_URL}/matches/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getPlayers(matchId: string): Promise<{ matchId: string; totalAvailable: number; players: Player[] }> {
      const res = await fetch(`${BASE_URL}/matches/${matchId}/players`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getLeaderboard(matchId: string): Promise<{
      matchId: string;
      match: {
        id: string;
        status: string;
        venue: string;
        teamA: any;
        teamB: any;
      };
      totalParticipants: number;
      entries: Array<{
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
      }>;
    }> {
      const res = await fetch(`${BASE_URL}/matches/${matchId}/leaderboard`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async scoreMatch(matchId: string): Promise<{
      message: string;
      matchId: string;
      squadsScored: number;
      topEntries: any[];
    }> {
      const res = await fetch(`${BASE_URL}/matches/${matchId}/score`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  squads: {
    async autoPick(matchId: string, lockedPlayerIds: string[] = []): Promise<AutoPickResult> {
      const res = await fetch(`${BASE_URL}/squads/auto-pick`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ matchId, lockedPlayerIds })
      });
      return handleResponse(res);
    },

    async submit(payload: { matchId: string; playerIds: string[]; captainId: string; viceCaptainId: string }): Promise<{ message: string; squad: FantasySquad }> {
      const res = await fetch(`${BASE_URL}/squads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },

    async getMine(): Promise<{ squads: FantasySquad[] }> {
      const res = await fetch(`${BASE_URL}/squads/mine`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getMyMatchSquad(matchId: string): Promise<{ squad: FantasySquad | null }> {
      const res = await fetch(`${BASE_URL}/squads/match/${matchId}/my-squad`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getById(id: string): Promise<{ squad: FantasySquad }> {
      const res = await fetch(`${BASE_URL}/squads/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },

    async getProfile(): Promise<{
      user: { id: string; email: string; displayName: string; createdAt: string };
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
        match: any;
        totalPoints: number | null;
        totalCreditsUsed: number;
        lockedAt: string;
        rank: number | null;
        captain: { id: string; name: string; role: string } | null;
        viceCaptain: { id: string; name: string; role: string } | null;
        playerCount: number;
      }>;
    }> {
      const res = await fetch(`${BASE_URL}/squads/profile`, { headers: getHeaders() });
      return handleResponse(res);
    }
  }
};
