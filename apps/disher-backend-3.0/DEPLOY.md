# disher — self-hosted deploy runbook

Self-host the backend (Fastify) + Postgres behind Caddy (auto-HTTPS) on a single
Linux VPS, and cut over off Supabase (which was only a rented Postgres — no Auth,
RLS, Storage, or PostgREST in use; auth is better-auth with an httpOnly session
cookie).

Topology: `Caddy (:80/:443)` → `backend:3100` → `postgres:5432`. Only Caddy is
published; backend and Postgres are reachable only on the internal compose
network. The SPA (Vite PWA) is built separately with `VITE_API_BASE` and hosted
as static files (optionally by the same Caddy).

---

## 0. Prerequisites

- **VPS**: Ubuntu/Debian, Docker Engine + compose plugin, ports 22/80/443 open.
- **Firewall** (`ufw`): allow only what we publish.
  ```sh
  ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
  ```
- **DNS A-record** for the API host, e.g. `api.example.com` → VPS public IP. LE
  HTTP-01 needs this resolving AND :80 reachable *before* the first `up`.
  ```sh
  dig +short api.example.com   # must return the VPS IP
  ```
- A place to host the SPA + its domain (e.g. `app.example.com`), if hosting it
  via this Caddy set `SPA_DOMAIN` and uncomment the SPA block in `Caddyfile`.

## 1. Secrets

Copy the template and fill real values **out-of-band** — never commit secrets.
```sh
scp apps/disher-backend-3.0/.env.production.example \
    user@vps:/srv/disher/apps/disher-backend-3.0/.env.production
# then edit on the VPS and fill: POSTGRES_*, LOCAL_DATABASE_URL (must match
# POSTGRES_*), BETTER_AUTH_SECRET (openssl rand -hex 32), BETTER_AUTH_URL,
# BETTER_AUTH_TRUSTED_ORIGINS, FRONTEND_ORIGIN, OPENROUTER_API_KEY, RESEND_*,
# API_DOMAIN, ACME_EMAIL.
```
`.env.production` is gitignored. Leave `REMOTE_DATABASE_URL` unset (both pools hit
`LOCAL_DATABASE_URL`). Start with `REQUIRE_EMAIL_VERIFICATION=false`.

## 2. First bring-up against the LE **staging** CA

LE production rate limits are unforgiving while DNS/firewall settle. In
`Caddyfile`, uncomment `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory`.
```sh
cd /srv/disher/apps/disher-backend-3.0
docker compose up -d --wait postgres backend   # backend must go healthy
docker compose up -d caddy
docker compose logs caddy                       # expect a staging cert issued
```
A staging cert is **untrusted in the browser — that is expected**. Once issued,
re-comment `acme_ca`, then:
```sh
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```
to obtain a real, trusted production cert.

## 3. Schema bootstrap (fresh DB, one-time)

The prod image has no `tsx`/`dotenv`/migrations — apply raw SQL via psql in the
postgres container:
```sh
./scripts/pg-migrate.sh
```
Applies the 6 numbered `db/migrations/*.sql` in order (own_auth_init first).
`better-auth-schema.sql` is intentionally skipped (duplicate of own_auth_init).
Not idempotent — run once.

## 4. Postgres backups — **BEFORE the first wallet top-up**

`wallet`/`wallet_ledger` hold real money; `user_backups` is the only copy of user
data. Set up off-box nightly dumps first.
```sh
BACKUP_DIR=/srv/disher/backups ./scripts/pg-backup.sh   # verify it produces a .dump
```
Schedule it (systemd timer shown; cron works too):
```ini
# /etc/systemd/system/disher-backup.service
[Service]
Type=oneshot
WorkingDirectory=/srv/disher/apps/disher-backend-3.0
Environment=BACKUP_DIR=/srv/disher/backups
ExecStart=/srv/disher/apps/disher-backend-3.0/scripts/pg-backup.sh

# /etc/systemd/system/disher-backup.timer
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
```
```sh
systemctl enable --now disher-backup.timer
```
Ideally copy dumps to a second location (object storage / another host).

## 5. Email (Resend) — gate before flipping verification

The sandbox sender `onboarding@resend.dev` only delivers to the account owner.
**Before** `REQUIRE_EMAIL_VERIFICATION=true`: verify a domain in Resend, set
`RESEND_FROM` to an address on it, restart backend, send a test signup to a
non-owner address and confirm delivery. Only then flip verification on and
`docker compose up -d backend`.

## 6. SPA cutover

Rebuild the PWA pointing at the API, then host it.
```sh
VITE_API_BASE=https://api.example.com pnpm --filter @disher/frontend build
# deploy apps/food-calc/dist to your static host, OR mount into Caddy:
#   set SPA_DOMAIN in .env.production, uncomment the SPA block in Caddyfile,
#   mount the build (e.g. ./spa-dist:/srv/spa:ro), reload Caddy.
```
Sequence with the backend deploy — the SPA must point at `api.example.com:443`,
never `:3100` (not published).

## 7. Verification (E2E)

1. `docker compose ps` — all healthy; `docker compose logs backend` has no
   `ERR_MODULE_NOT_FOUND` / `ENOENT`; model loaded from cache (no HF download).
2. `curl https://api.example.com/health/ready` → 200, `db:"ok"`,
   `matcherReady:true`, valid (production) LE cert.
3. From the SPA origin: register → email delivered → login (session cookie) →
   `GET`/`PUT /api/backup`.
4. Paid matcher route `/api/free-text-food/parse` returns non-503 and debits the
   wallet (do this AFTER step 4 backups exist).
5. Restart + **volume-loss drill**: `pg_restore` a backup into a fresh `pgdata`
   recovers wallet + user_backups.
6. SPA prod build actually reaches `api.example.com` (not `:3100`).
7. Local gate: `pnpm --filter @disher/backend typecheck`.

## 8. Supabase teardown (after cutover verified)

```sh
cd apps/food-calc
supabase unlink                  # drops the linked project
rm -rf supabase/.temp            # holds a live prod conn-string — remove it
```
Then delete the `DisherServerFirst` project in the Supabase dashboard and confirm
billing has stopped.

---

## Redeploys

```sh
./deploy.sh           # SHA-tags, builds, health-gated `up -d --wait`
# rollback:  IMAGE_TAG=<previous-sha> docker compose up -d --wait backend caddy
```

## Operational notes

- Backend/Postgres ports are **not** published — Caddy is the only ingress.
- `HOST=0.0.0.0`/`PORT`/`MODEL_CACHE_DIR`/`ANALYTICS_DB_PATH` are pinned in
  compose `environment:` and override any `.env.production` value.
- Volumes: `pgdata` (DB), `analytics_state` (sqlite), `telemetry`, `llm_logs`,
  `caddy_data`/`caddy_config` (certs). Back up `pgdata` (step 4); the rest are
  regenerable caches/logs.
- The embedding model is baked into the image (`/app/.hfcache`) and loaded
  offline — a rebuild re-warms it; runtime never hits HuggingFace.
