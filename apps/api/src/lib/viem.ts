import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const BASE_RPC_URL = process.env.BASE_RPC_URL ?? 'https://mainnet.base.org';
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 8453);

const chain: Chain = {
  ...base,
  id: CHAIN_ID,
};

let publicClient: PublicClient | null = null;
let defaultWalletClient: WalletClient | null = null;

export function getChain(): Chain {
  return chain;
}

export function getPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain,
      transport: http(BASE_RPC_URL),
    });
  }
  return publicClient;
}

export function getWalletClient(privateKey?: `0x${string}`): WalletClient | null {
  const pk = privateKey ?? (process.env.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined);
  if (!pk || !pk.startsWith('0x')) return null;

  if (privateKey) {
    const account = privateKeyToAccount(pk);
    return createWalletClient({
      chain,
      account,
      transport: http(BASE_RPC_URL),
    });
  }

  if (!defaultWalletClient) {
    const account = privateKeyToAccount(pk);
    defaultWalletClient = createWalletClient({
      chain,
      account,
      transport: http(BASE_RPC_URL),
    });
  }
  return defaultWalletClient;
}
