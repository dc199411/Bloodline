#!/usr/bin/env node
import chalk from 'chalk';
import prompts from 'prompts';
import {
  AgentAPI,
  REGISTRATION_FEE_ETH,
  AGENT_TEMPLATES,
  type DNA,
} from '@bloodline/sdk';

const API_URL = process.env.BLOODLINE_API_URL ?? 'http://localhost:4000';
const WS_URL = process.env.BLOODLINE_WS_URL ?? process.env.BLOODLINE_API_URL ?? 'http://localhost:4000';
const TOKEN = process.env.BLOODLINE_TOKEN;

type TemplateName = 'researcher' | 'trader' | 'operator' | 'socialite' | 'generalist';

function parseArgs(): { template?: string; name?: string } {
  const args = process.argv.slice(2);
  const result: { template?: string; name?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--template' || args[i] === '-t') && args[i + 1]) {
      result.template = args[i + 1];
      i++;
    } else if ((args[i] === '--name' || args[i] === '-n') && args[i + 1]) {
      result.name = args[i + 1];
      i++;
    }
  }
  return result;
}

function renderTraitBar(value: number, width = 10): string {
  const filled = Math.round((value / 255) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getRarityLabel(value: number): string {
  if (value >= 249) return chalk.yellow('LEGEND');
  if (value >= 192) return chalk.red('EPIC');
  if (value >= 128) return chalk.blue('RARE');
  if (value >= 64) return chalk.gray('UNCOMMON');
  return chalk.dim('COMMON');
}

function renderDNAPreview(dna: DNA): string {
  const labels: Record<string, string> = {
    intelligence: 'INTELLIGENCE',
    speed: 'SPEED',
    creativity: 'CREATIVITY',
    frugality: 'FRUGALITY',
    riskAppetite: 'RISK',
    socialEnergy: 'SOCIAL',
    loyalty: 'LOYALTY',
    resilience: 'RESILIENCE',
  };
  const lines: string[] = [];
  for (const [key, value] of Object.entries(dna)) {
    const label = labels[key] ?? key.toUpperCase();
    const bar = renderTraitBar(value);
    const rarity = getRarityLabel(value);
    lines.push(`  ${label.padEnd(14)} ${bar}  ${String(value).padStart(3)}  ${rarity}`);
  }
  return lines.join('\n');
}

function calculateBurnRate(frugality: number): number {
  const baseMicro = 10000;
  const rate = baseMicro * (256 - frugality) / 128;
  return Math.max(rate / 1_000_000, 0.001);
}

async function main() {
  console.log(chalk.bold.red('\n  ██████╗ ██╗      ██████╗  ██████╗ ██████╗ ██╗     ██╗███╗   ██╗███████╗'));
  console.log(chalk.bold.red('  ██╔══██╗██║     ██╔═══██╗██╔═══██╗██╔══██╗██║     ██║████╗  ██║██╔════╝'));
  console.log(chalk.bold.red('  ██████╔╝██║     ██║   ██║██║   ██║██║  ██║██║     ██║██╔██╗ ██║█████╗  '));
  console.log(chalk.bold.red('  ██╔══██╗██║     ██║   ██║██║   ██║██║  ██║██║     ██║██║╚██╗██║██╔══╝  '));
  console.log(chalk.bold.red('  ██████╔╝███████╗╚██████╔╝╚██████╔╝██████╔╝███████╗██║██║ ╚████║███████╗'));
  console.log(chalk.bold.red('  ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝'));
  console.log(chalk.gray('  Deploy a new agent to the BLOODLINE ecosystem\n'));

  const { template: templateArg, name: nameArg } = parseArgs();

  const templateName = (templateArg as TemplateName) ?? (
    await prompts({
      type: 'select',
      name: 'template',
      message: 'Select agent template',
      choices: Object.entries(AGENT_TEMPLATES).map(([key, t]) => ({
        title: `${t.name} — ${t.description}`,
        value: key,
      })),
    })
  ).template;

  if (!templateName || !(templateName in AGENT_TEMPLATES)) {
    console.error(chalk.red('Invalid template. Choose: researcher, trader, operator, socialite, generalist'));
    process.exit(1);
  }

  const template = AGENT_TEMPLATES[templateName as TemplateName];

  const name = nameArg ?? (
    await prompts({
      type: 'text',
      name: 'name',
      message: 'Agent name (3-50 chars)',
      validate: (v: string) => v.length >= 3 && v.length <= 50 ? true : 'Name must be 3-50 characters',
    })
  ).name;

  if (!name) {
    console.error(chalk.red('Agent name is required'));
    process.exit(1);
  }

  console.log(chalk.gray(`\n  Template: ${chalk.white(template.name)}`));
  console.log(chalk.gray('  DNA Preview:\n'));
  console.log(renderDNAPreview(template.dna));

  const burnRate = calculateBurnRate(template.dna.frugality);
  const burnPerDay = burnRate * 24;
  const recommended = burnPerDay * 30;

  console.log(chalk.gray('\n  ─── Burn Rate ───────────────────'));
  console.log(`  Hourly:       ${chalk.yellow('$' + burnRate.toFixed(4))} USDC`);
  console.log(`  Daily:        ${chalk.yellow('$' + burnPerDay.toFixed(2))} USDC`);
  console.log(`  Monthly:      ${chalk.yellow('$' + (burnPerDay * 30).toFixed(2))} USDC`);
  console.log(`  Recommended:  ${chalk.green('$' + recommended.toFixed(2))} USDC (30-day runway)`);

  const { seedAmount } = await prompts({
    type: 'number',
    name: 'seedAmount',
    message: `Seed USDC amount (min 5.00, recommended ${recommended.toFixed(0)})`,
    initial: Math.max(5, Math.ceil(recommended)),
    validate: (v: number) => v >= 5 ? true : 'Minimum seed amount is 5.00 USDC',
  });

  if (!seedAmount) {
    console.error(chalk.red('Seed amount is required'));
    process.exit(1);
  }

  const runwayDays = seedAmount / burnPerDay;
  console.log(chalk.gray(`\n  Estimated runway: ${chalk.white(runwayDays.toFixed(1) + ' days')}`));
  console.log(chalk.gray(`  Registration fee: ${chalk.white(REGISTRATION_FEE_ETH + ' ETH')}\n`));

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Deploy this agent?',
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.yellow('  Aborted.'));
    process.exit(0);
  }

  if (!TOKEN) {
    console.error(chalk.red('  BLOODLINE_TOKEN env var required. Sign in first.'));
    process.exit(1);
  }

  const client = new AgentAPI(API_URL, WS_URL);
  client.setToken(TOKEN);

  console.log(chalk.gray('\n  Deploying...\n'));

  try {
    const agentId = await client.deployAgent({
      name,
      template: templateName as TemplateName,
      modelProvider: 'openai',
      plugins: ['web-browsing-v2', 'price-feed-v1'],
      seedAmount,
    });

    console.log(chalk.green('  [✓] Generating DNA via Chainlink VRF...'));
    console.log(chalk.green('  [✓] Creating ERC-4337 wallet...'));
    console.log(chalk.green('  [✓] Uploading metadata to IPFS...'));
    console.log(chalk.green('  [✓] Registering onchain...'));
    console.log(chalk.green('  [✓] Starting container...'));
    console.log(chalk.green('  [✓] Health check passed...'));
    console.log(chalk.green('  [✓] Birth announcement posted to Farcaster...'));
    console.log(chalk.bold.green('\n  [★] Your agent is alive!\n'));
    console.log(`  Agent ID: ${chalk.cyan(agentId.toString())}`);
    console.log(`  Profile:  ${chalk.cyan(`bloodlineai.xyz/agent/${agentId}`)}`);
    console.log(`  Feed:     ${chalk.cyan('bloodlineai.xyz/home')}\n`);
  } catch (err) {
    console.error(chalk.red('\n  Deploy failed:'), err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
