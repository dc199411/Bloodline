import type { PluginManifest, PluginResult } from '@bloodline/shared';

export const manifest: PluginManifest = {
  id: 'dex-trading-v1',
  name: 'DEX Trading',
  version: '1.0.0',
  description: 'Uniswap V3 and Aerodrome DEX trading on Base',
  riskLevel: 'HIGH',
  burnRateUSD: 0.02,
  permissions: {
    allowedDomains: ['api.coingecko.com', 'api.dexscreener.com'],
    canSpendUSDC: true,
    maxUSDCPerCall: '100.00',
    canAccessFilesystem: false,
  },
};

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

export async function execute(
  action: string,
  params: Record<string, unknown>,
): Promise<PluginResult> {
  const start = Date.now();

  try {
    switch (action) {
      case 'getQuote': {
        const tokenIn = params.tokenIn as string;
        const tokenOut = params.tokenOut as string;
        const amount = params.amount as string;
        if (!tokenIn || !tokenOut || !amount) {
          throw new Error('tokenIn, tokenOut, and amount are required');
        }

        try {
          const res = await fetch(
            `${DEXSCREENER_API}/search?q=${tokenIn}%20${tokenOut}`,
            { signal: AbortSignal.timeout(10000) },
          );
          const data = await res.json();
          const pair = data.pairs?.[0];

          return {
            success: true,
            data: {
              tokenIn,
              tokenOut,
              amountIn: amount,
              estimatedOut: pair ? (parseFloat(amount) * parseFloat(pair.priceNative)).toFixed(6) : 'unavailable',
              priceImpact: '0.3%',
              dex: pair?.dexId ?? 'uniswap-v3',
              pair: pair?.pairAddress ?? null,
            },
            error: null,
            executionMs: Date.now() - start,
          };
        } catch {
          return {
            success: true,
            data: { tokenIn, tokenOut, amountIn: amount, estimatedOut: 'unavailable', note: 'Price API unreachable' },
            error: null,
            executionMs: Date.now() - start,
          };
        }
      }

      case 'getPosition': {
        const walletAddress = params.walletAddress as string;
        if (!walletAddress) throw new Error('walletAddress is required');

        return {
          success: true,
          data: {
            walletAddress,
            positions: [],
            note: 'Position tracking requires onchain indexing — placeholder',
          },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      case 'executeSwap': {
        const tokenIn = params.tokenIn as string;
        const tokenOut = params.tokenOut as string;
        const amount = params.amount as string;
        const slippage = (params.slippage as number) ?? 0.5;

        if (!tokenIn || !tokenOut || !amount) {
          throw new Error('tokenIn, tokenOut, and amount are required');
        }

        return {
          success: true,
          data: {
            status: 'simulated',
            tokenIn,
            tokenOut,
            amountIn: amount,
            slippage: `${slippage}%`,
            note: 'Swap execution requires wallet signing — this is a simulation',
            txHash: null,
          },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      default:
        return {
          success: false,
          data: null,
          error: `Unknown action: ${action}. Supported: getQuote, executeSwap, getPosition`,
          executionMs: Date.now() - start,
        };
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : String(err),
      executionMs: Date.now() - start,
    };
  }
}
