import { useEffect } from 'react';
import { useUserThemeStore } from './user-theme-store';

const THEME_ATTR = 'data-theme';

/**
 * Reflects the current user-selected theme onto `<html data-theme="...">`
 * so the CSS rules in `themes.scss` can apply the matching palette
 * tokens globally. Runs once at mount + on every theme change.
 *
 * Coexists with the dev DV-bar: `[data-dv='ScheduleFood'][data-dv-v=X]`
 * has higher specificity than `:root[data-theme=Y]`, so dev variant
 * overrides win inside their anchor scope — `data-theme` covers the
 * rest of the app.
 */
export function useApplyUserTheme(): void {
  const theme = useUserThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTR, theme);
  }, [theme]);
}
