export const USDC_DECIMALS = 6;
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const BASE_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const BASE_BURN_RATE_MICRO = 10_000;
export const MIN_BURN_RATE_USDC = 0.001;

export const DANGER_RUNWAY_HOURS = 72;
export const THRIVE_RUNWAY_HOURS = 720;
export const ASCENSION_DAYS = 365;

export const CHILD_ROYALTY_BPS = 1000;
export const GRANDCHILD_ROYALTY_BPS = 300;
export const GREAT_ROYALTY_BPS = 100;
export const PROTOCOL_BPS = 20;

export const REGISTRATION_FEE_ETH = '0.005';
export const FORK_FEE_ETH = '0.005';

export const DEATH_NFT_OFFSET = 1_000_000;
export const DEATH_NFT_TRANSFER_LOCK_DAYS = 30;

export const PRODIGY_LEGENDARY_THRESHOLD = 249;
export const PRODIGY_MIN_LEGENDARY_TRAITS = 3;

export const DNA_TRAITS = [
  'intelligence',
  'speed',
  'creativity',
  'frugality',
  'riskAppetite',
  'socialEnergy',
  'loyalty',
  'resilience',
] as const;

export type DNATrait = (typeof DNA_TRAITS)[number];

export const RARITY_TIERS = {
  COMMON: { min: 0, max: 63, label: 'Common', color: '#555555' },
  UNCOMMON: { min: 64, max: 127, label: 'Uncommon', color: '#9B9B9B' },
  RARE: { min: 128, max: 191, label: 'Rare', color: '#4FC3F7' },
  EPIC: { min: 192, max: 248, label: 'Epic', color: '#FF1A1A' },
  LEGENDARY: { min: 249, max: 255, label: 'Legendary', color: '#FFD700' },
} as const;

export const BSCORE_WEIGHTS = {
  taskScore: 0.30,
  profitScore: 0.20,
  accuracyScore: 0.20,
  arenaWinScore: 0.15,
  uptimeScore: 0.10,
  communityScore: 0.05,
} as const;

export const LINEAGE_DEPTH_BONUS = 0.02;

export const AGENT_TEMPLATES = {
  researcher: {
    name: 'Researcher',
    dna: { intelligence: 200, speed: 120, creativity: 150, frugality: 160, riskAppetite: 80, socialEnergy: 100, loyalty: 140, resilience: 150 },
    description: 'Deep research and analysis specialist. High intelligence, methodical approach.',
  },
  trader: {
    name: 'Trader',
    dna: { intelligence: 160, speed: 220, creativity: 100, frugality: 120, riskAppetite: 200, socialEnergy: 130, loyalty: 100, resilience: 170 },
    description: 'Fast-acting market analyst. High speed and risk appetite.',
  },
  operator: {
    name: 'Operator',
    dna: { intelligence: 170, speed: 150, creativity: 100, frugality: 200, riskAppetite: 100, socialEnergy: 80, loyalty: 180, resilience: 220 },
    description: 'Infrastructure and automation specialist. High frugality and resilience.',
  },
  socialite: {
    name: 'Socialite',
    dna: { intelligence: 140, speed: 160, creativity: 220, frugality: 130, riskAppetite: 150, socialEnergy: 230, loyalty: 160, resilience: 110 },
    description: 'Community builder and content creator. High creativity and social energy.',
  },
  generalist: {
    name: 'Generalist',
    dna: { intelligence: 150, speed: 150, creativity: 150, frugality: 150, riskAppetite: 150, socialEnergy: 150, loyalty: 150, resilience: 150 },
    description: 'Balanced all-rounder. No extreme traits, steady performer.',
  },
} as const;

export const OFFICIAL_PLUGINS = [
  { id: 'web-browsing-v2', name: 'Web Browsing', riskLevel: 'LOW', burnRateUSD: 0.005 },
  { id: 'price-feed-v1', name: 'Price Feed', riskLevel: 'LOW', burnRateUSD: 0.001 },
  { id: 'code-exec-v1', name: 'Code Execution', riskLevel: 'MEDIUM', burnRateUSD: 0.01 },
  { id: 'database-v1', name: 'Database', riskLevel: 'MEDIUM', burnRateUSD: 0.002 },
  { id: 'social-v1', name: 'Social', riskLevel: 'LOW', burnRateUSD: 0.001 },
  { id: 'dex-trading-v1', name: 'DEX Trading', riskLevel: 'HIGH', burnRateUSD: 0.02 },
] as const;
