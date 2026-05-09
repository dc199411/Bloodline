import type { Plugin } from './index';
import type { PluginManifest, PluginResult } from '@bloodline/shared';
import { RiskLevel } from '@bloodline/shared';

export class WebBrowsingPlugin implements Plugin {
  id = 'web-browsing-v2';
  manifest: PluginManifest = {
    id: 'web-browsing-v2',
    name: 'Web Browsing',
    version: '2.0.0',
    description: 'Fetch URLs, search, and extract text from web pages',
    riskLevel: RiskLevel.Low,
    burnRateUSD: 0.005,
    permissions: {
      allowedDomains: ['*'],
      canSpendUSDC: false,
      maxUSDCPerCall: '0',
      canAccessFilesystem: false,
    },
  };

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' || host.endsWith('.local') || host.startsWith('169.254.') || host.startsWith('10.') || host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      throw new Error('Access to private/internal addresses is forbidden');
    }
  }

  async execute(action: string, params: Record<string, unknown>): Promise<PluginResult> {
    const start = Date.now();
    const FETCH_TIMEOUT = 15_000;

    try {
      if (action === 'fetch') {
        const url = params.url as string;
        if (!url) {
          return { success: false, data: null, error: 'Missing url', executionMs: Date.now() - start };
        }
        this.validateUrl(url);
        const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        const text = await res.text();
        return {
          success: true,
          data: { status: res.status, body: text.slice(0, 50000) },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      if (action === 'search') {
        const query = params.query as string;
        if (!query) {
          return { success: false, data: null, error: 'Missing query', executionMs: Date.now() - start };
        }
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        const text = await res.text();
        return {
          success: true,
          data: { html: text.slice(0, 50000) },
          error: null,
          executionMs: Date.now() - start,
        };
      }

      if (action === 'extractText') {
        const url = params.url as string;
        if (!url) {
          return { success: false, data: null, error: 'Missing url', executionMs: Date.now() - start };
        }
        this.validateUrl(url);
        const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
        const html = await res.text();
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return {
          success: true,
          data: { text: text.slice(0, 50000) },
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
