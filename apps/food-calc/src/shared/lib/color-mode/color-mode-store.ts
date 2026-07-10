import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Light/dark is a MODE axis, orthogonal to the `data-theme` colour palettes
// (tropic/meadow/…). Manual only — no `prefers-color-scheme` auto-follow (product
// decision 2026-07-05): the user flips it explicitly in ProfileDrawer, and the
// choice persists. The value reflects onto `<html data-theme-mode="light|dark">`
// (see `useApplyColorMode`); the dark token layer lives in `theme-dark.scss`
// under `:root[data-theme-mode='dark']`.
export const COLOR_MODES = ['light', 'dark'] as const;

export type ColorMode = (typeof COLOR_MODES)[number];

const DEFAULT_MODE: ColorMode = 'light';

const isColorMode = (value: unknown): value is ColorMode =>
  typeof value === 'string' && (COLOR_MODES as readonly string[]).includes(value);

interface ColorModeStore {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggle: () => void;
}

export const useColorModeStore = create<ColorModeStore>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_MODE,
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'disher.color-mode',
      storage: createJSONStorage(() => localStorage),
      // Defensive: reject a stale/garbage persisted value, fall back to light.
      migrate: (persisted) => {
        if (
          persisted &&
          typeof persisted === 'object' &&
          'mode' in persisted &&
          isColorMode((persisted as { mode: unknown }).mode)
        ) {
          return persisted as ColorModeStore;
        }
        return { mode: DEFAULT_MODE } as ColorModeStore;
      },
      version: 1,
    },
  ),
);
