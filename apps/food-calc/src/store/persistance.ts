import { onSnapshot, applySnapshot } from "mobx-state-tree"

export function makePersistable(store: any, key: string) {
    const saved = localStorage.getItem(key)

    if (saved) {
        try {
            applySnapshot(store, JSON.parse(saved))
        } catch (e) {
            console.error("Failed to load MST snapshot", e)
        }
    }

    onSnapshot(store, snapshot => {
        localStorage.setItem(key, JSON.stringify(snapshot))
    })
}
