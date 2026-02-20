FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
RUN pnpm install -g turbo@^2
COPY . .
RUN turbo prune backend --docker

FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
# We only install production dependencies since we don't need a build step
RUN pnpm install --frozen-lockfile --prod

# Copy full pruned source code
COPY --from=builder /app/out/full/ .

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backenduser
USER backenduser

# Copy over the pruned node_modules and pruned workspace
COPY --from=installer --chown=backenduser:nodejs /app .

WORKDIR /app/apps/backend

ENV PORT=3001
EXPOSE 3001
CMD ["node", "server.js"]
