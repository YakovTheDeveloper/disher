// The one allowlist. Three consumers read it and they MUST agree, or the app
// breaks in a way that looks like a bug in whichever one you're staring at:
//
//   1. @fastify/cors            (buildApp.ts)      — what the browser may call
//   2. better-auth trustedOrigins (server.ts)      — /api/auth/* origin check
//   3. requireTrustedOrigin     (require-origin.ts) — every other mutating route
//
// Before this module each of them kept its own copy, and the CORS one had
// degenerated to `return true` in dev (reflect any Origin). That was harmless
// with a bearer token in localStorage; with a session COOKIE it means any page
// the dev happens to open can call the dev API as them and read /api/backup.

const STATIC_DEV_ORIGINS = [
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://127.0.0.1:5173",
];

// Ports: 5173 = vite dev (dev-network), 4173 = vite preview --host.
// Echoing after a strict match (rather than reflecting anything) is what keeps
// a LAN dev box usable without opening an unconditional wildcard.
const LAN_ORIGIN_DEV =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+):(?:5173|4173)$/;

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Env-driven allowlist. Read at call time — tests mutate NODE_ENV per case. */
export function staticAllowedOrigins(): string[] {
  const fromEnv = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const frontend = process.env.FRONTEND_ORIGIN
    ? [process.env.FRONTEND_ORIGIN]
    : [];
  if (isProd()) {
    return [...frontend, ...fromEnv];
  }
  return [...frontend, ...STATIC_DEV_ORIGINS, ...fromEnv];
}

/**
 * Is this `Origin` header value one of ours? An empty prod allowlist fails
 * closed — no origin is trusted, cross-origin requests are blocked.
 */
export function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (staticAllowedOrigins().includes(origin)) return true;
  return !isProd() && LAN_ORIGIN_DEV.test(origin);
}
