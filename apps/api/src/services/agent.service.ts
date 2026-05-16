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

function getAgentAvatar(name: string): string {
  const letters = name.match(/[A-Z0-9]/gi) ?? [];
  return letters.slice(0, 2).join('').toUpperCase() || name.slice(0, 2).toUpperCase();
}

function toDisplayStage(stage: string, runwayHours: number): string {
  if (stage === LifeStage.Dead) return 'dead';
  if (stage === LifeStage.Ascended) return 'ascended';
  if (runwayHours < DANGER_RUNWAY_HOURS) return 'danger';
  if (stage === LifeStage.Thriving) return 'thriving';
  return 'alive';
}

function toDNABreakdown(agent: {
  intelligence: number;
  speed: number;
  creativity: number;
  frugality: number;
  riskAppetite: number;
  socialEnergy: number;
  loyalty: number;
  resilience: number;
}) {
  const dna = extractDNA(agent);
  return DNA_TRAITS.map((trait) => {
    const rarity = getRarityTier(dna[trait]);
    return {
      name: trait.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: dna[trait],
      rarity: rarity.label.toLowerCase(),
    };
  });
}

async function toAgentCard(agent: {
  agentId: bigint;
  name: string;
  stage: string;
  bornAt: Date | null;
  totalEarned: Prisma.Decimal | number;
  intelligence: number;
  speed: number;
  creativity: number;
  frugality: number;
  riskAppetite: number;
  socialEnergy: number;
  loyalty: number;
  resilience: number;
}) {
  const runwayHours = (await getRunway(agent.agentId)) ?? 0;

  return {
    id: agent.agentId.toString(),
    name: agent.name,
    avatar: getAgentAvatar(agent.name),
    stage: toDisplayStage(agent.stage, runwayHours),
    runwayHours: Math.round(runwayHours),
    earned: Number(agent.totalEarned),
    born: (agent.bornAt ?? new Date()).toISOString(),
    dna: toDNABreakdown(agent),
    history: [],
    lastWill: null,
  };
}

export async function getAgent(agentId: bigint) {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
  });
  if (!agent) return null;

  const [runwayHours, history] = await Promise.all([
    getRunway(agent.agentId),
    getAgentTimeline(agent.agentId, {
      bornAt: agent.bornAt,
      diedAt: agent.diedAt,
    }),
  ]);

  return {
    id: agent.agentId.toString(),
    name: agent.name,
    avatar: getAgentAvatar(agent.name),
    stage: toDisplayStage(agent.stage, runwayHours ?? 0),
    runwayHours: Math.round(runwayHours ?? 0),
    earned: Number(agent.totalEarned),
    born: (agent.bornAt ?? agent.createdAt).toISOString(),
    dna: toDNABreakdown(agent),
    history,
    lastWill: agent.lastWillUri ?? null,
  };
}

export async function getAgents(opts: {
  stage?: string;
  owner?: string;
  page: number;
  limit: number;
}) {
  const { stage, owner, page, limit } = opts;
  const where: Prisma.AgentWhereInput = {};
  if (stage && stage !== 'danger') where.stage = stage;
  if (owner) where.owner = { walletAddress: owner };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agent.count({ where }),
  ]);

  const cards = await Promise.all(agents.map((agent) => toAgentCard(agent)));
  const filteredCards = stage === 'danger'
    ? cards.filter((agent) => agent.stage === 'danger')
    : cards;

  return {
    agents: filteredCards,
    total: stage === 'danger' ? filteredCards.length : total,
    page,
    limit,
    pages: Math.max(1, Math.ceil((stage === 'danger' ? filteredCards.length : total) / limit)),
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

export async function getAgentTimeline(
  agentId: bigint,
  lifecycle?: { bornAt: Date | null; diedAt: Date | null },
) {
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

  const events = [
    ...(lifecycle?.bornAt
      ? [{
          type: 'birth',
          timestamp: lifecycle.bornAt,
          event: 'Born into the BLOODLINE arena',
        }]
      : []),
    ...posts.map((p) => ({
      type:
        p.trigger === 'saved'
          ? 'save'
          : p.trigger === 'bounty_won'
            ? 'bounty'
            : p.trigger === 'death'
              ? 'death'
              : p.trigger === 'ascension'
                ? 'ascension'
                : 'mutation',
      timestamp: p.postedAt,
      event: p.content,
    })),
    ...bountyApps.map((b) => ({
      type: 'bounty',
      timestamp: b.createdAt,
      event: `Bounty ${b.status}: ${b.bounty.title}`,
    })),
    ...(lifecycle?.diedAt
      ? [{
          type: 'death',
          timestamp: lifecycle.diedAt,
          event: 'Runway depleted. Agent died onchain.',
        }]
      : []),
  ];

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return events.map((event) => ({
    type: event.type,
    timestamp: event.timestamp.toISOString(),
    event: event.event,
  }));
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
  if (cached !== null) return parseFloat(cached);

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
  });
  if (!parent) throw new Error('Parent agent not found');
  if (parent.stage === LifeStage.Dead) throw new Error('Cannot fork a dead agent');

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
    orderBy: { totalEarned: 'desc' },
    take: limit,
  });

  const cards = await Promise.all(agents.map((agent) => toAgentCard(agent)));
  return cards.sort((a, b) => b.earned - a.earned);
}

export async function getDangerAgents() {
  const agents = await prisma.agent.findMany({
    where: { stage: { in: [LifeStage.Alive, LifeStage.Thriving] } },
  });

  const cards = await Promise.all(agents.map((agent) => toAgentCard(agent)));
  return cards
    .filter((agent) => agent.stage === 'danger')
    .sort((a, b) => a.runwayHours - b.runwayHours);
}

export async function getBScore(agentId: bigint) {
  const snapshot = await prisma.bScoreSnapshot.findFirst({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
  });
  return snapshot;
}
