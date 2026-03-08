import type { Plugin } from './index';
import type { PluginManifest, PluginResult } from '@bloodline/shared';
import { RiskLevel } from '@bloodline/shared';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export class PriceFeedPlugin implements Plugin {
  id = 'price-feed-v1';
  manifest: PluginManifest = {
    id: 'price-feed-v1',
    name: 'Price Feed',
    version: '1.0.0',
    description: 'Get token prices and OHLC data via CoinGecko',
    riskLevel: RiskLevel.Low,
    burnRateUSD: 0.001,
    permissions: {
      allowedDomains: ['api.coingecko.com'],
      canSpendUSDC: false,
      maxUSDCPerCall: '0',
      canAccessFilesystem: false,
    },
  };

  private tokenIdMap: Record<string, string> = {
    usdc: 'usd-coin',
    usdt: 'tether',
    eth: 'ethereum',
    weth: 'weth',
    base: 'base-protocol',
  };

  private resolveTokenId(token: string): string {
    const lower = token.toLowerCase();
    return this.tokenIdMap[lower] ?? lower;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<PluginResult> {
    const start = Date.now();

    try {
      if (action === 'getPrice') {
        const token = params.token as string;
        if (!token) {
          return { success: false, data: null, error: 'Missing token', executionMs: Date.now() - start };
        }
        const id = this.resolveTokenId(token);
        const res = await fetch(
          `${COINGECKO_BASE}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
        );
        const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
        const data = json[id];
        if (!data) {
          return {
            success: false,
            data: null,
            error: `Token not found: ${token}`,
            executionMs: Date.now() - start,
          };
        }
        return {
          success: true,
          data: { price: data.usd ?? 0, change24h: data.usd_24h_change ?? 0 },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      if (action === 'getOHLC') {
        const token = params.token as string;
        const timeframe = (params.timeframe as string) ?? '1';
        if (!token) {
          return { success: false, data: null, error: 'Missing token', executionMs: Date.now() - start };
        }
        const id = this.resolveTokenId(token);
        const days = timeframe === '1' ? 1 : timeframe === '7' ? 7 : 30;
        const res = await fetch(
          `${COINGECKO_BASE}/coins/${id}/ohlc?vs_currency=usd&days=${days}`,
        );
        const ohlc = (await res.json()) as [number, number, number, number, number][];
        return {
          success: true,
          data: { ohlc: ohlc ?? [] },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      return {
        success: false,
        data: null,
        error: `Unknown action: ${action}`,
        executionMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
        executionMs: Date.now() - start,
      };
    }
  }
}
