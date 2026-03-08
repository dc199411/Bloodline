FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/miniapp/package.json apps/miniapp/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/miniapp/ apps/miniapp/
RUN pnpm install --frozen-lockfile
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/miniapp && pnpm run build

FROM node:20-alpine AS runner
RUN addgroup -S bloodline && adduser -S bloodline -G bloodline
WORKDIR /app

COPY --from=build /app/apps/miniapp/.next/standalone ./
COPY --from=build /app/apps/miniapp/.next/static ./apps/miniapp/.next/static
COPY --from=build /app/apps/miniapp/public ./apps/miniapp/public

USER bloodline
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "apps/miniapp/server.js"]
