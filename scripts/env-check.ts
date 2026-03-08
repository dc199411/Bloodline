#!/usr/bin/env node
/**
 * Validates that all REQUIRED environment variables are set.
 * Run: pnpm run env:check
 */
import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_VARS = [
  'BASE_RPC_URL',
  'CHAIN_ID',
  'DATABASE_URL',
  'REDIS_URL',
  'API_PORT',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const REQUIRED_FOR_DEPLOY = [
  'DEPLOYER_PRIVATE_KEY',
  'CHAINLINK_VRF_COORDINATOR',
  'CHAINLINK_VRF_KEY_HASH',
  'CHAINLINK_VRF_SUBSCRIPTION_ID',
  'USDC_ADDRESS',
];

const REQUIRED_FOR_SOCIAL = [
  'FARCASTER_HUB_URL',
  'FARCASTER_SIGNER_UUID',
];

function loadEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return vars;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  BLOODLINE ENV CHECK                                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const root = path.resolve(__dirname, '..');
  const envLocal = loadEnvFile(path.join(root, '.env.local'));
  const envFile = loadEnvFile(path.join(root, '.env'));
  const merged = { ...envFile, ...envLocal };

  for (const [k, v] of Object.entries(process.env)) {
    if (v) merged[k] = v;
  }

  let errors = 0;
  let warnings = 0;

  console.log('── REQUIRED (core) ─────────────────────────────────\n');
  for (const v of REQUIRED_VARS) {
    if (merged[v] && merged[v] !== '') {
      console.log(`  ✓ ${v}`);
    } else {
      console.log(`  ✗ ${v} — MISSING`);
      errors++;
    }
  }

  console.log('\n── REQUIRED (contract deploy) ──────────────────────\n');
  for (const v of REQUIRED_FOR_DEPLOY) {
    if (merged[v] && merged[v] !== '') {
      console.log(`  ✓ ${v}`);
    } else {
      console.log(`  ○ ${v} — not set (required for deploy only)`);
      warnings++;
    }
  }

  console.log('\n── REQUIRED (social) ──────────────────────────────\n');
  for (const v of REQUIRED_FOR_SOCIAL) {
    if (merged[v] && merged[v] !== '') {
      console.log(`  ✓ ${v}`);
    } else {
      console.log(`  ○ ${v} — not set (required for social features)`);
      warnings++;
    }
  }

  console.log('\n── LLM (at least one required) ────────────────────\n');
  const llmKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OLLAMA_BASE_URL'];
  const hasLLM = llmKeys.some(k => merged[k] && merged[k] !== '');
  for (const v of llmKeys) {
    if (merged[v] && merged[v] !== '') {
      console.log(`  ✓ ${v}`);
    } else {
      console.log(`  ○ ${v}`);
    }
  }
  if (!hasLLM) {
    console.log('  ✗ At least one LLM API key is required');
    errors++;
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Status:   ${errors === 0 ? '✓ PASS' : '✗ FAIL'}\n`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
