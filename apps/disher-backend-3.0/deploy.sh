#!/usr/bin/env bash
# Build + health-gated swap deploy for the disher stack.
#
# Tags the backend image by git SHA (so a rollback target always exists), builds,
# then rolls the running services with `--wait` so compose blocks until the new
# backend passes its HEALTHCHECK (db ping + matcher ready) before returning.
#
# This does NOT run schema migrations — those are a one-time bootstrap on a fresh
# DB (./scripts/pg-migrate.sh). The migrations are not idempotent; re-running them
# on a live DB would error.
#
# Usage (from apps/disher-backend-3.0, on the VPS):
#   ./deploy.sh
#
# Rollback (to the previously deployed SHA):
#   IMAGE_TAG=<previous-sha> docker compose up -d --wait backend caddy
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.production ]]; then
  echo "ERROR: .env.production missing — deliver it out-of-band first." >&2
  exit 1
fi

SHA="$(git rev-parse --short HEAD)"
export IMAGE_TAG="$SHA"
echo "Deploying disher @ ${SHA}"

# Build the SHA-tagged image (compose: image: disher-backend:${IMAGE_TAG}).
docker compose build backend

# Health-gated swap: compose waits for postgres healthy, then backend healthy,
# then caddy. If the new backend never becomes healthy, --wait exits non-zero and
# the old container keeps serving until you re-run with the previous IMAGE_TAG.
docker compose up -d --wait

echo "Deployed ${SHA}. Current state:"
docker compose ps
echo
echo "Rollback if needed:  IMAGE_TAG=<previous-sha> docker compose up -d --wait backend caddy"
