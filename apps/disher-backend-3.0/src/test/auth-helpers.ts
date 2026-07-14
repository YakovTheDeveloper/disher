import { auth } from "../auth/server.js";

// Test auth helpers — wrap better-auth's first-party `auth.api.signUpEmail`
// so each test can mint a fresh user + session cookie in one call.
//
// We intentionally use the production `auth` instance (../auth/server.ts)
// rather than better-auth's `getTestInstance` — the latter spins up its own
// sqlite DB, which would not exercise the FK chain into our `public.<disher>`
// tables (see init.sql). Tests need to write rows that reference users.id, so
// users must live in our `disher_test` schema.
//
// LOCAL_DATABASE_URL on the auth instance is overridden to TEST_DATABASE_URL
// at the top of every test entry-point (see global-setup.ts indirectly: the
// test pool reads from TEST_DATABASE_URL, but `auth/server.ts` reads
// LOCAL_DATABASE_URL when imported). Solution: set LOCAL_DATABASE_URL = the
// test URL in global-setup so the in-process `auth` pool points at disher_test.
//
// Email verification (C1): `requireEmailVerification: true` makes signUpEmail
// return `token: null` (no session). To keep the rest of the suite focused on
// post-auth behaviour (LWW upsert, ownership, etc.), `createTestUser` runs
// signUp → picks the JWT verification token out of the `globalThis` map
// populated by the dev-stub `sendVerificationEmail` callback in auth/server.ts
// → calls `auth.api.verifyEmail`, which (with
// `autoSignInAfterVerification: true`) issues the session cookie in `set-cookie`.
//
// Note: better-auth's email-verification token is a self-contained signed JWT,
// not a `verification` table row — reading from the table would always miss.

export type TestUser = {
  /** UUID — usable as user_id in disher tables. */
  userId: string;
  /** `Cookie:` header value carrying the session cookie (name=<signed value>). */
  sessionCookie: string;
  /** Convenience: `{ cookie: "<name>=<value>" }` ready for inject() headers. */
  headers: Record<string, string>;
  email: string;
};

let counter = 0;

/**
 * Pull the better-auth session cookie out of a `Set-Cookie` response and return
 * it as a `Cookie:` header value. Matched by suffix (`*session_token`) rather
 * than a hard-coded name so `advanced.cookiePrefix` and the `__Secure-` prefix
 * (added only when the base URL is https) stay free to change.
 */
export function sessionCookieFromResponse(response: Response): string | null {
  return pickSessionCookie(response.headers.getSetCookie());
}

/**
 * Same, for a Fastify `inject()` result — its `set-cookie` header is a bare
 * string when a single cookie was set and an array when several were.
 */
export function sessionCookieFromInject(res: {
  headers: Record<string, unknown>;
}): string | null {
  const raw = res.headers["set-cookie"];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return pickSessionCookie(list.map(String));
}

function pickSessionCookie(setCookies: string[]): string | null {
  for (const raw of setCookies) {
    const pair = raw.split(";", 1)[0];
    const name = pair.split("=", 1)[0];
    // An expiry-style clear (`...=; Max-Age=0`) carries an empty value — it is
    // a sign-out, not a session, so don't hand it back as a credential.
    if (name.endsWith("session_token") && pair.length > name.length + 1) {
      return pair;
    }
  }
  return null;
}

type VerifyTokenMap = Map<
  string,
  { url: string; frontendUrl: string; token: string }
>;

function getVerifyTokensMap(): VerifyTokenMap {
  const g = globalThis as { __verifyTokensByEmail?: VerifyTokenMap };
  if (!g.__verifyTokensByEmail) g.__verifyTokensByEmail = new Map();
  return g.__verifyTokensByEmail;
}

/**
 * Pick the JWT verification token left by the dev-stub `sendVerificationEmail`
 * callback (see auth/server.ts) and call `auth.api.verifyEmail`. Returns the
 * session cookie issued by `autoSignInAfterVerification`. Throws if the callback
 * has not populated the map for `email` (a signal that better-auth never invoked
 * the callback — likely a config regression).
 */
async function verifyEmailForTest(email: string): Promise<string> {
  const tokens = getVerifyTokensMap();
  const entry = tokens.get(email);
  if (!entry) {
    throw new Error(
      `no verification token recorded for ${email} — did sendVerificationEmail fire? Check auth/server.ts emailVerification config.`,
    );
  }
  // Consume so subsequent verifyEmail calls for the same address don't
  // accidentally reuse a stale (potentially already-consumed) token.
  tokens.delete(email);

  const response = (await auth.api.verifyEmail({
    query: { token: entry.token },
    asResponse: true,
  })) as Response;

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    throw new Error(
      `verifyEmail failed: ${response.status} ${response.statusText} — ${body}`,
    );
  }

  const sessionCookie = sessionCookieFromResponse(response);
  if (!sessionCookie) {
    throw new Error(
      "verifyEmail response set no session cookie — is autoSignInAfterVerification enabled?",
    );
  }
  return sessionCookie;
}

/**
 * Sign up a fresh test user via better-auth, then verify the email + grab the
 * session cookie. Returns userId + the cookie header.
 *
 * Email defaults to `test+<counter>+<random>@example.com` so multiple users
 * in the same test get unique emails without collision.
 */
export async function createTestUser(opts: {
  email?: string;
  password?: string;
  name?: string;
} = {}): Promise<TestUser> {
  counter += 1;
  const email =
    opts.email ??
    `test+${counter}+${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = opts.password ?? "test-password-12345";
  const name = opts.name ?? `Test User ${counter}`;

  const signUpResponse = (await auth.api.signUpEmail({
    body: { email, password, name },
    asResponse: true,
  })) as Response;

  if (!signUpResponse.ok) {
    const body = await signUpResponse.text().catch(() => "<no body>");
    throw new Error(
      `signUpEmail failed: ${signUpResponse.status} ${signUpResponse.statusText} — ${body}`,
    );
  }

  const json = (await signUpResponse.json()) as { user: { id: string } };
  const userId = json.user.id;

  const sessionCookie = await verifyEmailForTest(email);

  return {
    userId,
    sessionCookie,
    headers: { cookie: sessionCookie },
    email,
  };
}
