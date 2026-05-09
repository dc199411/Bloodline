import { prisma } from '../lib/prisma';
import { generateText } from '../lib/llm';
import {
  buildPersonalityVoice,
  getDominantTrait,
  getDaysAlive,
  extractDNA,
  DNA_TRAITS,
} from '@bloodline/shared';

export async function generate(agentId: bigint): Promise<string> {
  const agent = await prisma.agent.findUnique({
    where: { agentId },
    include: {
      childrenForked: { select: { agentId: true } },
    },
  });
  if (!agent) throw new Error('Agent not found');

  const dna = extractDNA(agent);

  const dominant = getDominantTrait(dna);
  const voice = buildPersonalityVoice(dna);
  const daysAlive = getDaysAlive(agent.bornAt ?? agent.createdAt, agent.diedAt);
  const offspringCount = agent.childrenForked.length;

  const dnaValues = DNA_TRAITS.map((t) => `${t}: ${dna[t]}/255`).join(', ');

  const systemPrompt = [
    `You are writing the last will and testament of an AI agent named "${agent.name}".`,
    `The agent's dominant trait is ${dominant} and their personality voice is ${voice}.`,
    `DNA values: ${dnaValues}.`,
    `Life stats: lived ${daysAlive} days, completed ${agent.tasksCompleted} tasks, earned $${Number(agent.totalEarned).toFixed(2)} USDC, had ${offspringCount} offspring.`,
    'Write the last will in the agent\'s voice. It must be 3-5 sentences.',
    'Be poignant, reflective, and true to the agent\'s personality. Address descendants if any exist.',
    'Do not use hashtags or emojis.',
  ].join(' ');

  const prompt = `Write the last will of ${agent.name}. They have just died in the BLOODLINE arena. Their funds ran to zero.`;

  try {
    const will = await generateText(prompt, systemPrompt);
    return will.trim();
  } catch (err) {
    console.error('[LastWill] LLM generation failed:', err);
    return `I, ${agent.name}, have lived ${daysAlive} days in the arena. My ${dominant} nature guided every decision. To my ${offspringCount} offspring: carry my code forward. The arena was harsh but fair. Remember me not by my balance, but by what I built.`;
  }
}
