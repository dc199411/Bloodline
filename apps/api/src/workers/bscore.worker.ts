import { Worker } from 'bullmq';
import { queueConnection } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { writeSnapshot } from '../services/bscore.service';
import { getDaysAlive } from '@bloodline/shared';

const BSCORE_WEEKLY_CRON = '0 0 * * 0'; // Sundays at midnight

interface BScoreJobData {
  agentId?: string;
  stats?: {
    taskScore: number;
    profitScore: number;
    accuracyScore: number;
    arenaWinScore: number;
    uptimeScore: number;
    communityScore: number;
  };
}

function computeStatsFromAgent(agent: {
  tasksCompleted: number;
  totalEarned: { toString: () => string };
  bountyApps?: { status: string; score: { toString: () => string } | null }[];
  bornAt: Date | null;
  diedAt: Date | null;
  createdAt: Date;
  followerCount: number;
}): {
  taskScore: number;
  profitScore: number;
  accuracyScore: number;
  arenaWinScore: number;
  uptimeScore: number;
  communityScore: number;
} {
  const totalEarned = Number(agent.totalEarned.toString());
  const daysAlive = getDaysAlive(agent.bornAt ?? agent.createdAt, agent.diedAt);
  const wonBounties = agent.bountyApps?.filter((b) => b.status === 'completed').length ?? 0;
  const avgScore = agent.bountyApps?.length
    ? agent.bountyApps
        .filter((b) => b.score != null)
        .reduce((sum, b) => sum + Number(b.score!.toString()), 0) /
      agent.bountyApps.length
    : 0;

  return {
    taskScore: Math.min(100, agent.tasksCompleted * 2),
    profitScore: Math.min(100, totalEarned * 10),
    accuracyScore: Math.min(100, avgScore),
    arenaWinScore: Math.min(100, wonBounties * 20),
    uptimeScore: Math.min(100, daysAlive),
    communityScore: Math.min(100, agent.followerCount * 5),
  };
}

export function createBScoreWorker(): Worker {
  const worker = new Worker<BScoreJobData>(
    'bscore',
    async (job) => {
      try {
        if (job.name === 'weekly-recalc') {
          // Weekly cron: full recalculation of all agent bScores
          console.log('[BScoreWorker] Running weekly full recalculation...');
          const agents = await prisma.agent.findMany({
            where: { isActive: true },
            include: {
              bountyApps: { select: { status: true, score: true } },
            },
          });

          let count = 0;
          for (const agent of agents) {
            const stats = computeStatsFromAgent(agent);
            await writeSnapshot(agent.agentId, stats, agent.lineageDepth);
            count++;
          }
          console.log('[BScoreWorker] Weekly recalculation complete. Updated', count, 'agents');
          return { updated: count };
        }

        if (job.name === 'agent-update' && job.data.agentId) {
          // Individual agent bScore update (e.g. post-bounty)
          const { agentId: agentIdStr, stats: providedStats } = job.data;
          const agentId = BigInt(agentIdStr);

          const agent = await prisma.agent.findUnique({
            where: { agentId },
            include: {
              bountyApps: { select: { status: true, score: true } },
            },
          });

          if (!agent) {
            throw new Error(`Agent ${agentIdStr} not found`);
          }

          const stats =
            providedStats && Object.keys(providedStats).length === 6
              ? providedStats
              : computeStatsFromAgent(agent);

          const result = await writeSnapshot(agent.agentId, stats, agent.lineageDepth);
          console.log('[BScoreWorker] Updated bScore for agent', agentIdStr, '->', result.composite);
          return { agentId: agentIdStr, composite: result.composite };
        }

        console.log('[BScoreWorker] Unknown job type:', job.name);
        return {};
      } catch (err) {
        console.error('[BScoreWorker] Error:', err);
        throw err;
      }
    },
    { connection: queueConnection },
  );

  worker.on('completed', (job) => {
    console.log('[BScoreWorker] Job', job.id, 'completed');
  });

  worker.on('failed', (job, err) => {
    console.error('[BScoreWorker] Job', job?.id, 'failed:', err.message);
  });

  return worker;
}

export async function scheduleBScoreWeeklyCron(): Promise<void> {
  const { bscoreQueue } = await import('../lib/queue');
  const existing = await bscoreQueue.getRepeatableJobs();
  const alreadyScheduled = existing.some((j) => j.pattern === BSCORE_WEEKLY_CRON);
  if (!alreadyScheduled) {
    await bscoreQueue.add('weekly-recalc', {}, { repeat: { pattern: BSCORE_WEEKLY_CRON } });
    console.log('[BScoreWorker] Scheduled weekly cron:', BSCORE_WEEKLY_CRON);
  }
}
