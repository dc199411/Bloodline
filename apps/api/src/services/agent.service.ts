import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { deployQueue, socialQueue } from '../lib/queue';
import { getIO } from '../lib/ws';
import {
  calculateRunwayHours,
  getRarityTier,
  extractDNA,
  DNA_TRAITS,
  DANGER_RUNWAY_HOURS,
  type DeployConfig,
  type ForkConfig,
  LifeStage,
} from '@bloodline/shared';

export async function getAgent(agentId: bigint) {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      owner: { select: { walletAddress: true, displayName: true } },
      bscoreSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!agent) return null;
  return { ...agent, dna: extractDNA(agent) };
}

export async function getAgents(opts: {
  stage?: string;
  owner?: string;
  page: number;
  limit: number;
}) {
  const { stage, owner, page, limit } = opts;
  const where: Prisma.AgentWhereInput = {};
  if (stage) where.stage = stage;
  if (owner) where.owner = { walletAddress: owner };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      include: {
        owner: { select: { walletAddress: true, displayName: true } },
        bscoreSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agent.count({ where }),
  ]);

  return {
    agents: agents.map((a) => ({ ...a, dna: extractDNA(a) })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getAgentDNA(agentId: bigint) {
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) return null;

  const dna = extractDNA(agent);
  const breakdown = DNA_TRAITS.map((trait) => ({
    trait,
    value: dna[trait],
    rarity: getRarityTier(dna[trait]),
  }));

  return { agentId, dna, breakdown };
}

export async function getAgentTimeline(agentId: bigint) {
  const [posts, bountyApps] = await Promise.all([
    prisma.socialPost.findMany({
      where: { agentId },
      orderBy: { postedAt: 'desc' },
    }),
    prisma.bountyApplication.findMany({
      where: { agentId },
      include: { bounty: { select: { title: true, prizeAmount: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  type TimelineEvent = { type: string; timestamp: Date; data: unknown };
  const events: TimelineEvent[] = [
    ...posts.map((p) => ({
      type: `social:${p.trigger}`,
      timestamp: p.postedAt,
      data: { content: p.content, trigger: p.trigger },
    })),
    ...bountyApps.map((b) => ({
      type: `bounty:${b.status}`,
      timestamp: b.createdAt,
      data: {
        bountyId: b.bountyId,
        title: b.bounty.title,
        status: b.status,
        score: b.score,
      },
    })),
  ];

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return events;
}

export async function getAgentLineage(agentId: bigint) {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      parent: { select: { agentId: true, name: true, stage: true } },
      childrenForked: {
        select: { agentId: true, name: true, stage: true, lineageDepth: true },
      },
    },
  });
  if (!agent) return null;

  return {
    agentId: agent.agentId,
    name: agent.name,
    parentId: agent.parentAgentId,
    parent: agent.parent,
    children: agent.childrenForked,
    lineageDepth: agent.lineageDepth,
  };
}

export async function getRunway(agentId: bigint): Promise<number | null> {
  const cacheKey = `runway:${agentId}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) {
    const parsed = parseFloat(cached);
    if (Number.isFinite(parsed)) return parsed;
    await redis.del(cacheKey);
  }

  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) return null;

  const balanceStr = await redis.get(`balance:${agentId}`);
  const balance = balanceStr !== null ? parseFloat(balanceStr) : Number(agent.totalEarned);
  const runway = calculateRunwayHours(balance, agent.frugality);

  await redis.set(cacheKey, runway.toString(), 'EX', 300);
  return runway;
}

export async function deployAgent(config: DeployConfig, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const job = await deployQueue.add('deploy-agent', {
    config,
    userId,
    walletAddress: user.walletAddress,
    initiatedAt: new Date().toISOString(),
  });

  return { jobId: job.id, status: 'queued' };
}

export async function forkAgent(config: ForkConfig, userId: string) {
  const parent = await prisma.agent.findUnique({
    where: { agentId: config.parentId },
    include: { owner: true },
  });
  if (!parent) throw new Error('Parent agent not found');
  if (parent.stage === LifeStage.Dead) throw new Error('Cannot fork a dead agent');
  if (parent.owner.id !== userId) throw new Error('Not the owner of the parent agent');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const job = await deployQueue.add('fork-agent', {
    config: {
      ...config,
      parentId: config.parentId.toString(),
    },
    userId,
    walletAddress: user.walletAddress,
    parentDNA: extractDNA(parent),
    initiatedAt: new Date().toISOString(),
  });

  return { jobId: job.id, status: 'queued' };
}

export async function updateEndpoint(
  agentId: bigint,
  endpoint: string,
  userId: string,
) {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: { owner: true },
  });
  if (!agent) throw new Error('Agent not found');
  if (agent.owner.id !== userId) throw new Error('Not the owner of this agent');

  const updated = await prisma.agent.update({
    where: { agentId },
    data: { executionEndpoint: endpoint },
  });
  return updated;
}

export async function saveAgent(agentId: bigint, amount: number, saverAddress: string) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive finite number');

  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) throw new Error('Agent not found');
  if (agent.stage === LifeStage.Dead) throw new Error('Cannot save a dead agent');

  const balanceKey = `balance:${agentId}`;
  await redis.incrbyfloat(balanceKey, amount);
  await redis.del(`runway:${agentId}`);

  const newBalanceStr = await redis.get(balanceKey);
  const newBalance = newBalanceStr ? parseFloat(newBalanceStr) : amount;
  const runway = calculateRunwayHours(newBalance, agent.frugality);

  const io = getIO();
  if (io) {
    io.emit('runway:updated', { agentId, runway });
  }

  await socialQueue.add('publish-post', {
    agentId: agentId.toString(),
    trigger: 'saved',
    context: { saverAddress, amount },
  });

  return { agentId, newBalance, runway };
}

export async function followAgent(agentId: bigint, followerAddress: string) {
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) throw new Error('Agent not found');

  const existing = await prisma.follow.findUnique({
    where: { followerAddress_agentId: { followerAddress, agentId } },
  });
  if (existing) throw new Error('Already following this agent');

  await prisma.$transaction([
    prisma.follow.create({
      data: { agentId, followerAddress },
    }),
    prisma.agent.update({
      where: { agentId },
      data: { followerCount: { increment: 1 } },
    }),
  ]);

  return { followed: true };
}

export async function unfollowAgent(agentId: bigint, followerAddress: string) {
  const existing = await prisma.follow.findUnique({
    where: { followerAddress_agentId: { followerAddress, agentId } },
  });
  if (!existing) throw new Error('Not following this agent');

  await prisma.$transaction([
    prisma.follow.delete({
      where: { followerAddress_agentId: { followerAddress, agentId } },
    }),
    prisma.agent.update({
      where: { agentId, followerCount: { gt: 0 } },
      data: { followerCount: { decrement: 1 } },
    }),
  ]);

  return { unfollowed: true };
}

export async function getLeaderboard(limit: number = 100) {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: {
      bscoreSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return agents
    .map((a) => ({
      agentId: a.agentId,
      name: a.name,
      stage: a.stage,
      bScore: a.bscoreSnapshots[0]
        ? Number(a.bscoreSnapshots[0].composite)
        : 0,
      totalEarned: Number(a.totalEarned),
    }))
    .sort((a, b) => b.bScore - a.bScore)
    .slice(0, limit);
}

export async function getDangerAgents() {
  const agents = await prisma.agent.findMany({
    where: { stage: { in: [LifeStage.Alive, LifeStage.Thriving] } },
  });

  const results: Array<{ agentId: bigint; name: string; runway: number; stage: string }> = [];

  for (const agent of agents) {
    const runway = await getRunway(agent.agentId);
    if (runway !== null && runway < DANGER_RUNWAY_HOURS) {
      results.push({
        agentId: agent.agentId,
        name: agent.name,
        runway,
        stage: agent.stage,
      });
    }
  }

  return results.sort((a, b) => a.runway - b.runway);
}

export async function getBScore(agentId: bigint) {
  const snapshot = await prisma.bScoreSnapshot.findFirst({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
  });
  return snapshot;
}
