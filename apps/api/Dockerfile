FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
RUN pnpm install --frozen-lockfile
RUN cd packages/shared && pnpm run build
RUN cd apps/api && npx prisma generate && pnpm run build

FROM node:20-alpine AS runner
RUN addgroup -S bloodline && adduser -S bloodline -G bloodline
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

USER bloodline
EXPOSE 4000
ENV NODE_ENV=production
ENV API_PORT=4000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
