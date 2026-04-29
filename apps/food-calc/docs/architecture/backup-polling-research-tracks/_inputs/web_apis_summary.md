# Web APIs for backup-polling — verified 2026-04-29

Sources: caniuse.com, developer.chrome.com/docs/web-platform/page-lifecycle-api, developer.mozilla.org.

## Background Sync API (`SyncManager`, `sync` event)

- **iOS Safari: NOT SUPPORTED. Ever.** caniuse: "3.2 – 26.5: Not supported" (no future support indicated).
- **Desktop Safari: NOT SUPPORTED.** Same status as iOS.
- **Chrome (Android + Desktop):** supported from v49+ (current Chrome 147-150 OK).
- **Firefox:** unsupported, status "unknown" for future versions.
- **Global coverage:** ~76% (Chrome dominance).

**Implication for Disher:** Cannot rely on Background Sync to push after tab close on iOS PWA. Must use `visibilitychange` + `sendBeacon` while page is alive.

## Page Lifecycle API (`freeze`, `resume` events)

- **Safari (desktop + iOS): NOT SUPPORTED** for the dedicated `freeze`/`resume` events. iOS does its own freezing under the hood, but JS cannot subscribe to it.
- **Recommended event for "save state before tab close":** `visibilitychange` (page becomes `hidden`).
- For unload signal use `pagehide`, NOT deprecated `unload`.
- In frozen state: timers/fetch callbacks/most async operations suspended; code already executing (including `freeze` handler) can run; **must close IndexedDB connections, WebSockets, Web Locks** before freeze.

**Implication for Disher:** On iOS we can't react to `freeze`. We push on `visibilitychange→hidden` synchronously via `sendBeacon`. Anything heavier may be killed by iOS's own freeze.

## navigator.sendBeacon

- **Payload limit: 64 KiB (65,536 bytes).** Use `fetch(..., { keepalive: true })` for bigger payloads.
- HTTP method: POST only.
- Data: ArrayBuffer, TypedArray, DataView, Blob, string, FormData, URLSearchParams.
- Reliability: sent asynchronously without delaying unload, doesn't impact next page load.
- **iOS Safari:** does NOT fire `unload`/`beforeunload` reliably — must use `visibilitychange` as trigger.
- Returns boolean: `true` if queued, `false` if failed.
- Recommended pattern:
  ```js
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      navigator.sendBeacon("/backup", payload);
    }
  });
  ```

**Implication for Disher:** sendBeacon is our "best-effort push on tab close" primitive. Payload must fit 64 KiB → may need to split if many dirty rows accumulated. fetch keepalive (max 64 KiB combined per origin) is alternative for non-trivial payloads.

## navigator.locks (LockManager / Web Locks API)

- **iOS Safari: 15.4+** (March 2022). Same threshold as desktop Safari.
- **Desktop Safari: 15.4+.**
- **Chrome: 69+.**
- **Firefox: 96+.**
- Requires HTTPS (secure context). Available in Web Workers.
- No documented platform-specific limitations.

**Implication for Disher:** Can use `navigator.locks.request('disher-sync', { mode: 'exclusive' }, callback)` for leader election across tabs (one tab elected to drain). iOS Safari 15.4+ baseline matches our minimum browser target.

## visibilitychange (Page Visibility API)

- Baseline widely available since July 2015. Works on iOS Safari reliably.
- Distinct from `blur`/`focus` — `visibilitychange` only fires when page actually hidden (tab switch, minimize, app background).
- Pattern: subscribe → on `document.hidden === true`, do persist work; on `document.hidden === false`, do refresh work.

**Implication for Disher:** Primary trigger for "push dirty rows" + "re-fetch fresh data" boundary.
