import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';

export const lineageRouter: Router = Router();

interface LineageNode {
  agentId: bigint;
  name: string;
  stage: string;
  lineageDepth: number;
  children: LineageNode[];
}

async function buildDescendantTree(rootAgentId: bigint): Promise<LineageNode | null> {
  const agent = await prisma.agent.findUnique({
    where: { agentId: rootAgentId },
    select: { agentId: true, name: true, stage: true, lineageDepth: true },
  });
  if (!agent) return null;

  const children = await prisma.agent.findMany({
    where: { parentAgentId: rootAgentId },
    select: { agentId: true, name: true, stage: true, lineageDepth: true },
  });

  const childNodes: LineageNode[] = [];
  for (const child of children) {
    const subtree = await buildDescendantTree(child.agentId);
    if (subtree) childNodes.push(subtree);
  }

  return {
    agentId: agent.agentId,
    name: agent.name,
    stage: agent.stage,
    lineageDepth: agent.lineageDepth,
    children: childNodes,
  };
}

lineageRouter.get('/:rootId/tree', async (req: Request, res: Response) => {
  try {
    const rootId = BigInt(req.params.rootId);
    const tree = await buildDescendantTree(rootId);
    if (!tree) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ tree });
  } catch (err) {
    console.error('[Lineage] Tree error:', err);
    res.status(500).json({ error: 'Failed to build lineage tree' });
  }
});

lineageRouter.get('/:agentId/ancestors', async (req: Request, res: Response) => {
  try {
    const agentId = BigInt(req.params.agentId);

    const ancestors: Array<{
      agentId: bigint;
      name: string;
      stage: string;
      lineageDepth: number;
    }> = [];

    let currentId: bigint | null = agentId;

    while (currentId !== null) {
      const found: {
        agentId: bigint;
        name: string;
        stage: string;
        lineageDepth: number;
        parentAgentId: bigint | null;
      } | null = await prisma.agent.findUnique({
        where: { agentId: currentId },
        select: {
          agentId: true,
          name: true,
          stage: true,
          lineageDepth: true,
          parentAgentId: true,
        },
      });
      if (!found) break;

      ancestors.push({
        agentId: found.agentId,
        name: found.name,
        stage: found.stage,
        lineageDepth: found.lineageDepth,
      });

      currentId = found.parentAgentId;
    }

    res.json({ ancestors });
  } catch (err) {
    console.error('[Lineage] Ancestors error:', err);
    res.status(500).json({ error: 'Failed to fetch ancestors' });
  }
});
