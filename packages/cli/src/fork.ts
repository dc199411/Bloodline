#!/usr/bin/env node
import chalk from 'chalk';
import prompts from 'prompts';
import {
  AgentAPI,
  FORK_FEE_ETH,
  type Agent,
  type DNA,
} from '@bloodline/sdk';

const API_URL = process.env.BLOODLINE_API_URL ?? 'http://localhost:4000';
const WS_URL = process.env.BLOODLINE_WS_URL ?? process.env.BLOODLINE_API_URL ?? 'http://localhost:4000';
const TOKEN = process.env.BLOODLINE_TOKEN;

function parseArgs(): { agent?: string; name?: string } {
  const args = process.argv.slice(2);
  const result: { agent?: string; name?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--agent' || args[i] === '-a') && args[i + 1]) {
      result.agent = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      result.name = args[i + 1];
      i++;
    }
  }
  return result;
}

function renderTraitBar(value: number, width = 20): string {
  const filled = Math.round((value / 255) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function renderDNAPreview(dna: DNA): string {
  const lines: string[] = [];
  const labels: Record<string, string> = {
    intelligence: 'Intelligence',
    speed: 'Speed',
    creativity: 'Creativity',
    frugality: 'Frugality',
    riskAppetite: 'Risk Appetite',
    socialEnergy: 'Social Energy',
    loyalty: 'Loyalty',
    resilience: 'Resilience',
  };
  for (const [key, value] of Object.entries(dna)) {
    const label = labels[key] ?? key;
    lines.push(`  ${label.padEnd(14)} ${renderTraitBar(value)} ${value}`);
  }
  return lines.join('\n');
}

async function main() {
  console.log(chalk.bold.cyan('\n  BLOODLINE — Fork\n'));

  const { agent: agentArg, name: nameArg } = parseArgs();

  const agentIdStr = agentArg ?? (
    await prompts({
      type: 'text',
      name: 'agent',
      message: 'Parent agent ID',
    })
  ).agent;

  if (!agentIdStr) {
    console.error(chalk.red('Parent agent ID is required. Use: --agent 1847'));
    process.exit(1);
  }

  const parentId = BigInt(agentIdStr);
  const client = new AgentAPI(API_URL, WS_URL);

  let parent: Agent;
  let dna: DNA;
  try {
    parent = await client.getAgent(parentId);
    dna = await client.getDNA(parentId);
  } catch (err) {
    console.error(chalk.red('Failed to fetch parent agent:'), err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const name = nameArg ?? (
    await prompts({
      type: 'text',
      name: 'name',
      message: 'Fork name',
      initial: `${parent.name} (fork)`,
    })
  ).name;

  if (!name) {
    console.error(chalk.red('Name is required'));
    process.exit(1);
  }

  console.log(chalk.gray('\n  Parent DNA:'));
  console.log(renderDNAPreview(dna));
  console.log(chalk.gray('\n  Fork inherits parent DNA (no mutation preview in this version)'));
  console.log(chalk.yellow(`\n  Fork fee: ${FORK_FEE_ETH} ETH`));

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Create fork?',
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.yellow('Aborted.'));
    process.exit(0);
  }

  if (!TOKEN) {
    console.error(chalk.red('BLOODLINE_TOKEN env var required for fork. Sign in first.'));
    process.exit(1);
  }

  client.setToken(TOKEN);

  try {
    const newAgentId = await client.forkAgent(parentId, {
      name,
      plugins: ['web-browsing-v2', 'price-feed-v1'],
      seedAmount: 10,
    });

    const agentUrl = `${API_URL.replace(/\/$/, '')}/agents/${newAgentId}`;
    console.log(chalk.green('\n  Fork created!'));
    console.log(chalk.cyan(`  Agent: ${agentUrl}`));
    console.log(chalk.gray(`  ID: ${newAgentId}`));
  } catch (err) {
    console.error(chalk.red('\n  Fork failed:'), err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
