import { create } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { persist } from "zustand/middleware";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string;
  nameEng: string;
  nameRu: string;
  status: "Удалить" | "Оставить";
  reason: string;
}

export type FilterType = "all" | "keep" | "del" | "changed" | "unreviewed";

interface ReviewState {
  items: Record<string, ReviewItem>;
  overrides: Record<string, "Удалить" | "Оставить">;
  reviewed: Record<string, true>;
  filter: FilterType;
  search: string;
  loading: boolean;
}

interface ReviewActions {
  fetchItems: () => Promise<void>;
  toggle: (id: string) => void;
  decide: (id: string, decision: "Удалить" | "Оставить") => void;
  undoDecide: (id: string) => void;
  setFilter: (f: FilterType) => void;
  setSearch: (q: string) => void;
  save: () => Promise<number>;
}

// ── Debounced storage — writes at most once per second ──────────────────────

let writeTimer: ReturnType<typeof setTimeout> | undefined;

const debouncedStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // storage full — silently ignore
      }
    }, 1000);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

// ── Store ───────────────────────────────────────────────────────────────────

const API_BASE = `http://${window.location.hostname}:3100`;

export const useReviewStore = create<ReviewState & ReviewActions>()(
  persist(
    (set, get) => ({
      items: {},
      overrides: {},
      reviewed: {},
      filter: "all",
      search: "",
      loading: false,

      fetchItems: async () => {
        set({ loading: true });
        try {
          const res = await fetch(`${API_BASE}/parser/candidates`);
          const raw = (await res.json()) as Record<string, Omit<ReviewItem, "id">>;
          const items: Record<string, ReviewItem> = {};
          for (const [id, val] of Object.entries(raw)) {
            if (val.status === "Удалить") continue;
            items[id] = { id, ...val };
          }
          set({ items, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      toggle: (id) => {
        const { items, overrides } = get();
        const item = items[id];
        if (!item) return;
        const current = overrides[id] ?? item.status;
        const next = current === "Удалить" ? "Оставить" : "Удалить";
        if (next === item.status) {
          const { [id]: _, ...rest } = overrides;
          set({ overrides: rest });
        } else {
          set({ overrides: { ...overrides, [id]: next } });
        }
      },

      decide: (id, decision) => {
        const { items, overrides, reviewed } = get();
        const item = items[id];
        if (!item) return;
        const newReviewed = { ...reviewed, [id]: true as const };
        if (decision === item.status) {
          const { [id]: _, ...rest } = overrides;
          set({ overrides: rest, reviewed: newReviewed });
        } else {
          set({ overrides: { ...overrides, [id]: decision }, reviewed: newReviewed });
        }
      },

      undoDecide: (id) => {
        const { reviewed, overrides, items } = get();
        const item = items[id];
        if (!item) return;
        const { [id]: _r, ...newReviewed } = reviewed;
        const { [id]: _o, ...newOverrides } = overrides;
        set({
          reviewed: newReviewed,
          overrides: item.status !== overrides[id] ? newOverrides : overrides,
        });
      },

      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),

      save: async () => {
        const { overrides } = get();
        const res = await fetch(`${API_BASE}/parser/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overrides }),
        });
        const { saved } = (await res.json()) as { saved: number };
        set((s) => {
          const newItems = { ...s.items };
          for (const [id, status] of Object.entries(s.overrides)) {
            if (newItems[id]) newItems[id] = { ...newItems[id], status };
          }
          return { items: newItems, overrides: {} };
        });
        return saved;
      },
    }),
    {
      name: "usda-review",
      storage: {
        getItem: (name) => {
          const raw = debouncedStorage.getItem(name);
          return raw ? JSON.parse(raw as string) : null;
        },
        setItem: (name, value) => {
          debouncedStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          debouncedStorage.removeItem(name);
        },
      },
      partialize: (state) =>
        ({
          overrides: state.overrides,
          reviewed: state.reviewed,
        }) as unknown as ReviewState & ReviewActions,
    },
  ),
);

// ── Pure selectors (no new objects/arrays — return primitives or stable refs) ─

export const selectStatus = (id: string) => (s: ReviewState) =>
  s.overrides[id] ?? s.items[id]?.status ?? "Оставить";

export const selectIsReviewed = (id: string) => (s: ReviewState) =>
  !!s.reviewed[id];

export const selectItem = (id: string) => (s: ReviewState) =>
  s.items[id];
