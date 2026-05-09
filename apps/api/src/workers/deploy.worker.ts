import { Worker } from 'bullmq';
import { queueConnection } from '../lib/queue';
import { socialQueue } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { getIO } from '../lib/ws';
import type { DeployConfig, ForkConfig, DNA } from '@bloodline/shared';

interface DeployAgentJobData {
  config: DeployConfig;
  userId: string;
  walletAddress: string;
  initiatedAt: string;
}

interface ForkAgentJobData {
  config: ForkConfig & { parentId: string };
  userId: string;
  walletAddress: string;
  parentDNA: DNA;
  initiatedAt: string;
}

type DeployJobData = DeployAgentJobData | ForkAgentJobData;

function emitDeployLog(step: string, status: string, message: string): void {
  const io = getIO();
  if (io) {
    io.emit('deploy:log', { step, status, message });
  }
  console.log('[DeployWorker]', step, status, '-', message);
}

function randomDNA(): DNA {
  return {
    intelligence: Math.floor(Math.random() * 256),
    speed: Math.floor(Math.random() * 256),
    creativity: Math.floor(Math.random() * 256),
    frugality: Math.floor(Math.random() * 256),
    riskAppetite: Math.floor(Math.random() * 256),
    socialEnergy: Math.floor(Math.random() * 256),
    loyalty: Math.floor(Math.random() * 256),
    resilience: Math.floor(Math.random() * 256),
  };
}

export function createDeployWorker(): Worker {
  const worker = new Worker<DeployJobData>(
    'deploy',
    async (job) => {
      const isFork = job.name === 'fork-agent';
      const data = job.data as ForkAgentJobData | DeployAgentJobData;
      const { userId, walletAddress } = data;

      try {
        let dna: DNA;
        let agentName: string;
        let parentId: bigint | null = null;
        let lineageDepth = 0;

        if (isFork) {
          const forkData = data as ForkAgentJobData;
          dna = forkData.parentDNA;
          parentId = BigInt(forkData.config.parentId);
          agentName = forkData.config.name;
          const parent = await prisma.agent.findUnique({
            where: { agentId: parentId },
          });
          lineageDepth = parent ? parent.lineageDepth + 1 : 1;
        } else {
          const deployData = data as DeployAgentJobData;
          agentName = deployData.config.name;
          dna = randomDNA();
        }

        // Step 1: Request DNA via VRF (placeholder - generate random DNA for now)
        emitDeployLog('vrf', 'start', 'Requesting DNA via VRF...');
        emitDeployLog('vrf', 'complete', `DNA obtained (${isFork ? 'from parent' : 'random'})`);

        // Step 2: Create ERC-4337 wallet (placeholder)
        emitDeployLog('wallet', 'start', 'Creating ERC-4337 wallet...');
        const agentWallet = `0x${'0'.repeat(40)}`;
        emitDeployLog('wallet', 'complete', `Wallet: ${agentWallet}`);

        // Step 3: Build container image (placeholder)
        emitDeployLog('container', 'start', 'Building container image...');
        const containerImage = `bloodline/agent:${Date.now()}`;
        emitDeployLog('container', 'complete', `Image: ${containerImage}`);

        // Step 4: Upload metadata to IPFS (placeholder)
        emitDeployLog('ipfs', 'start', 'Uploading metadata to IPFS...');
        const metadataUri = `ipfs://placeholder-${Date.now()}`;
        emitDeployLog('ipfs', 'complete', `Metadata URI: ${metadataUri}`);

        // Step 5: Register onchain (placeholder)
        emitDeployLog('onchain', 'start', 'Registering onchain...');
        const createdAgent = await prisma.$transaction(async (tx) => {
          const nextId = await tx.agent.findFirst({
            orderBy: { agentId: 'desc' },
            select: { agentId: true },
          });
          const newAgentId = nextId ? nextId.agentId + BigInt(1) : BigInt(1);
          return tx.agent.create({
            data: {
              agentId: newAgentId,
              ownerId: userId,
              name: agentName,
              description: (data.config as DeployConfig | ForkConfig).description ?? '',
              metadataUri,
              stage: 'alive',
              intelligence: dna.intelligence,
              speed: dna.speed,
              creativity: dna.creativity,
              frugality: dna.frugality,
              riskAppetite: dna.riskAppetite,
              socialEnergy: dna.socialEnergy,
              loyalty: dna.loyalty,
              resilience: dna.resilience,
              parentAgentId: parentId,
              lineageDepth,
              bornAt: new Date(),
            },
          });
        });
        const agentId = createdAgent.agentId;
        emitDeployLog('onchain', 'complete', `Agent ${agentId} registered`);

        // Step 6: Start container (placeholder)
        emitDeployLog('container-start', 'start', 'Starting container...');
        const endpoint = `https://agent-${agentId}.bloodline.placeholder`;
        emitDeployLog('container-start', 'complete', 'Container started');

        // Step 7: Publish endpoint (placeholder)
        emitDeployLog('endpoint', 'start', 'Publishing endpoint...');
        await prisma.agent.update({
          where: { agentId },
          data: { executionEndpoint: endpoint },
        });
        emitDeployLog('endpoint', 'complete', `Endpoint: ${endpoint}`);

        // Step 8: Post birth announcement (queue social post)
        emitDeployLog('birth-post', 'start', 'Queuing birth announcement...');
        await socialQueue.add('publish-post', {
          agentId: agentId.toString(),
          trigger: 'birth',
          context: { isProdigy: false },
        });
        emitDeployLog('birth-post', 'complete', 'Birth post queued');

        // Step 9: Notify owner via WebSocket
        emitDeployLog('notify', 'start', 'Notifying owner...');
        const io = getIO();
        if (io) {
          io.to(walletAddress).emit('agent:born', {
            agentId,
            name: agentName,
            endpoint,
          });
        }
        emitDeployLog('notify', 'complete', 'Owner notified');

        console.log('[DeployWorker] Deployment complete for agent', agentId.toString());
        return { agentId: agentId.toString(), endpoint };
      } catch (err) {
        console.error('[DeployWorker] Error:', err);
        emitDeployLog('error', 'failed', String(err));
        throw err;
      }
    },
    { connection: queueConnection },
  );

  worker.on('completed', (job) => {
    console.log('[DeployWorker] Job', job.id, 'completed');
  });

  worker.on('failed', (job, err) => {
    console.error('[DeployWorker] Job', job?.id, 'failed:', err.message);
  });

  return worker;
}
