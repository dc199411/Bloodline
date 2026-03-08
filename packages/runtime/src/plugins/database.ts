import type { PluginManifest, PluginResult } from '@bloodline/shared';

export const manifest: PluginManifest = {
  id: 'database-v1',
  name: 'Database',
  version: '1.0.0',
  description: 'Scoped key-value and SQL query access for agent data storage',
  riskLevel: 'MEDIUM',
  burnRateUSD: 0.002,
  permissions: {
    allowedDomains: [],
    canSpendUSDC: false,
    maxUSDCPerCall: '0',
    canAccessFilesystem: false,
  },
};

const agentStores = new Map<string, Map<string, unknown>>();

function getStore(agentId: string): Map<string, unknown> {
  if (!agentStores.has(agentId)) {
    agentStores.set(agentId, new Map());
  }
  return agentStores.get(agentId)!;
}

export async function execute(
  action: string,
  params: Record<string, unknown>,
): Promise<PluginResult> {
  const start = Date.now();
  const agentId = (params.agentId as string) ?? 'default';

  try {
    switch (action) {
      case 'get': {
        const key = params.key as string;
        if (!key) throw new Error('key is required');
        const store = getStore(agentId);
        return {
          success: true,
          data: { key, value: store.get(key) ?? null },
          error: null,
          executionMs: Date.now() - start,
        };
      }
      case 'set': {
        const key = params.key as string;
        if (!key) throw new Error('key is required');
        const store = getStore(agentId);
        store.set(key, params.value);
        return {
          success: true,
          data: { key, stored: true },
          error: null,
          executionMs: Date.now() - start,
        };
      }
      case 'delete': {
        const key = params.key as string;
        if (!key) throw new Error('key is required');
        const store = getStore(agentId);
        const existed = store.delete(key);
        return {
          success: true,
          data: { key, deleted: existed },
          error: null,
          executionMs: Date.now() - start,
        };
      }
      case 'list': {
        const store = getStore(agentId);
        return {
          success: true,
          data: { keys: Array.from(store.keys()) },
          error: null,
          executionMs: Date.now() - start,
        };
      }
      default:
        return {
          success: false,
          data: null,
          error: `Unknown action: ${action}. Supported: get, set, delete, list`,
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
