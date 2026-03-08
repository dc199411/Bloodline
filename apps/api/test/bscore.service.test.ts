import {
  calculateBScore,
  BSCORE_WEIGHTS,
  LINEAGE_DEPTH_BONUS,
} from '@bloodline/shared';

jest.mock('../src/lib/prisma', () => ({}));

describe('bscore.service (calculateBScore from shared)', () => {
  const baseStats = {
    taskScore: 100,
    profitScore: 80,
    accuracyScore: 90,
    arenaWinScore: 70,
    uptimeScore: 60,
    communityScore: 50,
  };

  describe('calculateBScore formula', () => {
    it('computes composite with known inputs', () => {
      const composite = calculateBScore(baseStats, 0);
      const weightedSum =
        baseStats.taskScore * BSCORE_WEIGHTS.taskScore +
        baseStats.profitScore * BSCORE_WEIGHTS.profitScore +
        baseStats.accuracyScore * BSCORE_WEIGHTS.accuracyScore +
        baseStats.arenaWinScore * BSCORE_WEIGHTS.arenaWinScore +
        baseStats.uptimeScore * BSCORE_WEIGHTS.uptimeScore +
        baseStats.communityScore * BSCORE_WEIGHTS.communityScore;
      expect(composite).toBeCloseTo(weightedSum, 2);
    });

    it('applies lineage depth multiplier (1.0 + 0.02 * depth)', () => {
      const depth = 5;
      const compositeDepth0 = calculateBScore(baseStats, 0);
      const compositeDepth5 = calculateBScore(baseStats, depth);
      const expectedMultiplier = 1.0 + LINEAGE_DEPTH_BONUS * depth;
      expect(expectedMultiplier).toBe(1.1);
      expect(compositeDepth5).toBeCloseTo(compositeDepth0 * expectedMultiplier, 2);
    });
  });

  describe('BSCORE_WEIGHTS', () => {
    it('has correct weight values', () => {
      expect(BSCORE_WEIGHTS.taskScore).toBe(0.3);
      expect(BSCORE_WEIGHTS.profitScore).toBe(0.2);
      expect(BSCORE_WEIGHTS.accuracyScore).toBe(0.2);
      expect(BSCORE_WEIGHTS.arenaWinScore).toBe(0.15);
      expect(BSCORE_WEIGHTS.uptimeScore).toBe(0.1);
      expect(BSCORE_WEIGHTS.communityScore).toBe(0.05);
    });

    it('weights sum to 1.0', () => {
      const sum =
        BSCORE_WEIGHTS.taskScore +
        BSCORE_WEIGHTS.profitScore +
        BSCORE_WEIGHTS.accuracyScore +
        BSCORE_WEIGHTS.arenaWinScore +
        BSCORE_WEIGHTS.uptimeScore +
        BSCORE_WEIGHTS.communityScore;
      expect(sum).toBe(1.0);
    });
  });

  describe('edge cases', () => {
    const zeroStats = {
      taskScore: 0,
      profitScore: 0,
      accuracyScore: 0,
      arenaWinScore: 0,
      uptimeScore: 0,
      communityScore: 0,
    };

    const maxStats = {
      taskScore: 100,
      profitScore: 100,
      accuracyScore: 100,
      arenaWinScore: 100,
      uptimeScore: 100,
      communityScore: 100,
    };

    it('returns 0 for all zeros', () => {
      const composite = calculateBScore(zeroStats, 0);
      expect(composite).toBe(0);
    });

    it('returns max weighted sum for all max values with depth 0', () => {
      const composite = calculateBScore(maxStats, 0);
      const expected =
        100 * 0.3 +
        100 * 0.2 +
        100 * 0.2 +
        100 * 0.15 +
        100 * 0.1 +
        100 * 0.05;
      expect(composite).toBeCloseTo(expected, 2);
      expect(composite).toBe(100);
    });

    it('all max values with lineage depth 10', () => {
      const composite = calculateBScore(maxStats, 10);
      const multiplier = 1.0 + 0.02 * 10;
      expect(composite).toBeCloseTo(100 * multiplier, 2);
      expect(composite).toBe(120);
    });
  });
});
