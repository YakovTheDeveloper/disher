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

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import pg from "pg";

const connectionString = process.env.LOCAL_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "LOCAL_DATABASE_URL is required for better-auth (CLI generate + runtime)"
  );
}

export const auth = betterAuth({
  database: new pg.Pool({ connectionString }),
  user: {
    modelName: "users",
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url, token }) => {
      console.log(
        `[auth] verification email -> ${user.email}\n  url: ${url}\n  token: ${token}`
      );
      // Stash per-email token + url so test helpers + E2E bridges can pick
      // them up without coupling to better-auth's internal token format
      // (which is a signed JWT, not a DB row).
      const g = globalThis as {
        __verifyTokensByEmail?: Map<string, { url: string; token: string }>;
      };
      if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
      g.__verifyTokensByEmail.set(user.email, { url, token });
    },
  },
  plugins: [bearer()],
});
