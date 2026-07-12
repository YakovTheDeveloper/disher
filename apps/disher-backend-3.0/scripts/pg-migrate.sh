#!/usr/bin/env bash
# Schema migrations for the disher Postgres (the compose `postgres` service).
#
# Applies the numbered raw-SQL migrations in db/migrations/ in lexical order via
# psql INSIDE the postgres container (psql ships in the image; the prod backend
# image has no tsx/dotenv/migrations, so the old `pnpm db:reset` path is dead).
#
# Now ledger-tracked and idempotent: a schema_migrations table records applied
# filenames, and already-applied files are skipped. Each file is applied together
# with its ledger INSERT in ONE transaction, so a mid-file failure rolls back and
# the file is retried on the next run. Safe to call from deploy.sh before
# `docker compose up`.
#
# CAVEAT — CREATE INDEX CONCURRENTLY cannot run inside a transaction. Files whose
# SQL contains "CONCURRENTLY" are applied WITHOUT the wrapping transaction (apply,
# then record). A failure there can leave an INVALID index; re-running retries the
# whole file, so such migrations must themselves be written idempotently
# (DROP INDEX IF EXISTS … before the CONCURRENTLY create).
#
# better-auth-schema.sql is INTENTIONALLY skipped by the glob ([0-9]* prefix) —
# its tables are already created by 20260501000000_own_auth_init.sql.
#
# Usage (from apps/disher-backend-3.0, with the stack up):
#   docker compose up -d --wait postgres
#   ./scripts/pg-migrate.sh
#
# One-time baseline on a DB that already has the pre-ledger schema applied
# (records every current migration as applied WITHOUT running any DDL):
#   ./scripts/pg-migrate.sh --baseline
set -euo pipefail

cd "$(dirname "$0")/.."

BASELINE=0
if [[ "${1:-}" == "--baseline" ]]; then
  BASELINE=1
fi

if [[ ! -f .env.production ]]; then
  echo "ERROR: .env.production not found (cp .env.production.example and fill it)" >&2
  exit 1
fi
# .env.production is a docker-compose env file, NOT a shell script: values are
# unquoted and may contain shell metacharacters (RESEND_FROM=Disher <no-reply@...>
# reads as a redirection), so `source`-ing it is a syntax error that kills the run
# before a single migration is applied. Read the two keys we actually need, literally.
read_env() {
  local v
  v="$(sed -n "s/^$1=//p" ./.env.production | head -n1 | tr -d '\r')"
  v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"
  printf '%s' "$v"
}
POSTGRES_USER="${POSTGRES_USER:-$(read_env POSTGRES_USER)}"
POSTGRES_DB="${POSTGRES_DB:-$(read_env POSTGRES_DB)}"
: "${POSTGRES_USER:?POSTGRES_USER unset (not in env, not in .env.production)}"
: "${POSTGRES_DB:?POSTGRES_DB unset (not in env, not in .env.production)}"

psql_run() { docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"; }

shopt -s nullglob
migrations=(db/migrations/[0-9]*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "ERROR: no numbered migrations found under db/migrations/" >&2
  exit 1
fi
# Lexical order == chronological (timestamp-prefixed filenames).
IFS=$'\n' migrations=($(printf '%s\n' "${migrations[@]}" | sort)); unset IFS

# Ledger table (id === migration filename). Created up front so both baseline and
# normal runs can rely on it.
psql_run -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);"

# Which filenames are already recorded as applied.
applied="$(psql_run -tAq -c "SELECT filename FROM schema_migrations;" | tr -d '\r')"
is_applied() { grep -qxF "$1" <<<"$applied"; }

if [[ $BASELINE -eq 1 ]]; then
  echo "BASELINE: recording ${#migrations[@]} migration(s) as applied WITHOUT running DDL:"
  for f in "${migrations[@]}"; do
    name="$(basename "$f")"
    if is_applied "$name"; then
      echo "  = $name (already recorded)"
    else
      echo "  + $name"
      psql_run -q -c "INSERT INTO schema_migrations (filename) VALUES ('$name') ON CONFLICT DO NOTHING;"
    fi
  done
  echo "Baseline recorded."
  exit 0
fi

echo "Migrating ${POSTGRES_DB} as ${POSTGRES_USER}:"
count=0
for f in "${migrations[@]}"; do
  name="$(basename "$f")"
  if is_applied "$name"; then
    echo "  = $name (skip)"
    continue
  fi
  if grep -qi 'CONCURRENTLY' "$f"; then
    # Non-transactional: CONCURRENTLY forbids running inside a transaction.
    echo "  -> $name (concurrently, non-transactional)"
    psql_run -f - < "$f"
    psql_run -q -c "INSERT INTO schema_migrations (filename) VALUES ('$name');"
  else
    echo "  -> $name"
    # Wrap the file body + its ledger INSERT in one transaction. ON_ERROR_STOP
    # aborts before COMMIT on any failed statement, so nothing is half-applied.
    # The leading newline before INSERT guards against a migration file that ends
    # without a trailing newline (which would glue INSERT onto the last statement).
    { echo "BEGIN;"; cat "$f"; printf '\n'; echo "INSERT INTO schema_migrations (filename) VALUES ('$name');"; echo "COMMIT;"; } \
      | psql_run -f -
  fi
  count=$((count + 1))
done
echo "Migrations applied: $count new, $((${#migrations[@]} - count)) already present."
