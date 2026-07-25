# AGENTS.md

Guidance for AI coding agents working in this repository. The reader is assumed to know nothing about the project.

## Project overview

**Disher** is a food calculator: a local-first React PWA for meal planning, nutrition tracking, and schedule management, backed by a self-hosted Node.js API. The repo is a pnpm + Turborepo monorepo.

Product philosophy (from `apps/disher-backend-3.0/catalog.md`): UX over nutrient precision — the app is about minimal input friction, not exact calorie accounting; an LLM later analyses the day's diet.

### Workspace layout

| Path | Package | What it is |
|---|---|---|
| `apps/food-calc/` | `@disher/frontend` | React 19 + TypeScript + Vite PWA (the SPA). |
| `apps/disher-backend-3.0/` | `@disher/backend` | Fastify 5 (ESM, Node) API server. |
| `packages/contracts/` | `@disher/contracts` | Shared client↔server shapes as TypeBox schemas; both apps derive types from `Static<>`. Built package — consumers resolve `dist/index.d.ts`. |
| `contracts/sync-merge/` | — | Language-neutral conformance fixtures for the snapshot `merge()` (JSON + `INVARIANTS.md`). The web PWA is the reference implementation; a Kotlin Multiplatform client must match these semantics byte-for-byte. |
| `scratchpad/` | — | One-off codemods/scripts, not part of the build. |

**Naming caveat:** package names are `@disher/frontend` / `@disher/backend`, but the **folders** are still `apps/food-calc` / `apps/disher-backend-3.0` (rename pending). Use the folder paths for files, the package names for `pnpm --filter`.

**`tds/`** (in both apps) holds technical-design docs; it is git-ignored in some places — do not treat it as the source of truth for committed behaviour.

## Tech stack

- **Frontend:** React 19, TypeScript (strict, ES2022), Vite 6, SCSS Modules (`vite-css-modules`), react-router v7, Dexie 4 (IndexedDB) + `dexie-react-hooks`, Zustand 5 (+ `persist` over `idb-keyval`), better-auth client (Bearer mode), Base UI (`@base-ui/react`) overlays, Motion, i18next, vite-plugin-pwa. React Compiler via `babel-plugin-react-compiler`.
- **Backend:** Fastify 5 + `@fastify/type-provider-typebox` + TypeBox, better-auth 1.6.x (httpOnly session cookie), `pg` (Postgres pool), better-sqlite3 (analytics), `@xenova/transformers` (local embedding model for food matching), Resend (email), OpenRouter (LLM). Runs under `tsx watch` in dev; `tsc` build + `node dist` in prod.
- **Shared:** `@disher/contracts` declares the analysis output shape once; backend (`src/shared/analysis-output.ts`) and SPA (`features/analysis/api/types.ts`) both derive from it. Only shapes belong in that package — permissive parsers stay app-side.
- **Toolchain:** pnpm 9 (`packageManager: pnpm@9.0.0`), Turborepo 2, Node ≥ 20 (CI uses 22), TypeScript 5.9, Prettier, husky + lint-staged.

## Build and test commands

Root (via turbo):

```sh
pnpm install          # fresh clone: installs the workspace
pnpm dev              # turbo run dev — both apps
pnpm dev:frontend     # @disher/frontend on 0.0.0.0:5173 (self-signed certs from backend certs/)
pnpm dev:backend      # @disher/backend on 0.0.0.0:3100
pnpm build            # builds contracts → backend dist; frontend via vite build
pnpm test             # unit tests across the workspace
pnpm lint             # eslint (frontend zero-warnings policy; backend/contracts are no-op)
pnpm typecheck        # tsc --noEmit across the workspace
```

**Important:** `@disher/contracts` is consumed through its gitignored `dist/`, so on a fresh clone `test`/`typecheck`/`spec:check` only work because turbo gives them a `^build` edge (see `turbo.json` comments). Never bypass turbo for these — a bare `tsc` fails with «Cannot find module '@disher/contracts'».

Frontend (`apps/food-calc/`):

- `pnpm dev-local` — localhost:5173; `pnpm dev-network` — 0.0.0.0:5173 for mobile testing (accept the self-signed cert).
- `pnpm dev:e2e` — 127.0.0.1:4173, HTTP (`VITE_E2E_HTTP=1` disables COOP/COEP), `VITE_BACKEND_PORT=3101`.
- `pnpm test` — vitest run; `npx vitest run path/to/file.test.ts` for one file.
- `pnpm test:sync` — the snapshot-merge suite subset.
- `pnpm golden:regen` — regenerates the `contracts/sync-merge` fixture `expected` blobs by running the real `merge()` (see below).
- `pnpm test:e2e` — Playwright (multi-server: Vite 4173 + backend 3101 via `BACKEND_E2E_HTTP=1`).
- `pnpm lint`, `pnpm lint:arch` (steiger FSD gate), `pnpm lint:style` / `pnpm check:tokens` (design-token gates), `pnpm typecheck`.
- `pnpm storybook` on port 6006.

Backend (`apps/disher-backend-3.0/`):

- `pnpm dev` — tsx watch on localhost:3100 (`scripts/free-port.mjs` kills a stale process first).
- `pnpm dev:e2e` — 127.0.0.1:3101, test mode env for Playwright.
- `pnpm test` — vitest run. **Integration-grade:** global-setup drops the schema and applies `db/migrations/*.sql`; needs a real Postgres via `TEST_DATABASE_URL` (DB-touching suites `describe.skip` without it — a green local run without a DB is not proof).
- `pnpm db:reset:test` — reset the test DB; `pnpm db:reset` for dev.
- `pnpm spec:check` — verifies committed `openapi.json` matches the route table (drift + placeholder detection).
- `pnpm build:catalog` — regenerates the frontend `shared/data/catalog.json` from `seed/combined-foods.json`.
- `pnpm probe:matcher*` / `probe:coverage` / `probe:parse` / `mine:queries` / `analyze:logs` — calibration tooling for the free-text-food pipeline.

## Architecture

### Data layer: zero-base — one writer per row (pivot 2026-05-09)

Every piece of data has exactly one writer; the writer determines the route. Three writers, three routes, three storages:

| Writer | Storage | Delivery |
|---|---|---|
| User (device) | Dexie | snapshot push/pull via `PUT/GET /api/backup` (LWW jsonb blob in Postgres `user_backups`) |
| Server (LLM job) | Postgres `analyses` | `POST /api/analyze` + `GET /api/analyses/:id` poll while `result_md=''` |
| Build (CI artifact) | JS bundle `shared/data/catalog.json` | static `import` (~715 foods; no `/api/catalog`, no Dexie catalog table) |

Plan ground truth: `apps/food-calc/tds/backup-only-arch-plan.md`.

Key mechanics (reference implementation `apps/food-calc/src/shared/lib/`):

- **Write contract** (`shared/lib/dexie/write.ts`): all domain writes go through `putRow`/`putRows` (stamp `updated_at`), `updateRow` (re-stamp), `deleteRow`/`deleteRows` (hard delete + `tombstones` row in the same rw-tx). A `no-restricted-syntax` eslint rule bans raw `db.<table>.put/add/update/delete/bulk*` everywhere except the contract, `snapshot/index.ts`, the schema migration, and tests.
- **Deliberately absent:** no `_dirty`/`edit_count`/`client_modified_at`/`server_received_at` columns, no `deleted_at` column on domain rows (hard delete + separate `tombstones` table), no per-row `user_id` (sign-out wipes Dexie + idb-keyval), no drain scheduler, no Dexie hooks. References to `@powersync/*`, `pendingWrites`, `installDexieHooks`, etc. are pre-2026-05-09 code and should be deleted.
- **Sync** (`shared/lib/snapshot/index.ts`): `syncNow()` = `navigator.locks('disher-sync')` Web Lock → pull → `merge()` → push. Triggered on `BackupGate` mount + manual buttons. `merge()` is per-row LWW on `updated_at` (ties keep local) + tombstone-apply (ties favour the delete), in one rw-tx.
- **Boot:** `<AuthGate><BackupGate><App/></BackupGate></AuthGate>`. Sign-out: best-effort server revoke → `db.tables.clear()` → `idb-keyval.clear()` (the clear is non-negotiable — Zustand drafts live there).

### Sync-merge conformance corpus (`contracts/sync-merge/`)

JSON fixtures pin what `merge()` actually does. `expected` is **generated, never hand-written** (`pnpm golden:regen`); review regen diffs, don't rubber-stamp them. `status: canon` means a mismatch is a bug in your client; `pins-known-bug` pins wrong-but-shipped behaviour a second client must reproduce. The non-negotiable writer contract (millisecond-precision ISO stamp format compared as strings, persistent monotonic high-water-mark clock, whole-row replace, cross-table-unique UUIDs, pull-merge-before-push, carry unknown table keys through) is written up in `contracts/sync-merge/INVARIANTS.md` and `README.md` — read these before touching sync code.

### Frontend: Feature-Sliced Design

`apps/food-calc/src/` follows FSD ≥ 2.1. Layers import downward only: `app → pages → widgets → features → entities → shared`. Steiger (`pnpm lint:arch`) enforces import direction in CI.

- `entities/<name>/` — `api/{queries,mutations,mappers}.ts` (useLiveQuery hooks, contract mutations, snake_case row ↔ camelCase UI mapping), `model/{types,draft}.ts` (Zustand drafts, `persist` over idb-keyval for long-lived ones), optional `ui/`, `index.ts` public API. Entities: product, dish, schedule-food, schedule-event, daily-norm, nutrient, hypothesis, custom-tag.
- `shared/lib/` — pure logic (nutrients, cost, schedule), `dexie/` (schema v7: 9 domain tables + `tombstones`), `snapshot/`, `auth/` (better-auth bearer provider; token in `localStorage["disher.bearer"]`).
- `shared/ui/` — the UI kit. Overlays run through Zustand singleton stores (`drawer-store.ts`, `modal-store.ts`) with per-instance Base UI roots rendered by managers in `src/app/ui/`; all drawer content uses `DrawerLayout`, modals use `ModalLayout`/`ModalShell`. Multi-step fullscreen flows use the `ModalByLabel` label→input focus-delegation pattern (see `apps/food-calc/CLAUDE.md` for the iOS caret fix and the "don't unmount the label on click" rule).
- Path aliases: `@/` → `src/`, `@icons` → `src/shared/assets/icons`.
- `useLiveQuery` returns `undefined` on first tick — default-coalesce (`?? []`).

### Backend: Fastify routes

`apps/disher-backend-3.0/src/`:

- `api/buildApp.ts` — app factory; `api/server.ts` — entry.
- `api/routes/` — `backup.ts` (~30 lines: LWW upsert into `user_backups`, unconditional blob replace — no ETag), `analyze.ts` + `analyze.runJob.ts` (LLM analyses; pending ⇔ `result_md=''`; failures are `⚠️`-prefixed rows), `free-text-food.ts` (LLM extraction + vector matching pipeline, wallet-debiting — see its colocated `free-text-food.README.md`), `billing.ts`, `admin.ts`, `diag-logs.ts`, `user-reports.ts`, `suggestions.ts`, etc.
- `auth/` — better-auth server, `require-user.ts` / `require-admin.ts` guards, origin checks.
- `billing/` — wallet + ledger (`wallet`/`wallet_ledger` hold real money).
- `db/migrations/` — numbered SQL applied in order via `scripts/pg-migrate.sh` (not idempotent, run once on a fresh DB).

## Testing instructions

- **Frontend unit:** vitest + jsdom + Testing Library + `fake-indexeddb` + fast-check (property tests for the merge). Golden fixtures in `contracts/sync-merge/` are regenerated with `pnpm golden:regen` (`GOLDEN_REGEN=1`).
- **Frontend E2E:** Playwright (`apps/food-calc/playwright.config.ts`); specs include `dexie-smoke` (mocked backend) and `auth-flow` (real backend, chromium+webkit). An `e2e/bridge.ts` exposes `window.__e2e` helpers (`countLocal/wipeLocal/pushSnapshot/pullSnapshot/createProduct`).
- **Backend:** vitest integration tests against real Postgres (`TEST_DATABASE_URL`), migrations applied by global-setup. Route tests live next to routes (`src/api/routes/*.test.ts`).
- **Contracts package:** build-only, no tests.
- **OpenAPI gate:** `pnpm --filter @disher/backend spec:check` must stay green — regenerate with `spec:dump` after changing route schemas.

## Code style guidelines

- **Comments: write *why*, never *what*.** Match the surrounding file's (low) comment density. Load-bearing `// intentional` / `// НАМЕРЕННО` anchors and invariant notes stay. Prefer a clear name over a comment; don't narrate the diff in code.
- **eslint zero-warnings** on the frontend (`--max-warnings 0`); backend has no lint configured (typecheck is its gate).
- **TypeScript strict** everywhere; shared base in `tsconfig.base.json` (ES2022, bundler resolution).
- **snake_case rows, camelCase UI.** Dexie rows match Postgres column names so the snapshot blob round-trips; conversion happens in each entity's `api/mappers.ts`.
- **Styling:** SCSS Modules. A stylelint token gate (`stylelint-declaration-strict-value` + `scripts/check-*.mjs`) forbids raw color/font-size/border-radius literals — use `var(--…)` design tokens. It's a ratchet: legacy violators are amnestied in `stylelint-legacy-baseline.cjs` (and `typo-encapsulation-baseline.cjs`); **new or touched files must comply**. Design canon: fading-hairline dividers + two-tier typography (`<Heading>`/`<Text>`/`<QuietLabel>`), composite-only animations, design-variants via `useDesignVariant`. Full design philosophy: `apps/food-calc/CLAUDE.md`.
- **i18n:** UI strings go through i18next (the app is Russian-first); never hardcode user-facing strings.
- **Pre-commit** (`.husky/pre-commit` → lint-staged in `apps/food-calc`): staged `*.scss` run the token checks + stylelint; `vite.config.ts` runs the precache check. A raw style value blocks the commit.

## CI

`.github/workflows/ci.yml` (push to main + PRs), two jobs on Node 22 / pnpm:

1. **static** — `pnpm typecheck`, frontend `lint`, `lint:arch`, `lint:style`, `build`, backend `spec:check` (OpenAPI drift), frontend unit tests.
2. **backend** — backend tests against a Postgres 16 service container with `TEST_DATABASE_URL` set.

House rule (top of that file): every gate was verified green on a clean checkout before being added — don't add a gate that isn't.

## Hard rules for agents

- **НИКОГДА не делать `git stash` (и `git stash pop`)** — даже временно и «с возвратом». Рабочее дерево пользователя нетронуто: чтобы проверить поведение на чистом HEAD, используй `git worktree add` в отдельный каталог или читай файлы через `git show HEAD:path`, не трогая working copy.

## Security considerations

- **Never commit secrets.** `.env*` files are gitignored (except `.env.production.example`); fill real values out-of-band. CI uses a literal `BETTER_AUTH_SECRET` placeholder deliberately.
- Auth is better-auth: httpOnly session cookie for browser, Bearer token (`localStorage["disher.bearer"]`) captured from `set-auth-token` for the SPA. Sessions are opaque server-side. Trusted origins are allow-listed (`BETTER_AUTH_TRUSTED_ORIGINS`, `src/auth/origins.ts`).
- `wallet`/`wallet_ledger` hold real money; the free-text-food matcher route debits the wallet. Nightly off-box Postgres dumps are mandatory before any wallet top-up (see DEPLOY.md).
- `user_backups` is the only copy of user data — `PUT /api/backup` replaces the whole blob unconditionally; never push without pull+merge first.
- Production topology: only Caddy (:80/:443) is published; backend :3100 and Postgres :5432 stay on the internal compose network.
- The embedding model is baked into the Docker image and loaded offline — runtime never hits HuggingFace.

## Deployment

Self-hosted single VPS: `Caddy → backend:3100 → postgres:5432` via Docker Compose (`apps/disher-backend-3.0/{Dockerfile,docker-compose.yml,Caddyfile,deploy.sh}`). The SPA is a static build (`VITE_API_BASE=... pnpm --filter @disher/frontend build`) hosted separately or by the same Caddy. The full runbook — staging-CA bring-up, one-time schema bootstrap (`scripts/pg-migrate.sh`), backup timer, Resend email gate, SPA cutover, rollback — is `apps/disher-backend-3.0/DEPLOY.md`. Read it before touching anything deploy-related.

## Pointers and caveats

- `apps/food-calc/CLAUDE.md` is the deep, maintained reference for the frontend (data layer, FSD layout, overlay patterns, design canon) — consult it for anything beyond what's summarized here.
- `apps/food-calc/AI_RULES.md` and `apps/food-calc/README.md` are **stale** (they describe a MobX/Vite-template era; the app now uses Zustand + Dexie). Don't follow them.
- `apps/food-calc/docs/guidelines.md` and `docs/e2e-screenshot-recipe.md` are current.
- `apps/disher-backend-3.0/pnpm-lock.yaml` is a tracked legacy standalone lockfile; the workspace installs from the root lockfile.
