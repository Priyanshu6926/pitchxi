import { describe, it, expect } from 'vitest';
import { Player, validateSquad } from './index';

describe('Squad Validation Constraint Checker (PRD §8.3)', () => {
  // Helper to create a dummy player
  const makePlayer = (id: string, role: 'WK' | 'BAT' | 'ALL' | 'BOWL', teamId: string, credit: number): Player => ({
    id,
    name: `Player ${id}`,
    role,
    teamId,
    creditValue: credit
  });

  // Valid legal 11-player squad (total credits = 91.5 cr <= 100, team CSK = 6, team MI = 5)
  // Roles: WK: 1, BAT: 4, ALL: 2, BOWL: 4
  const validSquad: Player[] = [
    makePlayer('p-wk1', 'WK', 'CSK', 8.5),
    makePlayer('p-bat1', 'BAT', 'CSK', 9.0),
    makePlayer('p-bat2', 'BAT', 'CSK', 8.5),
    makePlayer('p-bat3', 'BAT', 'MI', 9.5),
    makePlayer('p-bat4', 'BAT', 'MI', 8.0),
    makePlayer('p-all1', 'ALL', 'CSK', 8.5),
    makePlayer('p-all2', 'ALL', 'MI', 8.0),
    makePlayer('p-bowl1', 'BOWL', 'CSK', 8.5),
    makePlayer('p-bowl2', 'BOWL', 'CSK', 7.5),
    makePlayer('p-bowl3', 'BOWL', 'MI', 9.0),
    makePlayer('p-bowl4', 'BOWL', 'MI', 7.0)
  ];

  it('approves a valid legal squad meeting all 5 constraints', () => {
    const result = validateSquad(validSquad, 'p-bat1', 'p-bowl1');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.playerCount).toBe(11);
    expect(result.totalCredits).toBe(92.0);
    expect(result.roleCounts.WK).toBe(1);
    expect(result.roleCounts.BAT).toBe(4);
    expect(result.roleCounts.ALL).toBe(2);
    expect(result.roleCounts.BOWL).toBe(4);
  });

  it('rejects squad if total players is not 11', () => {
    // 10 players
    const tenPlayers = validSquad.slice(0, 10);
    const result = validateSquad(tenPlayers, 'p-bat1', 'p-bowl1');

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exactly 11 players'))).toBe(true);
  });

  it('rejects squad exceeding 100 credits', () => {
    const expensiveSquad = validSquad.map(p => ({ ...p, creditValue: 10.0 })); // 110 credits
    const result = validateSquad(expensiveSquad, 'p-bat1', 'p-bowl1');

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exceeds salary cap budget'))).toBe(true);
  });

  it('rejects squad with duplicate player selections', () => {
    const duplicateSquad = [...validSquad.slice(0, 10), validSquad[0]]; // Duplicate first player
    const result = validateSquad(duplicateSquad, 'p-bat1', 'p-bowl1');

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate player'))).toBe(true);
  });

  it('rejects squad violating role minimums (e.g. 0 Wicketkeepers)', () => {
    // Replace WK with another BAT (WK=0, BAT=5)
    const noWkSquad = [
      makePlayer('p-extra-bat', 'BAT', 'MI', 7.5),
      ...validSquad.slice(1)
    ];

    const result = validateSquad(noWkSquad, 'p-bat1', 'p-bowl1');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Requires at least 1 WK'))).toBe(true);
  });

  it('rejects squad violating role maximums (e.g. 7 Batters)', () => {
    // Replace 3 bowlers with batters -> BAT = 7, BOWL = 1
    const tooManyBatsSquad = [
      validSquad[0], // WK
      validSquad[1], validSquad[2], validSquad[3], validSquad[4], // 4 BAT
      makePlayer('b5', 'BAT', 'CSK', 7.0),
      makePlayer('b6', 'BAT', 'MI', 7.0),
      makePlayer('b7', 'BAT', 'MI', 7.0), // 7 BAT total
      validSquad[5], validSquad[6], // 2 ALL
      validSquad[7] // 1 BOWL
    ];

    const result = validateSquad(tooManyBatsSquad, 'p-bat1', 'b5');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Cannot exceed 6 BAT'))).toBe(true);
    expect(result.errors.some(e => e.includes('Requires at least 3 BOWL'))).toBe(true);
  });

  it('rejects squad with more than 7 players from a single IPL team', () => {
    // 8 players from CSK, 3 from MI
    const biasedSquad = validSquad.map((p, idx) => ({
      ...p,
      teamId: idx < 8 ? 'CSK' : 'MI'
    }));

    const result = validateSquad(biasedSquad, 'p-bat1', 'p-bowl1');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Cannot select more than 7 players from the same team (CSK)'))).toBe(true);
  });

  it('rejects squad when Captain or Vice-Captain is missing or invalid', () => {
    // Missing captain
    const missingCap = validateSquad(validSquad, undefined, 'p-bowl1');
    expect(missingCap.valid).toBe(false);
    expect(missingCap.errors.some(e => e.includes('Captain must be designated'))).toBe(true);

    // Captain not in squad
    const outsiderCap = validateSquad(validSquad, 'random-outsider-id', 'p-bowl1');
    expect(outsiderCap.valid).toBe(false);
    expect(outsiderCap.errors.some(e => e.includes('not in the squad'))).toBe(true);

    // Same player as Captain and Vice-Captain
    const sameCap = validateSquad(validSquad, 'p-bat1', 'p-bat1');
    expect(sameCap.valid).toBe(false);
    expect(sameCap.errors.some(e => e.includes('must be different players'))).toBe(true);
  });

  it('supports partial validation during live squad building (allowPartial: true)', () => {
    // Only 4 players picked so far, no captain designated yet
    const partialSquad = validSquad.slice(0, 4);
    const result = validateSquad(partialSquad, undefined, undefined, { allowPartial: true });

    expect(result.valid).toBe(true);
    expect(result.playerCount).toBe(4);
    expect(result.errors).toHaveLength(0);
  });
});
