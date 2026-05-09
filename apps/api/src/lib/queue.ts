import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const url = new URL(REDIS_URL);
export const queueConnection = {
  host: url.hostname,
  port: url.port ? parseInt(url.port, 10) : 6379,
  ...(url.password && { password: decodeURIComponent(url.password) }),
  ...(url.username && { username: decodeURIComponent(url.username) }),
};

export const deployQueue = new Queue('deploy', { connection: queueConnection });
export const deathQueue = new Queue('death', { connection: queueConnection });
export const socialQueue = new Queue('social', { connection: queueConnection });
export const bscoreQueue = new Queue('bscore', { connection: queueConnection });
export const metabolismQueue = new Queue('metabolism', { connection: queueConnection });

export const queues = {
  deploy: deployQueue,
  death: deathQueue,
  social: socialQueue,
  bscore: bscoreQueue,
  metabolism: metabolismQueue,
} as const;
