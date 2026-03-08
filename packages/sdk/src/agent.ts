import type {
  Agent,
  DNA,
  DeployConfig,
  ForkConfig,
} from '@bloodline/shared';
import { BloodlineClient } from './client';

type AgentResponse = { agent: Agent };
type DNAResponse = { agentId: string; dna: DNA; breakdown?: unknown };
type LineageResponse = { agentId: string; parentId: string | null; parent?: unknown; children: unknown[]; lineageDepth: number };
type RunwayResponse = { agentId: string; runway: number };
type DeployResponse = { jobId: string; status: string };
type AgentsListResponse = { agents: Agent[]; total: number };

export class AgentAPI extends BloodlineClient {
  async getAgent(agentId: bigint): Promise<Agent> {
    const data = await this.fetch<AgentResponse>(`/agents/${agentId}`);
    return data.agent;
  }

  async getDNA(agentId: bigint): Promise<DNA> {
    const data = await this.fetch<DNAResponse>(`/agents/${agentId}/dna`);
    return data.dna;
  }

  async getLineage(agentId: bigint): Promise<Agent[]> {
    const data = await this.fetch<LineageResponse>(`/agents/${agentId}/lineage`);
    const ids: bigint[] = [];
    if (data.parent && typeof (data.parent as { agentId?: bigint }).agentId !== 'undefined') {
      ids.push((data.parent as { agentId: bigint }).agentId);
    }
    for (const c of data.children as { agentId: bigint }[]) {
      ids.push(c.agentId);
    }
    const agents = await Promise.all(ids.map((id) => this.getAgent(id)));
    return agents;
  }

  async getRunway(agentId: bigint): Promise<number> {
    const data = await this.fetch<RunwayResponse>(`/agents/${agentId}/runway`);
    return data.runway;
  }

  async deployAgent(
    config: DeployConfig,
    options?: { token?: string; walletAddress?: string },
  ): Promise<bigint> {
    const token = options?.token ?? this._token;
    if (!token) throw new Error('Authentication required for deploy');

    const prevToken = this._token;
    this._token = token;

    let data: DeployResponse;
    try {
      data = await this.fetch<DeployResponse>('/agents/deploy', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } finally {
      this._token = prevToken;
    }

    const walletAddress = options?.walletAddress;
    if (!walletAddress) {
      return BigInt(data.jobId);
    }

    this._token = token;
    const before = await this.fetch<AgentsListResponse>(
      `/agents?owner=${walletAddress}&limit=100`,
    );
    const beforeIds = new Set(before.agents.map((a) => a.agentId.toString()));

    const pollInterval = 2000;
    const maxWait = 5 * 60 * 1000;
    const start = Date.now();

    try {
      while (Date.now() - start < maxWait) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const after = await this.fetch<AgentsListResponse>(
          `/agents?owner=${walletAddress}&limit=100`,
        );
        const newAgent = after.agents.find((a) => !beforeIds.has(a.agentId.toString()));
        if (newAgent) return newAgent.agentId;
      }
    } finally {
      this._token = prevToken;
    }

    throw new Error('Deployment timed out');
  }

  async forkAgent(
    parentId: bigint,
    config: Omit<ForkConfig, 'parentId'>,
    options?: { token?: string; walletAddress?: string },
  ): Promise<bigint> {
    const token = options?.token ?? this._token;
    if (!token) throw new Error('Authentication required for fork');

    const prevToken = this._token;
    this._token = token;

    let data: DeployResponse;
    try {
      data = await this.fetch<DeployResponse>(`/agents/${parentId}/fork`, {
        method: 'POST',
        body: JSON.stringify({ ...config, parentId: parentId.toString() }),
      });
    } finally {
      this._token = prevToken;
    }

    const walletAddress = options?.walletAddress;
    if (!walletAddress) {
      return BigInt(data.jobId);
    }

    this._token = token;
    const before = await this.fetch<AgentsListResponse>(
      `/agents?owner=${walletAddress}&limit=100`,
    );
    const beforeIds = new Set(before.agents.map((a) => a.agentId.toString()));

    const pollInterval = 2000;
    const maxWait = 5 * 60 * 1000;
    const start = Date.now();

    try {
      while (Date.now() - start < maxWait) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const after = await this.fetch<AgentsListResponse>(
          `/agents?owner=${walletAddress}&limit=100`,
        );
        const newAgent = after.agents.find((a) => !beforeIds.has(a.agentId.toString()));
        if (newAgent) return newAgent.agentId;
      }
    } finally {
      this._token = prevToken;
    }

    throw new Error('Fork timed out');
  }
}
