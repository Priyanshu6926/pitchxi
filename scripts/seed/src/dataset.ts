import { Role } from '@pitchxi/shared-types';

export interface SeedTeam {
  id: string;
  name: string;
  shortCode: string;
  primaryColor: string;
  logoUrl: string;
}

export interface SeedPlayer {
  id: string;
  name: string;
  teamId: string;
  role: Role;
  photoUrl: string;
  recentPoints: number[];
  careerAveragePoints: number;
}

export interface SeedMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  status: 'COMPLETED' | 'UPCOMING' | 'HISTORICAL';
  source: 'SEED';
}

export interface SeedPerformance {
  playerId: string;
  matchId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  catches: number;
  stumpings: number;
  runOuts: number;
  fantasyPoints: number;
}

export const SEED_TEAMS: SeedTeam[] = [
  { id: 'team-csk', name: 'Chennai Super Kings', shortCode: 'CSK', primaryColor: '#F9CD05', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
  { id: 'team-mi', name: 'Mumbai Indians', shortCode: 'MI', primaryColor: '#004BA0', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
  { id: 'team-rcb', name: 'Royal Challengers Bengaluru', shortCode: 'RCB', primaryColor: '#EC1C24', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
  { id: 'team-kkr', name: 'Kolkata Knight Riders', shortCode: 'KKR', primaryColor: '#3A225D', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
  { id: 'team-rr', name: 'Rajasthan Royals', shortCode: 'RR', primaryColor: '#EA1A85', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
  { id: 'team-gt', name: 'Gujarat Titans', shortCode: 'GT', primaryColor: '#1B2133', logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' }
];

export const SEED_PLAYERS: SeedPlayer[] = [
  // CSK
  { id: 'csk-dhoni', name: 'MS Dhoni', teamId: 'team-csk', role: 'WK', photoUrl: '', recentPoints: [42, 55, 30, 68, 48], careerAveragePoints: 50 },
  { id: 'csk-ruturaj', name: 'Ruturaj Gaikwad', teamId: 'team-csk', role: 'BAT', photoUrl: '', recentPoints: [88, 110, 45, 95, 76], careerAveragePoints: 72 },
  { id: 'csk-dube', name: 'Shivam Dube', teamId: 'team-csk', role: 'ALL', photoUrl: '', recentPoints: [75, 82, 60, 94, 52], careerAveragePoints: 65 },
  { id: 'csk-jadeja', name: 'Ravindra Jadeja', teamId: 'team-csk', role: 'ALL', photoUrl: '', recentPoints: [65, 80, 72, 55, 90], careerAveragePoints: 68 },
  { id: 'csk-pathirana', name: 'Matheesha Pathirana', teamId: 'team-csk', role: 'BOWL', photoUrl: '', recentPoints: [85, 75, 105, 60, 92], careerAveragePoints: 74 },
  { id: 'csk-chahar', name: 'Deepak Chahar', teamId: 'team-csk', role: 'BOWL', photoUrl: '', recentPoints: [45, 52, 38, 60, 42], careerAveragePoints: 48 },
  { id: 'csk-deshpande', name: 'Tushar Deshpande', teamId: 'team-csk', role: 'BOWL', photoUrl: '', recentPoints: [60, 48, 70, 35, 55], careerAveragePoints: 52 },
  { id: 'csk-rahane', name: 'Ajinkya Rahane', teamId: 'team-csk', role: 'BAT', photoUrl: '', recentPoints: [35, 42, 28, 55, 30], careerAveragePoints: 40 },

  // MI
  { id: 'mi-rohit', name: 'Rohit Sharma', teamId: 'team-mi', role: 'BAT', photoUrl: '', recentPoints: [105, 52, 85, 40, 94], careerAveragePoints: 70 },
  { id: 'mi-sky', name: 'Suryakumar Yadav', teamId: 'team-mi', role: 'BAT', photoUrl: '', recentPoints: [98, 120, 65, 110, 88], careerAveragePoints: 78 },
  { id: 'mi-kishan', name: 'Ishan Kishan', teamId: 'team-mi', role: 'WK', photoUrl: '', recentPoints: [68, 45, 75, 32, 82], careerAveragePoints: 58 },
  { id: 'mi-hardik', name: 'Hardik Pandya', teamId: 'team-mi', role: 'ALL', photoUrl: '', recentPoints: [70, 85, 55, 65, 90], careerAveragePoints: 66 },
  { id: 'mi-bumrah', name: 'Jasprit Bumrah', teamId: 'team-mi', role: 'BOWL', photoUrl: '', recentPoints: [115, 90, 85, 120, 95], careerAveragePoints: 85 },
  { id: 'mi-tilak', name: 'Tilak Varma', teamId: 'team-mi', role: 'BAT', photoUrl: '', recentPoints: [62, 58, 70, 45, 68], careerAveragePoints: 56 },
  { id: 'mi-chawla', name: 'Piyush Chawla', teamId: 'team-mi', role: 'BOWL', photoUrl: '', recentPoints: [40, 55, 35, 48, 50], careerAveragePoints: 44 },
  { id: 'mi-coetzee', name: 'Gerald Coetzee', teamId: 'team-mi', role: 'BOWL', photoUrl: '', recentPoints: [65, 72, 50, 60, 58], careerAveragePoints: 55 },

  // RCB
  { id: 'rcb-kohli', name: 'Virat Kohli', teamId: 'team-rcb', role: 'BAT', photoUrl: '', recentPoints: [118, 92, 105, 84, 96], careerAveragePoints: 88 },
  { id: 'rcb-faf', name: 'Faf du Plessis', teamId: 'team-rcb', role: 'BAT', photoUrl: '', recentPoints: [75, 88, 42, 65, 90], careerAveragePoints: 68 },
  { id: 'rcb-maxwell', name: 'Glenn Maxwell', teamId: 'team-rcb', role: 'ALL', photoUrl: '', recentPoints: [85, 40, 95, 30, 78], careerAveragePoints: 64 },
  { id: 'rcb-dk', name: 'Dinesh Karthik', teamId: 'team-rcb', role: 'WK', photoUrl: '', recentPoints: [65, 55, 72, 48, 60], careerAveragePoints: 54 },
  { id: 'rcb-siraj', name: 'Mohammed Siraj', teamId: 'team-rcb', role: 'BOWL', photoUrl: '', recentPoints: [70, 55, 80, 42, 68], careerAveragePoints: 60 },
  { id: 'rcb-patidar', name: 'Rajat Patidar', teamId: 'team-rcb', role: 'BAT', photoUrl: '', recentPoints: [78, 64, 82, 50, 70], careerAveragePoints: 58 },
  { id: 'rcb-green', name: 'Cameron Green', teamId: 'team-rcb', role: 'ALL', photoUrl: '', recentPoints: [80, 65, 75, 58, 85], careerAveragePoints: 65 },
  { id: 'rcb-dayal', name: 'Yash Dayal', teamId: 'team-rcb', role: 'BOWL', photoUrl: '', recentPoints: [55, 62, 48, 60, 50], careerAveragePoints: 50 },

  // KKR
  { id: 'kkr-narine', name: 'Sunil Narine', teamId: 'team-kkr', role: 'ALL', photoUrl: '', recentPoints: [120, 95, 110, 85, 105], careerAveragePoints: 84 },
  { id: 'kkr-russell', name: 'Andre Russell', teamId: 'team-kkr', role: 'ALL', photoUrl: '', recentPoints: [95, 80, 115, 70, 90], careerAveragePoints: 78 },
  { id: 'kkr-shreyas', name: 'Shreyas Iyer', teamId: 'team-kkr', role: 'BAT', photoUrl: '', recentPoints: [60, 72, 55, 68, 64], careerAveragePoints: 58 },
  { id: 'kkr-rinku', name: 'Rinku Singh', teamId: 'team-kkr', role: 'BAT', photoUrl: '', recentPoints: [52, 65, 48, 70, 58], careerAveragePoints: 52 },
  { id: 'kkr-starc', name: 'Mitchell Starc', teamId: 'team-kkr', role: 'BOWL', photoUrl: '', recentPoints: [75, 90, 60, 85, 80], careerAveragePoints: 72 },
  { id: 'kkr-varun', name: 'Varun Chakaravarthy', teamId: 'team-kkr', role: 'BOWL', photoUrl: '', recentPoints: [82, 70, 95, 58, 88], careerAveragePoints: 70 },
  { id: 'kkr-salt', name: 'Phil Salt', teamId: 'team-kkr', role: 'WK', photoUrl: '', recentPoints: [88, 74, 90, 62, 85], careerAveragePoints: 72 },
  { id: 'kkr-harshit', name: 'Harshit Rana', teamId: 'team-kkr', role: 'BOWL', photoUrl: '', recentPoints: [65, 78, 52, 70, 60], careerAveragePoints: 58 },

  // RR
  { id: 'rr-samson', name: 'Sanju Samson', teamId: 'team-rr', role: 'WK', photoUrl: '', recentPoints: [85, 95, 60, 88, 72], careerAveragePoints: 70 },
  { id: 'rr-buttler', name: 'Jos Buttler', teamId: 'team-rr', role: 'WK', photoUrl: '', recentPoints: [110, 65, 125, 45, 90], careerAveragePoints: 80 },
  { id: 'rr-jaiswal', name: 'Yashasvi Jaiswal', teamId: 'team-rr', role: 'BAT', photoUrl: '', recentPoints: [95, 60, 105, 50, 82], careerAveragePoints: 72 },
  { id: 'rr-parag', name: 'Riyan Parag', teamId: 'team-rr', role: 'ALL', photoUrl: '', recentPoints: [78, 85, 65, 92, 70], careerAveragePoints: 68 },
  { id: 'rr-chahal', name: 'Yuzvendra Chahal', teamId: 'team-rr', role: 'BOWL', photoUrl: '', recentPoints: [80, 65, 90, 75, 85], careerAveragePoints: 74 },
  { id: 'rr-boult', name: 'Trent Boult', teamId: 'team-rr', role: 'BOWL', photoUrl: '', recentPoints: [72, 80, 60, 85, 70], careerAveragePoints: 68 },
  { id: 'rr-ashwin', name: 'Ravichandran Ashwin', teamId: 'team-rr', role: 'ALL', photoUrl: '', recentPoints: [50, 62, 45, 58, 52], careerAveragePoints: 50 },
  { id: 'rr-sandeep', name: 'Sandeep Sharma', teamId: 'team-rr', role: 'BOWL', photoUrl: '', recentPoints: [68, 75, 55, 80, 62], careerAveragePoints: 60 },

  // GT
  { id: 'gt-gill', name: 'Shubman Gill', teamId: 'team-gt', role: 'BAT', photoUrl: '', recentPoints: [100, 82, 95, 65, 90], careerAveragePoints: 80 },
  { id: 'gt-sudharsan', name: 'Sai Sudharsan', teamId: 'team-gt', role: 'BAT', photoUrl: '', recentPoints: [85, 74, 90, 68, 80], careerAveragePoints: 70 },
  { id: 'gt-rashid', name: 'Rashid Khan', teamId: 'team-gt', role: 'ALL', photoUrl: '', recentPoints: [90, 85, 70, 105, 80], careerAveragePoints: 78 },
  { id: 'gt-miller', name: 'David Miller', teamId: 'team-gt', role: 'BAT', photoUrl: '', recentPoints: [60, 72, 48, 65, 55], careerAveragePoints: 55 },
  { id: 'gt-tewatia', name: 'Rahul Tewatia', teamId: 'team-gt', role: 'ALL', photoUrl: '', recentPoints: [55, 48, 65, 40, 58], careerAveragePoints: 50 },
  { id: 'gt-mohit', name: 'Mohit Sharma', teamId: 'team-gt', role: 'BOWL', photoUrl: '', recentPoints: [70, 85, 60, 75, 68], careerAveragePoints: 65 },
  { id: 'gt-saha', name: 'Wriddhiman Saha', teamId: 'team-gt', role: 'WK', photoUrl: '', recentPoints: [45, 52, 38, 60, 42], careerAveragePoints: 44 },
  { id: 'gt-noor', name: 'Noor Ahmad', teamId: 'team-gt', role: 'BOWL', photoUrl: '', recentPoints: [62, 70, 50, 65, 58], careerAveragePoints: 56 }
];

export const SEED_MATCHES: SeedMatch[] = [
  {
    id: 'match-csk-mi-2024',
    teamAId: 'team-csk',
    teamBId: 'team-mi',
    venue: 'Wankhede Stadium, Mumbai',
    matchDate: '2024-04-14T19:30:00.000Z',
    status: 'COMPLETED',
    source: 'SEED'
  },
  {
    id: 'match-rcb-kkr-2024',
    teamAId: 'team-rcb',
    teamBId: 'team-kkr',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    matchDate: '2024-03-29T19:30:00.000Z',
    status: 'COMPLETED',
    source: 'SEED'
  },
  {
    id: 'match-gt-rr-2024',
    teamAId: 'team-gt',
    teamBId: 'team-rr',
    venue: 'Narendra Modi Stadium, Ahmedabad',
    matchDate: '2024-04-10T19:30:00.000Z',
    status: 'COMPLETED',
    source: 'SEED'
  },
  {
    id: 'match-mi-rcb-upcoming',
    teamAId: 'team-mi',
    teamBId: 'team-rcb',
    venue: 'Wankhede Stadium, Mumbai',
    matchDate: '2024-05-15T19:30:00.000Z',
    status: 'UPCOMING',
    source: 'SEED'
  },
  {
    id: 'match-csk-kkr-upcoming',
    teamAId: 'team-csk',
    teamBId: 'team-kkr',
    venue: 'MA Chidambaram Stadium, Chepauk',
    matchDate: '2024-05-18T19:30:00.000Z',
    status: 'UPCOMING',
    source: 'SEED'
  }
];

// Curated ball-by-ball performances for Match 1: CSK vs MI (2024-04-14 at Wankhede)
// CSK 206/4 (20) beat MI 186/6 (20) by 20 runs
export const MATCH_1_PERFORMANCES: SeedPerformance[] = [
  // CSK Players
  { playerId: 'csk-ruturaj', matchId: 'match-csk-mi-2024', runs: 69, ballsFaced: 40, fours: 5, sixes: 5, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 1, stumpings: 0, runOuts: 0, fantasyPoints: 112 },
  { playerId: 'csk-dube', matchId: 'match-csk-mi-2024', runs: 66, ballsFaced: 38, fours: 10, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 94 },
  { playerId: 'csk-dhoni', matchId: 'match-csk-mi-2024', runs: 20, ballsFaced: 4, fours: 0, sixes: 3, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 1, stumpings: 0, runOuts: 0, fantasyPoints: 52 },
  { playerId: 'csk-rahane', matchId: 'match-csk-mi-2024', runs: 5, ballsFaced: 8, fours: 1, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 9 },
  { playerId: 'csk-jadeja', matchId: 'match-csk-mi-2024', runs: 7, ballsFaced: 6, fours: 0, sixes: 0, wickets: 0, oversBowled: 4, runsConceded: 37, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 11 },
  { playerId: 'csk-pathirana', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 4, oversBowled: 4, runsConceded: 28, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 132 },
  { playerId: 'csk-deshpande', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 1, oversBowled: 4, runsConceded: 29, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 31 },
  { playerId: 'csk-chahar', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 2, runsConceded: 20, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 4 },

  // MI Players
  { playerId: 'mi-rohit', matchId: 'match-csk-mi-2024', runs: 105, ballsFaced: 63, fours: 11, sixes: 5, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 159 },
  { playerId: 'mi-kishan', matchId: 'match-csk-mi-2024', runs: 23, ballsFaced: 15, fours: 3, sixes: 1, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 1, stumpings: 0, runOuts: 0, fantasyPoints: 43 },
  { playerId: 'mi-sky', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 2, fours: 0, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: -2 },
  { playerId: 'mi-tilak', matchId: 'match-csk-mi-2024', runs: 31, ballsFaced: 20, fours: 5, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 51 },
  { playerId: 'mi-hardik', matchId: 'match-csk-mi-2024', runs: 2, ballsFaced: 6, fours: 0, sixes: 0, wickets: 2, oversBowled: 3, runsConceded: 43, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 52 },
  { playerId: 'mi-bumrah', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 4, runsConceded: 27, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 14 },
  { playerId: 'mi-coetzee', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 1, oversBowled: 4, runsConceded: 35, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 29 },
  { playerId: 'mi-chawla', matchId: 'match-csk-mi-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 2, runsConceded: 22, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 2 }
];

// Curated ball-by-ball performances for Match 2: RCB vs KKR (2024-03-29 at Chinnaswamy)
// KKR 186/3 (16.5) beat RCB 182/6 (20) by 7 wickets
export const MATCH_2_PERFORMANCES: SeedPerformance[] = [
  // RCB Players
  { playerId: 'rcb-kohli', matchId: 'match-rcb-kkr-2024', runs: 83, ballsFaced: 59, fours: 4, sixes: 4, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 119 },
  { playerId: 'rcb-faf', matchId: 'match-rcb-kkr-2024', runs: 8, ballsFaced: 6, fours: 1, sixes: 1, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 20 },
  { playerId: 'rcb-green', matchId: 'match-rcb-kkr-2024', runs: 33, ballsFaced: 21, fours: 4, sixes: 2, wickets: 0, oversBowled: 2, runsConceded: 20, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 65 },
  { playerId: 'rcb-maxwell', matchId: 'match-rcb-kkr-2024', runs: 28, ballsFaced: 19, fours: 3, sixes: 1, wickets: 0, oversBowled: 1, runsConceded: 12, maidens: 0, catches: 1, stumpings: 0, runOuts: 0, fantasyPoints: 56 },
  { playerId: 'rcb-patidar', matchId: 'match-rcb-kkr-2024', runs: 3, ballsFaced: 4, fours: 0, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 5 },
  { playerId: 'rcb-dk', matchId: 'match-rcb-kkr-2024', runs: 20, ballsFaced: 8, fours: 0, sixes: 3, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 44 },
  { playerId: 'rcb-siraj', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 3, runsConceded: 46, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: -6 },
  { playerId: 'rcb-dayal', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 1, oversBowled: 4, runsConceded: 46, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 21 },

  // KKR Players
  { playerId: 'kkr-narine', matchId: 'match-rcb-kkr-2024', runs: 47, ballsFaced: 22, fours: 2, sixes: 5, wickets: 1, oversBowled: 4, runsConceded: 40, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 114 },
  { playerId: 'kkr-salt', matchId: 'match-rcb-kkr-2024', runs: 30, ballsFaced: 20, fours: 2, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 1, stumpings: 0, runOuts: 0, fantasyPoints: 56 },
  { playerId: 'kkr-shreyas', matchId: 'match-rcb-kkr-2024', runs: 39, ballsFaced: 24, fours: 2, sixes: 2, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 63 },
  { playerId: 'kkr-russell', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 2, oversBowled: 4, runsConceded: 29, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 66 },
  { playerId: 'kkr-harshit', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 2, oversBowled: 4, runsConceded: 39, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 54 },
  { playerId: 'kkr-starc', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 4, runsConceded: 47, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: -2 },
  { playerId: 'kkr-varun', matchId: 'match-rcb-kkr-2024', runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, oversBowled: 2, runsConceded: 20, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 4 },
  { playerId: 'kkr-rinku', matchId: 'match-rcb-kkr-2024', runs: 5, ballsFaced: 5, fours: 0, sixes: 0, wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, fantasyPoints: 5 }
];
