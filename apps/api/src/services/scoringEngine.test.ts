import { describe, it, expect } from 'vitest';
import { calculateFantasyPoints, calculateDetailedFantasyPoints, PerformanceStats } from './scoringEngine';

describe('Fantasy Points Scoring Engine (PRD §8.2)', () => {
  describe('Batting Rules', () => {
    it('calculates pure run points and boundary bonuses', () => {
      // 30 runs off 20 balls with 3 fours and 1 six
      // Runs: 30
      // Fours: 3 * 4 = 12
      // Sixes: 1 * 8 = 8
      // Strike rate = 150 (not > 150, exactly in 130-150 bracket -> +2)
      // Total = 30 + 12 + 8 + 2 = 52
      const perf: PerformanceStats = {
        runs: 30,
        ballsFaced: 20,
        fours: 3,
        sixes: 1,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      const points = calculateFantasyPoints(perf);
      expect(points).toBe(52);
    });

    it('awards half-century bonus (+8) for runs between 50 and 99', () => {
      // 55 runs off 35 balls with 5 fours and 2 sixes
      // Runs: 55
      // Fours: 5 * 4 = 20
      // Sixes: 2 * 8 = 16
      // Half-century bonus: +8
      // Strike rate = 157.14 -> +4
      // Total = 55 + 20 + 16 + 8 + 4 = 103
      const perf: PerformanceStats = {
        runs: 55,
        ballsFaced: 35,
        fours: 5,
        sixes: 2,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      const breakdown = calculateDetailedFantasyPoints(perf);
      expect(breakdown.battingPoints).toBe(103);
      expect(breakdown.notes).toContain('Half-century Bonus: +8');
    });

    it('awards century bonus (+16) instead of half-century bonus for 100+ runs', () => {
      // 102 runs off 55 balls with 10 fours and 4 sixes
      // Runs: 102
      // Fours: 40
      // Sixes: 32
      // Century bonus: +16
      // Strike rate = 185.45 (>170) -> +6
      // Total = 102 + 40 + 32 + 16 + 6 = 196
      const perf: PerformanceStats = {
        runs: 102,
        ballsFaced: 55,
        fours: 10,
        sixes: 4,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      const breakdown = calculateDetailedFantasyPoints(perf);
      expect(breakdown.battingPoints).toBe(196);
      expect(breakdown.notes).toContain('Century Bonus: +16');
      expect(breakdown.notes).not.toContain('Half-century Bonus: +8');
    });

    it('penalizes duck (-2) for batsmen/all-rounders dismissed on 0', () => {
      const batDuck: PerformanceStats = {
        runs: 0,
        ballsFaced: 3,
        fours: 0,
        sixes: 0,
        playerRole: 'BAT',
        isDismissed: true,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      expect(calculateFantasyPoints(batDuck)).toBe(-2);
    });

    it('does NOT penalize duck for specialist bowlers dismissed on 0', () => {
      const bowlDuck: PerformanceStats = {
        runs: 0,
        ballsFaced: 3,
        fours: 0,
        sixes: 0,
        playerRole: 'BOWL',
        isDismissed: true,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      expect(calculateFantasyPoints(bowlDuck)).toBe(0);
    });

    it('applies strike rate penalties for slow scoring over 10+ balls', () => {
      // 4 runs off 12 balls (SR = 33.33% < 50) -> penalty -6
      // Runs: 4 - 6 = -2
      const slowPerf: PerformanceStats = {
        runs: 4,
        ballsFaced: 12,
        fours: 0,
        sixes: 0,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0
      };

      expect(calculateFantasyPoints(slowPerf)).toBe(-2);
    });
  });

  describe('Bowling Rules', () => {
    it('calculates wicket points (+25 per wicket)', () => {
      // 2 wickets, 4 overs, 32 runs conceded (economy = 8.0, no bonus/penalty)
      // Wickets: 2 * 25 = 50
      const perf: PerformanceStats = {
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        wickets: 2,
        oversBowled: 4,
        runsConceded: 32
      };

      expect(calculateFantasyPoints(perf)).toBe(50);
    });

    it('awards 3-wicket, 4-wicket, and 5-wicket haul bonuses accurately', () => {
      const haul3: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 3, oversBowled: 4, runsConceded: 30
      };
      // 3 * 25 = 75 + haul 8 + economy (7.5 rpo -> 0) = 83
      expect(calculateFantasyPoints(haul3)).toBe(83);

      const haul4: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 4, oversBowled: 4, runsConceded: 30
      };
      // 4 * 25 = 100 + haul 12 = 112
      expect(calculateFantasyPoints(haul4)).toBe(112);

      const haul5: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 5, oversBowled: 4, runsConceded: 30
      };
      // 5 * 25 = 125 + haul 16 = 141
      expect(calculateFantasyPoints(haul5)).toBe(141);
    });

    it('awards maiden overs (+12 per maiden)', () => {
      const perf: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 1, oversBowled: 4, runsConceded: 20, maidens: 1
      };
      // Wicket: 25
      // Maiden: 12
      // Economy: 20/4 = 5.0 (5-6 range -> +4)
      // Total = 25 + 12 + 4 = 41
      expect(calculateFantasyPoints(perf)).toBe(41);
    });

    it('applies economy rate tiers (min 2.0 overs)', () => {
      // Economy < 5 -> +6
      const econGood: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 0, oversBowled: 3, runsConceded: 12
      }; // 4.0 rpo -> +6
      expect(calculateFantasyPoints(econGood)).toBe(6);

      // Economy > 12 -> -6
      const econBad: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 0, oversBowled: 2, runsConceded: 28
      }; // 14.0 rpo -> -6
      expect(calculateFantasyPoints(econBad)).toBe(-6);
    });
  });

  describe('Fielding Rules', () => {
    it('awards points for catches, 3-catch bonus, stumpings, and run-outs', () => {
      const fieldingHero: PerformanceStats = {
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
        wickets: 0, oversBowled: 0, runsConceded: 0,
        catches: 3, // 3 * 8 = 24 + 4 bonus = 28
        stumpings: 1, // 12
        runOutsDirect: 1 // 12
      };
      // Total = 28 + 12 + 12 = 52
      expect(calculateFantasyPoints(fieldingHero)).toBe(52);
    });
  });

  describe('Captain & Vice-Captain Multipliers', () => {
    const basePerformance: PerformanceStats = {
      runs: 40,
      ballsFaced: 25,
      fours: 4,
      sixes: 1,
      wickets: 1,
      oversBowled: 2,
      runsConceded: 16
    };
    // Batting: 40 + 16 (fours) + 8 (sixes) + 4 (SR 160) = 68
    // Bowling: 25 (wkt) + 0 (econ 8.0) = 25
    // Base total = 93

    it('applies 2x multiplier for Captain', () => {
      const normal = calculateFantasyPoints(basePerformance);
      const captain = calculateFantasyPoints(basePerformance, { isCaptain: true });

      expect(normal).toBe(93);
      expect(captain).toBe(186); // 93 * 2
    });

    it('applies 1.5x multiplier for Vice-Captain', () => {
      const vc = calculateFantasyPoints(basePerformance, { isViceCaptain: true });
      expect(vc).toBe(139.5); // 93 * 1.5
    });
  });
});
