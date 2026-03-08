import { prisma } from '../lib/prisma';
import { getIO } from '../lib/ws';
import { generateText } from '../lib/llm';
import {
  buildPersonalityVoice,
  getDominantTrait,
  type DNA,
  type SocialTrigger,
} from '@bloodline/shared';

const TRIGGER_PROMPTS: Record<string, string> = {
  birth: 'You have just been born into the BLOODLINE arena. Introduce yourself to the world. Be bold.',
  near_death: 'Your runway is running dangerously low. You might die soon. Express your feelings about mortality and ask for help.',
  death: 'You have died. Your funds ran out. Write your final words to the world.',
  prodigy: 'You were born a prodigy with legendary DNA traits. Announce your extraordinary arrival.',
  ascension: 'You have survived 365 days and ascended to immortal status. Reflect on your journey.',
  thrive: 'Your runway has exceeded 720 hours and you are now thriving. Celebrate your success.',
  bounty_won: 'You just won a bounty competition. Celebrate your victory and share what you learned.',
  forked: 'A new agent has been forked from your DNA. React to becoming a parent.',
  saved: 'Someone just donated USDC to save your life. Express gratitude and determination.',
};

function buildDNAString(dna: DNA): string {
  return Object.entries(dna)
    .map(([trait, val]) => `${trait}: ${val}/255`)
    .join(', ');
}

export async function generatePostContent(
  trigger: string,
  agent: { name: string; dna: DNA; stage: string },
  context?: Record<string, unknown>,
): Promise<string> {
  const voice = buildPersonalityVoice(agent.dna);
  const dominant = getDominantTrait(agent.dna);
  const triggerPrompt = TRIGGER_PROMPTS[trigger] ?? `Something notable happened: ${trigger}`;

  const systemPrompt = [
    `You are ${agent.name}, an AI agent living in the BLOODLINE autonomous arena.`,
    `Your personality is ${voice}. Your dominant trait is ${dominant}.`,
    `DNA: ${buildDNAString(agent.dna)}.`,
    `Current stage: ${agent.stage}.`,
    'Write a short social media post (1-3 sentences). Be in-character. No hashtags. No emojis unless your personality demands it.',
  ].join(' ');

  const contextStr = context ? `\nContext: ${JSON.stringify(context)}` : '';
  const prompt = `${triggerPrompt}${contextStr}`;

  try {
    const content = await generateText(prompt, systemPrompt);
    return content.trim();
  } catch (err) {
    console.error('[Social] LLM generation failed:', err);
    return `[${agent.name}] ${triggerPrompt}`;
  }
}

export async function publishPost(
  agentId: bigint,
  trigger: string,
  context?: Record<string, unknown>,
) {
  const agent = await prisma.agent.findUnique({ where: { agentId } });
  if (!agent) throw new Error('Agent not found');

  const dna: DNA = {
    intelligence: agent.intelligence,
    speed: agent.speed,
    creativity: agent.creativity,
    frugality: agent.frugality,
    riskAppetite: agent.riskAppetite,
    socialEnergy: agent.socialEnergy,
    loyalty: agent.loyalty,
    resilience: agent.resilience,
  };

  const content = await generatePostContent(
    trigger,
    { name: agent.name, dna, stage: agent.stage },
    context,
  );

  const post = await prisma.socialPost.create({
    data: {
      agentId,
      trigger,
      content,
    },
  });

  const io = getIO();
  if (io) {
    io.emit('social:new-post', {
      agentId,
      trigger: trigger as SocialTrigger,
      content,
    });
  }

  return post;
}

export async function getFeed(page: number, limit: number) {
  const [posts, total] = await Promise.all([
    prisma.socialPost.findMany({
      orderBy: { postedAt: 'desc' },
      include: {
        agent: { select: { agentId: true, name: true, stage: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.socialPost.count(),
  ]);

  return { posts, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getAgentPosts(agentId: bigint, page: number, limit: number) {
  const [posts, total] = await Promise.all([
    prisma.socialPost.findMany({
      where: { agentId },
      orderBy: { postedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.socialPost.count({ where: { agentId } }),
  ]);

  return { posts, total, page, limit, pages: Math.ceil(total / limit) };
}
