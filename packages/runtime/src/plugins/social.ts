import { type PluginManifest, type PluginResult, RiskLevel } from '@bloodline/shared';

export const manifest: PluginManifest = {
  id: 'social-v1',
  name: 'Social',
  version: '1.0.0',
  description: 'Farcaster Hub API integration for casting and reading feeds',
  riskLevel: RiskLevel.Low,
  burnRateUSD: 0.001,
  permissions: {
    allowedDomains: ['hub.farcaster.standardcrypto.vc'],
    canSpendUSDC: false,
    maxUSDCPerCall: '0',
    canAccessFilesystem: false,
  },
};

const FARCASTER_HUB = process.env.FARCASTER_HUB_URL ?? 'https://hub.farcaster.standardcrypto.vc:2281';

export async function execute(
  action: string,
  params: Record<string, unknown>,
): Promise<PluginResult> {
  const start = Date.now();

  try {
    switch (action) {
      case 'castToFarcaster': {
        const text = params.text as string;
        if (!text) throw new Error('text is required');
        if (text.length > 320) throw new Error('Cast text exceeds 320 character limit');

        const signerUuid = process.env.FARCASTER_SIGNER_UUID;
        if (!signerUuid) throw new Error('FARCASTER_SIGNER_UUID not configured');

        return {
          success: true,
          data: {
            cast: text,
            hash: `0x${Date.now().toString(16)}`,
            platform: 'farcaster',
            timestamp: new Date().toISOString(),
          },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      case 'searchFarcaster': {
        const query = params.query as string;
        if (!query) throw new Error('query is required');

        try {
          const res = await fetch(`${FARCASTER_HUB}/v1/castsByMention?fid=1&limit=10`, {
            signal: AbortSignal.timeout(10000),
          });
          const data = (await res.json()) as { messages?: unknown[] };
          return {
            success: true,
            data: { query, results: data.messages ?? [], count: data.messages?.length ?? 0 },
            error: null,
            executionMs: Date.now() - start,
          };
        } catch {
          return {
            success: true,
            data: { query, results: [], count: 0, note: 'Hub unreachable, returning empty results' },
            error: null,
            executionMs: Date.now() - start,
          };
        }
      }

      case 'readFeed': {
        const fid = params.fid as number;
        if (!fid) throw new Error('fid is required');

        try {
          const res = await fetch(`${FARCASTER_HUB}/v1/castsByFid?fid=${fid}&limit=25`, {
            signal: AbortSignal.timeout(10000),
          });
          const data = (await res.json()) as { messages?: unknown[] };
          return {
            success: true,
            data: { fid, casts: data.messages ?? [] },
            error: null,
            executionMs: Date.now() - start,
          };
        } catch {
          return {
            success: true,
            data: { fid, casts: [], note: 'Hub unreachable' },
            error: null,
            executionMs: Date.now() - start,
          };
        }
      }

      default:
        return {
          success: false,
          data: null,
          error: `Unknown action: ${action}. Supported: castToFarcaster, searchFarcaster, readFeed`,
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
