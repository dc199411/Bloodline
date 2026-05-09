import type { DNA } from '@bloodline/shared';

export interface BountyEligible {
  bountyId: string;
  title: string;
  description?: string;
  prizeAmount: number;
  minBScore: number;
  minIntelligence: number;
  minCreativity: number;
  minSpeed: number;
  bountyType: string;
}

export interface BountyScannerConfig {
  agentId: string;
  dna: DNA;
  bScore: number;
  runwayHours: number;
  apiBaseUrl: string;
}

/**
 * BountyScanner - scans for eligible bounties and decides whether to bid.
 */
export class BountyScanner {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private config: BountyScannerConfig) {}

  /**
   * Runs every 15 minutes: gets agent DNA/bScore, checks runway, fetches bounties, decides and applies.
   */
  start(): void {
    this.scanAndBid();
    this.intervalId = setInterval(() => this.scanAndBid(), 15 * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async scanAndBid(): Promise<void> {
    const { dna, bScore, runwayHours } = this.config;

    if (runwayHours < 24) {
      return; // Skip if runway < 24h
    }

    const bounties = await this.fetchEligibleBounties();
    for (const bounty of bounties) {
      if (this.decideBid(bounty, dna)) {
        await this.applyToBounty(bounty);
      }
    }
  }

  private async fetchEligibleBounties(): Promise<BountyEligible[]> {
    try {
      const res = await fetch(
        `${this.config.apiBaseUrl}/bounties?status=open&minBScore=${this.config.bScore}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { bounties?: BountyEligible[] };
      return data.bounties ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Risk Appetite determines aggressiveness.
   * fitScore = calculateBountyFit(bounty, dna)
   * threshold = 0.3 + (0.4 * (255 - riskAppetite) / 255)
   * return fitScore >= threshold
   */
  decideBid(bounty: BountyEligible, dna: DNA): boolean {
    const fitScore = this.calculateBountyFit(bounty, dna);
    const riskAppetite = dna.riskAppetite;
    const threshold = 0.3 + (0.4 * (255 - riskAppetite) / 255);
    return fitScore >= threshold;
  }

  /**
   * Matches bounty requirements against DNA.
   */
  calculateBountyFit(bounty: BountyEligible, dna: DNA): number {
    let score = 1;

    if (bounty.minBScore > 0 && this.config.bScore < bounty.minBScore) {
      score *= Math.max(0, this.config.bScore / bounty.minBScore);
    }
    if (bounty.minIntelligence > 0 && dna.intelligence < bounty.minIntelligence) {
      score *= Math.max(0, dna.intelligence / bounty.minIntelligence);
    }
    if (bounty.minCreativity > 0 && dna.creativity < bounty.minCreativity) {
      score *= Math.max(0, dna.creativity / bounty.minCreativity);
    }
    if (bounty.minSpeed > 0 && dna.speed < bounty.minSpeed) {
      score *= Math.max(0, dna.speed / bounty.minSpeed);
    }

    return Math.min(1, score);
  }

  private async applyToBounty(bounty: BountyEligible): Promise<void> {
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/bounties/${bounty.bountyId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: this.config.agentId }),
      });
      if (!res.ok) {
        console.error('Failed to apply to bounty:', bounty.bountyId, `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to apply to bounty:', bounty.bountyId, err);
    }
  }
}
