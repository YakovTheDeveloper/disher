#!/usr/bin/env bash
# Off-box logical backup of the disher Postgres.
#
# Postgres holds the ONLY copy of money data (wallet / wallet_ledger, immutable
# journal of real ₽) and user_backups (the single copy of each user's data).
# Run this BEFORE the first wallet top-up, then on a timer (ops/disher-backup.timer).
#
# Dumps via pg_dump INSIDE the postgres container (custom format, compressed),
# writes to $BACKUP_DIR on the host, integrity-checks, copies OFFSITE (so a disk
# loss / provider incident / stray rm can't take the only money records with it),
# prunes (keep 7 daily + 4 weekly), and pings a heartbeat so a silently-stopped
# timer becomes an alert.
#
# Env (all optional except BACKUP_DIR default):
#   BACKUP_DIR       host dir for dumps (default /srv/disher/backups)
#   RCLONE_REMOTE    if set, `rclone copyto` each dump here, e.g. b2:disher-backups
#                    (bucket with versioning + lifecycle; rclone.conf root-owned).
#                    An offsite-copy failure fails the whole run (non-zero exit).
#   HEALTHCHECK_URL  if set, pinged on success (healthchecks.io etc.); pinged at
#                    /fail if the disk is over DISK_ALERT_PCT so a full disk alerts.
#   DISK_ALERT_PCT   backup-partition usage % that trips the fail-ping (default 85)
#
# Usage (from apps/disher-backend-3.0):
#   BACKUP_DIR=/srv/disher/backups RCLONE_REMOTE=b2:disher-backups ./scripts/pg-backup.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/srv/disher/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"
DISK_ALERT_PCT="${DISK_ALERT_PCT:-85}"
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

# Offsite copy — the single most important line for money data. Without it every
# dump shares fate with pgdata on one disk. Failure here fails the run so the
# heartbeat below is skipped and the alert fires.
if [[ -n "$RCLONE_REMOTE" ]]; then
  echo "Copying offsite -> ${RCLONE_REMOTE}/$(basename "$out")"
  rclone copyto "$out" "${RCLONE_REMOTE}/$(basename "$out")"
  echo "Offsite copy OK."
else
  echo "WARN: RCLONE_REMOTE unset — dump is LOCAL-ONLY (shares fate with pgdata)." >&2
fi

# Retention: keep last 7 daily; keep Sunday dumps up to 4 weeks; prune the rest.
find "$BACKUP_DIR" -name 'disher-*.dump' -type f -mtime +7 ! -newermt 'last Sunday' -delete 2>/dev/null || true
# Hard cap: keep at most the 11 most recent regardless.
ls -1t "$BACKUP_DIR"/disher-*.dump 2>/dev/null | tail -n +12 | xargs -r rm -f
echo "Retention applied."

# Heartbeat: a healthy run pings HEALTHCHECK_URL; a missed ping (timer died, dump
# failed before here) auto-alerts on the monitor's schedule. If the backup disk is
# nearly full, ping /fail instead — a full disk would take down Postgres AND break
# these backups, so surface it as an incident now rather than at the next dump.
if [[ -n "$HEALTHCHECK_URL" ]]; then
  usage_pct="$(df --output=pcent "$BACKUP_DIR" 2>/dev/null | tr -dc '0-9' || echo 0)"
  if [[ -n "$usage_pct" && "$usage_pct" -ge "$DISK_ALERT_PCT" ]]; then
    echo "WARN: backup disk at ${usage_pct}% (>= ${DISK_ALERT_PCT}%) — sending fail-ping." >&2
    curl -fsS -m 15 "${HEALTHCHECK_URL%/}/fail" >/dev/null || true
  else
    curl -fsS -m 15 "$HEALTHCHECK_URL" >/dev/null || true
  fi
fi
