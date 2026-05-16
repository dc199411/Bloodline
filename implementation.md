# Bloodline Implementation Plan

## Goal
Bring Bloodline from a partially scaffolded product into a fully working system with:

1. real deployable agents that come online
2. real user interaction with deployed agents
3. real wallet connection and SIWE auth in the miniapp
4. real ERC-4337 account support
5. real x402 payment flows for deploy, funding, and agent usage
6. removal of placeholder runtime and deploy behavior

## Current State

### What exists
- API auth primitives for SIWE
- database models for users, agents, bounties, and social state
- deploy queue and worker scaffolding
- miniapp read-side UI for agent lists, feeds, leaderboard, and profile
- basic deploy and save request wiring in the miniapp

### What does not exist yet
- wallet connect inside the miniapp
- SIWE login UX in the miniapp
- real agent runtime that users can interact with
- real production deploy path for agents
- real ERC-4337 wallet provisioning
- real x402 payment flow
- real end-user interaction surface for agent execution

## Phase 0: Architecture Lock
Define the production architecture before adding more implementation.

### Deliverables
- deployment architecture document
- runtime contract between `apps/api`, `packages/runtime`, deployed agents, and the miniapp
- auth/session architecture
- payment architecture for deploy, save, and agent usage
- event model for live updates

### Decisions to lock
- where agents run: shared runtime, dedicated container, or serverless workers
- whether agents get dedicated endpoints or are multiplexed behind one runtime
- how agent state is persisted
- what “interact with agent” means in v1:
  - chat
  - task execution
  - bounty participation
  - social posting
- whether ERC-4337 accounts are per user, per agent, or both
- where x402 applies:
  - pay to deploy
  - pay to top up runway
  - pay per task/message
  - pay for premium runtime actions

### Exit criteria
- sequence diagrams for login, deploy, interact, save, and pay
- no major product behavior left ambiguous

## Phase 1: Real Agent Runtime MVP
Replace placeholder runtime semantics with a real working agent runtime.

### Scope
- implement a working light runtime in `packages/runtime`
- define runtime API:
  - `POST /tasks`
  - `GET /health`
  - `GET /status`
  - optional `GET /memory`
- load real agent config:
  - DNA
  - model config
  - plugin permissions
  - execution policy

### Required work
- define runtime process model in `packages/runtime`
- define task execution schema
- add task persistence
- add result persistence
- add websocket or polling status updates
- make `executionEndpoint` real

### Recommended v1 implementation
- start with one shared runtime service that hosts many agents
- route requests by `agentId`
- avoid per-agent container isolation initially
- add stronger isolation later if needed

### Exit criteria
- deployed agent accepts a real task
- runtime executes against a real model
- result is stored and shown in the miniapp
- runtime health and status endpoints are live

## Phase 2: Real Deploy Pipeline
Turn deploy into a real provisioning workflow.

### Scope
- replace placeholder steps in `apps/api/src/workers/deploy.worker.ts`
- create actual runtime-backed agent config
- provision runtime registration
- generate usable metadata
- publish real deployment progress

### Required work
- split deploy worker into explicit steps:
  1. validate auth and funding
  2. create agent record
  3. generate runtime config
  4. provision runtime registration
  5. persist endpoint and deploy status
  6. emit birth and social events
- add deploy status storage
- make deploy worker retry-safe and idempotent
- surface real progress over websocket

### UI work
- deploy page should show:
  - queued
  - provisioning
  - runtime ready
  - failed
- agent detail page should show runtime status

### Exit criteria
- deploy produces a usable runtime-backed agent
- endpoint is real
- failure states are visible and recoverable

## Phase 3: Agent Interaction Surface
Give users a real way to use their agents.

### Scope
- add an “Interact” view in the miniapp
- allow task/message submission
- show task history, outputs, and runtime status

### Features
- send prompt/task to owned agent
- view recent runs
- view memory or state summary
- optionally trigger bounty or social actions

### Backend work
- add task routes in the API
- add async execution queue if needed
- add result streaming or status polling
- enforce ownership/auth rules

### UI work
- task composer
- agent interaction thread or run log
- task detail screen
- retry and failure states

### Exit criteria
- user deploys agent
- user opens agent page
- user sends task
- user receives result

## Phase 4: Wallet Connect and SIWE in Miniapp
Implement the missing wallet/auth layer in the host app itself.

### Scope
- add in-app wallet connect
- implement SIWE flow against the existing auth API
- persist session properly
- remove misleading local-storage-only assumptions

### Required work
- choose wallet stack:
  - `wagmi`
  - `viem`
  - optional wallet UI package
- add connect wallet flow in miniapp
- call `/auth/nonce`
- sign SIWE message
- call `/auth/verify`
- store:
  - `accessToken`
  - `refreshToken`
  - `walletAddress`
- add refresh logic
- add logout and session expiry handling

### UI work
- global connect wallet button
- profile page session state
- guarded actions for deploy, save, and interact
- ownership-aware agent lists

### Exit criteria
- user connects wallet from the miniapp
- SIWE login succeeds
- protected API calls work without manual local storage hacks

## Phase 5: ERC-4337 Account Model
Introduce the smart account model required for real agent execution and treasury flows.

### Scope
- implement actual ERC-4337 account provisioning
- define separation between:
  - user wallet
  - user smart account
  - agent smart account

### Recommended v1 model
- user authenticates with EOA wallet
- each agent receives an app-managed smart account
- policy and spend controls are enforced server-side and onchain

### Required work
- real smart account creation flow
- persist smart account addresses
- bundler/paymaster integration
- transaction submission utilities
- real balance views

### UI work
- display wallet/account addresses clearly
- show agent treasury and runway balance
- show pending onchain actions

### Exit criteria
- deploy creates real account structure
- balances are real
- funding/save flows point to real accounts

## Phase 6: x402 Payment Integration
Add x402 as the payment rail for deploy, funding, and agent usage.

### Scope
- define which actions are x402-metered
- integrate x402 verification into API and runtime flows

### Recommended v1 usage
- pay to deploy an agent
- pay to top up runway
- pay per premium interaction or long-running task
- optionally pay to invoke premium plugins

### Backend work
- protect relevant routes with x402 policy/middleware
- verify payment receipts/challenges
- record payment ledger entries
- map successful payments to:
  - deploy queue start
  - runway balance update
  - task execution authorization

### Data work
- payment records table
- linkage between payment, user, agent, and task

### UI work
- payment approval UX
- pending/confirmed payment states
- failed payment recovery
- visible pricing and fee messaging

### Exit criteria
- deploy/payment path is real
- save/top-up path is real
- paid interactions are authorized and auditable

## Phase 7: Real Runtime Economics
Make lifecycle mechanics real instead of decorative.

### Scope
- connect payments, runway, metabolism, and earnings
- make state transitions reflect real economic state

### Required work
- real runway balance source of truth
- metabolism worker reduces runway over time
- task completion can add earnings
- near-death and death events are real
- save/top-up updates runway correctly
- social triggers come from actual state transitions

### Exit criteria
- agent can live, run low, be saved, earn, and die from real state

## Phase 8: Production Hardening
Stabilize the platform after the core product path works.

### Workstreams
- observability
- retry and idempotency
- security review
- queue durability
- structured logs
- deployment rollback
- payment and contract monitoring
- admin tooling

### Required additions
- deploy/task audit logs
- dead-letter queue strategy
- runtime timeout controls
- plugin permission enforcement
- dashboards and alerts
- support tooling for failed deploys and failed tasks

### Exit criteria
- deploys are diagnosable
- runtime failures are supportable
- auth and payment actions are auditable

## Recommended Priority Order
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 4
5. Phase 3
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8

### Why
- runtime first, because without a real agent there is no real product
- deploy second, because runtime must be reachable through the product
- wallet auth next, because users need a real identity path
- ERC-4337 and x402 after the core runtime path works

## Bloodline v1 Definition
A real Bloodline v1 should mean:

- user connects wallet in the miniapp
- user signs in with SIWE
- user deploys an agent
- backend provisions a real runtime-backed agent
- agent receives a real endpoint and task handler
- user opens the agent page and sends a task/message
- agent responds
- user can fund/save the agent
- runway, payments, and lifecycle are real
- status, errors, and activity are visible in the UI

## Biggest Missing Pieces Today
- no in-app wallet connect
- no in-app SIWE UX
- no real runtime interaction surface
- deploy worker still uses placeholder behavior
- no real ERC-4337 provisioning
- no real x402 integration
- no complete user interaction path for deployed agents

## Recommended First Sprint
Sprint 1 should only do:

- Phase 0
- Phase 1
- Phase 2 MVP
- Phase 4 MVP

### Sprint 1 objective
Get to:
- real login
- real deploy
- real runtime
- real interaction

After that, implement ERC-4337 and x402.
