import { create } from 'zustand';

/** Per-component state used by `useDesignVariant`. */
export type RegistryEntry = {
  variants: readonly string[];
  variant: string;
  visible: boolean;
  /** Timestamp of last visibility report — used to pick "most recently visible" when no pin. */
  lastSeen: number;
};

function loadStoredVariant(key: string, fallback: string): string {
  try {
    return localStorage.getItem(`dv:${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}

function persistVariant(key: string, variant: string): void {
  try {
    localStorage.setItem(`dv:${key}`, variant);
  } catch {
    /* ignore quota / private mode */
  }
}

type DesignVariantsStore = {
  /** Registered components, keyed by `key` passed to `useDesignVariant`. */
  entries: Record<string, RegistryEntry>;
  /** When set, overrides "most recently visible" → the bar pins to this key. */
  pinned: string | null;

  register: (key: string, variants: readonly string[]) => void;
  unregister: (key: string) => void;
  markVisible: (key: string) => void;
  setVariant: (key: string, variant: string) => void;
  setPinned: (key: string | null) => void;
  /** Advance the active entry to next variant (wraps). */
  next: () => void;
  /** Step the active entry back one variant (wraps). */
  prev: () => void;
};

export const useDesignVariantsStore = create<DesignVariantsStore>((set, get) => ({
  entries: {},
  pinned: null,

  register: (key, variants) =>
    set((state) => {
      const fallback = variants[0] ?? '';
      const existing = state.entries[key];
      const stored = loadStoredVariant(key, existing?.variant ?? fallback);
      const variant = variants.includes(stored) ? stored : fallback;
      return {
        entries: {
          ...state.entries,
          [key]: {
            variants,
            variant,
            visible: existing?.visible ?? false,
            lastSeen: existing?.lastSeen ?? 0,
          },
        },
      };
    }),

  unregister: (key) =>
    set((state) => {
      if (!(key in state.entries)) return state;
      const { [key]: _, ...rest } = state.entries;
      return {
        entries: rest,
        pinned: state.pinned === key ? null : state.pinned,
      };
    }),

  markVisible: (key) =>
    set((state) => {
      const entry = state.entries[key];
      if (!entry) return state;
      return {
        entries: {
          ...state.entries,
          [key]: { ...entry, visible: true, lastSeen: Date.now() },
        },
      };
    }),

  setVariant: (key, variant) =>
    set((state) => {
      const entry = state.entries[key];
      if (!entry || !entry.variants.includes(variant)) return state;
      persistVariant(key, variant);
      return { entries: { ...state.entries, [key]: { ...entry, variant } } };
    }),

  setPinned: (key) => set({ pinned: key }),

  next: () => {
    const activeKey = selectActiveKey(get());
    if (!activeKey) return;
    const entry = get().entries[activeKey];
    if (!entry) return;
    const idx = entry.variants.indexOf(entry.variant);
    const nextIdx = (idx + 1 + entry.variants.length) % entry.variants.length;
    get().setVariant(activeKey, entry.variants[nextIdx] ?? entry.variant);
  },

  prev: () => {
    const activeKey = selectActiveKey(get());
    if (!activeKey) return;
    const entry = get().entries[activeKey];
    if (!entry) return;
    const idx = entry.variants.indexOf(entry.variant);
    const prevIdx = (idx - 1 + entry.variants.length) % entry.variants.length;
    get().setVariant(activeKey, entry.variants[prevIdx] ?? entry.variant);
  },
}));

/**
 * Resolves which registered key the bar currently operates on:
 *   1. user-pinned key (if still registered),
 *   2. otherwise the most recently visible one,
 *   3. otherwise the first registered key,
 *   4. otherwise null.
 */
export function selectActiveKey(state: {
  entries: Record<string, RegistryEntry>;
  pinned: string | null;
}): string | null {
  if (state.pinned && state.entries[state.pinned]) return state.pinned;
  const keys = Object.keys(state.entries);
  if (keys.length === 0) return null;
  let bestKey: string | null = null;
  let bestSeen = -1;
  for (const k of keys) {
    const e = state.entries[k];
    if (e.visible && e.lastSeen > bestSeen) {
      bestKey = k;
      bestSeen = e.lastSeen;
    }
  }
  return bestKey ?? keys[0];
}
