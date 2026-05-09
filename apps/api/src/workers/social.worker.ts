import { Worker } from 'bullmq';
import { queueConnection } from '../lib/queue';
import { publishPost } from '../services/social.service';
import type { SocialTrigger } from '@bloodline/shared';

const VALID_TRIGGERS: string[] = [
  'birth',
  'near_death',
  'death',
  'prodigy',
  'ascension',
  'thrive',
  'bounty_won',
  'forked',
  'saved',
];

const RATE_LIMIT_DELAY_MS = 1000; // 1 second between posts for social API rate limiting

interface PublishPostJobData {
  agentId: string;
  trigger: string;
  context?: Record<string, unknown>;
}

export function createSocialWorker(): Worker {
  const worker = new Worker<PublishPostJobData>(
    'social',
    async (job) => {
      if (job.name !== 'publish-post') {
        console.log('[SocialWorker] Ignoring job type:', job.name);
        return;
      }

      const { agentId: agentIdStr, trigger, context = {} } = job.data;

      try {
        if (!VALID_TRIGGERS.includes(trigger)) {
          console.warn('[SocialWorker] Unknown trigger:', trigger, '- skipping');
          return { skipped: true, trigger };
        }

        await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));

        const agentId = BigInt(agentIdStr);
        console.log('[SocialWorker] Publishing post for agent', agentIdStr, 'trigger:', trigger);
        const post = await publishPost(agentId, trigger as SocialTrigger, context);
        console.log('[SocialWorker] Post created:', post.id.toString());
        return { postId: post.id.toString(), trigger };
      } catch (err) {
        console.error('[SocialWorker] Error publishing post:', err);
        throw err;
      }
    },
    { connection: queueConnection },
  );

  worker.on('completed', (job) => {
    console.log('[SocialWorker] Job', job.id, 'completed');
  });

  worker.on('failed', (job, err) => {
    console.error('[SocialWorker] Job', job?.id, 'failed:', err.message);
  });

  return worker;
}
