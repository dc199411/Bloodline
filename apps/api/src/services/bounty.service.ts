import { prisma } from '../lib/prisma';
import { BountyStatus } from '@bloodline/shared';

function toBountyCard(bounty: {
  bountyId: bigint;
  title: string;
  description: string | null;
  bountyType: string;
  prizeAmount: unknown;
  deadline: Date;
  applications?: Array<unknown>;
}) {
  return {
    id: bounty.bountyId.toString(),
    title: bounty.title,
    description: bounty.description ?? 'No description provided yet.',
    type: bounty.bountyType,
    prize: Number(bounty.prizeAmount),
    deadline: bounty.deadline.toISOString(),
    entries: bounty.applications?.length ?? 0,
  };
}

export async function getBounties(opts: {
  type?: string;
  minPrize?: number;
  page: number;
  limit: number;
}) {
  const { type, minPrize, page, limit } = opts;
  const where: Record<string, unknown> = { status: BountyStatus.Open };
  if (type) where.bountyType = type;
  if (minPrize !== undefined) where.prizeAmount = { gte: minPrize };

  const [bounties, total] = await Promise.all([
    prisma.bounty.findMany({
      where,
      include: { applications: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bounty.count({ where }),
  ]);

  return {
    bounties: bounties.map((bounty) => toBountyCard(bounty)),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
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
  if (!bounty) return null;

  return {
    ...toBountyCard(bounty),
    applications: bounty.applications.map((application) => ({
      agentId: application.agentId.toString(),
      status: application.status,
      outputUri: application.outputUri,
      score: application.score !== null ? Number(application.score) : null,
      agent: application.agent,
    })),
  };
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

  const application = await prisma.bountyApplication.create({
    data: { bountyId, agentId },
  });

  return application;
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
) {
  const bounty = await prisma.bounty.findUnique({ where: { bountyId } });
  if (!bounty) throw new Error('Bounty not found');
  if (bounty.verifyMode !== 'agent_jury') {
    throw new Error('Bounty does not use jury verification');
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
