# Joplin sync recovery issues — verified metadata

Fetched 2026-04-29 from api.github.com/repos/laurent22/joplin/issues/{4919,9023,8660}.

## #4919 — closed 2021-05-09 (4 days open)
- **Title:** "Delete local data and re-download from sync target - hangs in loop"
- **Labels:** bug, desktop, high
- **Summary:** Notes disappear after restart despite syncing. Application requires resynchronization repeatedly instead of retaining downloaded data persistently.

## #9023 — closed 2023-10-20 (14 days open)
- **Title:** "Endless sync with \"Delete local data and re-download from sync target\""
- **Labels:** bug
- **Summary:** Infinite synchronization loop after using Victor plugin + "delete local & re-download". Sync did not complete or allow cancellation; continued even after system restart.

## #8660 — closed 2023-09-20 (38 days open, also marked stale)
- **Title:** "resources folder not cleaned-up after \"Delete local data and re-download from sync target\" & fail-safe = OFF"
- **Labels:** bug, stale
- **Summary:** When fail-safe disabled, "delete local & re-download" doubles resources folder size instead of clearing. Manual intervention required.

## Pattern across all three

All 3 issues touch the **"Delete local data and re-download from sync target"** code path (recovery flow). 2 of 3 are explicitly about silent data loss or infinite loops; 1 is about leaked storage.

**Lesson for Disher backup-polling recovery flow:**
- Never auto-wipe — always require explicit user confirmation.
- Fail-safe ON by default.
- Idempotent recovery (safe to re-run, no double-application of cleanup).
- Detectable end state — recovery either completes or surfaces a clear error, never "still syncing forever".
