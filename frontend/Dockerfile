# Production image of the site: Next's standalone server and nothing else.
# Built and started by docker-compose.yml in the repository root.

# The Node.js version the site runs on in production.
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# The site's own address (src/lib/site.ts), from DOMAIN in docker-compose.yml.
# Needed by the build, which writes most pages out in advance, and by the
# server, which renders the rest.
ARG SITE_URL
ENV SITE_URL=${SITE_URL}
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

USER node
EXPOSE 3000
CMD ["node", "server.js"]
