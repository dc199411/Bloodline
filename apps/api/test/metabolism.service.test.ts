import { calculateAgentBurnRate } from '../src/services/metabolism.service';
import {
  BASE_BURN_RATE_MICRO,
  MIN_BURN_RATE_USDC,
  USDC_DECIMALS,
} from '@bloodline/shared';

jest.mock('../src/lib/prisma', () => ({}));
jest.mock('../src/lib/redis', () => ({}));
jest.mock('../src/lib/queue', () => ({}));
jest.mock('../src/lib/ws', () => ({ getIO: () => null }));

describe('metabolism.service', () => {
  describe('calculateAgentBurnRate / calculateBurnRate', () => {
    it('returns correct burn rate for frugality 0 (max burn)', () => {
      const rate = calculateAgentBurnRate(0);
      const expected =
        (BASE_BURN_RATE_MICRO * (256 - 0)) / 128 / Math.pow(10, USDC_DECIMALS);
      expect(rate).toBe(expected);
      expect(rate).toBe(0.02);
    });

    it('returns correct burn rate for frugality 127', () => {
      const rate = calculateAgentBurnRate(127);
      const expected =
        (BASE_BURN_RATE_MICRO * (256 - 127)) / 128 / Math.pow(10, USDC_DECIMALS);
      expect(rate).toBeCloseTo(expected, 10);
      expect(rate).toBeCloseTo(0.010078125, 6);
    });

    it('returns correct burn rate for frugality 255 (min burn, clamped to minimum)', () => {
      const rate = calculateAgentBurnRate(255);
      const rawRate =
        (BASE_BURN_RATE_MICRO * (256 - 255)) / 128 / Math.pow(10, USDC_DECIMALS);
      expect(rawRate).toBeLessThan(MIN_BURN_RATE_USDC);
      expect(rate).toBeGreaterThanOrEqual(MIN_BURN_RATE_USDC);
    });

    it('burn rate is always positive for all frugality values 0-255', () => {
      for (let frugality = 0; frugality <= 255; frugality++) {
        const rate = calculateAgentBurnRate(frugality);
        expect(rate).toBeGreaterThan(0);
      }
    });

    it('follows formula: baseMicro * (256 - frugality) / 128 / 1_000_000', () => {
      const frugality = 100;
      const expected =
        (BASE_BURN_RATE_MICRO * (256 - frugality)) / 128 / 1_000_000;
      const actual = calculateAgentBurnRate(frugality);
      expect(actual).toBeCloseTo(expected, 10);
    });

    it('enforces minimum burn rate of 0.001', () => {
      const rate = calculateAgentBurnRate(255);
      expect(rate).toBeGreaterThanOrEqual(MIN_BURN_RATE_USDC);
    });
  });
});
