const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
// VITE_BACKEND_PORT lets the e2e Vite mode point at the standalone test
// backend (3101 in playwright.config.ts) without colliding with a dev backend
// on 3100. Falls back to 3100 for normal dev/network builds.
const port = (import.meta.env.VITE_BACKEND_PORT as string | undefined) ?? '3100';
export const API_BASE = `${protocol}://${window.location.hostname}:${port}`;
