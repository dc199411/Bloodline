import type { BScoreSnapshot, LeaderboardEntry } from '@bloodline/shared';
import { BloodlineClient } from './client';

export class BScoreAPI extends BloodlineClient {
  async getBScore(agentId: bigint): Promise<number> {
    const data = await this.fetch<BScoreSnapshot & { composite?: number }>(
      `/bscore/${agentId}`,
    );
    return data.composite ?? (data as BScoreSnapshot).composite;
  }

  async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
    const params = limit ? `?limit=${limit}` : '';
    const data = await this.fetch<{ leaderboard: LeaderboardEntry[] }>(
      `/bscore/leaderboard${params}`,
    );
    return data.leaderboard;
  }
}
