import { DetectChangesStore } from "@/store/common/DetectChangesStore";

export interface UserDataStore<Data extends unknown[]> {
    detectChangesStore: DetectChangesStore<Data>
    remove: (id: number) => void
    resetToInit: () => void
    save: (id: number) => Promise<void>
    id: number,
    empty: boolean
}

export interface DraftStore {
    resetToInit: () => void
    save: () => Promise<void>
    empty: boolean
}

