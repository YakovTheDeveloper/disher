import { applySnapshot, getSnapshot, onSnapshot, IAnyStateTreeNode } from "mobx-state-tree"
import { db } from "@/infrastructure/storage/db"

const STORE_VERSION = 1
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 100

interface HydrateOptions {
    seed?: () => Promise<void> | void
}

function log(action: string, key: string, details?: unknown) {
    console.log(`[Persistence:${key}] ${action}`, details ?? "")
}

function logError(action: string, key: string, error: unknown) {
    console.error(`[Persistence:${key}] ERROR: ${action}`, error)
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    key: string,
    operationName: string
): Promise<T | null> {
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            return await operation()
        } catch (e) {
            logError(`${operationName} (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`, key, e)

            if (attempt === MAX_RETRY_ATTEMPTS) {
                logError(`${operationName} failed after all retries`, key, e)
                return null
            }

            await delay(RETRY_DELAY_MS * attempt)
        }
    }
    return null
}

async function loadSnapshotFromStorage(key: string): Promise<unknown | null> {
    log("Loading from IndexedDB...", key)

    const saved = await retryWithBackoff(
        () => db.snapshots.get(key),
        key,
        "Load from IndexedDB"
    )

    if (saved) {
        log("Found in IndexedDB", key, { version: saved.version, timestamp: saved.timestamp })
        return saved.data
    }

    // Fallback to LocalStorage
    try {
        const legacy = localStorage.getItem(key)
        if (legacy) {
            log("Found in LocalStorage, migrating...", key)
            const parsed = JSON.parse(legacy)
            const migrated = await retryWithBackoff(
                () => db.snapshots.put({
                    key,
                    data: parsed,
                    version: STORE_VERSION,
                    timestamp: Date.now(),
                }),
                key,
                "Migrate to IndexedDB"
            )

            if (migrated !== null) {
                localStorage.removeItem(key)
                log("Migrated from LocalStorage", key)
            }
            return parsed
        }
    } catch (e) {
        logError("Failed to migrate from LocalStorage", key, e)
    }

    log("No saved data found", key)
    return null
}

async function saveSnapshot(key: string, snapshot: unknown): Promise<boolean> {
    const result = await retryWithBackoff(
        () => db.snapshots.put({
            key,
            data: snapshot,
            version: STORE_VERSION,
            timestamp: Date.now(),
        }),
        key,
        "Save snapshot"
    )

    if (result === null) {
        // Fallback to LocalStorage if IndexedDB fails
        try {
            localStorage.setItem(key, JSON.stringify(snapshot))
            log("Fallback: Saved to LocalStorage", key)
            return true
        } catch (e) {
            logError("Failed to save to LocalStorage fallback", key, e)
            return false
        }
    }

    return true
}

function persist(store: IAnyStateTreeNode, key: string) {
    log("Starting persistence subscription", key)

    return onSnapshot(store, async snapshot => {
        const success = await saveSnapshot(key, snapshot)
        if (success) {
            log("Snapshot saved", key)
        } else {
            logError("Failed to save snapshot", key, "All persistence methods failed")
        }
    })
}

export async function hydrateAndPersist(
    store: IAnyStateTreeNode,
    key: string,
    options?: HydrateOptions
) {
    log("=== Starting hydration ===", key)

    const snapshot = await loadSnapshotFromStorage(key)

    if (snapshot) {
        log("Applying snapshot...", key)
        try {
            applySnapshot(store, snapshot)
            log("Snapshot applied successfully", key)
        } catch (e) {
            logError("Failed to apply snapshot", key, e)
            // Clear corrupted data
            await retryWithBackoff(
                () => db.snapshots.delete(key),
                key,
                "Clear corrupted snapshot"
            )
            localStorage.removeItem(key)
            log("Cleared corrupted snapshot", key)

            // Continue to seed as fallback
            if (options?.seed) {
                log("Fallback to seed due to applySnapshot error", key)
                try {
                    await options.seed()
                    log("Seed completed", key)
                } catch (seedError) {
                    logError("Seed failed", key, seedError)
                }
            }
        }
    } else if (options?.seed) {
        log("No snapshot, running seed...", key)
        try {
            await options.seed()
            log("Seed completed", key)
        } catch (e) {
            logError("Seed failed", key, e)
        }
    }

    // Immediately save current state after hydration/seed
    // This ensures data is in IndexedDB even if store never changes
    log("Saving initial state to IndexedDB", key)
    const currentSnapshot = getSnapshot(store)
    await saveSnapshot(key, currentSnapshot)

    persist(store, key)

    log("=== Hydration completed ===", key)
}