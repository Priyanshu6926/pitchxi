import { describe, it, expect } from 'vitest';
import { calculatePlayerFormScore, calculatePlayerCredits, PlayerStatsForValuation } from './creditCalculator';

describe('Credit Valuation Engine (PRD §8.1)', () => {
  const samplePlayers: PlayerStatsForValuation[] = [
    {
      id: 'virat-kohli',
      name: 'Virat Kohli',
      role: 'BAT',
      recentPoints: [85, 92, 110, 65, 78],
      careerAveragePoints: 75
    },
    {
      id: 'jasprit-bumrah',
      name: 'Jasprit Bumrah',
      role: 'BOWL',
      recentPoints: [75, 105, 60, 95, 80],
      careerAveragePoints: 70
    },
    {
      id: 'andre-russell',
      name: 'Andre Russell',
      role: 'ALL',
      recentPoints: [90, 45, 120, 80, 60],
      careerAveragePoints: 68
    },
    {
      id: 'young-talent',
      name: 'Young Debutant',
      role: 'BAT',
      recentPoints: [10, 15, 20],
      careerAveragePoints: 15
    }
  ];

  it('calculates weighted form scores giving precedence to recent form and role scarcity', () => {
    const kohliScore = calculatePlayerFormScore(samplePlayers[0]);
    const youngScore = calculatePlayerFormScore(samplePlayers[3]);

    expect(kohliScore).toBeGreaterThan(youngScore);
    expect(kohliScore).toBeGreaterThan(60);
  });

  it('normalizes credits strictly within [6.0, 11.0] in 0.5 increments', () => {
    const results = calculatePlayerCredits(samplePlayers);

    expect(results).toHaveLength(4);

    results.forEach(res => {
      expect(res.creditValue).toBeGreaterThanOrEqual(6.0);
      expect(res.creditValue).toBeLessThanOrEqual(11.0);
      // Verify 0.5 step increment (e.g. 6.0, 6.5, 7.0, etc.)
      expect(res.creditValue * 2 % 1).toBe(0);
    });

    // Highest scorer should be close to 11.0
    const topPerformer = results.find(r => r.playerId === 'virat-kohli');
    expect(topPerformer?.creditValue).toBeGreaterThanOrEqual(10.0);

    // Lowest scorer should be 6.0
    const bottomPerformer = results.find(r => r.playerId === 'young-talent');
    expect(bottomPerformer?.creditValue).toBe(6.0);
  });

  it('handles empty player array gracefully', () => {
    expect(calculatePlayerCredits([])).toEqual([]);
  });

  it('handles identical scores by assigning median credit 8.5', () => {
    const identicalPlayers: PlayerStatsForValuation[] = [
      { id: 'p1', name: 'Player 1', role: 'BAT', recentPoints: [50], careerAveragePoints: 50 },
      { id: 'p2', name: 'Player 2', role: 'BAT', recentPoints: [50], careerAveragePoints: 50 }
    ];
    const results = calculatePlayerCredits(identicalPlayers);
    expect(results[0].creditValue).toBe(8.5);
    expect(results[1].creditValue).toBe(8.5);
  });
});
