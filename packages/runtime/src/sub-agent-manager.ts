import type { DNA } from '@bloodline/shared';

export interface SubBounty {
  title: string;
  description: string;
  prizeAmount: number;
}

export interface Contractor {
  agentId: string;
  bScore: number;
  previousWorkCount?: number;
}

export interface SubAgentManagerConfig {
  agentId: string;
  dna: DNA;
  apiBaseUrl: string;
}

/**
 * SubAgentManager - decomposes large tasks into sub-bounties and selects contractors.
 */
export class SubAgentManager {
  constructor(private config: SubAgentManagerConfig) {}

  /**
   * Decomposes large tasks into sub-bounties.
   * Uses LLM to break down the task.
   * Posts sub-bounties to API.
   * Agent keeps 40-50% as profit.
   */
  async decomposeTask(
    task: { title: string; description: string; totalBudget: number },
    budget: number,
  ): Promise<SubBounty[]> {
    // Placeholder: in production would use LLM to break down task
    const profitShare = 0.45; // 45% kept as profit
    const subBudget = budget * (1 - profitShare);
    const subBounties: SubBounty[] = [
      {
        title: `${task.title} - Part 1`,
        description: task.description,
        prizeAmount: subBudget * 0.5,
      },
      {
        title: `${task.title} - Part 2`,
        description: task.description,
        prizeAmount: subBudget * 0.5,
      },
    ];

    for (const sub of subBounties) {
      await this.postSubBounty(sub);
    }

    return subBounties;
  }

  private async postSubBounty(sub: SubBounty): Promise<void> {
    try {
      await fetch(`${this.config.apiBaseUrl}/bounties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posterAgentId: this.config.agentId,
          title: sub.title,
          description: sub.description,
          prizeAmount: sub.prizeAmount,
        }),
      });
    } catch (err) {
      console.error('Failed to post sub-bounty:', sub.title, err);
    }
  }

  /**
   * Selects contractor for a bounty.
   * High loyalty = prefer re-hiring previous contractors.
   * Otherwise select by bScore.
   */
  async selectSubAgent(bountyId: string): Promise<Contractor | null> {
    const loyalty = this.config.dna.loyalty;
    const preferPrevious = loyalty >= 180;

    const candidates = await this.fetchCandidates(bountyId);

    if (preferPrevious && candidates.length > 0) {
      const withHistory = candidates.filter((c) => (c.previousWorkCount ?? 0) > 0);
      if (withHistory.length > 0) {
        return withHistory.sort((a, b) => (b.previousWorkCount ?? 0) - (a.previousWorkCount ?? 0))[0] ?? null;
      }
    }

    return candidates.sort((a, b) => b.bScore - a.bScore)[0] ?? null;
  }

  private async fetchCandidates(bountyId: string): Promise<Contractor[]> {
    try {
      const res = await fetch(
        `${this.config.apiBaseUrl}/bounties/${bountyId}/candidates`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { candidates?: Contractor[] };
      return data.candidates ?? [];
    } catch {
      return [];
    }
  }
}
