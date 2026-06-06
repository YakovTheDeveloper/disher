/**
 * Single source of truth for the PWA-mode tag used in diagnostics and bug
 * reports. Reports iOS `navigator.standalone` and the `(display-mode:
 * standalone)` media query so a home-screen PWA can be told apart from a normal
 * browser tab. Format: `standalone=… display-mode=…`.
 */
export function getPwaTag(): string {
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone;
  const displayMode =
    typeof matchMedia === 'function'
      ? matchMedia('(display-mode: standalone)').matches
      : undefined;
  return `standalone=${standalone ?? 'n/a'} display-mode=${displayMode ?? 'n/a'}`;
}
