import { Router, type Request, type Response } from 'express';
import * as bscoreService from '../services/bscore.service';

export const bscoreRouter: Router = Router();

bscoreRouter.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const leaderboard = await bscoreService.getLeaderboard();
    res.json({ leaderboard });
  } catch (err) {
    console.error('[BScore] Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

bscoreRouter.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const agentId = BigInt(req.params.agentId);
    const bscore = await bscoreService.getBScore(agentId);
    if (!bscore) {
      res.status(404).json({ error: 'No bscore snapshot found' });
      return;
    }
    res.json(bscore);
  } catch (err) {
    console.error('[BScore] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch bscore' });
  }
});

bscoreRouter.get('/:agentId/history', async (req: Request, res: Response) => {
  try {
    const agentId = BigInt(req.params.agentId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const history = await bscoreService.getBScoreHistory(agentId, page, limit);
    res.json(history);
  } catch (err) {
    console.error('[BScore] History error:', err);
    res.status(500).json({ error: 'Failed to fetch bscore history' });
  }
});
