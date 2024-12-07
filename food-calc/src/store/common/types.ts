import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { Response } from "@/types/api/common";

export interface UserDataStore<Data> {
  detectChangesStore: DetectChangesStore<Data>;
  remove: (id: number) => Promise<Response<boolean>>;
  resetToInit: () => void;
  save: (id: number) => Promise<Response<Data>>;
  id: number;
  empty: boolean;
  loading: boolean;
  name: string;
}

export interface DraftStore<Data> {
  resetToInit: () => void;
  save: () => Promise<Response<Data>>;
  empty: boolean;
  name: string;
}
