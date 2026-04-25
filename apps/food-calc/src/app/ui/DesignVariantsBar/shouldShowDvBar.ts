let cached: boolean | null = null;

export function shouldShowDvBar(): boolean {
  if (cached !== null) return cached;
  const isDev = import.meta.env.DEV;
  const urlForce =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('dv');
  cached = isDev || urlForce;
  return cached;
}
