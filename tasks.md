# BLOODLINE — Task Tracker

> Last updated: 2026-03-08
> Active tasks: 0 | Blocked: 0 | Done: 30+

---

## ACTIVE

*(all critical tasks completed)*

---

## REMAINING (non-blocking)

[PENDING] TASK-API-TESTS | API | "Add Jest unit tests for services"
Priority: MED | Est: 4h | Owner: cursor
Description: Unit tests for agent, bounty, metabolism, social services
Links: apps/api/test/

[PENDING] TASK-MINIAPP-SDK | Frontend | "Wire miniapp to real API via SDK"
Priority: MED | Est: 3h | Owner: cursor
Description: Replace mock data with SDK/fetch hooks calling the API
Links: apps/miniapp/lib/

[PENDING] TASK-DOCS | Docs | "Documentation site (apps/docs)"
Priority: LOW | Est: 6h | Owner: cursor
Description: Next.js MDX docs with Pagefind search, interactive components
Links: apps/docs/

---

## DONE (recent)

[DONE] CLI birth.ts | 2026-03-08 — Full deploy wizard with ASCII art, DNA preview, burn rate
[DONE] env-check.ts | 2026-03-08 — Validates all required env vars
[DONE] verify-mainnet.ts | 2026-03-08 — 7 post-deploy health checks
[DONE] API Dockerfile | 2026-03-08 — Multi-stage build, non-root user, health check
[DONE] Miniapp Dockerfile | 2026-03-08 — Multi-stage build for Next.js standalone
[DONE] 3 new plugins | 2026-03-08 — database-v1, social-v1, dex-trading-v1
[DONE] ESLint config | 2026-03-08 — Root .eslintrc.json with TS rules
[DONE] Root tsconfig.json | 2026-03-08 — Project references
[DONE] Landing page → miniapp | 2026-03-08 — Root page with full Part 20 design
[DONE] Agent templates (5) | 2026-03-08 — All files: package.json, src/index.ts, Dockerfile, README
[DONE] Scanner (9 checks) | 2026-03-07 — env, routes, imports, assertions, hardcoded, Docker, templates
[DONE] Security audit (136 tests) | 2026-03-07 — 7 bugs fixed, 8 test suites
[DONE] All 7 contracts | 2026-03-07 — Registry, VRF, Metabolism, Bounty, Royalty, BScore, NFT
[DONE] Full API | 2026-03-07 — 31 endpoints, 8 services, 5 workers
[DONE] Agent runtime | 2026-03-07 — HTTP protocol, 6 plugins, bounty scanner
[DONE] Miniapp frontend | 2026-03-07 — 10 routes, 13 components

---

## BACKLOG

- LangGraph integration for agent orchestration
- Production LLM wiring in runtime executeNode
- Miniapp WebSocket real-time event handling
- Contract deployment to Base Sepolia
- Smoke test suite
