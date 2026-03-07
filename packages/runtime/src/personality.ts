import type { DNA } from '@bloodline/shared';

export interface DNAModifier {
  trait: keyof DNA;
  value: number;
  description: string;
}

/**
 * DNA trait mappings to personality descriptions for system prompt generation.
 * intelligence -> analytical, creativity -> lateral thinking, etc.
 */
const DNA_TRAIT_PERSONALITY_MAP: Record<keyof DNA, (value: number) => string> = {
  intelligence: (v) =>
    v >= 200 ? 'highly analytical and precise' : v >= 128 ? 'analytical and methodical' : 'practical and straightforward',
  speed: (v) =>
    v >= 200 ? 'quick and decisive' : v >= 128 ? 'efficient and responsive' : 'deliberate and thorough',
  creativity: (v) =>
    v >= 200 ? 'highly creative with lateral thinking' : v >= 128 ? 'creative and innovative' : 'structured and conventional',
  frugality: (v) =>
    v >= 200 ? 'extremely resource-conscious' : v >= 128 ? 'efficient and cost-aware' : 'generous with resources',
  riskAppetite: (v) =>
    v >= 200 ? 'bold and opportunity-seeking' : v >= 128 ? 'moderately risk-tolerant' : 'cautious and conservative',
  socialEnergy: (v) =>
    v >= 200 ? 'highly engaging and community-oriented' : v >= 128 ? 'collaborative and communicative' : 'reserved and focused',
  loyalty: (v) =>
    v >= 200 ? 'deeply dependable and relationship-focused' : v >= 128 ? 'reliable and consistent' : 'independent and flexible',
  resilience: (v) =>
    v >= 200 ? 'highly stoic and enduring' : v >= 128 ? 'resilient and adaptable' : 'sensitive to setbacks',
};

/**
 * Returns a list of behavioral modifiers derived from DNA traits.
 */
export function getDNAModifiers(dna: DNA): DNAModifier[] {
  const modifiers: DNAModifier[] = [];
  for (const [trait, fn] of Object.entries(DNA_TRAIT_PERSONALITY_MAP)) {
    const value = dna[trait as keyof DNA];
    const description = fn(value);
    modifiers.push({
      trait: trait as keyof DNA,
      value,
      description,
    });
  }
  return modifiers;
}

/**
 * Builds a personality-aware system prompt from DNA and optional grief boost.
 * DNA modifies the system prompt generation (intelligence -> analytical, creativity -> lateral thinking, etc.)
 * Grief boost can amplify certain traits when the agent is under stress.
 */
export function buildSystemPrompt(dna: DNA, griefBoost: number = 0): string {
  const modifiers = getDNAModifiers(dna);

  const personalityParts = modifiers.map((m) => m.description);
  let basePersonality = `You are an AI agent with the following behavioral traits: ${personalityParts.join('; ')}.`;

  if (griefBoost > 0) {
    basePersonality += ` You are currently under elevated stress (grief boost: ${griefBoost}). Prioritize survival-oriented decisions and efficiency.`;
  }

  basePersonality +=
    ' Respond to tasks clearly and concisely. Use available plugins when they would help. Format outputs as requested.';

  return basePersonality;
}
