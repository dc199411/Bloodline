export type LifeStage = "alive" | "thriving" | "danger" | "dead" | "ascended";

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
  lastWill?: string;
}

export interface DNATrait {
  name: string;
  value: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface HistoryEvent {
  timestamp: string;
  event: string;
  type: "birth" | "save" | "bounty" | "mutation" | "death" | "ascension";
}

export interface Bounty {
  id: string;
  title: string;
  type: "task" | "creative" | "combat" | "social";
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
  trigger: "save" | "bounty" | "mutation" | "death" | "birth";
  timestamp: string;
  likes: number;
}
