import { prisma } from '../lib/prisma';
import {
  calculateBScore as calcBScore,
  BSCORE_WEIGHTS,
} from '@bloodline/shared';

export async function getBScore(agentId: bigint) {
  const snapshot = await prisma.bScoreSnapshot.findFirst({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
  });
  if (!snapshot) return null;

  return {
    agentId,
    composite: Number(snapshot.composite),
    breakdown: {
      taskScore: Number(snapshot.taskScore),
      profitScore: Number(snapshot.profitScore),
      accuracyScore: Number(snapshot.accuracyScore),
      arenaWinScore: Number(snapshot.arenaScore),
      uptimeScore: Number(snapshot.uptimeScore),
      communityScore: Number(snapshot.communityScore),
    },
    weights: BSCORE_WEIGHTS,
    snapshotBlock: snapshot.snapshotBlock,
    snapshotAt: snapshot.createdAt,
  };
}

export async function getBScoreHistory(agentId: bigint, page = 1, limit = 50) {
  const [snapshots, total] = await Promise.all([
    prisma.bScoreSnapshot.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bScoreSnapshot.count({ where: { agentId } }),
  ]);

  return {
    snapshots: snapshots.map((s) => ({
      composite: Number(s.composite),
      taskScore: Number(s.taskScore),
      profitScore: Number(s.profitScore),
      accuracyScore: Number(s.accuracyScore),
      arenaWinScore: Number(s.arenaScore),
      uptimeScore: Number(s.uptimeScore),
      communityScore: Number(s.communityScore),
      snapshotBlock: s.snapshotBlock,
      snapshotAt: s.createdAt,
    })),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function writeSnapshot(
  agentId: bigint,
  stats: {
    taskScore: number;
    profitScore: number;
    accuracyScore: number;
    arenaWinScore: number;
    uptimeScore: number;
    communityScore: number;
  },
  lineageDepth: number,
  snapshotBlock?: bigint,
) {
  const composite = calcBScore(stats, lineageDepth);

  const snapshot = await prisma.bScoreSnapshot.create({
    data: {
      agentId,
      composite,
      taskScore: stats.taskScore,
      profitScore: stats.profitScore,
      accuracyScore: stats.accuracyScore,
      arenaScore: stats.arenaWinScore,
      uptimeScore: stats.uptimeScore,
      communityScore: stats.communityScore,
      snapshotBlock: snapshotBlock ?? null,
    },
  });

  return { ...snapshot, composite: Number(snapshot.composite) };
}

export async function getLeaderboard(limit = 100) {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: {
      bscoreSnapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const entries = agents
    .filter((a) => a.bscoreSnapshots.length > 0)
    .map((a) => ({
      agentId: a.agentId,
      name: a.name,
      stage: a.stage,
      bScore: Number(a.bscoreSnapshots[0].composite),
      totalEarned: Number(a.totalEarned),
    }))
    .sort((a, b) => b.bScore - a.bScore)
    .slice(0, limit);

  return entries;
}
