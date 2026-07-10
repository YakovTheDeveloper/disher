import { useEffect } from 'react';
import { useColorModeStore } from './color-mode-store';

const MODE_ATTR = 'data-theme-mode';

/**
 * Reflects the current light/dark mode onto `<html data-theme-mode="...">`
 * so the CSS rules in `theme-dark.scss` (`:root[data-theme-mode='dark']`) can
 * flip the semantic token layer globally. Runs once at mount + on every change.
 *
 * Orthogonal to `useApplyUserTheme` (which owns `data-theme` — the colour
 * palette). The two attributes coexist: a user can pick `meadow` AND dark; the
 * dark layer is imported after `themes.scss`, so at equal specificity it wins,
 * giving the TOD palettes their dark treatment regardless of palette choice.
 */
export function useApplyColorMode(): void {
  const mode = useColorModeStore((s) => s.mode);
  useEffect(() => {
    document.documentElement.setAttribute(MODE_ATTR, mode);
  }, [mode]);
}
