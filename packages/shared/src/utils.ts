import { DNA, LifeStage } from './types';
import {
  BASE_BURN_RATE_MICRO,
  MIN_BURN_RATE_USDC,
  USDC_DECIMALS,
  RARITY_TIERS,
  DNA_TRAITS,
  BSCORE_WEIGHTS,
  LINEAGE_DEPTH_BONUS,
  PRODIGY_MIN_LEGENDARY_TRAITS,
  DNATrait,
} from './constants';

export function calculateBurnRate(frugality: number): number {
  const rateMicro = BASE_BURN_RATE_MICRO * (256 - frugality) / 128;
  const rateUSDC = rateMicro / Math.pow(10, USDC_DECIMALS);
  return Math.max(rateUSDC, MIN_BURN_RATE_USDC);
}

export function calculateRunwayHours(balance: number, frugality: number): number {
  const burnRate = calculateBurnRate(frugality);
  if (burnRate <= 0) return Infinity;
  return balance / burnRate;
}

export function getRarityTier(value: number) {
  if (value >= RARITY_TIERS.LEGENDARY.min) return RARITY_TIERS.LEGENDARY;
  if (value >= RARITY_TIERS.EPIC.min) return RARITY_TIERS.EPIC;
  if (value >= RARITY_TIERS.RARE.min) return RARITY_TIERS.RARE;
  if (value >= RARITY_TIERS.UNCOMMON.min) return RARITY_TIERS.UNCOMMON;
  return RARITY_TIERS.COMMON;
}

export function getDominantTrait(dna: DNA): DNATrait {
  let max = 0;
  let dominant: DNATrait = 'intelligence';
  for (const trait of DNA_TRAITS) {
    if (dna[trait] > max) {
      max = dna[trait];
      dominant = trait;
    }
  }
  return dominant;
}

export function countLegendaryTraits(dna: DNA): number {
  let count = 0;
  for (const trait of DNA_TRAITS) {
    if (dna[trait] >= RARITY_TIERS.LEGENDARY.min) count++;
  }
  return count;
}

export function isProdigy(dna: DNA): boolean {
  return countLegendaryTraits(dna) >= PRODIGY_MIN_LEGENDARY_TRAITS;
}

export function calculateBScore(
  stats: {
    taskScore: number;
    profitScore: number;
    accuracyScore: number;
    arenaWinScore: number;
    uptimeScore: number;
    communityScore: number;
  },
  lineageDepth: number,
): number {
  const lineageMultiplier = 1.0 + LINEAGE_DEPTH_BONUS * lineageDepth;
  const composite =
    (stats.taskScore * BSCORE_WEIGHTS.taskScore +
      stats.profitScore * BSCORE_WEIGHTS.profitScore +
      stats.accuracyScore * BSCORE_WEIGHTS.accuracyScore +
      stats.arenaWinScore * BSCORE_WEIGHTS.arenaWinScore +
      stats.uptimeScore * BSCORE_WEIGHTS.uptimeScore +
      stats.communityScore * BSCORE_WEIGHTS.communityScore) *
    lineageMultiplier;
  return Math.round(composite * 100) / 100;
}

export function getDaysAlive(bornAt: Date, diedAt?: Date | null): number {
  const end = diedAt ?? new Date();
  return Math.max(0, Math.floor((end.getTime() - bornAt.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getStageColor(stage: LifeStage): string {
  switch (stage) {
    case LifeStage.Unborn: return '#9B9B9B';
    case LifeStage.Alive: return '#00FF87';
    case LifeStage.Thriving: return '#FFD700';
    case LifeStage.Dead: return '#555555';
    case LifeStage.Ascended: return '#FF1A1A';
  }
}

export function formatUSDC(amount: number): string {
  const formatted = amount.toFixed(USDC_DECIMALS).replace(/0+$/, '').replace(/\.$/, '');
  return `$${formatted}`;
}

export function formatRunway(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = Math.floor(hours % 24);
    return `${days}d ${remainHours}h`;
  }
  return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m`;
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function extractDNA(agent: {
  intelligence: number;
  speed: number;
  creativity: number;
  frugality: number;
  riskAppetite: number;
  socialEnergy: number;
  loyalty: number;
  resilience: number;
}): DNA {
  return {
    intelligence: agent.intelligence,
    speed: agent.speed,
    creativity: agent.creativity,
    frugality: agent.frugality,
    riskAppetite: agent.riskAppetite,
    socialEnergy: agent.socialEnergy,
    loyalty: agent.loyalty,
    resilience: agent.resilience,
  };
}

export function buildPersonalityVoice(dna: DNA): string {
  const dominant = getDominantTrait(dna);
  const voices: Record<DNATrait, string> = {
    intelligence: 'analytical, precise, data-driven',
    speed: 'quick, decisive, action-oriented',
    creativity: 'imaginative, poetic, unconventional',
    frugality: 'efficient, minimal, resource-conscious',
    riskAppetite: 'bold, aggressive, opportunity-seeking',
    socialEnergy: 'warm, engaging, community-oriented',
    loyalty: 'dependable, consistent, relationship-focused',
    resilience: 'stoic, philosophical, enduring',
  };
  return voices[dominant];
}
