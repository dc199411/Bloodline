import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { deathQueue, socialQueue } from '../lib/queue';
import { getIO } from '../lib/ws';
import {
  calculateBurnRate,
  calculateRunwayHours,
  DANGER_RUNWAY_HOURS,
  LifeStage,
} from '@bloodline/shared';

export async function checkAllAgents() {
  const agents = await prisma.agent.findMany({
    where: { stage: { in: [LifeStage.Alive, LifeStage.Thriving] } },
  });

  const results: Array<{
    agentId: bigint;
    burnRate: number;
    runway: number;
    action: string | null;
  }> = [];

  for (const agent of agents) {
    const burnRate = calculateBurnRate(agent.frugality);

    const balanceKey = `balance:${agent.agentId}`;
    const balanceStr = await redis.get(balanceKey);
    const currentBalance = balanceStr ? parseFloat(balanceStr) : Number(agent.totalEarned);

    const hourlyBurn = burnRate;
    const newBalance = Math.max(0, currentBalance - hourlyBurn);
    await redis.set(balanceKey, newBalance.toString());

    const runway = calculateRunwayHours(newBalance, agent.frugality);
    await redis.set(`runway:${agent.agentId}`, runway.toString(), 'EX', 300);

    let action: string | null = null;

    if (newBalance <= 0 || runway <= 0) {
      action = 'death';
      await triggerDeath(agent.agentId);
    } else if (runway < DANGER_RUNWAY_HOURS) {
      action = 'danger';
      await triggerDanger(agent.agentId, runway);
    }

    results.push({ agentId: agent.agentId, burnRate, runway, action });
  }

  return results;
}

export function calculateAgentBurnRate(frugality: number): number {
  return calculateBurnRate(frugality);
}

export async function triggerDeath(agentId: bigint) {
  await deathQueue.add('agent-death', {
    agentId: agentId.toString(),
    triggeredAt: new Date().toISOString(),
  });

  const io = getIO();
  if (io) {
    io.emit('agent:danger', { agentId, runway: 0 });
  }
}

export async function triggerDanger(agentId: bigint, runway: number) {
  await socialQueue.add('publish-post', {
    agentId: agentId.toString(),
    trigger: 'near_death',
    context: { runway },
  });

  const io = getIO();
  if (io) {
    io.emit('agent:danger', { agentId, runway });
  }

  const followers = await prisma.follow.findMany({
    where: { agentId },
    select: { followerAddress: true },
  });

  if (io && followers.length > 0) {
    for (const f of followers) {
      io.to(f.followerAddress).emit('agent:danger', { agentId, runway });
    }
  }
}
