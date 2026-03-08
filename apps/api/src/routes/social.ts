import { Router, type Request, type Response } from 'express';
import * as socialService from '../services/social.service';

export const socialRouter: Router = Router();

function parseBigIntParam(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

socialRouter.get('/feed', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const feed = await socialService.getFeed(page, limit);
    res.json(feed);
  } catch (err) {
    console.error('[Social] Feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

socialRouter.get('/agent/:id', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const posts = await socialService.getAgentPosts(agentId, page, limit);
    res.json(posts);
  } catch (err) {
    console.error('[Social] Agent posts error:', err);
    res.status(500).json({ error: 'Failed to fetch agent posts' });
  }
});
