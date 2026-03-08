import express from 'express';
import type { TaskRequest } from '@bloodline/shared';
import type { DNA } from '@bloodline/shared';
import { AgentCore } from './agent-core';
import { PluginManager } from './plugins';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

function loadAgentConfig(): {
  agentId: string;
  dna: DNA;
  griefBoost: number;
  plugins: string[];
} {
  const agentId = process.env.AGENT_ID ?? '0';
  const griefBoost = parseInt(process.env.AGENT_GRIEF_BOOST ?? '0', 10);
  const pluginsStr = process.env.AGENT_PLUGINS ?? 'web-browsing-v2,price-feed-v1,code-exec-v1';
  const plugins = pluginsStr.split(',').map((p) => p.trim()).filter(Boolean);

  const dna: DNA = {
    intelligence: parseInt(process.env.AGENT_DNA_INTELLIGENCE ?? '150', 10),
    speed: parseInt(process.env.AGENT_DNA_SPEED ?? '150', 10),
    creativity: parseInt(process.env.AGENT_DNA_CREATIVITY ?? '150', 10),
    frugality: parseInt(process.env.AGENT_DNA_FRUGALITY ?? '150', 10),
    riskAppetite: parseInt(process.env.AGENT_DNA_RISK_APPETITE ?? '150', 10),
    socialEnergy: parseInt(process.env.AGENT_DNA_SOCIAL_ENERGY ?? '150', 10),
    loyalty: parseInt(process.env.AGENT_DNA_LOYALTY ?? '150', 10),
    resilience: parseInt(process.env.AGENT_DNA_RESILIENCE ?? '150', 10),
  };

  return { agentId, dna, griefBoost, plugins };
}

const config = loadAgentConfig();
const pluginManager = new PluginManager();
const agentCore = new AgentCore(
  {
    ...config,
    systemPrompt: process.env.AGENT_SYSTEM_PROMPT,
  },
  pluginManager,
);

const app = express();
app.use(express.json());

app.post('/execute', async (req, res) => {
  try {
    const request = req.body as TaskRequest;
    if (!request?.taskId || !request?.taskType || !request?.context) {
      res.status(400).json({ error: 'Invalid TaskRequest: taskId, taskType, context required' });
      return;
    }
    const response = await agentCore.execute(request);
    res.json(response);
  } catch (err) {
    console.error('Execute error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agentId: config.agentId });
});

app.get('/info', (_req, res) => {
  res.json({
    agentId: config.agentId,
    dna: config.dna,
    griefBoost: config.griefBoost,
    plugins: config.plugins,
  });
});

app.listen(PORT, () => {
  console.log(`Agent runtime listening on port ${PORT}`);
});
