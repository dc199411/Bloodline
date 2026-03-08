import { getWalletClient } from '../lib/viem';
import { base } from 'viem/chains';

const ROYALTY_ROUTER_ADDRESS = process.env.ROYALTY_ROUTER_ADDRESS as `0x${string}` | undefined;

const ROYALTY_ROUTER_ABI = [
  {
    name: 'routeEarning',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'distributeLegacyPool',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'deadAgentId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export async function routeEarning(agentId: bigint, amount: bigint) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error('Wallet client not configured');
  if (!ROYALTY_ROUTER_ADDRESS) throw new Error('Royalty router address not configured');

  const hash = await walletClient.writeContract({
    chain: base,
    account: walletClient.account!,
    address: ROYALTY_ROUTER_ADDRESS,
    abi: ROYALTY_ROUTER_ABI,
    functionName: 'routeEarning',
    args: [agentId, amount],
  });

  return { txHash: hash };
}

export async function distributeLegacyPool(deadAgentId: bigint) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error('Wallet client not configured');
  if (!ROYALTY_ROUTER_ADDRESS) throw new Error('Royalty router address not configured');

  const hash = await walletClient.writeContract({
    chain: base,
    account: walletClient.account!,
    address: ROYALTY_ROUTER_ADDRESS,
    abi: ROYALTY_ROUTER_ABI,
    functionName: 'distributeLegacyPool',
    args: [deadAgentId],
  });

  return { txHash: hash };
}
