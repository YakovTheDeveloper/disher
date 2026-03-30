# Triplit: Edge Cases & Gotchas

Specification for known Triplit issues that affect the Disher food-calc app.
Last updated: 2026-03-29.

---

## 1. Auth & Session Lifecycle

### 1.1 JWT expiry kills sync silently
When a JWT expires, Triplit closes the WebSocket. No retry, no user notification.

**Mitigation (implemented):** `refreshHandler` option in `startSession()` calls `POST /api/auth/refresh` to get a fresh token without dropping the connection.

**Where:** `src/api/triplit/session.ts` — `initSession()`, `loginWithToken()`.

Source: https://www.triplit.dev/blog/release-notes-2024-11-15

### 1.2 `reset()` required on user switch
`client.clear()` keeps sync metadata. `client.reset()` wipes everything including sync cursors. Without `reset()` on login/logout, the next session inherits stale sync state.

**Mitigation (implemented):** `triplit.reset()` called in both `loginWithToken()` and `logout()`.

Source: https://www.triplit.dev/blog/release-notes-2024-09-20

### 1.3 Anon-to-user data migration is manual
Triplit has no built-in mechanism. We do it ourselves in `migrateAnonData()` — iterate all user collections, update `userId` from anonId to realUserId.

**Risk:** If migration fails mid-way (network drop), some entities stay orphaned under the anon ID. Consider adding a retry mechanism or migration status flag.

---

## 2. Data Integrity

### 2.1 Last-Writer-Wins loses concurrent edits
Field-level LWW: two devices edit the same field offline — one edit silently lost. No conflict notification.

**Mitigation:** Design data so different devices write to different entities. Avoid shared mutable fields for collaborative scenarios.

### 2.2 Deletes may not propagate to offline clients
GitHub Issue #18. If Client A is offline when Client B deletes an entity, the entity may persist on Client A after reconnect. Especially fragile with `Limit()` in queries.

**Mitigation:** Verify delete propagation in testing. Avoid `Limit()` on queries where delete sync matters.

### 2.3 RelationMany with exactly 1 match returns empty array
GitHub Issue #379. Confirmed, reopened bug. `where` clause on RelationMany returns `[]` when exactly 1 child matches; works for 0 and 2+.

**Mitigation:** Test all relation queries with 0, 1, 2+ child records.

### 2.4 HttpClient cannot update Set fields
GitHub Issue #196. Server-side `HttpClient.update()` silently fails on `S.Set()` fields. Frontend `TriplitClient` works fine.

**Mitigation:** Use TriplitClient for Set field updates, even in server context if possible.

---

## 3. Storage & Platform

### 3.1 iOS Safari deletes IndexedDB after 7 days of inactivity
Safari evicts all script-writable storage if the user hasn't visited the origin in 7 days of browser use. Affects PWAs and mobile Safari.

**Mitigation:**
- Call `navigator.storage.persist()` on startup (Safari 17+ / iOS 17+).
- Design sync flow to handle full re-sync gracefully (already done via version check in `initSession()`).
- Consider prompting users to add the app to Home Screen (relaxes eviction policy).

Source: https://webkit.org/blog/14403/updates-to-storage-policy/

### 3.2 IndexedDB grows linearly with edit history
Triplit stores full edit history per attribute for offline sync. No pruning/vacuum mechanism exists yet.

**Mitigation:** Monitor IDB size for heavy users. Consider periodic `client.clear()` + re-sync if storage gets excessive. Watch Triplit roadmap for vacuum support.

### 3.3 Private/Incognito mode = zero IDB quota
Safari private browsing gives zero IndexedDB storage. The app won't work in incognito on Safari.

---

## 4. Schema & Deployment

### 4.1 Schema changes can brick deployed clients
Client compares local schema with server on connect. Incompatible = refuses to connect.

**Breaking changes:**
- Adding a required field
- Removing a field
- Changing a field type

**Safe changes:** Adding optional fields only.

**Mitigation (implemented):** `SCHEMA_VERSION` constant in `client.ts`. Bump it on schema changes — triggers full IDB wipe and re-sync on next load.

Source: https://www.triplit.dev/docs/schemas/updating

### 4.2 `fetching` flag stuck on navigation
GitHub Issue #355. Fixed in v1.0.39+. Update Triplit if on older version.

---

## 5. Infrastructure

### 5.1 CORS behind reverse proxy breaks sync silently
Duplicate `Access-Control-Allow-Origin` headers cause HTTP to fail while WebSocket succeeds. Data appears to sync but doesn't.

**Mitigation:** Verify CORS headers when deploying behind nginx/Caddy. Test both HTTP and WebSocket independently.

### 5.2 Query fetch policy confusion
`"local-first"` = use local cache if available, never fetch from remote again. Does NOT mean "check local first, then remote."
Use `"local-and-remote"` for continuous sync.

---

## Status of Mitigations in Disher

| Issue | Status | Location |
|---|---|---|
| JWT refresh | Implemented | `session.ts` + `auth.ts` backend |
| `reset()` on login/logout | Implemented | `session.ts` |
| Anon-to-user migration | Implemented | `session.ts` `migrateAnonData()` |
| Schema version guard | Implemented | `client.ts` |
| `navigator.storage.persist()` | TODO | App startup |
| IDB size monitoring | TODO | — |
| Migration retry on failure | TODO | — |
