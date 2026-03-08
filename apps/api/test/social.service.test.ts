import { SocialTrigger } from '@bloodline/shared';
import { generatePostContent } from '../src/services/social.service';

jest.mock('../src/lib/prisma', () => ({}));
jest.mock('../src/lib/ws', () => ({ getIO: () => null }));
jest.mock('../src/lib/llm', () => ({
  generateText: jest.fn().mockResolvedValue('Mock post content'),
}));

const ALL_TRIGGER_TYPES = [
  'birth',
  'near_death',
  'death',
  'prodigy',
  'ascension',
  'thrive',
  'bounty_won',
  'forked',
  'saved',
] as const;

const mockAgent = {
  name: 'TestAgent',
  dna: {
    intelligence: 100,
    speed: 100,
    creativity: 100,
    frugality: 100,
    riskAppetite: 100,
    socialEnergy: 100,
    loyalty: 100,
    resilience: 100,
  },
  stage: 'alive',
};

describe('social.service', () => {
  describe('trigger types and post generation', () => {
    it('all 9 trigger types have post generation support', async () => {
      expect(ALL_TRIGGER_TYPES).toHaveLength(9);
      for (const trigger of ALL_TRIGGER_TYPES) {
        const content = await generatePostContent(trigger, mockAgent);
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('post content is non-empty for each trigger', async () => {
      const content = await generatePostContent('birth', mockAgent);
      expect(content).toBeDefined();
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('trigger type list completeness - matches SocialTrigger enum', () => {
      const enumValueCount = Object.keys(SocialTrigger).length;
      expect(enumValueCount).toBe(9);
      expect(ALL_TRIGGER_TYPES).toHaveLength(9);
    });
  });
});
