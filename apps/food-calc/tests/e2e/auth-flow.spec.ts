import { test, expect, type Page } from '@playwright/test';

// ⚠️ CURRENTLY DEAD — do not read a green board as coverage. This spec drives the
// email/password signup form, and AuthScreen went Telegram-only on 2026-07-13
// (see AuthScreen.tsx: "nothing calls signUp"). It fails at gate 2, on the
// «Зарегистрироваться» button that no longer renders, and has done so since.
// Reviving it means driving the session through the __e2e bridge (signInTest)
// instead of the removed UI — Telegram's OAuth leg cannot be automated here.
//
// Until then the session-cookie contract is ratcheted on the BACKEND, in
// auth/__tests__/auth-cookie-contract.test.ts (no Domain, HttpOnly, SameSite,
// namespace, and sign-out actually clearing the cookie). The cookie assertions
// below are correct and ready, but they are downstream of the dead gate and do
// not run.
//
// Phase 1 acceptance E2E — full happy path against a REAL backend (no mocks):
//   gate 1: signed-out user is blocked by AuthScreen.
//   gate 2: signup with requireEmailVerification leaves the user on
//           CheckInboxView (NOT logged in yet).
//   gate 3: clicking the verification link (simulated via dev-only
//           /api/dev/verify-tokens + authClient.verifyEmail) signs the user in
//           and unmounts AuthScreen.
//   gate 4: a hard reload preserves the session (httpOnly cookie +
//           server-side opaque session row).
//   gate 5: signOut returns the user to AuthScreen.
//
// The session cookie is asserted directly at gates 3-5. It is the whole of our
// auth now (the bearer token is gone), and it is the one surface no other test
// can see: a JS test cannot read an httpOnly cookie, but Playwright can, through
// context.cookies(). The sharpest assertion is the one after sign-out — ZERO
// session cookies. That is the ratchet against the two-cookie trap, where a
// scope change leaves a second cookie of the same name behind, the server reads
// whichever comes first, and "Выйти" clears only one of them: the user presses
// sign-out and stays signed in.
//
// Backend infra: a separate dev:e2e backend on 127.0.0.1:3101 with
// REQUIRE_EMAIL_VERIFICATION=true (see playwright.config.ts webServer + the
// backend's package.json dev:e2e script). The user's `pnpm run dev:backend`
// on 3100 stays running without conflict.
//
// Bridge contract: window.__e2e is installed by SyncProvider in MODE === 'test'.
// Methods used here:
//   - getSession(): returns null until verifyEmail() flips it.
//   - verifyEmail(email): hits the dev token route + authClient.verifyEmail
//     (same code path as a real link click).
//   - signOut(): tears down the session.

const SIGN_IN_HEADING = /^Вход$/;
const SIGN_UP_HEADING = /^Регистрация$/;
const PASSWORD_STEP_HEADING = /^Придумайте пароль$/;
const CHECK_INBOX_HEADING = /^Проверьте почту$/;

// Wait for window.__e2e to be installed without requiring a session — the
// existing helpers.ts waitForBridge insists on a non-null session, which is
// wrong for the signed-out boot we test here.
async function waitForBridgeNoSession(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const e2e = (
        window as unknown as { __e2e?: { getSession?: unknown } }
      ).__e2e;
      return !!e2e && typeof e2e.getSession === 'function';
    },
    { timeout: 30_000 },
  );
}

async function getSession(
  page: Page,
): Promise<{ user: { id: string; email: string } } | null> {
  return page.evaluate(async () => {
    const e2e = (
      window as unknown as {
        __e2e: {
          getSession: () => Promise<{
            user: { id: string; email: string };
          } | null>;
        };
      }
    ).__e2e;
    return e2e.getSession();
  });
}

async function sessionCookies(page: Page) {
  const all = await page.context().cookies();
  return all.filter((c) => c.name.endsWith('.session_token'));
}

test.describe('auth flow (real backend)', () => {
  test('signup → CheckInbox → verify → reload persists → signOut → AuthScreen', async ({
    page,
  }) => {
    // Unique per-run email — the test pollutes whatever DB the dev:e2e backend
    // points at (LOCAL_DATABASE_URL, currently disher_dev), so don't collide
    // across runs.
    const email = `e2e-flow-${Date.now()}@disher.test`;
    const password = 'e2e-test-password-12';

    await page.goto('/');
    await waitForBridgeNoSession(page);

    // gate 1: AuthScreen visible, no session.
    await expect(
      page.getByRole('heading', { name: SIGN_IN_HEADING }),
    ).toBeVisible();
    expect(await getSession(page)).toBeNull();

    // Switch to signUp mode.
    await page.getByRole('button', { name: /Зарегистрироваться/ }).click();
    await expect(
      page.getByRole('heading', { name: SIGN_UP_HEADING }),
    ).toBeVisible();

    // Step 1: email.
    await page.getByPlaceholder('Email').fill(email);
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(
      page.getByRole('heading', { name: PASSWORD_STEP_HEADING }),
    ).toBeVisible();

    // Step 2: password → submit.
    await page.getByPlaceholder(/Пароль/).fill(password);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();

    // gate 2: CheckInboxView, NOT logged in.
    await expect(
      page.getByRole('heading', { name: CHECK_INBOX_HEADING }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(email)).toBeVisible();
    expect(await getSession(page)).toBeNull();

    // gate 3: simulate the verification-email click. The bridge fetches the
    // token from /api/dev/verify-tokens (dev-stub-only) and calls
    // authClient.verifyEmail({ query: { token } }) — better-auth issues the
    // bearer in set-auth-token, the onSuccess hook captures it, the session
    // atom flips, auth-store.applyUser logs the SPA in.
    await page.evaluate(async (em) => {
      const e2e = (
        window as unknown as {
          __e2e: { verifyEmail: (e: string) => Promise<unknown> };
        }
      ).__e2e;
      await e2e.verifyEmail(em);
    }, email);

    // CheckInboxView unmounts as soon as the auth-store flips isLoggedIn=true.
    await expect(
      page.getByRole('heading', { name: CHECK_INBOX_HEADING }),
    ).toBeHidden({ timeout: 10_000 });

    // Session is non-null and matches the email we signed up with.
    await page.waitForFunction(
      async () => {
        const e2e = (
          window as unknown as {
            __e2e: { getSession: () => Promise<unknown> };
          }
        ).__e2e;
        return (await e2e.getSession()) !== null;
      },
      undefined,
      { timeout: 10_000 },
    );
    const sessionAfterVerify = await getSession(page);
    expect(sessionAfterVerify).not.toBeNull();
    expect(sessionAfterVerify?.user.email).toBe(email);

    // Exactly ONE session cookie, and it is host-only. A `Domain` attribute here
    // would mean any neighbour on the parent domain can write our users' session
    // cookie (cookie tossing) — see auth/origins.ts + auth-cookie-contract.test.ts.
    const cookies = await sessionCookies(page);
    expect(cookies).toHaveLength(1);
    const [session] = cookies;
    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toBe('Lax');
    // Playwright reports a host-only cookie's domain WITHOUT a leading dot; a
    // domain-scoped one carries it. That dot is the whole difference.
    expect(session.domain.startsWith('.')).toBe(false);

    // gate 4: hard reload — the httpOnly cookie + the server-side session row
    // both survive.
    await page.reload();
    await waitForBridgeNoSession(page);
    const sessionAfterReload = await getSession(page);
    expect(sessionAfterReload).not.toBeNull();
    expect(sessionAfterReload?.user.email).toBe(email);
    // AuthScreen is NOT mounted (children are visible).
    await expect(
      page.getByRole('heading', { name: SIGN_IN_HEADING }),
    ).toBeHidden();

    // gate 5: signOut → AuthScreen returns.
    await page.evaluate(async () => {
      const e2e = (
        window as unknown as { __e2e: { signOut: () => Promise<void> } }
      ).__e2e;
      await e2e.signOut();
    });
    await expect(
      page.getByRole('heading', { name: SIGN_IN_HEADING }),
    ).toBeVisible({ timeout: 10_000 });
    expect(await getSession(page)).toBeNull();

    // The two-cookie ratchet: sign-out must leave NOTHING behind. A survivor here
    // is the exact shape of the bug where the user presses «Выйти» and stays in.
    expect(await sessionCookies(page)).toHaveLength(0);
  });
});
