# iOS Safari ↔ Supabase REST: HTTP/2 connection pool poisoning

> **Status:** RESOLVED in dev (2026-04-28). Picked **Option B** (Node passthrough
> proxy) over Option C (Realtime migration) after research showed C required
> significant per-collection mitigations (`worker:true`, manual visibilitychange
> reconnect, snapshot/subscribe race timestamp guards, watchdog) for what was
> still going to leave the initial REST snapshot hitting #284946.
>
> See [Resolution](#resolution-2026-04-28) at the bottom for verification logs
> and the [Production deployment](#production-deployment-open) section for
> what's left.

## Symptom

iPhone (iOS 18.6.2, both Safari and CriOS) on the same Wi-Fi as a working
desktop and a working Android phone:

- Page hydrates from IndexedDB cache instantly.
- Background refresh fires ~9 parallel `GET /rest/v1/<table>` to Supabase.
- 8 of 9 stay `pending` forever in DevTools Network. One arbitrary one
  succeeds.
- Eventually some die with `TypeError: Load failed`; the ones we wrap with
  `AbortSignal.timeout(15s)` die at the 15s mark with `AbortError`.
- After a `TypeError: Load failed` the pool clears, the next 2-3 requests
  succeed in &lt;200ms each, then the pattern repeats.

User-visible: FoodSchedule items render with empty product/dish names because
FK lookups never resolve.

## Root cause

[**WebKit Bug 284946**](https://bugs.webkit.org/show_bug.cgi?id=284946) +
HTTP/2 connection coalescing. iOS 18 WebKit reuses one TCP/H2 connection per
origin and, after wake/visibility transitions, stalls most streams on that
connection for 14-30 seconds before declaring "Load failed."

Confirmed via converging evidence:
- [Apple Developer Forum 771127](https://developer.apple.com/forums/thread/771127)
- [denysoblohin-okta/ios_fetch_bug](https://github.com/denysoblohin-okta/ios_fetch_bug) — minimal repro
- [Apple Forum 796906 — Safari 18+ stale keep-alive](https://developer.apple.com/forums/thread/796906)
- [Supabase Discussions #27477](https://github.com/orgs/supabase/discussions/27477)

Falsified hypotheses (kept for posterity so we don't re-investigate):

| Hypothesis | Verdict | Evidence |
|---|---|---|
| `idb-keyval` persister hangs on iOS | ❌ | `idb probe` returns in ~80ms with valid blob |
| TanStack Query hydration deadlocks | ❌ | `[PQC] hydration onSuccess` fires at +124ms |
| Auth bootstrap blocks queries | ❌ | `auth.bootstrap END` at +56ms, `isLoggedIn=true` |
| `AbortSignal.any` missing on iOS &lt; 17.4 | ❌ | UA shows iOS 18.6.2; `typeof AbortSignal.any === 'function'` |
| Supabase Web-Locks deadlock ([supabase-js#2111](https://github.com/supabase/supabase-js/issues/2111)) | ❌ | `navigator.locks.query()` shows no `sb-…-auth-token` lock at boot/+5s/+15s |
| Supabase free-tier pgbouncer cold start | ❌ | desktop on same Wi-Fi answers in &lt;1s |
| HTTP/3 QUIC negotiation stall | ❌ | not table-specific; pattern doesn't match |
| CORS preflight stall | ❌ | server `Date` header shows server replied promptly |
| Per-table issue (`schedule_foods` only) | ❌ | illusory — depends on request ordinal within stall window |

## Why simple retry doesn't work

Supabase officially [recommends](https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js)
retry on `TypeError: Load failed`. We added it. Telemetry showed retries
landing on the **same poisoned H2 connection** because WebKit pools reuse
across the retry. Adding `AbortSignal.timeout` shorter than 15s + retry
just produces a tighter loop of doomed requests on the same pool. The pool
only clears when WebKit itself surrenders the connection (typically after a
`Load failed`), at which point 2-3 follow-up requests fly through before the
new connection drifts back into the broken state.

iOS-only serialization (concurrency=1 queue) was tried — partial improvement
but did not fix it. WebKit still placed serialized requests onto the same
poisoned connection for ~5 sequential timeouts before the connection died
and the chain unstuck.

## What is currently in the codebase

After the diagnostic session of 2026-04-28:

- **`src/shared/api/supabase-client.ts`** — `timedFetch` wraps native fetch
  with: per-request `AbortSignal.timeout` (5s on iOS, 15s elsewhere),
  iOS-only serialization queue, retry-once on `TypeError: Load failed`.
  Includes telemetry (`[sb-fetch] START / END / ERROR`) and `cf-ray`,
  `Server-Timing`, server `Date` header capture.
- **`src/app/index.tsx`** — boot-time `[diag] env probe` (UA,
  `AbortSignal.any` availability, `navigator.locks` API present) and
  three `navigator.locks.query()` snapshots at boot / +5s / +15s.
- **`src/shared/lib/observability/diagLog.ts`** — ring-buffer telemetry,
  auto-flush every 2s + `sendBeacon` on `pagehide`.
- **`apps/disher-backend-3.0/src/api/routes/diag-logs.ts`** — receives dumps
  to `data/diag-logs/<ISO>_<sessionId>.log`.

The current shape **mitigates but does not fix** the underlying WebKit bug.
A full fix requires changing transport.

## Decision options

We need to pick one. Cost is from "pure code change" estimates; production
infra changes are extra.

### A. Stay on REST, tighten the workaround

Keep the current `timedFetch` (serialize + retry + short timeout). Treat it
as permanent. Add jitter so retry storms don't synchronize across queries.

- **Cost:** done, ~30 LOC.
- **Pro:** zero architecture change; works for now.
- **Con:** WebKit #284946 is unfixed and Apple has not committed to a fix.
  This is technical debt with no expiry. iOS users will continue to see
  visible 5-15s stalls on cold loads. Will NOT survive going to production
  Cloudflare-fronted Supabase.

### B. Backend proxy (own Node origin in front of Supabase REST)

`disher-backend-3.0` already exists. Add `/api/sb/*` route that forwards
the user's JWT to Supabase REST and pipes the response back. Frontend
points `supabase-js` at the proxy origin instead of `<ref>.supabase.co`.

- **Cost:** ~half a day. JWT pass-through, RLS still works because Supabase
  enforces it on the service.
- **Pro:** HTTP/1.1 from iPhone → Node has no multiplex, no Cloudflare,
  no #284946. One transport, one failure mode.
- **Con:** extra hop in production (~10-30ms). Backend becomes critical
  path for reads. **Currently backend runs only locally**, so this option
  requires standing up a production backend (deployment, TLS cert,
  monitoring) before it is real. Not free.

### C. Migrate read-heavy entities to TanStack DB collections via Supabase Realtime

`products` already does this and is the only entity that doesn't suffer the
hang. Replicate the pattern for `schedule_foods`, `dishes`, `dish_items`,
`dish_portions`, `daily_norms`, `schedule_events`, `periods`. Initial
snapshot via REST (single fetch, retry works), then live updates over WSS.

This is the **Phase 3 continuation** already on the roadmap
(`project_phase3_progress.md`).

- **Cost:** ~30-60 min per table × 7 tables = 1 day. Mutations stay on
  fetch (single requests, retry handles them).
- **Pro:** WebSocket is unaffected by #284946. Bonus: cross-tab / cross-
  device live updates. Consistent with what already works for `products`.
  No new infra.
- **Con:** initial snapshot still uses fetch (one request per collection),
  so the cold-load pattern still hits #284946 once at boot — but only
  once per collection per session, not on every `staleTime` expiry.

### D. Service Worker proxy

SW intercepts `fetch`, runs requests in its own network process. Some
reports indicate SW network stack on iOS is less affected by #284946.

- **Cost:** ~half a day if vanilla, more if Vite dev SW gets in the way.
- **Pro:** transparent to app code.
- **Con:** SW + iOS PWA standalone mode is fragile; debugging is harder;
  would still leave fetch in production code paths.

### Decision (2026-04-28): went with B

After a 3-track web-research pass under our specific stack, **B was chosen
over C**. The deciding factors:

- **C requires per-collection mitigations** that aren't optional: `worker:true`
  for background heartbeat (otherwise iOS throttles the heartbeat timer in PWAs),
  manual `visibilitychange` reconnect (supabase-js doesn't ship one), a
  snapshot/subscribe timestamp guard against the documented race, and a
  watchdog that re-creates (not just rejoins) the channel on missed heartbeats.
  That's ~four invariants × seven tables to keep coherent.
- **C still hits #284946 once per collection on cold load** because the initial
  snapshot is REST. So the `timedFetch` workaround couldn't be removed.
- **B is one architectural change with one failure mode.** Node defaults to
  HTTP/1.1 in ALPN (`http.createServer` doesn't advertise `h2`), so iPhone →
  Node speaks H1.1 — no shared H2 stream pool exists to poison. JWT pass-through
  is well-trodden, RLS works unchanged.
- **The backend already exists locally** (`disher-backend-3.0`) and the
  iPhone already trusts its self-signed cert because diag-logs go through it.
  The proxy is dozens of LOC, not a new service.

**A** stays in the code as paranoia-net (timeout, serialize, retry) for
mutations and for the case where someone bypasses the proxy via
`VITE_SUPABASE_PROXY=0`.

**C** stays viable for later if cross-tab/cross-device live sync becomes
a product requirement — `productsCollection.ts` is the existing example.

## Telemetry already in place (do not rebuild)

- `apps/food-calc/src/shared/lib/observability/diagLog.ts` — ring buffer +
  auto-flush every 2s + `sendBeacon` on `pagehide`.
- `apps/disher-backend-3.0/src/api/routes/diag-logs.ts` writes each dump to
  `data/diag-logs/<ISO>_<sessionId>.log`.
- Vite proxy `/api/diag-logs` → `https://localhost:3100` sidesteps the per-
  port self-signed cert prompt on iOS.
- Instrumented hooks: `[diag] env probe`, `[diag] locks.query@boot/5s/15s`,
  `[boot]`, `[persister]`, `[SyncBootstrap]`, `[PQC]`, `[sb-fetch]`,
  `[query schedule_foods]`, `[useAllScheduleFoodsQuery]`.

When picking option C and migrating tables, the telemetry stays useful for
verifying snapshot fetches no longer pile up in parallel.

## CV / interview write-up

Story version of this debugging session lives outside the repo at
`C:\Users\booty\Desktop\FOR_CV\ios18_webkit_h2_pool_poisoning.md`. Cite
WebKit #284946, the converging falsifications, and the Option C decision
rationale.

## Resolution (2026-04-28)

### What shipped

- **Backend** — new `apps/disher-backend-3.0/src/api/routes/supabase-proxy.ts`
  registered at `/api/sb`. Transparent passthrough for every method + every
  subpath under `<SUPABASE_URL>` (so REST + Auth + Storage + Functions all
  flow through). Forwards every header except hop-by-hop + `Cookie`. Body is
  treated as an opaque `Buffer` via `removeContentTypeParser(['application/json',
  'text/plain'])` + a wildcard `addContentTypeParser('*', { parseAs: 'buffer' })`
  — without removing the built-in JSON parser, Fastify v5 turns POST bodies
  into `[object Object]` upstream. Response is streamed via `Readable.fromWeb`.
- **Frontend** — `src/shared/api/supabase-client.ts`'s `runOneFetch` rewrites
  the URL through `rewriteToProxy()` before calling `fetch`: any URL starting
  with the configured Supabase origin becomes `/api/sb/<rest>`. The Supabase
  client is still constructed with the **original** `<ref>.supabase.co` URL so
  Realtime (WSS) keeps connecting directly — WebSocket transport is unaffected
  by #284946 and proxying it would only add a hop. Escape hatch:
  `VITE_SUPABASE_PROXY=0` bypasses rewriting (useful for A/B comparison).
- **Vite** — `vite.config.ts` proxies `/api/sb` to `https://localhost:3100`
  alongside the existing `/api/diag-logs` mapping, so iPhone hits a single
  origin (the dev server) and doesn't have to accept a second self-signed cert.
- **Backend `.env`** — fixed `SUPABASE_URL` (had been pointing at a stale
  project). Backend doesn't need the anon key; the client sends `apikey` and
  `Authorization` headers and the proxy forwards them as-is.

### Verified by diag-logs (sessions `0b2b4b44` vs `38aa5f6f`)

Before (direct REST, `19:49:36–19:50:26`):

```
+15184ms ERROR seq:3   AbortError "Fetch is aborted"  /rest/v1/schedule_foods    (5002ms)
+20186ms ERROR seq:4   AbortError                     /rest/v1/products          (5001ms)
+25191ms ERROR seq:5   AbortError                     /rest/v1/dishes            (5005ms)
…7 more 5-second timeouts in a row…
+65393ms ERROR seq:17  AbortError                     /rest/v1/dishes            (5006ms)
```

After (via proxy, `20:36:40` cold boot):

```
+ 140ms START seq:1   /api/sb/rest/v1/products      …+790ms END status:200
+ 930ms START seq:2   /api/sb/rest/v1/daily_norms    …+284ms END status:200
+1214ms START seq:3   /api/sb/rest/v1/dish_portions  …+173ms END status:200
+1387ms START seq:4   /api/sb/rest/v1/schedule_foods …+161ms END status:200
+1737ms START seq:5   /api/sb/rest/v1/products       …+189ms END status:200
+1904ms START seq:6   /api/sb/rest/v1/dishes         …+167ms END status:200
+2129ms START seq:7   /api/sb/rest/v1/schedule_events…+224ms END status:200
+2287ms START seq:8   /api/sb/rest/v1/dish_items     …+158ms END status:200
```

8 boot fetches in 2.1s, all 200, p50 ≈ 180ms. No `AbortError`, no
`TypeError: Load failed`. Including `schedule_foods`, the table that timed
out 8× in a row pre-fix.

## Cleanup follow-ups (low priority)

These can be removed or relaxed now that the transport is stable, but they're
not breaking anything:

1. **iOS-only serialization queue** in `supabase-client.ts` (`serializeOnIos`,
   `iosFetchTail`) — was needed because all 9 parallel fetches piled onto one
   poisoned H2 connection. With H1.1 to Node there is no shared pool to
   poison. Can be removed in a follow-up commit.
2. **`FETCH_TIMEOUT_MS = 5_000` on iOS** — was tightened so dead H2 streams
   would unblock the queue faster. Through the proxy, latencies are
   ~150-800ms, so this can go back to 15s or be unified with non-iOS.
3. **Retry-once on `TypeError: Load failed`** — still useful as paranoia-net
   for the rare iOS quirk on resume-from-lock (one such event observed in
   session `10acae19` at +271843ms — instantaneous Load failed, not a stall,
   no further reproduction). Keep it; it's cheap.
4. **403 on `POST /schedule_foods?on_conflict=id`** observed in the boot wave.
   Unrelated to the proxy (RLS or payload shape). Investigate separately.

## Production deployment (open)

Local dev works because iPhone → Vite (5173) → Node (3100) → Supabase. In
production the same chain has to preserve **HTTP/1.1 from iPhone to our
origin**, otherwise the bug returns at the edge.

Per the research (Track 3, 2026-04-28):

| Edge | Client → Edge | Verdict |
|---|---|---|
| Bare VPS (own Node + TLS) | H1.1 | ✅ works |
| Cloudflare (proxied / "orange-cloud") | H2/H3 | ❌ bug returns |
| Cloudflare (DNS-only / "grey-cloud") | depends on origin | ✅ works if origin doesn't advertise h2 |
| Fly.io / Render / Railway / Vercel | H2/H3 at edge | ❌ bug returns |

→ Production prereq: a bare VPS terminating TLS itself (Hetzner / Contabo /
DO Droplet, ~€5/mo), **or** Cloudflare in DNS-only mode pointing at one. The
existing `disher-backend-3.0` Fastify setup with its self-signed cert is
~one Caddy/Nginx swap away from being deployable; pick a domain, put a
real cert in front, point the iPhone at `api.<domain>`.

Until that's done, the iOS fix only works for users on the same LAN as the
dev box. Web/desktop/Android users are fine either way.

## Next physical action

Pick one:
- **Cleanup commit:** drop `serializeOnIos` and unify `FETCH_TIMEOUT_MS` to 15s.
- **403 on schedule_foods POST:** dump the payload and the RLS policy, fix.
- **Prod deploy plan:** decide host (bare VPS vs CF DNS-only), buy domain,
  draft Caddy config + deploy script. Until done, iOS fix is dev-only.
