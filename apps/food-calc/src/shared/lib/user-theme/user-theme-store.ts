import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const USER_THEMES = [
  'tropic',
  'meadow',
  'sunrise',
  'sorbet',
  'garden',
  'lagoon',
  'twilight',
] as const;

export type UserTheme = (typeof USER_THEMES)[number];

export const USER_THEME_LABELS: Record<UserTheme, string> = {
  tropic: 'Тропик',
  meadow: 'Луг',
  sunrise: 'Рассвет',
  sorbet: 'Сорбет',
  garden: 'Сад',
  lagoon: 'Лагуна',
  twilight: 'Сумерки',
};

const DEFAULT_THEME: UserTheme = 'tropic';

const isUserTheme = (value: unknown): value is UserTheme =>
  typeof value === 'string' && (USER_THEMES as readonly string[]).includes(value);

interface UserThemeStore {
  theme: UserTheme;
  setTheme: (theme: UserTheme) => void;
}

export const useUserThemeStore = create<UserThemeStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'disher.user-theme',
      storage: createJSONStorage(() => localStorage),
      // Defensive: localStorage may hold a stale value from a removed theme.
      // Reject anything we don't recognise, fall back to the default.
      migrate: (persisted) => {
        if (
          persisted &&
          typeof persisted === 'object' &&
          'theme' in persisted &&
          isUserTheme((persisted as { theme: unknown }).theme)
        ) {
          return persisted as UserThemeStore;
        }
        return { theme: DEFAULT_THEME } as UserThemeStore;
      },
      version: 1,
    },
  ),
);
