import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { auth } from "../server.js";
import { createTestUser } from "../../test/auth-helpers.js";
import { makeTestPool, truncateAllUserData } from "../../test/db-helpers.js";

// Ratchet on the SHAPE of the session cookie. The session is the whole of our
// auth — every attribute below is load-bearing, and every one of them is set by
// config that a better-auth upgrade or an innocent-looking edit could flip.
//
// The `Domain` assertion is the point of this file. With `Domain=.disher.life` the
// browser attached our session token to every request to every *.disher.life host —
// and prod ingress is a SHARED box, so a neighbour's server could read it straight
// out of the Cookie header. Host-only ends that broadcast, and costs nothing: a
// cookie follows the origin of the REQUEST, not of the page.
//
// It does NOT close cookie TOSSING — a neighbour can still write
// `__Secure-disher1.session_token=<their own valid session>; Domain=.disher.life`,
// both cookies fly, and RFC 6265 §5.4 ordering decides who wins. Only `__Host-`
// forbids that write, and taking it is deliberately deferred. Don't read a green
// board here as "the cookie cannot be tossed". See auth/server.ts `advanced`.

const ready = Boolean(process.env.TEST_DATABASE_URL);
const describeIfReady = ready ? describe : describe.skip;

type CookieAttrs = {
  name: string;
  value: string;
  attrs: Map<string, string>;
};

function parseSetCookie(raw: string): CookieAttrs {
  const [pair, ...rest] = raw.split(";");
  const eq = pair.indexOf("=");
  const attrs = new Map<string, string>();
  for (const part of rest) {
    const trimmed = part.trim();
    const i = trimmed.indexOf("=");
    if (i === -1) attrs.set(trimmed.toLowerCase(), "");
    else
      attrs.set(
        trimmed.slice(0, i).toLowerCase(),
        trimmed.slice(i + 1),
      );
  }
  return {
    name: pair.slice(0, eq),
    value: pair.slice(eq + 1),
    attrs,
  };
}

function sessionSetCookie(res: Response): CookieAttrs {
  const raw = res.headers
    .getSetCookie()
    .find((c) => c.split("=", 1)[0].endsWith("session_token"));
  if (!raw) throw new Error("no session cookie in Set-Cookie");
  return parseSetCookie(raw);
}

describeIfReady("session cookie contract", () => {
  let pool: ReturnType<typeof makeTestPool>;

  beforeAll(() => {
    pool = makeTestPool();
  });
  afterAll(async () => {
    await pool.end();
  });
  beforeEach(async () => {
    await truncateAllUserData(pool);
  });

  it("is host-only — no Domain attribute", async () => {
    const user = await createTestUser();
    const res = (await auth.api.signInEmail({
      body: { email: user.email, password: "test-password-12345" },
      asResponse: true,
    })) as Response;

    const cookie = sessionSetCookie(res);
    expect(cookie.attrs.has("domain")).toBe(false);
  });

  // The wire test above only proves the CURRENT env. `crossSubDomainCookies` was
  // previously gated on NODE_ENV==='production', so a reintroduction behind that
  // same gate would sail past a test running under NODE_ENV=test. Assert the
  // config directly — that catches it in any env.
  it("declares no crossSubDomainCookies in config", () => {
    const advanced = auth.options.advanced as
      | { crossSubDomainCookies?: unknown }
      | undefined;
    expect(advanced?.crossSubDomainCookies).toBeUndefined();
  });

  it("carries HttpOnly, SameSite=Lax and Path=/", async () => {
    const user = await createTestUser();
    const res = (await auth.api.signInEmail({
      body: { email: user.email, password: "test-password-12345" },
      asResponse: true,
    })) as Response;

    const cookie = sessionSetCookie(res);
    expect(cookie.attrs.has("httponly")).toBe(true);
    expect(cookie.attrs.get("samesite")).toBe("Lax");
    expect(cookie.attrs.get("path")).toBe("/");
  });

  // The prefix is a namespace, not decoration: the pre-migration `disher` cookie
  // was domain-scoped, so dropping Domain without renaming would have parked the
  // new host-only cookie NEXT to the old one (identity = name+domain+path) and
  // the server would read whichever came first. Renaming the namespace is what
  // makes the migration deterministic.
  it("lives in the disher1 namespace", async () => {
    const user = await createTestUser();
    const res = (await auth.api.signInEmail({
      body: { email: user.email, password: "test-password-12345" },
      asResponse: true,
    })) as Response;

    // `__Secure-` is prepended by better-auth whenever baseURL is https; the
    // test server is http, so only the bare name is asserted here.
    expect(sessionSetCookie(res).name).toMatch(
      /^(__Secure-)?disher1\.session_token$/,
    );
  });

  // Chrome caps cookie lifetime at 400 days (RFC 6265bis §5.5): a longer Max-Age
  // is silently clamped, so a drift past it would quietly shorten our sessions
  // instead of erroring. 365d is the "log in once" invariant — see server.ts.
  it("expires in ~365 days, under the 400-day browser cap", async () => {
    const user = await createTestUser();
    const res = (await auth.api.signInEmail({
      body: { email: user.email, password: "test-password-12345" },
      asResponse: true,
    })) as Response;

    const maxAge = Number(sessionSetCookie(res).attrs.get("max-age"));
    const day = 60 * 60 * 24;
    expect(maxAge).toBeGreaterThan(360 * day);
    expect(maxAge).toBeLessThan(400 * day);
  });

  // Sign-out must CLEAR the cookie, not just delete the DB row — and it must
  // clear the same name it set. This is the two-cookie trap seen from the other
  // end: when a cookie exists twice under different scopes, sign-out can only
  // clear one of them, so the user presses «Выйти» and stays signed in. The e2e
  // spec was supposed to own this ratchet, but it has been dead since AuthScreen
  // went Telegram-only (it drives a signup form that no longer renders), so the
  // assertion lives here — where it actually runs.
  it("clears the session cookie on sign-out", async () => {
    const user = await createTestUser();
    const res = (await auth.api.signOut({
      headers: new Headers({ cookie: user.sessionCookie }),
      asResponse: true,
    })) as Response;

    const cleared = res.headers
      .getSetCookie()
      .filter((c) => c.split("=", 1)[0].endsWith("session_token"));

    expect(cleared).toHaveLength(1);
    const cookie = parseSetCookie(cleared[0]);
    expect(cookie.name).toMatch(/^(__Secure-)?disher1\.session_token$/);
    expect(cookie.value).toBe("");
    expect(cookie.attrs.get("max-age")).toBe("0");
  });

  // probeSessionLiveness (frontend) asks getSession whether a mid-session 401 was
  // real before it signs the user out and wipes Dexie. That answer is only
  // trustworthy while the session is read from the DB. Turn cookieCache on and a
  // revoked session keeps answering "alive" from a signed cookie payload until the
  // cache TTL lapses — the user would never be signed out, and (per better-auth
  // #10021) a stale cached payload signs them out at the wrong moment instead.
  // The invariant lived only in a comment in server.ts. Now it fails a test.
  it("keeps the session cookie cache OFF", () => {
    const session = auth.options.session as
      | { cookieCache?: { enabled?: boolean } }
      | undefined;
    expect(session?.cookieCache?.enabled).not.toBe(true);
  });

  // The residual risk that dropping `Domain` does NOT close, pinned as behaviour.
  // A neighbour on the shared ingress can write a cookie with OUR name and their
  // own valid session (`Domain=.disher.life`), and the browser sends both. There is
  // no signature to distinguish them — theirs is genuinely signed. Whoever the
  // parser reads first wins, and that is decided by RFC 6265 §5.4 ordering, not by
  // us. This test states which one the server picks, so that if a better-auth
  // upgrade flips first-wins to last-wins (turning "usually safe" into "always
  // tossed"), it is caught here and not in production. The real fix is `__Host-`.
  it("reads the FIRST of two same-named session cookies (cookie-tossing surface)", async () => {
    const user = await createTestUser();
    const [name] = user.sessionCookie.split("=");

    const tossedFirst = await auth.api.getSession({
      headers: new Headers({
        cookie: `${name}=tossed-garbage; ${user.sessionCookie}`,
      }),
    });
    // Ours comes second and is shadowed — the tossed value is what got read.
    expect(tossedFirst).toBeNull();

    const tossedSecond = await auth.api.getSession({
      headers: new Headers({
        cookie: `${user.sessionCookie}; ${name}=tossed-garbage`,
      }),
    });
    // Ours comes first and wins. Order is the ONLY thing protecting us.
    expect(tossedSecond?.user.id).toBe(user.userId);
  });

  // The direct regression test for the two-cookie trap: a stale `disher` cookie
  // left in a live browser must not shadow the new `disher1` one.
  it("resolves the session past a stale disher.* cookie", async () => {
    const user = await createTestUser();
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `disher.session_token=stale-garbage; ${user.sessionCookie}`,
      }),
    });

    expect(session?.user.id).toBe(user.userId);
  });
});
