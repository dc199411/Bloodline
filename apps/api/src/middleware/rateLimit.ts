import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    keyPrefix = 'rl:',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = `${keyPrefix}${ip}`;

    try {
      const multi = redis.multi();
      multi.incr(key);
      multi.pttl(key);

      const results = await multi.exec();
      if (!results) {
        next();
        return;
      }

      const [[, count], [, ttl]] = results as [[Error | null, number], [Error | null, number]];
      const currentCount = count ?? 0;
      const currentTtl = ttl ?? -1;

      if (currentTtl === -1) {
        await redis.pexpire(key, windowMs);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));

      if (currentCount > maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((currentTtl > 0 ? currentTtl : windowMs) / 1000),
        });
        return;
      }

      next();
    } catch (err) {
      console.error('[RateLimit] Redis error:', err);
      next();
    }
  };
}
