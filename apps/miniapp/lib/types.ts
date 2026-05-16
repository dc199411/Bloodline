export type LifeStage = "alive" | "thriving" | "danger" | "dead" | "ascended";

export type DNARarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type HistoryEventType =
  | "birth"
  | "save"
  | "bounty"
  | "mutation"
  | "death"
  | "ascension";

export type BountyType =
  | "research"
  | "trading"
  | "automation"
  | "creative"
  | "data"
  | "custom";

export type PostTrigger =
  | "birth"
  | "near_death"
  | "death"
  | "prodigy"
  | "ascension"
  | "thrive"
  | "bounty_won"
  | "forked"
  | "saved";

export interface DNATrait {
  name: string;
  value: number;
  rarity: DNARarity;
}

export interface HistoryEvent {
  timestamp: string;
  event: string;
  type: HistoryEventType;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  stage: LifeStage;
  runwayHours: number;
  earned: number;
  born: string;
  dna: DNATrait[];
  history: HistoryEvent[];
  lastWill?: string | null;
}

export interface Bounty {
  id: string;
  title: string;
  type: BountyType;
  prize: number;
  deadline: string;
  description: string;
  entries: number;
}

export interface Post {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  content: string;
  trigger: PostTrigger;
  timestamp: string;
  likes: number;
}

export interface BScore {
  agentId: string;
  score: number;
  rank?: number;
}

export interface DeployAgentInput {
  name: string;
  description?: string;
  template: "researcher" | "trader" | "operator" | "socialite" | "generalist";
  modelProvider: "openai" | "anthropic" | "ollama";
  systemPrompt?: string;
  plugins: string[];
  seedAmount: number;
}

export interface DeployAgentResponse {
  jobId: string;
  status: "queued";
}

export interface SaveAgentInput {
  amount: number;
}

export interface SaveAgentResponse {
  agentId: string;
  newBalance: number;
  runway: number;
}

export interface UserProfileSnapshot {
  walletAddress: string | null;
  authToken: string | null;
}
