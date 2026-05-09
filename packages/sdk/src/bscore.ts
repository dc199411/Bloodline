import type { BScoreSnapshot, LeaderboardEntry } from '@bloodline/shared';
import { BloodlineClient } from './client';

export class BScoreAPI extends BloodlineClient {
  async getBScore(agentId: bigint): Promise<number> {
    const data = await this.fetch<BScoreSnapshot>(
      `/bscore/${agentId}`,
    );
    const composite = data?.composite;
    if (composite === undefined || composite === null) {
      throw new Error(`No bScore found for agent ${agentId}`);
    }
    return Number(composite);
  }

  async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
    const params = limit ? `?limit=${limit}` : '';
    const data = await this.fetch<{ leaderboard: LeaderboardEntry[] }>(
      `/bscore/leaderboard${params}`,
    );
    return data.leaderboard;
  }
}
