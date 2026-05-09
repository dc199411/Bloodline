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

  private isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
      if (hostname === '0.0.0.0' || hostname.endsWith('.local')) return false;
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
      if (hostname === 'metadata.google.internal') return false;
      return true;
    } catch {
      return false;
    }
  }

  async execute(action: string, params: Record<string, unknown>): Promise<PluginResult> {
    const start = Date.now();

    try {
      if (action === 'fetch') {
        const url = params.url as string;
        if (!url) {
          return { success: false, data: null, error: 'Missing url', executionMs: Date.now() - start };
        }
        if (!this.isAllowedUrl(url)) {
          return { success: false, data: null, error: 'URL not allowed: private/internal addresses are blocked', executionMs: Date.now() - start };
        }
        const res = await fetch(url);
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
        const res = await fetch(url);
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
        if (!this.isAllowedUrl(url)) {
          return { success: false, data: null, error: 'URL not allowed: private/internal addresses are blocked', executionMs: Date.now() - start };
        }
        const res = await fetch(url);
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
