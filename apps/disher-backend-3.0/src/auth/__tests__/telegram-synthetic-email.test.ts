import { describe, expect, it } from "vitest";
import { auth } from "../server.js";
import {
  isSyntheticTelegramEmail,
  syntheticTelegramEmail,
  telegramProfileFromIdToken,
  TELEGRAM_ISSUER,
} from "../telegram.js";

// Ratchets on the account-takeover fix (audit 2026-07-14, V-1).
//
// The hole: Telegram returns no email, better-auth demands one, so we mint
// `tg_<sub>@telegram.local`. `sub` is a Telegram user-id — PUBLIC. And
// better-auth's findOAuthUser, on missing an `account` row, falls back to a
// lookup BY EMAIL. So an attacker who registered that address with a password of
// their own would receive the victim's Telegram identity on the victim's next
// login, and with it the diary, the backup vault and the wallet.
//
// Two independent guards, one test each below:
//   1. the namespace is unregisterable  (hooks.before in server.ts)
//   2. email is never a linking key     (accountLinking.disableImplicitLinking)
//
// NOT covered here: the full OAuth callback. Driving it would mean standing up a
// fake Telegram token endpoint, and these tests would then assert against our own
// mock rather than the library. So the guards are pinned at the two places they
// actually live — the sign-up route and the resolved config — and the attack path
// between them is argued, not executed. A green board here means "both guards are
// still in place", not "takeover has been demonstrated impossible end-to-end".

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

/** An id_token shaped like Telegram's, signed with nothing — we only decode it. */
function fakeIdToken(sub: string): string {
  const claims = {
    iss: TELEGRAM_ISSUER,
    sub,
    aud: "test-client",
    exp: Math.floor(Date.now() / 1000) + 3600,
    name: "Victim",
  };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(claims)}.`;
}

describe("synthetic Telegram email — namespace", () => {
  // THE anti-divergence ratchet. The guard (isSyntheticTelegramEmail) and the
  // minter (syntheticTelegramEmail) are two functions; the day they disagree,
  // the takeover is back and nothing else in the suite would notice. This test
  // is the reason they live in one file.
  it("recognizes every address it mints", () => {
    for (const sub of ["1", "123456789", "99999999999"]) {
      expect(isSyntheticTelegramEmail(syntheticTelegramEmail(sub))).toBe(true);
    }
  });

  // Same coupling, but through the REAL profile builder — the code path an
  // actual Telegram login takes. Catches a reshape of the address that edits
  // telegramProfileFromIdToken without touching syntheticTelegramEmail.
  it("recognizes the address a real Telegram login would produce", () => {
    const profile = telegramProfileFromIdToken(fakeIdToken("123456789"), {
      clientId: "test-client",
    });
    expect(profile).not.toBeNull();
    expect(isSyntheticTelegramEmail(profile?.email)).toBe(true);
  });

  it("does not swallow ordinary addresses", () => {
    for (const email of [
      "user@example.com",
      "tg_123@example.com",
      // Lookalikes: the domain must match exactly, not merely appear.
      "user@nottelegram.local",
      "user@telegram.local.evil.com",
      undefined,
      null,
      42,
    ]) {
      expect(isSyntheticTelegramEmail(email)).toBe(false);
    }
  });

  it("is case- and whitespace-insensitive", () => {
    expect(isSyntheticTelegramEmail("  TG_123@Telegram.Local  ")).toBe(true);
  });
});

describe("account linking config", () => {
  // Asserted against the resolved config, not against behaviour: a flip of
  // either flag is silent — no error, no log, just a reopened takeover (for the
  // first) or a dead "Привязать Telegram" (for the second).
  it("never links an OAuth identity onto an existing user by email", () => {
    const account = auth.options.account as
      | { accountLinking?: { disableImplicitLinking?: unknown } }
      | undefined;
    expect(account?.accountLinking?.disableImplicitLinking).toBe(true);
  });

  // The deliberate link runs on an authenticated session and compares the
  // provider's email to the session user's. Telegram's is synthetic and never
  // matches, so without this flag that flow dies on `email_doesn't_match`.
  it("allows the deliberate link across different emails", () => {
    const account = auth.options.account as
      | { accountLinking?: { allowDifferentEmails?: unknown } }
      | undefined;
    expect(account?.accountLinking?.allowDifferentEmails).toBe(true);
  });
});

describeIfReady("sign-up guard on the reserved namespace", () => {
  // The load-bearing one. Note this goes through `auth.api.signUpEmail`, which
  // runs the same endpoint + hooks the public HTTP route does — an attacker
  // reaching it with curl hits exactly this code.
  //
  // A `before`-hook throw surfaces as a rejected APIError rather than a 4xx
  // Response, because `auth.api.*` rethrows instead of serializing (over HTTP
  // the same throw becomes a 400 — better-auth's router catches it there).
  // Asserting on the rejection is what pins the guard; asserting on a Response
  // would pass vacuously the day the hook stops firing.
  it("refuses to register an address in the Telegram namespace", async () => {
    const attempt = auth.api.signUpEmail({
      body: {
        // Precisely the address a victim with Telegram id 123456789 would get.
        email: syntheticTelegramEmail("123456789"),
        password: "attacker-password-12345",
        name: "Attacker",
      },
      asResponse: true,
    });

    await expect(attempt).rejects.toMatchObject({
      statusCode: 400,
      body: { code: "RESERVED_EMAIL_DOMAIN" },
    });
  });

  // The row must not exist afterwards — the point is that the namespace stays
  // unowned, not merely that one call errored.
  it("leaves no user row behind after the refusal", async () => {
    const email = syntheticTelegramEmail("987654321");
    await auth.api
      .signUpEmail({
        body: { email, password: "attacker-password-12345", name: "Attacker" },
        asResponse: true,
      })
      .catch(() => undefined);

    const ctx = await auth.$context;
    const existing = await ctx.internalAdapter.findUserByEmail(email);
    expect(existing).toBeNull();
  });

  // The guard must be a scalpel, not an axe: ordinary signup is a live feature.
  it("still registers an ordinary address", async () => {
    const res = (await auth.api.signUpEmail({
      body: {
        email: `guard-scope+${Math.random().toString(36).slice(2, 8)}@example.com`,
        password: "ordinary-password-12345",
        name: "Ordinary User",
      },
      asResponse: true,
    })) as Response;

    expect(res.ok).toBe(true);
  });
});
