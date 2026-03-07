import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const url = new URL(REDIS_URL);
const connection = {
  host: url.hostname,
  port: url.port ? parseInt(url.port, 10) : 6379,
  ...(url.password && { password: decodeURIComponent(url.password) }),
};

export const deployQueue = new Queue('deploy', { connection });
export const deathQueue = new Queue('death', { connection });
export const socialQueue = new Queue('social', { connection });
export const bscoreQueue = new Queue('bscore', { connection });
export const metabolismQueue = new Queue('metabolism', { connection });

export const queues = {
  deploy: deployQueue,
  death: deathQueue,
  social: socialQueue,
  bscore: bscoreQueue,
  metabolism: metabolismQueue,
} as const;
