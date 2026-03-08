#!/usr/bin/env node
/**
 * Post-deployment verification for Base Mainnet.
 * Checks that all deployed services are reachable and healthy.
 * Run: pnpm run verify:mainnet
 */

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

async function checkAPI(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    return {
      name: 'API Health',
      status: res.ok ? 'pass' : 'fail',
      message: res.ok ? `OK — v${data.version ?? 'unknown'}` : `HTTP ${res.status}`,
      duration: Date.now() - start,
    };
  } catch (e) {
    return { name: 'API Health', status: 'fail', message: (e as Error).message, duration: Date.now() - start };
  }
}

async function checkAgentsEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/agents?limit=1`);
    return {
      name: 'Agents Endpoint',
      status: res.ok ? 'pass' : 'fail',
      message: res.ok ? 'Reachable' : `HTTP ${res.status}`,
      duration: Date.now() - start,
    };
  } catch (e) {
    return { name: 'Agents Endpoint', status: 'fail', message: (e as Error).message, duration: Date.now() - start };
  }
}

async function checkBountiesEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}/bounties?limit=1`);
    return {
      name: 'Bounties Endpoint',
      status: res.ok ? 'pass' : 'fail',
      message: res.ok ? 'Reachable' : `HTTP ${res.status}`,
      duration: Date.now() - start,
    };
  } catch (e) {
    return { name: 'Bounties Endpoint', status: 'fail', message: (e as Error).message, duration: Date.now() - start };
  }
}

async function checkContractAddresses(): Promise<CheckResult> {
  const required = [
    'BLOODLINE_REGISTRY_ADDRESS',
    'METABOLISM_ORACLE_ADDRESS',
    'BOUNTY_BOARD_ADDRESS',
    'ROYALTY_ROUTER_ADDRESS',
    'BSCORE_ADDRESS',
    'BLOODLINE_NFT_ADDRESS',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    return { name: 'Contract Addresses', status: 'fail', message: `Missing: ${missing.join(', ')}` };
  }
  return { name: 'Contract Addresses', status: 'pass', message: 'All addresses configured' };
}

async function checkChainlink(): Promise<CheckResult> {
  const vrfSub = process.env.CHAINLINK_VRF_SUBSCRIPTION_ID;
  const automationId = process.env.CHAINLINK_AUTOMATION_UPKEEP_ID;
  if (!vrfSub || !automationId) {
    return { name: 'Chainlink Config', status: 'fail', message: 'VRF subscription or Automation upkeep ID missing' };
  }
  return { name: 'Chainlink Config', status: 'pass', message: `VRF sub: ${vrfSub}, Upkeep: ${automationId}` };
}

async function checkDatabase(): Promise<CheckResult> {
  if (!process.env.DATABASE_URL) {
    return { name: 'Database', status: 'fail', message: 'DATABASE_URL not set' };
  }
  return { name: 'Database', status: 'pass', message: 'DATABASE_URL configured' };
}

async function checkRedis(): Promise<CheckResult> {
  if (!process.env.REDIS_URL) {
    return { name: 'Redis', status: 'fail', message: 'REDIS_URL not set' };
  }
  return { name: 'Redis', status: 'pass', message: 'REDIS_URL configured' };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  BLOODLINE MAINNET VERIFICATION                     ║');
  console.log(`║  API: ${API_URL.padEnd(44)} ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const checks: CheckResult[] = await Promise.all([
    checkAPI(),
    checkAgentsEndpoint(),
    checkBountiesEndpoint(),
    checkContractAddresses(),
    checkChainlink(),
    checkDatabase(),
    checkRedis(),
  ]);

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'skip' ? '○' : '✗';
    const color = check.status === 'pass' ? '\x1b[32m' : check.status === 'fail' ? '\x1b[31m' : '\x1b[33m';
    const dur = check.duration ? ` (${check.duration}ms)` : '';
    console.log(`  ${color}${icon}\x1b[0m ${check.name.padEnd(24)} ${check.message}${dur}`);
    if (check.status === 'pass') passed++;
    if (check.status === 'fail') failed++;
  }

  console.log(`\n  ─────────────────────────────────────────────────`);
  console.log(`  Passed: ${passed}  Failed: ${failed}  Total: ${checks.length}`);
  console.log(`  Status: ${failed === 0 ? '\x1b[32m✓ ALL CHECKS PASS\x1b[0m' : '\x1b[31m✗ VERIFICATION FAILED\x1b[0m'}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
