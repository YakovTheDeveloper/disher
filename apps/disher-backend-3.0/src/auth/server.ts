// Production better-auth instance.
//
// Owns: schema-generating config (CLI generate reads this file), runtime
// password verification (signUpEmail / signInEmail), session management,
// bearer-token issuance for the SPA. HTTP route mounting is in B3 (the
// Fastify handler that proxies to `auth.handler`).
//
// Schema baked in here (see ../../db/migrations/better-auth-schema.sql for
// the CLI-generated SQL — do NOT regenerate without comparing the diff
// against init.sql, or test/dev DBs will silently desync):
//  - generateId: "uuid"          → user.id is `uuid`, not `text`
//  - user.modelName: "users"     → table is `public.users` (matches the
//                                  existing FK target name from `auth.users`)
//
// Plugins:
//  - bearer() — issues a `set-auth-token` response header on sign-in/-up that
//    callers (browser SPA, tests via Fastify.inject) read once and then send
//    back as `Authorization: Bearer <token>`. Required for non-cookie auth.
//
// Email verification (C1): `requireEmailVerification: true` blocks signIn
// (HTTP 403 EMAIL_NOT_VERIFIED) and forces signUp to return `token: null` —
// no session is issued until the user clicks the link. `autoSignIn: false`
// makes that explicit. `autoSignInAfterVerification: true` issues the session
// on the verify-email click, so the SPA does not need a follow-up signIn.
// `sendVerificationEmail` is a dev stub: it logs the URL/token to stdout and
// stashes them on `globalThis` for E2E (Playwright) — replace with a real
// transport (Resend/SES) before prod.
//
// C2.4: better-auth generates `url` pointing at backend
// (`${BETTER_AUTH_URL}/api/auth/verify-email?token=...`). The SPA owns the
// verify UX (loading/success/error states) and reads the bearer from the
// `set-auth-token` response header — better-auth's own redirect handler
// would 302 to `callbackURL` and the browser drops headers across redirects.
// So we rewrite the visible URL to the SPA route `/auth/verify-email?token=`
// and the SPA calls `authClient.verifyEmail({ query: { token } })` itself.
// Keep the original `url` in the globalThis map so the contract test
// (email-verification.test.ts) still asserts better-auth's wiring.

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import pg from "pg";
import { Resend } from "resend";

const connectionString = process.env.LOCAL_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "LOCAL_DATABASE_URL is required for better-auth (CLI generate + runtime)"
  );
}

// trustedOrigins: better-auth's built-in CSRF/origin check. Without this the
// SPA hits "Invalid Origin" because better-auth only trusts `baseURL` by
// default. The contract (per better-auth 1.6.x docs + 2026 research):
//
//   - In prod: static allowlist from env CSV. NEVER wildcard a full host.
//   - In dev: known localhost entries + echo back any RFC1918/loopback
//     origin on port 5173 so `pnpm run dev:frontend` (Vite network mode,
//     LAN IP varies) Just Works without env tweaks per machine.
//
// Why function form, not wildcards: better-auth wildcard syntax is
// label-style (`*.example.com`), not whole-host substitution. Patterns like
// `https://*:5173` are widely posted online but undocumented and may break
// silently between minor versions. Function form is the supported way to
// allow a dynamic set of LAN origins (echoing only after a strict regex
// match avoids the open-redirect surface that an unconditional wildcard
// would expose).
//
// `request` is undefined when better-auth is called via `auth.api` (init,
// internal calls) — handle that branch explicitly.
const STATIC_DEV_ORIGINS = [
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://127.0.0.1:5173",
];

const LAN_ORIGIN_5173 =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/;

function staticAllowedOrigins(): string[] {
  const fromEnv = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const frontend = process.env.FRONTEND_ORIGIN
    ? [process.env.FRONTEND_ORIGIN]
    : [];
  if (process.env.NODE_ENV === "production") {
    return [...frontend, ...fromEnv];
  }
  return [...frontend, ...STATIC_DEV_ORIGINS, ...fromEnv];
}

async function trustedOriginsResolver(
  request?: Request
): Promise<string[]> {
  const base = staticAllowedOrigins();
  if (process.env.NODE_ENV === "production") return base;
  if (!request) return base;
  const origin = request.headers.get("origin");
  if (origin && LAN_ORIGIN_5173.test(origin)) {
    return [...base, origin];
  }
  return base;
}

// Resend transport. Lazy: if RESEND_API_KEY is unset, sendVerificationEmail
// falls back to console-only (existing dev-stub behaviour). Lets vitest /
// dev boot work without an account, while real signup hits the wire.
//
// Best-practice 2026 (per better-auth docs/infrastructure/services/email):
//  - Do NOT await the send. Awaiting widens a timing channel that lets
//    attackers tell "user existed → email sent (slow)" from "did not exist
//    → no send (fast)". Fire-and-forget + .catch keeps response time flat.
//  - Errors get logged, never thrown — a flaky email provider must not 500
//    the signup endpoint.
const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM ?? "Disher <onboarding@resend.dev>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function dispatchVerificationEmail(args: {
  to: string;
  frontendUrl: string;
}): void {
  if (!resend) return;
  resend.emails
    .send({
      from: resendFrom,
      to: args.to,
      subject: "Подтверди email — Disher",
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="font-size:20px;margin:0 0 16px">Подтверди email</h1>
          <p style="margin:0 0 16px;color:#444">
            Чтобы войти в Disher, подтверди что это твой email — нажми кнопку ниже.
            Ссылка действует 1 час.
          </p>
          <p style="margin:24px 0">
            <a href="${args.frontendUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
              Подтвердить email
            </a>
          </p>
          <p style="margin:0;color:#888;font-size:13px">
            Если ты не регистрировался в Disher, просто проигнорируй это письмо.
          </p>
        </div>
      `,
      text: `Подтверди email для Disher: ${args.frontendUrl}\n\nСсылка действует 1 час. Если ты не регистрировался — проигнорируй это письмо.`,
    })
    .then((result) => {
      if (result.error) {
        console.error("[auth] Resend send failed", result.error);
      } else {
        console.log(`[auth] Resend email queued → ${args.to}`, result.data?.id);
      }
    })
    .catch((err) => {
      console.error("[auth] Resend threw", err);
    });
}

export const auth = betterAuth({
  database: new pg.Pool({ connectionString }),
  trustedOrigins: trustedOriginsResolver,
  user: {
    modelName: "users",
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  // Long session by design (Disher auth-инвариант: «логин один раз»). Bearer
  // mode means we have no refresh token — sliding `updateAge` extends the
  // server-side `session.expiresAt` row by re-issuing the bearer when it's
  // older than 1 day, so an active user effectively never re-logs. A user
  // who's away for >365d will see the login screen — acceptable.
  session: {
    expiresIn: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    // Synced with frontend AuthForm.tsx MIN_PASSWORD. NIST 800-63-4 minimum
    // is 8; 12 is plan default (recommended for personal app, no HIBP check).
    minPasswordLength: 12,
    // Dev escape hatch: REQUIRE_EMAIL_VERIFICATION=false lets us register +
    // sign in without clicking the link. In prod the flag must stay unset
    // (default → true). Tests rely on the gated behaviour, so do NOT remove
    // requireEmailVerification entirely — keep it driven by env.
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION !== "false",
    // When verification is required we keep autoSignIn=false (better-auth
    // returns token=null on signup until the user clicks the link). When
    // verification is dev-disabled we want signup to issue a session right
    // away — otherwise the SPA gets stuck on "check your inbox".
    autoSignIn: process.env.REQUIRE_EMAIL_VERIFICATION === "false",
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url, token }) => {
      const frontendOrigin =
        process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
      const frontendUrl = `${frontendOrigin}/auth/verify-email?token=${encodeURIComponent(token)}`;
      console.log(
        `[auth] verification email -> ${user.email}\n  frontend url: ${frontendUrl}\n  better-auth url: ${url}\n  token: ${token}\n  resend: ${resend ? "ON" : "OFF (console-only)"}`
      );
      // Stash per-email token + url so test helpers + E2E bridges can pick
      // them up without coupling to better-auth's internal token format
      // (which is a signed JWT, not a DB row). `url` stays as better-auth
      // emitted it (used by the C1 contract test); `frontendUrl` is what
      // the email body actually links to.
      const g = globalThis as {
        __verifyTokensByEmail?: Map<
          string,
          { url: string; frontendUrl: string; token: string }
        >;
      };
      if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
      g.__verifyTokensByEmail.set(user.email, { url, frontendUrl, token });

      // Real send via Resend if configured. Fire-and-forget: do NOT await,
      // do NOT throw — see dispatchVerificationEmail comment.
      dispatchVerificationEmail({ to: user.email, frontendUrl });
    },
  },
  plugins: [bearer()],
});
