import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import type { Plugin } from './index';
import type { PluginManifest, PluginResult } from '@bloodline/shared';
import { RiskLevel } from '@bloodline/shared';

const TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 512_000;

export class CodeExecPlugin implements Plugin {
  id = 'code-exec-v1';
  manifest: PluginManifest = {
    id: 'code-exec-v1',
    name: 'Code Execution',
    version: '1.0.0',
    description: 'Run JavaScript code in a sandboxed environment',
    riskLevel: RiskLevel.Medium,
    burnRateUSD: 0.01,
    permissions: {
      allowedDomains: [],
      canSpendUSDC: false,
      maxUSDCPerCall: '0',
      canAccessFilesystem: true,
    },
  };

  async execute(action: string, params: Record<string, unknown>): Promise<PluginResult> {
    const start = Date.now();

    if (action !== 'runJS') {
      return {
        success: false,
        data: null,
        error: `Unknown action: ${action}`,
        executionMs: Date.now() - start,
      };
    }

    const code = params.code as string;
    if (!code || typeof code !== 'string') {
      return {
        success: false,
        data: null,
        error: 'Missing code',
        executionMs: Date.now() - start,
      };
    }

    const tmpFile = join(tmpdir(), `bloodline-exec-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);

    try {
      writeFileSync(tmpFile, code);

      const result = await new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
        const proc = spawn('node', [tmpFile], {
          timeout: TIMEOUT_MS,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        proc.stdout?.on('data', (d) => { if (stdout.length < MAX_OUTPUT_BYTES) stdout += d.toString(); });
        proc.stderr?.on('data', (d) => { if (stderr.length < MAX_OUTPUT_BYTES) stderr += d.toString(); });

        proc.on('close', (code) => resolve({ stdout, stderr, code }));
        proc.on('error', (err) => {
          stderr += err.message;
          resolve({ stdout, stderr, code: 1 });
        });
      });

      if (existsSync(tmpFile)) unlinkSync(tmpFile);

      return {
        success: result.code === 0,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code,
        },
        error: result.code !== 0 ? result.stderr || `Exit code ${result.code}` : null,
        executionMs: Date.now() - start,
      };
    } catch (err) {
      if (existsSync(tmpFile)) try { unlinkSync(tmpFile); } catch (_) {}
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
        executionMs: Date.now() - start,
      };
    }
  }
}
