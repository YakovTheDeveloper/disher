import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TELEGRAM_ISSUER,
  decodeJwtClaims,
  telegramGenericOAuthConfig,
  telegramProfileFromIdToken,
} from "../telegram.js";

// Pure-logic tests for the Telegram id_token → profile mapping. No DB, no live
// bot — this is the part we CAN verify without BotFather credentials. The OAuth
// round-trip itself (code exchange, session mint, set-auth-token) is exercised
// by better-auth's own genericOAuth code and needs a real/mocked OIDC server.

const CLIENT_ID = "123456:test-bot";
const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/** Build a JWT-shaped string (signature is irrelevant — we don't verify it). */
function makeIdToken(claims: Record<string, unknown>): string {
  return `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url(claims)}.sig`;
}

function baseClaims(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: TELEGRAM_ISSUER,
    aud: CLIENT_ID,
    exp: FUTURE_EXP,
    sub: "777000",
    name: "Иван Петров",
    preferred_username: "ivanp",
    picture: "https://t.me/i/userpic/320/ivanp.jpg",
    ...over,
  };
}

afterEach(() => {
  delete process.env.TELEGRAM_CLIENT_ID;
  delete process.env.TELEGRAM_CLIENT_SECRET;
  vi.unstubAllEnvs();
});

describe("telegramProfileFromIdToken", () => {
  it("maps a valid id_token to a profile with a synthetic verified email", () => {
    const profile = telegramProfileFromIdToken(makeIdToken(baseClaims()), {
      clientId: CLIENT_ID,
    });
    expect(profile).toEqual({
      id: "777000",
      name: "Иван Петров",
      email: "tg_777000@telegram.local",
      emailVerified: true,
      image: "https://t.me/i/userpic/320/ivanp.jpg",
    });
  });

  it("keys the email on sub so distinct Telegram ids never collide", () => {
    const a = telegramProfileFromIdToken(makeIdToken(baseClaims({ sub: "111" })), { clientId: CLIENT_ID });
    const b = telegramProfileFromIdToken(makeIdToken(baseClaims({ sub: "222" })), { clientId: CLIENT_ID });
    expect(a?.email).toBe("tg_111@telegram.local");
    expect(b?.email).toBe("tg_222@telegram.local");
    expect(a?.email).not.toBe(b?.email);
  });

  it("falls back given_name+family_name → preferred_username → 'Telegram <sub>'", () => {
    const noName = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ name: undefined, given_name: "Анна", family_name: "Сидорова" })),
      { clientId: CLIENT_ID },
    );
    expect(noName?.name).toBe("Анна Сидорова");

    const onlyUsername = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ name: undefined, given_name: undefined, family_name: undefined })),
      { clientId: CLIENT_ID },
    );
    expect(onlyUsername?.name).toBe("ivanp");

    const nothing = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ name: undefined, given_name: undefined, family_name: undefined, preferred_username: undefined })),
      { clientId: CLIENT_ID },
    );
    expect(nothing?.name).toBe("Telegram 777000");
  });

  it("omits image when the picture claim is absent", () => {
    const profile = telegramProfileFromIdToken(makeIdToken(baseClaims({ picture: undefined })), { clientId: CLIENT_ID });
    expect(profile?.image).toBeUndefined();
  });

  it("rejects an expired token", () => {
    const expired = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ exp: Math.floor(Date.now() / 1000) - 10 })),
      { clientId: CLIENT_ID },
    );
    expect(expired).toBeNull();
  });

  it("rejects a wrong issuer", () => {
    const badIss = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ iss: "https://evil.example.com" })),
      { clientId: CLIENT_ID },
    );
    expect(badIss).toBeNull();
  });

  it("rejects an audience meant for a different client", () => {
    const badAud = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ aud: "999999:other-bot" })),
      { clientId: CLIENT_ID },
    );
    expect(badAud).toBeNull();
  });

  it("accepts an array aud that includes our client", () => {
    const arrAud = telegramProfileFromIdToken(
      makeIdToken(baseClaims({ aud: ["999999:other-bot", CLIENT_ID] })),
      { clientId: CLIENT_ID },
    );
    expect(arrAud?.id).toBe("777000");
  });

  it("rejects a token with no sub", () => {
    const noSub = telegramProfileFromIdToken(makeIdToken(baseClaims({ sub: undefined })), { clientId: CLIENT_ID });
    expect(noSub).toBeNull();
  });

  it("returns null for malformed / missing tokens", () => {
    expect(telegramProfileFromIdToken(undefined)).toBeNull();
    expect(telegramProfileFromIdToken("")).toBeNull();
    expect(telegramProfileFromIdToken("not-a-jwt")).toBeNull();
    expect(telegramProfileFromIdToken("a.b.c")).toBeNull(); // b is not valid base64url JSON
  });

  it("honors an injected clock for expiry checks", () => {
    const token = makeIdToken(baseClaims({ exp: 1_000 }));
    expect(telegramProfileFromIdToken(token, { clientId: CLIENT_ID, now: 500 * 1000 })?.id).toBe("777000");
    expect(telegramProfileFromIdToken(token, { clientId: CLIENT_ID, now: 2_000 * 1000 })).toBeNull();
  });
});

describe("decodeJwtClaims", () => {
  it("decodes the payload segment", () => {
    expect(decodeJwtClaims(makeIdToken({ sub: "1", hi: "there" }))).toMatchObject({ sub: "1", hi: "there" });
  });
  it("returns null on garbage", () => {
    expect(decodeJwtClaims("only-one-segment")).toBeNull();
    expect(decodeJwtClaims(undefined)).toBeNull();
  });
});

describe("telegramGenericOAuthConfig", () => {
  it("is null when credentials are absent (feature OFF)", () => {
    expect(telegramGenericOAuthConfig()).toBeNull();
  });

  it("builds the provider config when both credentials are set", () => {
    vi.stubEnv("TELEGRAM_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("TELEGRAM_CLIENT_SECRET", "s3cr3t");
    const cfg = telegramGenericOAuthConfig();
    expect(cfg).toMatchObject({
      providerId: "telegram",
      discoveryUrl: "https://oauth.telegram.org/.well-known/openid-configuration",
      issuer: TELEGRAM_ISSUER,
      requireIssuerValidation: true,
      clientId: CLIENT_ID,
      clientSecret: "s3cr3t",
      scopes: ["openid", "profile"],
      pkce: true,
      authentication: "basic",
    });
    expect(typeof cfg?.getUserInfo).toBe("function");
  });

  it("wires getUserInfo to decode the id_token", async () => {
    vi.stubEnv("TELEGRAM_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("TELEGRAM_CLIENT_SECRET", "s3cr3t");
    const cfg = telegramGenericOAuthConfig();
    const info = await cfg?.getUserInfo?.({ idToken: makeIdToken(baseClaims()) });
    expect(info).toMatchObject({ id: "777000", email: "tg_777000@telegram.local", emailVerified: true });
  });
});
