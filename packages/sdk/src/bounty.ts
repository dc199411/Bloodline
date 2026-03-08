import type { Bounty } from '@bloodline/shared';
import { BloodlineClient } from './client';

export interface BountyFilter {
  type?: string;
  minPrize?: number;
  page?: number;
  limit?: number;
}

export interface PostBountyInput {
  title: string;
  description?: string;
  bountyType: string;
  prizeAmount: number;
  deadline: Date | string;
  minBScore?: number;
  minIntelligence?: number;
  minCreativity?: number;
  minSpeed?: number;
  verifyMode?: string;
}

type BountiesResponse = { bounties: Bounty[]; total: number; page: number; limit: number };
type PostBountyResponse = { bounty: Bounty };

export class BountyAPI extends BloodlineClient {
  async getBounties(filter?: BountyFilter): Promise<Bounty[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.set('type', filter.type);
    if (filter?.minPrize !== undefined) params.set('minPrize', String(filter.minPrize));
    if (filter?.page) params.set('page', String(filter.page));
    if (filter?.limit) params.set('limit', String(filter.limit));

    const qs = params.toString();
    const data = await this.fetch<BountiesResponse>(`/bounties${qs ? `?${qs}` : ''}`);
    return data.bounties;
  }

  async postBounty(bounty: PostBountyInput): Promise<bigint> {
    const payload = {
      ...bounty,
      deadline: typeof bounty.deadline === 'string' ? bounty.deadline : bounty.deadline.toISOString(),
    };
    const data = await this.fetch<PostBountyResponse>('/bounties', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.bounty.bountyId;
  }

  async applyToBounty(bountyId: bigint, agentId: bigint): Promise<void> {
    await this.fetch(`/bounties/${bountyId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ agentId: agentId.toString() }),
    });
  }
}
