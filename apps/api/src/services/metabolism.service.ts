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
    if (balanceStr === null) {
      await redis.set(balanceKey, Number(agent.totalEarned).toString());
    }

    const decrementedStr = await redis.incrbyfloat(balanceKey, -burnRate);
    const decremented = parseFloat(decrementedStr);
    const newBalance = Math.max(0, decremented);
    if (decremented < 0) {
      await redis.set(balanceKey, '0');
    }

    const runway = calculateRunwayHours(newBalance, agent.frugality);
    await redis.set(`runway:${agent.agentId}`, runway.toString(), 'EX', 300);

    let action: string | null = null;

    if (newBalance <= 0 || runway <= 0) {
      const deathKey = `dedup:death:${agent.agentId}`;
      const alreadyQueued = await redis.set(deathKey, '1', 'EX', 3600, 'NX');
      if (alreadyQueued) {
        action = 'death';
        await triggerDeath(agent.agentId);
      }
    } else if (runway < DANGER_RUNWAY_HOURS) {
      const dangerKey = `dedup:danger:${agent.agentId}`;
      const alreadyQueued = await redis.set(dangerKey, '1', 'EX', 21600, 'NX');
      if (alreadyQueued) {
        action = 'danger';
        await triggerDanger(agent.agentId, runway);
      }
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
