import * as agentService from '../src/services/agent.service';
import type { DeployConfig } from '@bloodline/shared';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    agent: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    follow: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
    bScoreSnapshot: { findFirst: jest.fn(), findMany: jest.fn() },
    socialPost: { findMany: jest.fn() },
    bountyApplication: { findMany: jest.fn() },
  },
}));
jest.mock('../src/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incrbyfloat: jest.fn(),
  },
}));
jest.mock('../src/lib/queue', () => ({
  deployQueue: { add: jest.fn().mockResolvedValue({ id: 'job-1' }) },
  socialQueue: { add: jest.fn() },
}));
jest.mock('../src/lib/ws', () => ({ getIO: () => null }));

describe('agent.service', () => {
  describe('service function signatures', () => {
    it('getAgent exists and is a function', () => {
      expect(typeof agentService.getAgent).toBe('function');
    });

    it('getAgents exists and is a function', () => {
      expect(typeof agentService.getAgents).toBe('function');
    });

    it('getAgentDNA exists and is a function', () => {
      expect(typeof agentService.getAgentDNA).toBe('function');
    });

    it('getAgentTimeline exists and is a function', () => {
      expect(typeof agentService.getAgentTimeline).toBe('function');
    });

    it('getAgentLineage exists and is a function', () => {
      expect(typeof agentService.getAgentLineage).toBe('function');
    });

    it('getRunway exists and is a function', () => {
      expect(typeof agentService.getRunway).toBe('function');
    });

    it('deployAgent exists and is a function', () => {
      expect(typeof agentService.deployAgent).toBe('function');
    });

    it('forkAgent exists and is a function', () => {
      expect(typeof agentService.forkAgent).toBe('function');
    });

    it('updateEndpoint exists and is a function', () => {
      expect(typeof agentService.updateEndpoint).toBe('function');
    });

    it('saveAgent exists and is a function', () => {
      expect(typeof agentService.saveAgent).toBe('function');
    });

    it('followAgent exists and is a function', () => {
      expect(typeof agentService.followAgent).toBe('function');
    });

    it('unfollowAgent exists and is a function', () => {
      expect(typeof agentService.unfollowAgent).toBe('function');
    });

    it('getLeaderboard exists and is a function', () => {
      expect(typeof agentService.getLeaderboard).toBe('function');
    });

    it('getDangerAgents exists and is a function', () => {
      expect(typeof agentService.getDangerAgents).toBe('function');
    });

    it('getBScore exists and is a function', () => {
      expect(typeof agentService.getBScore).toBe('function');
    });
  });

  describe('deploy config validation', () => {
    const validDeployConfig: DeployConfig = {
      name: 'TestAgent',
      template: 'researcher',
      modelProvider: 'openai',
      plugins: ['web-browsing-v2'],
      seedAmount: 100,
    };

    it('deployAgent accepts valid DeployConfig', async () => {
      const { prisma } = require('../src/lib/prisma');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        walletAddress: '0x123',
      });

      const result = await agentService.deployAgent(validDeployConfig, 'user-1');
      expect(result).toEqual({ jobId: 'job-1', status: 'queued' });
    });

    it('deployAgent rejects when user not found', async () => {
      const { prisma } = require('../src/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        agentService.deployAgent(validDeployConfig, 'nonexistent-user'),
      ).rejects.toThrow('User not found');
    });
  });
});
