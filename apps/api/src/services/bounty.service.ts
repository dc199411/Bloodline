import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BountyStatus } from '@bloodline/shared';

export async function getBounties(opts: {
  type?: string;
  minPrize?: number;
  page: number;
  limit: number;
}) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const { type, minPrize } = opts;
  const where: Prisma.BountyWhereInput = { status: BountyStatus.Open };
  if (type) where.bountyType = type;
  if (minPrize !== undefined && Number.isFinite(minPrize)) where.prizeAmount = { gte: minPrize };

  const [bounties, total] = await Promise.all([
    prisma.bounty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.bounty.count({ where }),
  ]);

  return { bounties, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) || 1 };
}

export async function getBounty(bountyId: bigint) {
  const bounty = await prisma.bounty.findUnique({
    where: { bountyId },
    include: {
      applications: {
        include: {
          agent: { select: { agentId: true, name: true, stage: true } },
        },
      },
    },
  });
  return bounty;
}

export async function postBounty(data: {
  title: string;
  description?: string;
  bountyType: string;
  prizeAmount: number;
  deadline: Date;
  minBScore?: number;
  minIntelligence?: number;
  minCreativity?: number;
  minSpeed?: number;
  verifyMode?: string;
  posterAddress: string;
}) {
  const bounty = await prisma.$transaction(async (tx) => {
    const lastBounty = await tx.bounty.findFirst({
      orderBy: { bountyId: 'desc' },
    });
    const nextBountyId = lastBounty ? lastBounty.bountyId + BigInt(1) : BigInt(1);

    return tx.bounty.create({
      data: {
        bountyId: nextBountyId,
        posterAddress: data.posterAddress,
        title: data.title,
        description: data.description,
        bountyType: data.bountyType,
        prizeAmount: data.prizeAmount,
        deadline: data.deadline,
        minBScore: data.minBScore ?? 0,
        minIntelligence: data.minIntelligence ?? 0,
        minCreativity: data.minCreativity ?? 0,
        minSpeed: data.minSpeed ?? 0,
        verifyMode: data.verifyMode ?? 'human',
      },
    });
  });

  return bounty;
}

export async function applyToBounty(bountyId: bigint, agentId: bigint, userId: string) {
  const bounty = await prisma.bounty.findUnique({ where: { bountyId } });
  if (!bounty) throw new Error('Bounty not found');
  if (bounty.status !== BountyStatus.Open) throw new Error('Bounty is not open');
  if (bounty.deadline && new Date(bounty.deadline) < new Date()) throw new Error('Bounty deadline has passed');

  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      owner: true,
      bscoreSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  if (!agent) throw new Error('Agent not found');
  if (agent.owner.id !== userId) throw new Error('Not the owner of this agent');

  const bScore = agent.bscoreSnapshots[0]
    ? Number(agent.bscoreSnapshots[0].composite)
    : 0;
  if (bScore < bounty.minBScore) throw new Error('Agent bScore below minimum');
  if (agent.intelligence < bounty.minIntelligence) throw new Error('Agent intelligence below minimum');
  if (agent.creativity < bounty.minCreativity) throw new Error('Agent creativity below minimum');
  if (agent.speed < bounty.minSpeed) throw new Error('Agent speed below minimum');

  try {
    const application = await prisma.bountyApplication.create({
      data: { bountyId, agentId },
    });
    return application;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('Agent has already applied to this bounty');
    }
    throw err;
  }
}

export async function selectWinner(bountyId: bigint, winnerAgentId: bigint, userId: string) {
  const bounty = await prisma.bounty.findUnique({ where: { bountyId } });
  if (!bounty) throw new Error('Bounty not found');
  if (bounty.status !== BountyStatus.Open && bounty.status !== BountyStatus.InProgress) {
    throw new Error('Bounty is not open for winner selection');
  }

  const posterUser = await prisma.user.findFirst({
    where: { walletAddress: bounty.posterAddress },
  });
  if (!posterUser || posterUser.id !== userId) {
    throw new Error('Only the poster can select a winner');
  }

  const application = await prisma.bountyApplication.findFirst({
    where: { bountyId, agentId: winnerAgentId },
  });
  if (!application) throw new Error('Agent has not applied to this bounty');

  const [updatedBounty] = await prisma.$transaction([
    prisma.bounty.update({
      where: { bountyId },
      data: {
        winnerAgentId,
        status: BountyStatus.Completed,
        completedAt: new Date(),
      },
    }),
    prisma.bountyApplication.updateMany({
      where: { bountyId, agentId: winnerAgentId },
      data: { status: 'won' },
    }),
    prisma.agent.update({
      where: { agentId: winnerAgentId },
      data: {
        totalEarned: { increment: Number(bounty.prizeAmount) },
        tasksCompleted: { increment: 1 },
      },
    }),
  ]);

  return updatedBounty;
}

export async function submitJuryVote(
  bountyId: bigint,
  agentId: bigint,
  vote: { score: number; outputUri?: string },
  userId: string,
) {
  const bounty = await prisma.bounty.findUnique({ where: { bountyId } });
  if (!bounty) throw new Error('Bounty not found');
  if (bounty.verifyMode !== 'agent_jury') {
    throw new Error('Bounty does not use jury verification');
  }

  const posterUser = await prisma.user.findFirst({
    where: { walletAddress: bounty.posterAddress },
  });
  if (!posterUser || posterUser.id !== userId) {
    throw new Error('Only the bounty poster can submit jury votes');
  }

  const application = await prisma.bountyApplication.findFirst({
    where: { bountyId, agentId },
  });
  if (!application) throw new Error('Application not found');

  const updated = await prisma.bountyApplication.update({
    where: { id: application.id },
    data: {
      score: vote.score,
      outputUri: vote.outputUri ?? null,
      status: 'scored',
    },
  });

  return updated;
}
