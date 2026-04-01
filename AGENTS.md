# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
BLOODLINE is a pnpm + Turborepo monorepo. See `README.md` for full structure and API endpoints. Key apps:
- **API** (`apps/api`): Express server on port 4000 (Prisma + PostgreSQL + Redis/BullMQ)
- **Miniapp** (`apps/miniapp`): Next.js 14 frontend on port 3000
- **Docs** (`apps/docs`): Next.js 14 docs site on port 3001 (optional)

### Infrastructure
Postgres 16 and Redis 7 run via Docker Compose in `infra/`:
```
cd infra && docker compose up -d postgres redis
```
Docker must be running first: `sudo dockerd &>/tmp/dockerd.log &` then `sudo chmod 666 /var/run/docker.sock`.

### Environment
Copy `.env.example` to `.env` at the repo root. Critical overrides for local dev:
- `DATABASE_URL=postgresql://bloodline:bloodline_dev@localhost:5432/bloodline` (matches docker-compose credentials)
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be non-empty strings
- Symlink `.env` into app directories: `ln -sf /workspace/.env /workspace/apps/api/.env` (repeat for `apps/miniapp`, `apps/docs`)
- Prisma CLI requires `DATABASE_URL` passed explicitly or via the symlinked `.env` in `apps/api/`

### Database
Run Prisma migrations from `apps/api`:
```
cd apps/api && DATABASE_URL="postgresql://bloodline:bloodline_dev@localhost:5432/bloodline" npx prisma migrate dev
```

### Build order
`@bloodline/shared` must be built before the API or frontend can start:
```
pnpm turbo run build --filter=@bloodline/shared
```

### Starting services
- **API**: `cd apps/api && npx tsx watch src/index.ts` (needs `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` env vars)
- **Miniapp**: `cd apps/miniapp && npx next dev --port 3000`
- Both apps hot-reload. The API uses `tsx watch`, the miniapp uses Next.js dev server.

### Lint / Test / Typecheck
- `pnpm turbo run lint` — runs ESLint on packages that define a `lint` script (API + shared). Pre-existing warnings in API.
- `pnpm turbo run test` — runs Jest in API (`apps/api`). 33 tests across 4 suites.
- `pnpm turbo run typecheck` — TypeScript checking.
- Tests can also run directly: `cd apps/api && npx jest --passWithNoTests`

### Gotchas
- `turbo.json` uses `"tasks"` (not the deprecated `"pipeline"` key). This was fixed from the original codebase.
- `@bloodline/sdk` has a pre-existing TypeScript build error (missing DOM/Node types in `tsconfig.json`). This does not block the API or frontend.
- Prisma's `dotenv` resolution does not walk up to the repo root — the `.env` must be symlinked or present in `apps/api/`.
- The API requires `JWT_SECRET` to be set or it will `process.exit(1)` immediately.
- The docker-compose `anvil` service (local Base chain fork) is optional for basic dev — only needed for on-chain operations.
