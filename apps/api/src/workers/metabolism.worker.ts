import { Worker } from 'bullmq';
import { queueConnection, metabolismQueue } from '../lib/queue';
import { checkAllAgents } from '../services/metabolism.service';

const METABOLISM_CRON = '0 * * * *'; // Every hour at minute 0

export function createMetabolismWorker(): Worker {
  const worker = new Worker(
    'metabolism',
    async (job) => {
      try {
        console.log('[MetabolismWorker] Running checkAllAgents...');
        const results = await checkAllAgents();
        console.log('[MetabolismWorker] Completed. Checked', results.length, 'agents');
        for (const r of results) {
          if (r.action) {
            console.log('[MetabolismWorker] Agent', r.agentId.toString(), '->', r.action, '(runway:', r.runway.toFixed(1), 'h)');
          }
        }
        return { checked: results.length, results };
      } catch (err) {
        console.error('[MetabolismWorker] Error:', err);
        throw err;
      }
    },
    { connection: queueConnection },
  );

  worker.on('completed', (job) => {
    console.log('[MetabolismWorker] Job', job.id, 'completed');
  });

  worker.on('failed', (job, err) => {
    console.error('[MetabolismWorker] Job', job?.id, 'failed:', err.message);
  });

  return worker;
}

export async function scheduleMetabolismCron(): Promise<void> {
  const existing = await metabolismQueue.getRepeatableJobs();
  const alreadyScheduled = existing.some((j) => j.pattern === METABOLISM_CRON);
  if (!alreadyScheduled) {
    await metabolismQueue.add('check-all', {}, { repeat: { pattern: METABOLISM_CRON } });
    console.log('[MetabolismWorker] Scheduled hourly cron:', METABOLISM_CRON);
  }
}
