# NPM packages — verified versions 2026-04-29

Source: registry.npmjs.org/<package>/latest. Live data.

## Local DB layer

### dexie (v4.4.2)
- "A Minimalistic Wrapper for IndexedDB"
- **Zero runtime dependencies** ✅
- repo: github.com/dexie/Dexie.js
- Already pinned in Disher (`food-calc/package.json` likely has it).

### dexie-react-hooks (v4.4.0)
- React hooks: `useLiveQuery`, `usePermissions`.
- peerDependencies: `dexie >=4.2.0-alpha.1 <5.0.0`, `react >=16`
- Same monorepo as Dexie.

### dexie-export-import (v4.4.0)
- Dexie addon for full DB export/import.
- peerDependencies: `dexie ^4.4.0`
- Useful for "Manual export/import" feature (memory `project_manual_export_idea.md`).

### idb (v8.0.3) — by Jake Archibald
- "A small wrapper that makes IndexedDB usable"
- Zero runtime dependencies (only devDeps).
- Already used by Disher (per CLAUDE.md → `idb-keyval`).
- Lower-level than Dexie. Disher's persister uses it via `idb-keyval`.

## Server frameworks

### hono (v4.12.15)
- "Web framework built on Web Standards"
- **Zero runtime dependencies** ✅
- Multi-runtime: Node, Bun, Deno, Workers, Fastly Compute (devDeps include `bun-types`, `wrangler`, `vite-plugin-fastly-js-compute`).

### fastify (v5.8.5)
- "Fast and low overhead web framework, for Node.js"
- 15 runtime dependencies (`pino`, `find-my-way`, `@fastify/error`, `secure-json-parse`, `fast-json-stringify`, etc.).
- Node-specific (vs Hono multi-runtime).

### elysia (v1.4.28)
- "Ergonomic Framework for Human"
- 4 runtime dependencies (`cookie`, `exact-mirror`, `fast-decode-uri-component`, `memoirist`).
- Bun-first (peerDeps include `@types/bun`).

## Query builders / ORMs

### drizzle-orm (v0.45.2)
- (registry returned only version, no description for this version)
- Type-safe SQL toolkit.

## Auth

### lucia (v3.2.2) — **DEPRECATED**
- Note from registry: "This package has been deprecated. Please see https://lucia-auth.com/lucia-v3/migrate."
- Do not adopt for new projects.

### better-auth (v1.6.9)
- "The most comprehensive authentication framework for TypeScript"
- 15 runtime dependencies (heavy: `@noble/ciphers`, `@noble/hashes`, `jose`, `kysely`, `nanostores`, `zod`, multiple adapters).
- 19 peer dependencies (covers nearly every meta-framework / DB combo).
- Heavy but actively maintained, multi-DB.

## Recommendations summary

| Concern | Pick | Reason |
|---|---|---|
| Local DB | **Dexie 4.4.2** + dexie-react-hooks + dexie-export-import | Zero deps, already in JS local-first scene gold standard. |
| Server framework (small VPS) | **Hono 4.12** | Zero deps, multi-runtime, web standards (works on Cloudflare Workers / Bun / Node). |
| Auth | **Self-rolled JWT** OR keep Supabase Auth standalone | Lucia deprecated. better-auth is overkill for single-user backup endpoint. Supabase Auth keeps current structure (CLAUDE.md mentions `auth-store` + `useUserId`). |
| Query builder | **Drizzle ORM** | Type-safe, simple migrations, used by better-auth and many indie shops. |
| Idempotency / dedup | UUID `id` column + `client_modified_at` ON CONFLICT — no extra lib needed |
