# BLOODLINE — Mainnet Deployment Walkthrough

> Complete guide to deploying BLOODLINE to Base Mainnet.
> Estimated time: 2-4 hours for a first deployment.
> Prerequisites: Node.js 20+, pnpm, Docker, Foundry, a funded Base wallet.

---

## Pre-Deployment Checklist

Before starting, verify:

- [ ] All contract tests passing: `forge test -vvv` — zero failures
- [ ] All API tests passing: `pnpm run test --filter=api` — zero failures
- [ ] Recursive scanner clean: `pnpm run scan` — zero CRITICAL/ERROR
- [ ] TypeScript compiles: `pnpm run typecheck` — zero errors
- [ ] Docker images build: `docker build ./packages/runtime` — succeeds
- [ ] Staging deploy tested on Base Sepolia
- [ ] .env.local filled with all production values
- [ ] Deployer wallet holds >= 0.1 ETH on Base Mainnet for gas
- [ ] Pinata account active with API key
- [ ] Arweave wallet funded for Last Will storage
- [ ] Chainlink VRF subscription funded (>= 5 LINK on Base)
- [ ] Chainlink Automation upkeep funded (>= 5 LINK on Base)
- [ ] Farcaster account + signer UUID ready
- [ ] Database (PostgreSQL) provisioned
- [ ] Redis provisioned

---

## Step 1 — Environment Setup

```bash
git clone https://github.com/bloodlineai-xyz/bloodline
cd bloodline
pnpm install
cp .env.example .env.local
```

Open .env.local and fill every variable.

---

## Step 2 — Database Setup

```bash
cd apps/api
npx prisma migrate deploy
npx prisma migrate status
```

---

## Step 3 — Smart Contract Deployment

```bash
cd packages/contracts
forge build
forge test -vvv
forge script script/Deploy.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

After deployment, copy contract addresses to .env.local.

---

## Step 4 — Chainlink Setup

### VRF Subscription
1. Go to vrf.chain.link
2. Select Base Mainnet
3. Add VRF subscription ID to .env.local
4. Add the VRFConsumer contract as a consumer

### Automation Upkeep
1. Go to automation.chain.link
2. Create new upkeep: "Custom Logic"
3. Target: MetabolismOracle contract address
4. Set check interval: 3600 (1 hour)
5. Fund with LINK

---

## Step 5 — Build and Push Docker Images

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/bloodlineai-xyz/agent-runtime:latest \
  --push \
  ./packages/runtime
```

---

## Step 6 — Deploy API Server

```bash
cd apps/api
fly launch --name bloodlineai-api --region sjc
fly secrets import < .env.local
fly deploy
curl https://bloodlineai-api.fly.dev/health
```

---

## Step 7 — Deploy Miniapp

```bash
cd apps/miniapp
vercel --prod
```

---

## Step 8 — Deploy First Agent (Smoke Test)

```bash
pnpm run birth --template generalist --name "Bloodline-Genesis"
```

---

## Rollback Procedure

1. Pause Chainlink Automation upkeep (stops metabolism checks)
2. Roll back API: `fly deploy --image bloodlineai-api:previous-tag`
3. Roll back miniapp: Vercel Deployments -> Promote previous
4. Contracts: deploy new version with fix, update all addresses

---

## Ongoing Maintenance

After every code update, run the update loop:
```bash
pnpm run scan
pnpm run test
forge test
git commit -m "docs: sync loop after [description]"
```
