import { DetectChangesStore } from "@/store/common/DetectChangesStore";

export interface UserDataStore<Data> {
  detectChangesStore: DetectChangesStore<Data>;
  remove: (id: number) => void;
  resetToInit: () => void;
  save: (id: number) => Promise<void>;
  id: number;
  empty: boolean;
  loading: boolean;
}

export interface DraftStore {
  resetToInit: () => void;
  save: () => Promise<void>;
  empty: boolean;
  loading: boolean;
}
