#!/usr/bin/env bash
# Nightly off-box logical backup of the disher Postgres.
#
# Postgres holds the ONLY copy of money data (wallet / wallet_ledger, immutable
# journal of real ₽) and user_backups (the single copy of each user's data).
# Run this BEFORE the first wallet top-up, then on a timer (see DEPLOY.md for the
# systemd timer / cron stanza).
#
# Dumps via pg_dump INSIDE the postgres container (custom format, compressed),
# writes to $BACKUP_DIR on the host, and prunes: keep 7 daily + 4 weekly (Sunday).
#
# Usage (from apps/disher-backend-3.0):
#   BACKUP_DIR=/srv/disher/backups ./scripts/pg-backup.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/srv/disher/backups}"
# shellcheck disable=SC1091
set -a; . ./.env.production; set +a
: "${POSTGRES_USER:?POSTGRES_USER unset}"
: "${POSTGRES_DB:?POSTGRES_DB unset}"

mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/disher-${stamp}.dump"

echo "Dumping ${POSTGRES_DB} -> ${out}"
# -Fc custom format -> restore with pg_restore. -T '*' keeps full schema+data.
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner > "$out"

# Integrity smoke: pg_restore --list must parse the archive.
if ! docker compose exec -T postgres pg_restore --list < "$out" >/dev/null 2>&1; then
  echo "ERROR: dump failed integrity check, removing ${out}" >&2
  rm -f "$out"
  exit 1
fi
echo "OK: $(du -h "$out" | cut -f1) ${out}"

# Retention: keep last 7 daily; keep Sunday dumps up to 4 weeks; prune the rest.
find "$BACKUP_DIR" -name 'disher-*.dump' -type f -mtime +7 ! -newermt 'last Sunday' -delete 2>/dev/null || true
# Hard cap: keep at most the 11 most recent regardless.
ls -1t "$BACKUP_DIR"/disher-*.dump 2>/dev/null | tail -n +12 | xargs -r rm -f
echo "Retention applied."
