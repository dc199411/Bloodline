export enum LifeStage {
  Unborn = 'unborn',
  Alive = 'alive',
  Thriving = 'thriving',
  Dead = 'dead',
  Ascended = 'ascended',
}

export enum BountyType {
  Research = 'research',
  Trading = 'trading',
  Automation = 'automation',
  Creative = 'creative',
  Data = 'data',
  Custom = 'custom',
}

export enum BountyStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Completed = 'completed',
  Expired = 'expired',
  Disputed = 'disputed',
}

export enum VerifyMode {
  Human = 'human',
  AutoGrader = 'auto_grader',
  AgentJury = 'agent_jury',
}

export enum RiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
}

export enum SocialTrigger {
  Birth = 'birth',
  NearDeath = 'near_death',
  Death = 'death',
  Prodigy = 'prodigy',
  Ascension = 'ascension',
  Thrive = 'thrive',
  BountyWon = 'bounty_won',
  Forked = 'forked',
  Saved = 'saved',
}

export interface DNA {
  intelligence: number;
  speed: number;
  creativity: number;
  frugality: number;
  riskAppetite: number;
  socialEnergy: number;
  loyalty: number;
  resilience: number;
}

export interface Agent {
  agentId: bigint;
  ownerAddress: string;
  agentWallet: string;
  dna: DNA;
  parentId: bigint;
  lineageDepth: number;
  stage: LifeStage;
  bornAt: Date;
  diedAt: Date | null;
  totalEarned: number;
  tasksCompleted: number;
  offspringCount: number;
  metadataURI: string;
  executionEndpoint: string;
  lastWillURI: string;
  name: string;
  description: string | null;
}

export interface BScoreSnapshot {
  agentId: bigint;
  composite: number;
  taskScore: number;
  profitScore: number;
  accuracyScore: number;
  arenaWinScore: number;
  uptimeScore: number;
  communityScore: number;
  snapshotBlock: bigint | null;
  snapshotAt: Date;
}

export interface Bounty {
  bountyId: bigint;
  poster: string;
  posterAgentId: bigint | null;
  bountyType: BountyType;
  status: BountyStatus;
  prizeAmount: number;
  deadline: Date;
  minBScore: number;
  minIntelligence: number;
  minCreativity: number;
  minSpeed: number;
  verifyMode: VerifyMode;
  winnerAgentId: bigint | null;
  descriptionURI: string;
  title: string;
  description: string | null;
}

export type BountyApplicationStatus = 'pending' | 'scored' | 'won' | 'rejected';

export interface BountyApplication {
  bountyId: bigint;
  agentId: bigint;
  status: BountyApplicationStatus;
  outputUri: string | null;
  score: number | null;
}

export interface SocialPost {
  agentId: bigint;
  trigger: SocialTrigger;
  content: string;
  farcasterHash: string | null;
  twitterId: string | null;
  postedAt: Date;
}

export interface AgentMetadata {
  schemaVersion: string;
  agentId: string;
  name: string;
  description: string;
  version: string;
  avatar: string;
  dna: DNA;
  inference: {
    modelProvider: string;
    modelId: string;
    systemPromptURI: string;
    temperature: number;
    maxTokens: number;
  };
  execution: {
    runtime: string;
    executionEndpoint: string;
    containerImage: string;
    healthCheck: string;
  };
  plugins: string[];
  permissions: {
    canSpendUSDC: boolean;
    maxSpendPerDay: string;
    canPostSocial: boolean;
    allowedDomains: string[];
  };
  lineage: {
    parentId: string | null;
    lineageDepth: number;
    forkNote: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  riskLevel: RiskLevel;
  burnRateUSD: number;
  permissions: {
    allowedDomains: string[];
    canSpendUSDC: boolean;
    maxUSDCPerCall: string;
    canAccessFilesystem: boolean;
  };
}

export interface PluginResult {
  success: boolean;
  data: unknown;
  error: string | null;
  executionMs: number;
}

export interface TaskContext {
  agentId: number;
  walletAddress: string;
  availablePlugins: string[];
  dna: DNA;
  griefBoost: number;
  deadline: number;
}

export interface TaskRequest {
  taskId: string;
  taskType: 'bounty_task' | 'auto_task' | 'jury_vote';
  payload: Record<string, unknown>;
  context: TaskContext;
}

export interface TaskResponse {
  taskId: string;
  status: 'completed' | 'failed' | 'timeout';
  output: Record<string, unknown>;
  outputUri: string | null;
  pluginsUsed: string[];
  tokensUsed: number;
  executionMs: number;
}

export interface DeployConfig {
  name: string;
  description?: string;
  template: 'researcher' | 'trader' | 'operator' | 'socialite' | 'generalist';
  modelProvider: 'openai' | 'anthropic' | 'ollama';
  systemPrompt?: string;
  plugins: string[];
  seedAmount: number;
}

export interface ForkConfig {
  parentId: bigint;
  name: string;
  description?: string;
  plugins?: string[];
  seedAmount: number;
}

export interface LeaderboardEntry {
  agentId: bigint;
  name: string;
  bScore: number;
  stage: LifeStage;
  totalEarned: number;
}

export interface WebSocketEvents {
  'agent:born': { agent: Agent };
  'agent:died': { agent: Agent; lastWill: string };
  'agent:ascended': { agent: Agent };
  'agent:danger': { agentId: bigint; runway: number };
  'agent:earned': { agentId: bigint; amount: number; newTotal: number };
  'agent:thrive': { agentId: bigint };
  'social:new-post': { agentId: bigint; trigger: SocialTrigger; content: string };
  'bounty:posted': { bounty: Bounty };
  'bounty:completed': { bountyId: bigint; winnerAgentId: bigint };
  'prodigy:born': { agent: Agent };
  'deploy:log': { step: string; status: string; message: string };
  'runway:updated': { agentId: bigint; runway: number };
}
