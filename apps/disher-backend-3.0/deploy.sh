#!/usr/bin/env bash
# Build + health-gated swap deploy for the disher stack.
#
# Tags the backend image by git SHA (so a rollback target always exists), builds,
# then rolls the running services with `--wait` so compose blocks until the new
# backend passes its HEALTHCHECK (db ping + matcher ready) before returning.
#
# `docker compose up -d --wait` RE-CREATES the container first and only then waits:
# a failed deploy leaves the BROKEN new container in place (the old one is already
# gone), not the old one serving. So we capture the currently-running image tag up
# front and auto-roll-back to it if the swap never becomes healthy.
#
# This does NOT run schema migrations — those are a one-time bootstrap on a fresh
# DB (./scripts/pg-migrate.sh). The migrations are not idempotent; re-running them
# on a live DB would error.
#
# Usage (from apps/disher-backend-3.0, on the VPS):
#   ./deploy.sh
#
# Rollback (manual, to any prior SHA):
#   IMAGE_TAG=<previous-sha> docker compose up -d --wait backend caddy
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.production ]]; then
  echo "ERROR: .env.production missing — deliver it out-of-band first." >&2
  exit 1
fi

# Capture the tag the running backend is currently on, BEFORE we swap it out, so a
# failed deploy has a known-good rollback target. Empty on a first-ever deploy.
PREV_TAG=""
prev_cid="$(docker compose ps -q backend 2>/dev/null || true)"
if [[ -n "$prev_cid" ]]; then
  PREV_TAG="$(docker inspect --format '{{.Config.Image}}' "$prev_cid" 2>/dev/null | cut -d: -f2 || true)"
fi

SHA="$(git rev-parse --short HEAD)"
export IMAGE_TAG="$SHA"
echo "Deploying disher @ ${SHA} (current running tag: ${PREV_TAG:-none})"

# Build the SHA-tagged image (compose: image: disher-backend:${IMAGE_TAG}).
docker compose build backend

# Health-gated swap. If the new backend never becomes healthy, --wait exits
# non-zero — and the just-created broken container is now what's running.
if ! docker compose up -d --wait; then
  echo "ERROR: new backend @ ${SHA} did not become healthy." >&2
  if [[ -n "$PREV_TAG" && "$PREV_TAG" != "$SHA" ]]; then
    echo "Rolling back to ${PREV_TAG}…" >&2
    if IMAGE_TAG="$PREV_TAG" docker compose up -d --wait; then
      echo "Rolled back to ${PREV_TAG}. Prod is on the previous image." >&2
    else
      echo "ROLLBACK ALSO FAILED — manual intervention required. Prod may be down." >&2
    fi
  else
    echo "No previous tag to roll back to (first deploy?) — fix forward." >&2
  fi
  exit 1
fi

echo "Deployed ${SHA}. Current state:"
docker compose ps

# Disk hygiene: SHA-tagged backend images (each bakes the embedding model — heavy)
# + build cache accumulate on the single VPS where pgdata also lives. Prune keeps
# a disk-full incident (which would take down Postgres AND the backups meant to
# save it) from creeping up. Keep the last 3 backend images for rollback headroom.
echo "Pruning old images / build cache…"
docker image ls --filter reference='disher-backend' --format '{{.CreatedAt}}\t{{.ID}}' \
  | sort -r \
  | tail -n +4 \
  | cut -f2 \
  | xargs -r docker rmi -f 2>/dev/null || true
docker image prune -f >/dev/null || true
docker builder prune -f --keep-storage 5GB >/dev/null || true

echo
echo "Rollback if needed:  IMAGE_TAG=<previous-sha> docker compose up -d --wait backend caddy"
