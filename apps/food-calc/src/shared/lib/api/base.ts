// In production the SPA is hosted on a different origin than the API
// (api.<domain> behind Caddy on :443) and the backend port (3100) is never
// published — so a host-derived base would point at the wrong host AND port.
// VITE_API_BASE, baked at SPA build time, takes over when set.
const explicitBase = import.meta.env.VITE_API_BASE as string | undefined;

const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
// VITE_BACKEND_PORT lets the e2e Vite mode point at the standalone test
// backend (3101 in playwright.config.ts) without colliding with a dev backend
// on 3100. Falls back to 3100 for normal dev/network builds.
const port = (import.meta.env.VITE_BACKEND_PORT as string | undefined) ?? '3100';

// Prod: explicit base verbatim (trailing slash trimmed). Dev/network/e2e:
// host-derived — backend rides the same hostname on a known port.
export const API_BASE =
  explicitBase && explicitBase.length > 0
    ? explicitBase.replace(/\/+$/, '')
    : `${protocol}://${window.location.hostname}:${port}`;
