ARG NODE_VERSION=22
ARG BUN_VERSION=1.4.4

FROM node:${NODE_VERSION}-slim AS builder
ARG BUN_VERSION
RUN npm install -g bun@${BUN_VERSION}
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# The API source is needed too: the web app imports its types for the Hono client
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web

# Make sure the folder exists even when the project has no public assets yet
RUN mkdir -p apps/web/public

# Baked into the browser bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web
RUN bun run build

FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]