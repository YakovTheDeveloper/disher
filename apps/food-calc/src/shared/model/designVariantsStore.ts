import { create } from 'zustand';

type VariantEntry = { total: number; index: number };

export type KnownVariantComponent = {
  name: string;
  total: number;
};

/**
 * Static registry of all components that expose design variants.
 *
 * Registering here — rather than from inside each component's effect — keeps
 * the DesignVariantsBar dropdown stable even when the variant component is
 * unmounted (e.g. inside a drawer/modal that was just closed).
 *
 * To add a new variant set: append an entry here AND call
 * `useDesignVariants(name, total)` inside the component with matching values.
 */
export const KNOWN_VARIANT_COMPONENTS: readonly KnownVariantComponent[] = [
  { name: 'Calendar', total: 1 },
  { name: 'TimeChoose', total: 8 },
  { name: 'ProductQuantity', total: 2 },
  { name: 'SearchFood', total: 2 },
  { name: 'AuthScreen', total: 4 },
  { name: 'ModalShell', total: 5 },
] as const;

const initialComponents: Record<string, VariantEntry> = Object.fromEntries(
  KNOWN_VARIANT_COMPONENTS.map((c) => [c.name, { total: c.total, index: 0 }]),
);

const initialActive = KNOWN_VARIANT_COMPONENTS[0]?.name ?? null;

type DesignVariantsStore = {
  components: Record<string, VariantEntry>;
  activeComponent: string | null;
  syncTotal: (name: string, total: number) => void;
  setIndex: (name: string, index: number) => void;
  next: () => void;
  prev: () => void;
  setActive: (name: string) => void;
};

export const useDesignVariantsStore = create<DesignVariantsStore>((set) => ({
  components: initialComponents,
  activeComponent: initialActive,

  syncTotal: (name, total) =>
    set((state) => {
      const existing = state.components[name];
      if (!existing || existing.total === total) return state;
      const clampedIndex = existing.index >= total ? 0 : existing.index;
      return {
        components: { ...state.components, [name]: { total, index: clampedIndex } },
      };
    }),

  setIndex: (name, index) =>
    set((state) => {
      const entry = state.components[name];
      if (!entry) return state;
      const normalized = ((index % entry.total) + entry.total) % entry.total;
      return {
        components: { ...state.components, [name]: { ...entry, index: normalized } },
      };
    }),

  next: () =>
    set((state) => {
      const name = state.activeComponent;
      if (!name) return state;
      const entry = state.components[name];
      if (!entry) return state;
      return {
        components: {
          ...state.components,
          [name]: { ...entry, index: (entry.index + 1) % entry.total },
        },
      };
    }),

  prev: () =>
    set((state) => {
      const name = state.activeComponent;
      if (!name) return state;
      const entry = state.components[name];
      if (!entry) return state;
      return {
        components: {
          ...state.components,
          [name]: { ...entry, index: (entry.index - 1 + entry.total) % entry.total },
        },
      };
    }),

  setActive: (name) =>
    set((state) => (name in state.components ? { activeComponent: name } : state)),
}));
