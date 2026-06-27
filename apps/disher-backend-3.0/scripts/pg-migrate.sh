#!/usr/bin/env bash
# One-time schema bootstrap for a FRESH Postgres (the compose `postgres` service).
#
# Applies the numbered raw-SQL migrations in db/migrations/ in lexical order via
# psql INSIDE the postgres container (psql ships in the image; the prod backend
# image has no tsx/dotenv/migrations, so the old `pnpm db:reset` path is dead).
#
# better-auth-schema.sql is INTENTIONALLY skipped — its tables are already created
# by 20260501000000_own_auth_init.sql; applying both double-creates and errors.
#
# Usage (from apps/disher-backend-3.0, with the stack up):
#   docker compose up -d --wait postgres
#   ./scripts/pg-migrate.sh
#
# ON_ERROR_STOP=1 aborts on the first failed statement. The DDL is not idempotent
# — run this once, on an empty database.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.production ]]; then
  echo "ERROR: .env.production not found (cp .env.production.example and fill it)" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env.production; set +a
: "${POSTGRES_USER:?POSTGRES_USER unset}"
: "${POSTGRES_DB:?POSTGRES_DB unset}"

shopt -s nullglob
migrations=(db/migrations/[0-9]*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "ERROR: no numbered migrations found under db/migrations/" >&2
  exit 1
fi
# Lexical order == chronological (timestamp-prefixed filenames).
IFS=$'\n' migrations=($(printf '%s\n' "${migrations[@]}" | sort)); unset IFS

echo "Applying ${#migrations[@]} migration(s) to ${POSTGRES_DB} as ${POSTGRES_USER}:"
for f in "${migrations[@]}"; do
  echo "  -> $f"
  docker compose exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f - < "$f"
done
echo "Migrations applied."
