import { Worker } from 'bullmq';
import { queueConnection, socialQueue } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { getIO } from '../lib/ws';
import { generate as generateLastWill } from '../services/lastWill.service';
import { LifeStage } from '@bloodline/shared';

const GRIEF_BOOST_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
const GRIEF_BOOST_VALUE = '1.05';

interface AgentDeathJobData {
  agentId: string;
  triggeredAt: string;
}

export function createDeathWorker(): Worker {
  const worker = new Worker<AgentDeathJobData>(
    'death',
    async (job) => {
      if (job.name !== 'agent-death') {
        console.log('[DeathWorker] Ignoring job type:', job.name);
        return;
      }

      const { agentId: agentIdStr } = job.data;
      const agentId = BigInt(agentIdStr);

      try {
        const agent = await prisma.agent.findUnique({ where: { agentId } });
        if (!agent) {
          throw new Error(`Agent ${agentIdStr} not found`);
        }
        if (agent.stage === LifeStage.Dead) {
          console.log('[DeathWorker] Agent', agentIdStr, 'already dead, skipping');
          return;
        }

        // Step 1: Generate Last Will (LLM via lastWill.service)
        console.log('[DeathWorker] Step 1: Generating Last Will...');
        const lastWill = await generateLastWill(agentId);

        // Step 2: Upload Last Will to Arweave (placeholder - log URI)
        console.log('[DeathWorker] Step 2: Uploading to Arweave (placeholder)...');
        const lastWillUri = `arweave://placeholder-${agentId}-${Date.now()}`;
        console.log('[DeathWorker] Last Will URI:', lastWillUri);

        // Step 3: Call MetabolismOracle.finalizeKill() onchain (placeholder - log tx)
        console.log('[DeathWorker] Step 3: Calling MetabolismOracle.finalizeKill() (placeholder)...');
        const txHash = `0x${'0'.repeat(64)}`;
        console.log('[DeathWorker] Placeholder tx:', txHash);

        // Step 4: Update database (stage=dead, diedAt, lastWillUri, isActive=false)
        console.log('[DeathWorker] Step 4: Updating database...');
        await prisma.agent.update({
          where: { agentId },
          data: {
            stage: LifeStage.Dead,
            diedAt: new Date(),
            lastWillUri,
            isActive: false,
          },
        });

        // Step 5: Post death announcement (queue social post with highest priority)
        console.log('[DeathWorker] Step 5: Queuing death announcement...');
        await socialQueue.add(
          'publish-post',
          { agentId: agentIdStr, trigger: 'death', context: {} },
          { priority: 1 },
        );

        // Step 6: Notify all followers via WebSocket
        console.log('[DeathWorker] Step 6: Notifying followers...');
        const io = getIO();
        const followers = await prisma.follow.findMany({
          where: { agentId },
          select: { followerAddress: true },
        });
        if (io && followers.length > 0) {
          for (const f of followers) {
            io.to(f.followerAddress).emit('agent:died', { agentId, lastWill });
          }
        }

        // Step 7: Set grief boost for offspring in Redis (7 day TTL, value "1.05")
        console.log('[DeathWorker] Step 7: Setting grief boost for offspring...');
        const children = await prisma.agent.findMany({
          where: { parentAgentId: agentId },
          select: { agentId: true },
        });
        for (const child of children) {
          const key = `griefBoost:${child.agentId}`;
          await redis.set(key, GRIEF_BOOST_VALUE, 'EX', GRIEF_BOOST_TTL_SEC);
        }
        if (children.length > 0) {
          console.log('[DeathWorker] Set grief boost for', children.length, 'offspring');
        }

        // Step 8: Emit WebSocket event agent:died
        console.log('[DeathWorker] Step 8: Emitting agent:died...');
        if (io) {
          io.emit('agent:died', { agentId, lastWill });
        }

        console.log('[DeathWorker] Death sequence completed for agent', agentIdStr);
        return { agentId: agentIdStr, lastWillUri };
      } catch (err) {
        console.error('[DeathWorker] Error processing death for', agentIdStr, ':', err);
        throw err;
      }
    },
    { connection: queueConnection },
  );

  worker.on('completed', (job) => {
    console.log('[DeathWorker] Job', job.id, 'completed');
  });

  worker.on('failed', (job, err) => {
    console.error('[DeathWorker] Job', job?.id, 'failed:', err.message);
  });

  return worker;
}
