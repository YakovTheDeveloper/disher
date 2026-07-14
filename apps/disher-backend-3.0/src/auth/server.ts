// Production better-auth instance.
//
// Owns: schema-generating config (CLI generate reads this file), runtime
// password verification (signUpEmail / signInEmail), session management,
// session-cookie issuance for the SPA. HTTP route mounting is in B3 (the
// Fastify handler that proxies to `auth.handler`).
//
// Schema baked in here (see ../../db/migrations/better-auth-schema.sql for
// the CLI-generated SQL — do NOT regenerate without comparing the diff
// against init.sql, or test/dev DBs will silently desync):
//  - generateId: "uuid"          → user.id is `uuid`, not `text`
//  - user.modelName: "users"     → table is `public.users` (matches the
//                                  existing FK target name from `auth.users`)
//
// Session transport: httpOnly cookie (better-auth's native mode). The old
// bearer() plugin is gone — it existed only to translate an Authorization
// header back into the cookie better-auth reads anyway. SPA and API are
// different origins but the SAME site (disher.life / api.disher.life), so the
// cookie is first-party: SameSite=Lax carries it, and Safari's ITP does not
// cap it (that cap applies to JS-set cookies, not Set-Cookie).
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
// verify UX (loading/success/error states) and calls
// `authClient.verifyEmail({ query: { token } })` itself — better-auth's own
// redirect handler would 302 to `callbackURL` and the SPA never gets to render
// its states. So we rewrite the visible URL to the SPA route
// `/auth/verify-email?token=`. Keep the original `url` in the globalThis map so
// the contract test (email-verification.test.ts) still asserts better-auth's
// wiring.

import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getIp } from "better-auth/api";
import { genericOAuth } from "better-auth/plugins";
import pg from "pg";
import { Resend } from "resend";
import {
  buildAuthEvent,
  isTrackedAuthPath,
  recordAuthEvent,
  type AuthHookContext,
} from "./auth-events.js";
import { isTrustedOrigin, staticAllowedOrigins } from "./origins.js";
import {
  isSyntheticTelegramEmail,
  telegramGenericOAuthConfig,
} from "./telegram.js";

const connectionString = process.env.LOCAL_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "LOCAL_DATABASE_URL is required for better-auth (CLI generate + runtime)"
  );
}

// trustedOrigins: better-auth's built-in CSRF/origin check on /api/auth/*.
// Without this the SPA hits "Invalid Origin" — better-auth only trusts `baseURL`
// by default. The allowlist itself lives in ./origins.ts, shared with CORS and
// with requireTrustedOrigin (the same check for every non-auth mutating route).
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
async function trustedOriginsResolver(
  request?: Request
): Promise<string[]> {
  const base = staticAllowedOrigins();
  if (!request) return base;
  const origin = request.headers.get("origin");
  if (origin && !base.includes(origin) && isTrustedOrigin(origin)) {
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

// Telegram OIDC login (better-auth genericOAuth). Lazy, like Resend: only
// registered when both TELEGRAM_CLIENT_ID and TELEGRAM_CLIENT_SECRET are set,
// so dev/test/prod without a bot boot exactly as before. When ON, better-auth
// mounts the callback at ${BETTER_AUTH_URL}/api/auth/oauth2/callback/telegram —
// register that as the Redirect URI in @BotFather (see apps/food-calc/tds/telegram-auth.md).
const telegramOAuthConfig = telegramGenericOAuthConfig();
console.log(
  telegramOAuthConfig
    ? "[auth] Telegram OIDC login: ON"
    : "[auth] Telegram OIDC login: OFF (set TELEGRAM_CLIENT_ID + TELEGRAM_CLIENT_SECRET)",
);

export const auth = betterAuth({
  database: new pg.Pool({ connectionString }),
  trustedOrigins: trustedOriginsResolver,
  user: {
    modelName: "users",
    additionalFields: {
      // `users.role` is OURS now — the admin() plugin that used to declare it is
      // gone (it dragged in an RPC surface we 404'd by hand and a second source
      // of truth for "who is admin"). Declaring it here is what keeps `role` on
      // the session object that verify-session.ts reads; `input: false` means no
      // client can ever set it — promotion is a DB write (see seed-admin.ts).
      role: { type: "string", required: false, input: false },
    },
  },
  account: {
    accountLinking: {
      // An OAuth identity may NEVER resolve onto an existing user by email.
      // better-auth's default is the opposite: when no `account` row matches it
      // looks the user up by email and links implicitly, gated only by
      // `userInfo.emailVerified` — a flag WE set ourselves on an address WE
      // invent (telegram.ts). Trusting our own claim is circular, and it is what
      // turned the Telegram placeholder into an account-takeover vector. Off.
      //
      // Cost of this being on: a Telegram login that finds a same-email row it
      // cannot link now FAILS instead of merging. That is the correct outcome —
      // a refused login is recoverable, a stolen account is not.
      disableImplicitLinking: true,
      // The DELIBERATE link ("Привязать Telegram" in ProfileDrawer) is a
      // different flow: it runs on an authenticated session, so the user is
      // proving both identities. better-auth still refuses it unless the
      // provider's email equals the session user's — and Telegram's synthetic
      // address never equals a real one, so that flow is dead in prod today
      // (`email_doesn't_match`). This revives it. It does not widen the implicit
      // path above, which stays closed.
      allowDifferentEmails: true,
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
    // A cookie is identified by name+domain+path — so changing the SCOPE of a
    // cookie without changing its NAME does not replace it, it duplicates it.
    // Both fly on every request, the server reads whichever comes first, and
    // sign-out can only clear one of them. We hit that trap once already (the
    // bearer→cookie migration); the prefix bump is how we refuse to hit it twice.
    //
    // What changed: the cookie is now HOST-ONLY (no `Domain` attribute) and the
    // previous `disher` cookie in every live browser IS domain-scoped, so the
    // new one would land beside it. `disher1` is a namespace where exactly one
    // cookie can exist.
    //
    // Accepted cost: every live user is signed out once and re-logs via Telegram.
    // No data is lost — the diary lives in Dexie + the user_backups vault.
    //
    // The `__Secure-` prefix you'll see on the wire is better-auth's, added
    // whenever baseURL is https — including the self-signed local dev server.
    // So the dev cookie is `__Secure-disher1.session_token` too, not the bare name.
    cookiePrefix: "disher1",
    // No `crossSubDomainCookies`. The domain scope was never needed: a cookie
    // follows the origin of the REQUEST, not of the page, so the SPA on
    // disher.life sending fetch(credentials:'include') to api.disher.life gets
    // the api.disher.life cookie without any Domain attribute — and the OAuth
    // callback lands on api.disher.life directly.
    //
    // What dropping it BUYS, precisely: our session token stops being broadcast.
    // With `Domain=.disher.life` the browser attached it to every request to every
    // *.disher.life host — and prod ingress is a SHARED box, so a neighbour's
    // server could simply read it out of the Cookie header. Host-only ends that.
    //
    // What it does NOT buy — read this before believing the cookie is safe:
    // cookie TOSSING is still open. A neighbour can set
    //   Set-Cookie: __Secure-disher1.session_token=<their own valid session>;
    //               Domain=.disher.life; Path=/
    // and the browser will send BOTH cookies to api.disher.life. Their signature is
    // genuine (they registered an account legitimately), so only ORDER decides who
    // wins: RFC 6265 §5.4 sorts by longer Path first, then by earlier creation time.
    // Only the `__Host-` prefix actually forbids a sibling from writing the name.
    // We deliberately deferred `__Host-` (better-auth does not automate it; hand-
    // assembling it depends on an attribute-merge order that can shift in a minor).
    // Revisit the moment real third-party tenants appear on *.disher.life.
  },
  // Where auth errors land. Without this, better-auth's /error route in
  // production 302s the browser to a RELATIVE `/?error=<code>` — which the
  // browser resolves against the API origin (api.disher.life), NOT the SPA. The
  // user ends up staring at our Fastify problem+json 404 instead of the app;
  // that is exactly how the Telegram `issuer_missing` failure surfaced. An
  // absolute FRONTEND_ORIGIN sends them home instead. Left unset in dev (no
  // FRONTEND_ORIGIN) so better-auth keeps its own HTML error page, which is the
  // more useful thing to look at while developing.
  onAPIError: {
    ...(process.env.FRONTEND_ORIGIN
      ? { errorURL: process.env.FRONTEND_ORIGIN }
      : {}),
    // Only NON-APIError throws reach here (a real exception: DB down, Telegram
    // unreachable, a bug). APIErrors — including redirects — are caught upstream
    // and handled by the after-hook below. Defining `onError` SUPPRESSES
    // better-auth's own console logging of these (api/index.mjs: it returns
    // early once a custom handler exists), so log here too or the stdout trail
    // disappears.
    onError: (error: unknown) => {
      console.error("[auth] unhandled auth error", error);
      recordAuthEvent({
        path: null,
        provider: null,
        outcome: "error",
        statusCode: null,
        errorCode: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
        userId: null,
        email: null,
        ip: null,
        userAgent: null,
      });
    },
  },
  // One row per login-relevant attempt (see auth/auth-events.ts). Runs after the
  // handler returned — `ctx.context.returned` holds either the result or the
  // APIError it threw, so success and failure land in the same place. Untracked
  // paths (/get-session on every boot) are skipped: they'd bury the signal.
  hooks: {
    // Nobody may register an address inside Telegram's synthetic namespace.
    //
    // Why this is a security control and not hygiene: better-auth resolves an
    // OAuth login by (providerId, accountId) and, finding no `account` row,
    // FALLS BACK TO A LOOKUP BY EMAIL (db/internal-adapter.mjs findOAuthUser).
    // The Telegram placeholder derives from a Telegram user-id, which is public.
    // So without this guard an attacker registers `tg_<victim_id>@telegram.local`
    // with a password of their own, the victim's next Telegram login resolves
    // onto THAT row, and the attacker owns the victim's diary, backup vault and
    // wallet. `disableImplicitLinking` below is the second, independent stop.
    //
    // It has to run server-side: the attacker is curl, not our SPA, so a check
    // in the sign-up form guards nothing — the same reason the Origin header is
    // no defence on this route.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = (ctx.body as { email?: unknown } | undefined)?.email;
      if (!isSyntheticTelegramEmail(email)) return;
      throw APIError.from("BAD_REQUEST", {
        message: "Этот адрес занят системой — зарегистрируйтесь на другой",
        code: "RESERVED_EMAIL_DOMAIN",
      });
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (!isTrackedAuthPath(ctx.path)) return;
      const source = ctx.request ?? ctx.headers ?? new Headers();
      recordAuthEvent(
        buildAuthEvent(
          ctx as unknown as AuthHookContext,
          getIp(source, ctx.context.options),
        ),
      );
    }),
  },
  // Long session by design (Disher auth-инвариант: «логин один раз»). There is
  // no refresh token — sliding `updateAge` extends the server-side
  // `session.expiresAt` row (and re-sends the cookie) when it's older than a
  // day, so an active user effectively never re-logs. A user who's away for
  // >365d will see the login screen — acceptable. NOT touching these two: they
  // ARE the "log in once" invariant.
  //
  // `session.cookieCache` stays OFF deliberately: better-auth #10021 — a stale
  // cached session_data signs the user OUT instead of falling back to the DB,
  // which directly contradicts the invariant above.
  session: {
    expiresIn: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    // Synced with frontend AuthForm.tsx MIN_PASSWORD — менять ТОЛЬКО парой,
    // иначе форма и сервер разойдутся в валидации. NIST 800-63-4 floor is 8,
    // so 11 stays above it (no HIBP check here either way).
    minPasswordLength: 11,
    // Email verification is opt-IN: default is OFF (signIn doesn't 403,
    // signUp auto-issues a session). Tests that exercise the gated flow
    // (auth-routes.test.ts, auth-helpers.ts, dev:e2e in package.json,
    // global-setup.ts) set REQUIRE_EMAIL_VERIFICATION=true explicitly.
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION === "true",
    autoSignIn:
      process.env.REQUIRE_EMAIL_VERIFICATION !== "true",
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
      // Stash per-email token + url so test helpers + E2E bridges can pick them
      // up without coupling to better-auth's internal token format (which is a
      // signed JWT, not a DB row). `url` stays as better-auth emitted it (used
      // by the C1 contract test); `frontendUrl` is what the email body links to.
      //
      // Never in prod: this is a live map of валидных verification tokens sitting
      // in process memory, and the /api/dev/verify-tokens route reads it. Nothing
      // in prod needs it.
      if (process.env.NODE_ENV !== "production") {
        const g = globalThis as {
          __verifyTokensByEmail?: Map<
            string,
            { url: string; frontendUrl: string; token: string }
          >;
        };
        if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
        g.__verifyTokensByEmail.set(user.email, { url, frontendUrl, token });
      }

      // Real send via Resend if configured. Fire-and-forget: do NOT await,
      // do NOT throw — see dispatchVerificationEmail comment.
      dispatchVerificationEmail({ to: user.email, frontendUrl });
    },
  },
  plugins: [
    ...(telegramOAuthConfig
      ? [genericOAuth({ config: [telegramOAuthConfig] })]
      : []),
  ],
});
