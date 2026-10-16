# Production image of the admin panel: Next's standalone server and nothing else.
# Built and started by docker-compose.yml in the repository root.
#
# The image holds no data. The database and the uploaded photos live in /data,
# which docker-compose.yml backs with a named volume.

# Same Node.js version as the site (frontend/Dockerfile).
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Git does not keep empty folders, so public/ can be missing in a fresh clone.
RUN mkdir -p public && npm run build

FROM base AS run
ENV NODE_ENV=production
ENV PORT=3000
# Docker sets HOSTNAME to the container id, and Next would listen on that name
# alone. The port is not published: only Traefik (docker-compose.yml) or the
# localhost mapping of docker-compose.local.yml lead to it.
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# The image optimiser writes its cache here while the app runs.
RUN mkdir -p .next/cache && chown node:node .next/cache
# Created here so that a fresh volume mounted over it belongs to the app's user.
RUN mkdir -p /data && chown node:node /data
ENV DATA_DIR=/data
VOLUME /data

USER node
EXPOSE 3000
CMD ["node", "server.js"]
