ARG BUN_VERSION=1.4.4
FROM oven/bun:${BUN_VERSION}

WORKDIR /app

# Manifests first, so dependencies are cached until a package.json changes
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --filter @app/api

COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=3001
USER bun
EXPOSE 3001
CMD ["sh", "docker-entrypoint.sh"]