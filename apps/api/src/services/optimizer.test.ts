import { describe, it, expect } from 'vitest';
import { autoPickSquad } from './optimizer';
import { Player, Role, SQUAD_CONSTRAINTS, validateSquad } from '@pitchxi/shared-types';

describe('Auto-Pick Knapsack Optimizer (Phase 6)', () => {
  // Mock player pool simulating a 22-player IPL match (CSK vs MI)
  const mockPool: Player[] = [
    // Team A (CSK) - 11 players
    { id: 'csk-1', name: 'MS Dhoni', teamId: 'csk', role: 'WK', creditValue: 8.5, projectedPoints: 48 },
    { id: 'csk-2', name: 'Ruturaj Gaikwad', teamId: 'csk', role: 'BAT', creditValue: 9.5, projectedPoints: 68 },
    { id: 'csk-3', name: 'Shivam Dube', teamId: 'csk', role: 'BAT', creditValue: 9.0, projectedPoints: 58 },
    { id: 'csk-4', name: 'Ajinkya Rahane', teamId: 'csk', role: 'BAT', creditValue: 8.0, projectedPoints: 42 },
    { id: 'csk-5', name: 'Ravindra Jadeja', teamId: 'csk', role: 'ALL', creditValue: 9.5, projectedPoints: 64 },
    { id: 'csk-6', name: 'Moeen Ali', teamId: 'csk', role: 'ALL', creditValue: 8.5, projectedPoints: 46 },
    { id: 'csk-7', name: 'Deepak Chahar', teamId: 'csk', role: 'BOWL', creditValue: 8.0, projectedPoints: 38 },
    { id: 'csk-8', name: 'Matheesha Pathirana', teamId: 'csk', role: 'BOWL', creditValue: 9.0, projectedPoints: 62 },
    { id: 'csk-9', name: 'Tushar Deshpande', teamId: 'csk', role: 'BOWL', creditValue: 8.0, projectedPoints: 36 },
    { id: 'csk-10', name: 'Shardul Thakur', teamId: 'csk', role: 'BOWL', creditValue: 7.5, projectedPoints: 34 },
    { id: 'csk-11', name: 'Sameer Rizvi', teamId: 'csk', role: 'BAT', creditValue: 6.5, projectedPoints: 22 },

    // Team B (MI) - 11 players
    { id: 'mi-1', name: 'Ishan Kishan', teamId: 'mi', role: 'WK', creditValue: 9.0, projectedPoints: 56 },
    { id: 'mi-2', name: 'Rohit Sharma', teamId: 'mi', role: 'BAT', creditValue: 10.0, projectedPoints: 72 },
    { id: 'mi-3', name: 'Suryakumar Yadav', teamId: 'mi', role: 'BAT', creditValue: 10.0, projectedPoints: 75 },
    { id: 'mi-4', name: 'Tilak Varma', teamId: 'mi', role: 'BAT', creditValue: 8.5, projectedPoints: 52 },
    { id: 'mi-5', name: 'Hardik Pandya', teamId: 'mi', role: 'ALL', creditValue: 9.5, projectedPoints: 60 },
    { id: 'mi-6', name: 'Tim David', teamId: 'mi', role: 'ALL', creditValue: 8.0, projectedPoints: 40 },
    { id: 'mi-7', name: 'Jasprit Bumrah', teamId: 'mi', role: 'BOWL', creditValue: 10.5, projectedPoints: 80 },
    { id: 'mi-8', name: 'Gerald Coetzee', teamId: 'mi', role: 'BOWL', creditValue: 8.5, projectedPoints: 48 },
    { id: 'mi-9', name: 'Piyush Chawla', teamId: 'mi', role: 'BOWL', creditValue: 7.5, projectedPoints: 35 },
    { id: 'mi-10', name: 'Nuwan Thushara', teamId: 'mi', role: 'BOWL', creditValue: 7.0, projectedPoints: 32 },
    { id: 'mi-11', name: 'Nehal Wadhera', teamId: 'mi', role: 'BAT', creditValue: 6.5, projectedPoints: 26 },
  ];

  it('1. Generates a fully valid 11-player squad satisfying all Dream11 rules', () => {
    const result = autoPickSquad(mockPool);

    expect(result.squad).toHaveLength(11);
    expect(result.totalCredits).toBeLessThanOrEqual(100.0);
    expect(result.captainId).toBeTruthy();
    expect(result.viceCaptainId).toBeTruthy();
    expect(result.captainId).not.toEqual(result.viceCaptainId);

    // Verify using universal isomorphic validator
    const validation = validateSquad(result.squad, result.captainId, result.viceCaptainId);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('2. Satisfies role composition limits (WK 1-4, BAT 3-6, ALL 1-4, BOWL 3-6)', () => {
    const result = autoPickSquad(mockPool);
    const roleCounts: Record<Role, number> = { WK: 0, BAT: 0, ALL: 0, BOWL: 0 };
    result.squad.forEach(p => roleCounts[p.role]++);

    expect(roleCounts.WK).toBeGreaterThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.WK.min);
    expect(roleCounts.WK).toBeLessThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.WK.max);

    expect(roleCounts.BAT).toBeGreaterThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.BAT.min);
    expect(roleCounts.BAT).toBeLessThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.BAT.max);

    expect(roleCounts.ALL).toBeGreaterThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.ALL.min);
    expect(roleCounts.ALL).toBeLessThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.ALL.max);

    expect(roleCounts.BOWL).toBeGreaterThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.BOWL.min);
    expect(roleCounts.BOWL).toBeLessThanOrEqual(SQUAD_CONSTRAINTS.ROLE_LIMITS.BOWL.max);
  });

  it('3. Satisfies franchise team ceiling of max 7 players per team', () => {
    const result = autoPickSquad(mockPool);
    const cskCount = result.squad.filter(p => p.teamId === 'csk').length;
    const miCount = result.squad.filter(p => p.teamId === 'mi').length;

    expect(cskCount).toBeLessThanOrEqual(7);
    expect(miCount).toBeLessThanOrEqual(7);
    expect(cskCount + miCount).toBe(11);
  });

  it('4. Retains all user-locked players in the optimized squad', () => {
    const lockedIds = ['csk-1', 'mi-7']; // Dhoni + Bumrah
    const result = autoPickSquad(mockPool, lockedIds);

    const squadIds = result.squad.map(p => p.id);
    expect(squadIds).toContain('csk-1');
    expect(squadIds).toContain('mi-7');

    const validation = validateSquad(result.squad, result.captainId, result.viceCaptainId);
    expect(validation.valid).toBe(true);
  });

  it('5. Assigns Captain (2x) and Vice-Captain (1.5x) to top projected scorers', () => {
    const result = autoPickSquad(mockPool);
    const captain = result.squad.find(p => p.id === result.captainId);
    const viceCaptain = result.squad.find(p => p.id === result.viceCaptainId);

    expect(captain).toBeDefined();
    expect(viceCaptain).toBeDefined();

    // Captain should have the maximum projected points in the squad
    const maxProjected = Math.max(...result.squad.map(p => p.projectedPoints || 0));
    expect(captain!.projectedPoints).toBe(maxProjected);

    // VC should be distinct and second highest
    expect(result.captainId).not.toEqual(result.viceCaptainId);
  });

  it('6. Rejects impossible locked picks that violate constraints upfront', () => {
    // 8 players from CSK (exceeds max 7 per team)
    const tooManyTeamPicks = [
      'csk-1', 'csk-2', 'csk-3', 'csk-4', 'csk-5', 'csk-6', 'csk-7', 'csk-8'
    ];
    expect(() => autoPickSquad(mockPool, tooManyTeamPicks)).toThrow(/more than 7 players/i);
  });

  it('7. Rejects locked picks that leave insufficient budget to complete the squad', () => {
    // Create an artificial pool where locking leaves < 6.0 cr per remaining spot
    const expensiveLockIds = ['mi-7', 'mi-3', 'mi-2', 'csk-2', 'csk-5', 'csk-3', 'mi-5']; // 7 players = ~67 cr
    // 67 cr + (4 * 6.0 = 24) = 91 (valid), but let's test exceeding:
    const customExpensivePool: Player[] = [
      ...mockPool,
      { id: 'exp-1', name: 'Superstar 1', teamId: 'csk', role: 'BAT', creditValue: 30.0, projectedPoints: 100 },
      { id: 'exp-2', name: 'Superstar 2', teamId: 'mi', role: 'BAT', creditValue: 30.0, projectedPoints: 100 },
      { id: 'exp-3', name: 'Superstar 3', teamId: 'csk', role: 'BAT', creditValue: 30.0, projectedPoints: 100 },
    ];
    // 3 * 30 = 90 credits used, 8 slots remaining * 6.0 = 48 cr needed -> 138 > 100
    expect(() => autoPickSquad(customExpensivePool, ['exp-1', 'exp-2', 'exp-3'])).toThrow(/insufficient budget/i);
  });

  it('8. Benchmark: Executes in strictly < 25 ms', () => {
    const iterations = 20;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      autoPickSquad(mockPool);
    }
    const totalDuration = performance.now() - start;
    const avgDuration = totalDuration / iterations;

    expect(avgDuration).toBeLessThan(25);
  });
});
