import type { PluginManifest, PluginResult } from '@bloodline/shared';

export interface Plugin {
  id: string;
  manifest: PluginManifest;
  init?(): Promise<void>;
  execute(action: string, params: Record<string, unknown>): Promise<PluginResult>;
}

export class PluginManager {
  private plugins = new Map<string, Plugin>();

  async loadPlugin(pluginId: string): Promise<Plugin | null> {
    if (this.plugins.has(pluginId)) {
      return this.plugins.get(pluginId) ?? null;
    }

    let plugin: Plugin | null = null;
    if (pluginId === 'web-browsing-v2' || pluginId === 'web-browsing') {
      const { WebBrowsingPlugin } = await import('./web-browsing');
      plugin = new WebBrowsingPlugin();
    } else if (pluginId === 'price-feed-v1' || pluginId === 'price-feed') {
      const { PriceFeedPlugin } = await import('./price-feed');
      plugin = new PriceFeedPlugin();
    } else if (pluginId === 'code-exec-v1' || pluginId === 'code-exec') {
      const { CodeExecPlugin } = await import('./code-exec');
      plugin = new CodeExecPlugin();
    } else if (pluginId === 'database-v1' || pluginId === 'database') {
      const db = await import('./database');
      plugin = { id: 'database-v1', manifest: db.manifest, execute: db.execute };
    } else if (pluginId === 'social-v1' || pluginId === 'social') {
      const social = await import('./social');
      plugin = { id: 'social-v1', manifest: social.manifest, execute: social.execute };
    } else if (pluginId === 'dex-trading-v1' || pluginId === 'dex-trading') {
      const dex = await import('./dex-trading');
      plugin = { id: 'dex-trading-v1', manifest: dex.manifest, execute: dex.execute };
    }

    if (plugin) {
      if (plugin.init) await plugin.init();
      this.plugins.set(pluginId, plugin);
    }

    return plugin;
  }

  async executePlugin(
    pluginId: string,
    action: string,
    params: Record<string, unknown>,
  ): Promise<PluginResult> {
    const plugin = await this.loadPlugin(pluginId);
    if (!plugin) {
      return {
        success: false,
        data: null,
        error: `Plugin not found: ${pluginId}`,
        executionMs: 0,
      };
    }

    const start = Date.now();
    try {
      const result = await plugin.execute(action, params);
      return {
        ...result,
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
