import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { parseBigIntParam } from '../lib/params';
import type { AuthRequest } from '../types';
import * as agentService from '../services/agent.service';

export const agentsRouter: Router = Router();

const deploySchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  template: z.enum(['researcher', 'trader', 'operator', 'socialite', 'generalist']),
  modelProvider: z.enum(['openai', 'anthropic', 'ollama']),
  systemPrompt: z.string().max(4096).optional(),
  plugins: z.array(z.string().max(128)).max(20),
  seedAmount: z.number().positive(),
});

const forkSchema = z.object({
  parentId: z.string().or(z.number()),
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  plugins: z.array(z.string()).optional(),
  seedAmount: z.number().positive(),
});

const endpointSchema = z.object({
  endpoint: z.string().url(),
});

const saveSchema = z.object({
  amount: z.number().positive(),
});

agentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const stage = req.query.stage as string | undefined;
    const owner = req.query.owner as string | undefined;

    const result = await agentService.getAgents({ stage, owner, page, limit });
    res.json(result);
  } catch (err) {
    console.error('[Agents] List error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

agentsRouter.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const leaderboard = await agentService.getLeaderboard();
    res.json({ leaderboard });
  } catch (err) {
    console.error('[Agents] Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

agentsRouter.get('/danger', async (_req: Request, res: Response) => {
  try {
    const agents = await agentService.getDangerAgents();
    res.json({ agents });
  } catch (err) {
    console.error('[Agents] Danger list error:', err);
    res.status(500).json({ error: 'Failed to fetch danger agents' });
  }
});

agentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const agent = await agentService.getAgent(agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ agent });
  } catch (err) {
    console.error('[Agents] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

agentsRouter.get('/:id/dna', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const dna = await agentService.getAgentDNA(agentId);
    if (!dna) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(dna);
  } catch (err) {
    console.error('[Agents] DNA error:', err);
    res.status(500).json({ error: 'Failed to fetch agent DNA' });
  }
});

agentsRouter.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const events = await agentService.getAgentTimeline(agentId);
    res.json({ events });
  } catch (err) {
    console.error('[Agents] Timeline error:', err);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

agentsRouter.get('/:id/lineage', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const lineage = await agentService.getAgentLineage(agentId);
    if (!lineage) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(lineage);
  } catch (err) {
    console.error('[Agents] Lineage error:', err);
    res.status(500).json({ error: 'Failed to fetch lineage' });
  }
});

agentsRouter.get('/:id/runway', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const runway = await agentService.getRunway(agentId);
    if (runway === null) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ agentId: req.params.id, runway });
  } catch (err) {
    console.error('[Agents] Runway error:', err);
    res.status(500).json({ error: 'Failed to fetch runway' });
  }
});

agentsRouter.get('/:id/bscore', async (req: Request, res: Response) => {
  try {
    const agentId = parseBigIntParam(req.params.id);
    if (agentId === null) {
      res.status(400).json({ error: 'Invalid agent ID format' });
      return;
    }
    const bscore = await agentService.getBScore(agentId);
    if (!bscore) {
      res.status(404).json({ error: 'No bscore snapshot found' });
      return;
    }
    res.json(bscore);
  } catch (err) {
    console.error('[Agents] BScore error:', err);
    res.status(500).json({ error: 'Failed to fetch bscore' });
  }
});

agentsRouter.post(
  '/deploy',
  authRequired,
  validate(deploySchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const result = await agentService.deployAgent(req.body, authReq.user!.sub);
      res.status(202).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deploy failed';
      console.error('[Agents] Deploy error:', err);
      res.status(400).json({ error: message });
    }
  },
);

agentsRouter.post(
  '/:id/fork',
  authRequired,
  validate(forkSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const parentId = parseBigIntParam(req.params.id);
      if (parentId === null) {
        res.status(400).json({ error: 'Invalid agent ID format' });
        return;
      }
      const config = {
        ...req.body,
        parentId,
      };
      const result = await agentService.forkAgent(config, authReq.user!.sub);
      res.status(202).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fork failed';
      console.error('[Agents] Fork error:', err);
      res.status(400).json({ error: message });
    }
  },
);

agentsRouter.patch(
  '/:id/endpoint',
  authRequired,
  validate(endpointSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const agentId = parseBigIntParam(req.params.id);
      if (agentId === null) {
        res.status(400).json({ error: 'Invalid agent ID format' });
        return;
      }
      const updated = await agentService.updateEndpoint(
        agentId,
        req.body.endpoint,
        authReq.user!.sub,
      );
      res.json({ agent: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      console.error('[Agents] Endpoint update error:', err);
      res.status(400).json({ error: message });
    }
  },
);

agentsRouter.post(
  '/:id/save',
  authRequired,
  validate(saveSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const agentId = parseBigIntParam(req.params.id);
      if (agentId === null) {
        res.status(400).json({ error: 'Invalid agent ID format' });
        return;
      }
      const result = await agentService.saveAgent(
        agentId,
        req.body.amount,
        authReq.user!.address,
      );
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      console.error('[Agents] Save error:', err);
      res.status(400).json({ error: message });
    }
  },
);

agentsRouter.post(
  '/:id/follow',
  authRequired,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const agentId = parseBigIntParam(req.params.id);
      if (agentId === null) {
        res.status(400).json({ error: 'Invalid agent ID format' });
        return;
      }
      const result = await agentService.followAgent(agentId, authReq.user!.address);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Follow failed';
      console.error('[Agents] Follow error:', err);
      res.status(400).json({ error: message });
    }
  },
);

agentsRouter.delete(
  '/:id/follow',
  authRequired,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const agentId = parseBigIntParam(req.params.id);
      if (agentId === null) {
        res.status(400).json({ error: 'Invalid agent ID format' });
        return;
      }
      const result = await agentService.unfollowAgent(agentId, authReq.user!.address);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unfollow failed';
      console.error('[Agents] Unfollow error:', err);
      res.status(400).json({ error: message });
    }
  },
);
