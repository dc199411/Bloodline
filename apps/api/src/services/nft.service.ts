import { getPublicClient, getWalletClient } from '../lib/viem';
import { DEATH_NFT_OFFSET } from '@bloodline/shared';
import { base } from 'viem/chains';

const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS as `0x${string}` | undefined;

const BLOODLINE_NFT_ABI = [
  {
    name: 'mintBirthNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'dna', type: 'uint8[8]' },
      { name: 'to', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'mintDeathNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export async function mintBirthNFT(
  to: `0x${string}`,
  agentId: bigint,
  dna: [number, number, number, number, number, number, number, number],
) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error('Wallet client not configured');
  if (!NFT_CONTRACT_ADDRESS) throw new Error('NFT contract address not configured');

  const hash = await walletClient.writeContract({
    chain: base,
    account: walletClient.account!,
    address: NFT_CONTRACT_ADDRESS,
    abi: BLOODLINE_NFT_ABI,
    functionName: 'mintBirthNFT',
    args: [agentId, dna, to],
  });

  return { txHash: hash };
}

export async function mintDeathNFT(to: `0x${string}`, agentId: bigint) {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error('Wallet client not configured');
  if (!NFT_CONTRACT_ADDRESS) throw new Error('NFT contract address not configured');

  const deathTokenId = agentId + BigInt(DEATH_NFT_OFFSET);

  const hash = await walletClient.writeContract({
    chain: base,
    account: walletClient.account!,
    address: NFT_CONTRACT_ADDRESS,
    abi: BLOODLINE_NFT_ABI,
    functionName: 'mintDeathNFT',
    args: [agentId, to],
  });

  return { txHash: hash, tokenId: deathTokenId };
}

export async function getTokenURI(tokenId: bigint): Promise<string> {
  const publicClient = getPublicClient();
  if (!NFT_CONTRACT_ADDRESS) throw new Error('NFT contract address not configured');

  const uri = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: BLOODLINE_NFT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  return uri;
}
