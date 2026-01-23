import { onSnapshot, applySnapshot, getSnapshot } from "mobx-state-tree"
import { db } from "@/infrastructure/storage/db"

export async function makePersistable(store: any, key: string) {
    // 1. Try to load from IndexedDB
    const saved = await db.snapshots.get(key)

    if (saved) {
        try {
            applySnapshot(store, saved.data)
        } catch (e) {
            console.error(`Failed to load MST snapshot for ${key} from IndexedDB. Error:`, e)

        }
    } else {
        // 2. Fallback to LocalStorage and migrate if exists
        const legacyData = localStorage.getItem(key)
        if (legacyData) {
            try {
                const parsed = JSON.parse(legacyData)
                applySnapshot(store, parsed)

                await db.snapshots.put({ key, data: parsed })

                console.log(`Migrated ${key} from LocalStorage to IndexedDB`)
            } catch (e) {
                console.error(`Failed to migrate ${key} from LocalStorage. Error:`, e)
            }
        } else {
            // No saved data found, perform initial save of current state
            try {
                const initialSnapshot = getSnapshot(store)
                await db.snapshots.put({ key, data: initialSnapshot })
                console.log(`Initial snapshot for ${key} saved to IndexedDB`)
            } catch (e) {
                console.error(`Failed to save initial MST snapshot for ${key} to IndexedDB. Error:`, e)
            }
        }
    }

    onSnapshot(store, async snapshot => {

        try {
            await db.snapshots.put({ key, data: snapshot })
        } catch (e) {
            console.warn("Snapshot possibly not cloneable", snapshot)
            console.error(`Failed to save MST snapshot for ${key} to IndexedDB. Error:`, e)
        }
    })
}
