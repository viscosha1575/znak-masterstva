#!/usr/bin/env bash
#
# Deploys the site and the admin panel: uploads the repository to the server,
# builds the images there and restarts the containers behind Traefik.
#
#   deploy/deploy.sh                          both apps
#   DEPLOY_SERVICES=admin deploy/deploy.sh    one of them: frontend or admin
#
# The server needs Docker with the compose plugin, and a .env file with the
# domain and the panel's settings in the folder below — see .env.example.
# Both are set up once; README.md in the repository root says how.
#
# The images are built before anything is restarted, so a build that fails
# leaves the running site as it was. The data — applications, photos, the
# statistics, the certificates — lives in Docker volumes and is not touched.

set -euo pipefail

# The server, as ssh reaches it: DEPLOY_HOST=root@example.com deploy/deploy.sh
HOST="${DEPLOY_HOST:?Set DEPLOY_HOST to the server, e.g. DEPLOY_HOST=root@example.com}"
DIR="${DEPLOY_DIR:-/opt/znak-masterstva}"
SERVICES="${DEPLOY_SERVICES:-frontend admin}"

cd "$(dirname "$0")/.."

if ! ssh "$HOST" "docker compose version >/dev/null 2>&1 && test -f '$DIR/.env'"; then
  cat >&2 <<MESSAGE
✗ The server is not ready: it needs Docker with the compose plugin and the
  settings file $DIR/.env (a filled-in copy of .env.example).
  Nothing was changed on the server.
MESSAGE
  exit 1
fi

echo "→ Uploading the sources to $HOST:$DIR"
# The server's own .env is excluded, which also protects it from --delete.
# admin/data is the local development database: it never leaves this machine.
rsync -az --delete \
  --include '.env.example' --exclude '.env*' \
  --exclude .git --exclude node_modules --exclude .next --exclude '/admin/data' \
  --exclude .DS_Store --exclude .claude --exclude '*.zip' --exclude '*.tsbuildinfo' \
  ./ "$HOST:$DIR/"

# shellcheck disable=SC2087 — the variables are meant to expand on this side.
ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
cd "$DIR"
set -a; . ./.env; set +a

echo "→ Building: $SERVICES"
docker compose build $SERVICES

echo "→ Restarting"
docker compose up -d --no-build --remove-orphans traefik $SERVICES

echo "→ Waiting for the apps"
for service in $SERVICES; do
  for attempt in \$(seq 1 60); do
    state=\$(docker inspect --format '{{.State.Health.Status}}' "\$(docker compose ps -q "\$service")" 2>/dev/null || true)
    [ "\$state" = healthy ] && break
    sleep 2
  done
  if [ "\$state" != healthy ]; then
    echo "✗ \$service did not come up — see: docker compose logs \$service" >&2
    exit 1
  fi
  echo "✓ \$service is healthy"
done

echo "→ Checking through Traefik"
admin_domain="\${ADMIN_DOMAIN:-admin.\$DOMAIN}"
check() { # name, address — asked the way a visitor would, but without leaving the server
  host=\$(echo "\$2" | cut -d/ -f3)
  for attempt in \$(seq 1 30); do
    # Quiet on purpose: for a few seconds after a restart Traefik has no healthy
    # container to send the request to, and that is not worth a line of output.
    if curl -fs -o /dev/null --max-time 10 --resolve "\$host:443:127.0.0.1" "\$2"; then
      echo "✓ \$1 answers at \$2"
      return 0
    fi
    sleep 2
  done
  echo "✗ \$1 does not answer at \$2 — see: docker compose logs traefik" >&2
  return 1
}
check "The site" "https://\$DOMAIN/"
# The pages are static and would look fine with the API down; the form would not.
check "The application form's API" "https://\$DOMAIN/api/applications"
check "The panel" "https://\$admin_domain/login"
if [ -n "\${OLD_DOMAIN:-}" ]; then
  # A redirect to the site counts as an answer: curl -f fails only on errors.
  check "The former address" "https://\$OLD_DOMAIN/"
fi

docker image prune -f >/dev/null
REMOTE

echo "✓ Deployed"
