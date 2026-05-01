import { auth } from "../auth/server.js";

// Test auth helpers — wrap better-auth's first-party `auth.api.signUpEmail`
// so each test can mint a fresh user + bearer token in one call.
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

export type TestUser = {
  /** UUID — usable as user_id in disher tables. */
  userId: string;
  /** Bearer token from set-auth-token header — send as Authorization: Bearer <token>. */
  sessionToken: string;
  /** Convenience: `{ authorization: "Bearer <token>" }` ready for inject() headers. */
  headers: Record<string, string>;
  email: string;
};

let counter = 0;

/**
 * Sign up a fresh test user via better-auth. Returns userId + bearer token.
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

  const response = (await auth.api.signUpEmail({
    body: { email, password, name },
    asResponse: true,
  })) as Response;

  if (!response.ok) {
    const body = await response.text().catch(() => "<no body>");
    throw new Error(
      `signUpEmail failed: ${response.status} ${response.statusText} — ${body}`,
    );
  }

  const sessionToken = response.headers.get("set-auth-token");
  if (!sessionToken) {
    throw new Error(
      "signUpEmail response missing set-auth-token header — is bearer() plugin enabled in auth/server.ts?",
    );
  }

  const json = (await response.json()) as { user: { id: string } };
  const userId = json.user.id;

  return {
    userId,
    sessionToken,
    headers: { authorization: `Bearer ${sessionToken}` },
    email,
  };
}
