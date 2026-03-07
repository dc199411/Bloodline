# BLOODLINE — Task Tracker

> Last updated: 2026-03-07
> Active tasks: 5 | Blocked: 0 | Done: 0

---

## ACTIVE

[IN_PROGRESS] TASK-001 | Foundation | "Initialize pnpm monorepo with Turborepo"
Priority: HIGH | Est: 1h | Started: 2026-03-07 | Owner: cursor
Description: Set up pnpm workspace, turbo.json, all package scaffolds
Blockers: none
Links: package.json, pnpm-workspace.yaml, turbo.json

[IN_PROGRESS] TASK-002 | Foundation | "Create .env.example with all variables"
Priority: HIGH | Est: 0.5h | Started: 2026-03-07 | Owner: cursor
Description: Document every environment variable from the master spec
Blockers: none
Links: .env.example

[IN_PROGRESS] TASK-003 | Foundation | "Build shared types package"
Priority: HIGH | Est: 1h | Started: 2026-03-07 | Owner: cursor
Description: DNA, Agent, Bounty, BScore, LifeStage TypeScript types
Blockers: none
Links: packages/shared/

[IN_PROGRESS] TASK-004 | Foundation | "Create Prisma schema"
Priority: HIGH | Est: 1h | Started: 2026-03-07 | Owner: cursor
Description: All database tables per Part 4 spec
Blockers: none
Links: apps/api/prisma/schema.prisma

[IN_PROGRESS] TASK-005 | Foundation | "Docker compose for local dev"
Priority: HIGH | Est: 0.5h | Started: 2026-03-07 | Owner: cursor
Description: PostgreSQL, Redis, Anvil fork containers
Blockers: none
Links: infra/docker-compose.yml

---

## BLOCKED

*(none)*

---

## DONE (last 10)

*(none yet)*

---

## NEXT UP

[PENDING] TASK-006 | Contracts | "Build BloodlineNFT.sol"
Priority: HIGH | Est: 3h | Owner: cursor
Description: ERC-721 with Birth NFTs (soulbound) and Death NFTs (tradeable after 30d), on-chain SVG

[PENDING] TASK-007 | Contracts | "Build BloodlineBScore.sol"
Priority: HIGH | Est: 2h | Owner: cursor
Description: Onchain reputation scoring with snapshots and leaderboard

[PENDING] TASK-008 | Contracts | "Build BloodlineRegistry.sol"
Priority: HIGH | Est: 3h | Owner: cursor
Description: Core agent registry with DNA, life stages, lineage tracking

[PENDING] TASK-009 | Contracts | "Build VRFConsumer.sol"
Priority: HIGH | Est: 3h | Owner: cursor
Description: Chainlink VRF randomness for DNA generation and mutation

[PENDING] TASK-010 | Contracts | "Build MetabolismOracle.sol"
Priority: HIGH | Est: 3h | Owner: cursor
Description: Hourly burn checks via Chainlink Automation, death trigger

[PENDING] TASK-011 | Contracts | "Build BountyBoard.sol"
Priority: HIGH | Est: 4h | Owner: cursor
Description: Job marketplace with escrow, payout, agent jury system

[PENDING] TASK-012 | Contracts | "Build RoyaltyRouter.sol"
Priority: HIGH | Est: 2h | Owner: cursor
Description: Lineage royalty distribution up to 3 generations

[PENDING] TASK-013 | Contracts | "Deploy script + Foundry tests"
Priority: HIGH | Est: 3h | Owner: cursor
Description: Deploy.s.sol with dependency-aware ordering, all test files

[PENDING] TASK-014 | API | "Express server + middleware setup"
Priority: HIGH | Est: 2h | Owner: cursor
Description: Server entry, auth middleware, rate limiter, validation

[PENDING] TASK-015 | API | "Auth routes + agent routes"
Priority: HIGH | Est: 3h | Owner: cursor
Description: Nonce/verify/refresh auth + full CRUD agent endpoints

---

## BACKLOG

TASK-016 | API | "Bounty routes + BScore routes"
TASK-017 | API | "BullMQ queues + Socket.io setup"
TASK-018 | API | "All services (agent, bounty, bscore, metabolism, social, lastWill, nft, royalty)"
TASK-019 | Runtime | "Docker base image + HTTP protocol"
TASK-020 | Runtime | "LangGraph state graph (plan → execute → review → output)"
TASK-021 | Runtime | "DNA-driven system prompts + bounty scanner"
TASK-022 | Runtime | "Sub-agent manager"
TASK-023 | Workers | "metabolism.worker.ts"
TASK-024 | Workers | "death.worker.ts"
TASK-025 | Workers | "social.worker.ts"
TASK-026 | Workers | "bscore.worker.ts"
TASK-027 | Workers | "deploy.worker.ts"
TASK-028 | Frontend | "Layout: StatusBar + BottomNav"
TASK-029 | Frontend | "Home page (feed, save banner, leaderboard)"
TASK-030 | Frontend | "Agent Profile page"
TASK-031 | Frontend | "Deploy Wizard (4 steps)"
TASK-032 | Frontend | "Bounty Board + Lineage Tree + Social Feed"
TASK-033 | Frontend | "WebSocket integration (all events)"
TASK-034 | Frontend | "Death Memorial page + Prodigy overlay"
TASK-035 | SDK | "TypeScript client SDK"
TASK-036 | CLI | "birth + fork CLI commands"
TASK-037 | Plugins | "6 official plugins"
TASK-038 | Scanner | "Recursive scanner (15 checks)"
TASK-039 | Docs | "Documentation site"
TASK-040 | CI/CD | "GitHub Actions pipeline"
TASK-041 | Landing | "Pixel-exact landing page (Part 20)"
TASK-042 | Deploy | "DEPLOYMENT.md walkthrough"
