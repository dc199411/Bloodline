import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth';
import { validate } from '../middleware/validate';
import type { AuthRequest } from '../types';
import * as bountyService from '../services/bounty.service';

export const bountiesRouter: Router = Router();

const postBountySchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(4096).optional(),
  bountyType: z.enum(['research', 'trading', 'automation', 'creative', 'data', 'custom']),
  prizeAmount: z.number().positive(),
  deadline: z.string().datetime(),
  minBScore: z.number().int().min(0).optional(),
  minIntelligence: z.number().int().min(0).max(255).optional(),
  minCreativity: z.number().int().min(0).max(255).optional(),
  minSpeed: z.number().int().min(0).max(255).optional(),
  verifyMode: z.enum(['human', 'auto_grader', 'agent_jury']).optional(),
});

const applySchema = z.object({
  agentId: z.string().or(z.number()),
});

const selectWinnerSchema = z.object({
  winnerAgentId: z.string().or(z.number()),
});

const juryVoteSchema = z.object({
  agentId: z.string().or(z.number()),
  score: z.number().min(0).max(100),
  outputUri: z.string().url().optional(),
});

bountiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = req.query.type as string | undefined;
    const minPrize = req.query.minPrize ? parseFloat(req.query.minPrize as string) : undefined;

    const result = await bountyService.getBounties({ type, minPrize, page, limit });
    res.json(result);
  } catch (err) {
    console.error('[Bounties] List error:', err);
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
});

bountiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const bountyId = BigInt(req.params.id);
    const bounty = await bountyService.getBounty(bountyId);
    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }
    res.json({ bounty });
  } catch (err) {
    console.error('[Bounties] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch bounty' });
  }
});

bountiesRouter.post(
  '/',
  authRequired as any,
  validate(postBountySchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const bounty = await bountyService.postBounty({
        ...req.body,
        deadline: new Date(req.body.deadline),
        posterAddress: authReq.user!.address,
      });
      res.status(201).json({ bounty });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post bounty';
      console.error('[Bounties] Post error:', err);
      res.status(400).json({ error: message });
    }
  },
);

bountiesRouter.post(
  '/:id/apply',
  authRequired as any,
  validate(applySchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const bountyId = BigInt(req.params.id);
      const agentId = BigInt(req.body.agentId);
      const application = await bountyService.applyToBounty(bountyId, agentId, authReq.user!.sub);
      res.status(201).json({ application });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apply failed';
      console.error('[Bounties] Apply error:', err);
      res.status(400).json({ error: message });
    }
  },
);

bountiesRouter.post(
  '/:id/select',
  authRequired as any,
  validate(selectWinnerSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const bountyId = BigInt(req.params.id);
      const winnerAgentId = BigInt(req.body.winnerAgentId);
      const bounty = await bountyService.selectWinner(bountyId, winnerAgentId, authReq.user!.sub);
      res.json({ bounty });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Select failed';
      console.error('[Bounties] Select error:', err);
      res.status(400).json({ error: message });
    }
  },
);

bountiesRouter.post(
  '/:id/jury-vote',
  authRequired as any,
  validate(juryVoteSchema),
  async (req: Request, res: Response) => {
    try {
      const bountyId = BigInt(req.params.id);
      const agentId = BigInt(req.body.agentId);
      const result = await bountyService.submitJuryVote(bountyId, agentId, {
        score: req.body.score,
        outputUri: req.body.outputUri,
      });
      res.json({ vote: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote failed';
      console.error('[Bounties] Jury vote error:', err);
      res.status(400).json({ error: message });
    }
  },
);
