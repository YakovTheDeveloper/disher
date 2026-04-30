import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
} from "jose";
import Fastify, { type FastifyInstance } from "fastify";

// 8.10 verifySupabaseUser edge cases (P2).
//
// Replaces createRemoteJWKSet with a LOCAL JWKS so we can mint controlled
// tokens (good sub, missing sub, wrong issuer, expired) and verify the
// reply behaviour (401 vs 200) without a live Supabase round-trip.
//
// SUPABASE_URL must be set so the module under test boots its issuer/JWKS
// pair — we don't actually call Supabase, only borrow the URL string.

process.env.SUPABASE_URL ||= "https://example.supabase.co";

const ISSUER = `${process.env.SUPABASE_URL}/auth/v1`;

// jose 6 typed key as CryptoKey | KeyObject; use unknown so the test isn't
// pinned to internals.
let privateKey: any;
let publicJwk: any;
const kid = "test-key-1";

vi.mock("jose", async (importOriginal) => {
  const real = await importOriginal<typeof import("jose")>();
  return {
    ...real,
    // Replace remote JWKS with a local one so verifySupabaseUser uses our key.
    createRemoteJWKSet: (_url: URL) => {
      let local: ReturnType<typeof real.createLocalJWKSet> | null = null;
      return async (header: any, token: any) => {
        if (!local) {
          if (!publicJwk) {
            throw new Error(
              "test JWKS used before beforeAll initialised the key",
            );
          }
          local = real.createLocalJWKSet({ keys: [publicJwk] });
        }
        return local(header, token);
      };
    },
  };
});

let app: FastifyInstance;
let verifySupabaseUser: typeof import("../supabase-auth.js").verifySupabaseUser;

beforeAll(async () => {
  // Important: pass extractable: true so we can exportJWK the public half.
  const kp = await generateKeyPair("RS256", { extractable: true });
  privateKey = kp.privateKey;
  publicJwk = await exportJWK(kp.publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  // Import AFTER mock + env are in place.
  ({ verifySupabaseUser } = await import("../supabase-auth.js"));

  app = Fastify({ logger: false });
  app.get("/probe", async (req, reply) => {
    const uid = await verifySupabaseUser(req, reply);
    if (!uid) return; // verifySupabaseUser already sent the response
    return reply.send({ uid });
  });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
});

async function mintToken(opts: {
  sub?: string;
  issuer?: string;
  audience?: string | string[];
  expiresIn?: string;
  notBefore?: string;
}) {
  const j = new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuedAt()
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? "authenticated")
    .setExpirationTime(opts.expiresIn ?? "1h");
  if (opts.sub) j.setSubject(opts.sub);
  if (opts.notBefore) j.setNotBefore(opts.notBefore);
  return j.sign(privateKey);
}

describe("verifySupabaseUser", () => {
  it("returns 200 + uid for a valid token", async () => {
    const token = await mintToken({
      sub: "00000000-0000-0000-0000-000000000001",
    });
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      uid: "00000000-0000-0000-0000-000000000001",
    });
  });

  it("rejects with 401 when Authorization header is missing", async () => {
    const res = await app.inject({ method: "GET", url: "/probe" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: expect.stringMatching(/token/i) });
  });

  it("rejects with 401 when Authorization is not a Bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: "Basic abc:def" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects with 401 when token has no `sub` claim", async () => {
    const token = await mintToken({}); // sub omitted
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({
      error: expect.stringMatching(/sub|invalid/i),
    });
  });

  it("rejects expired tokens", async () => {
    const token = await mintToken({
      sub: "00000000-0000-0000-0000-000000000002",
      expiresIn: "-1m", // already expired
    });
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { detail?: string };
    expect(body.detail?.toLowerCase() ?? "").toMatch(/exp/);
  });

  it("rejects tokens signed with the wrong issuer", async () => {
    const token = await mintToken({
      sub: "00000000-0000-0000-0000-000000000003",
      issuer: "https://other.supabase.co/auth/v1",
    });
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { detail?: string };
    expect(body.detail?.toLowerCase() ?? "").toMatch(/iss/);
  });

  it("rejects tokens with the wrong audience", async () => {
    const token = await mintToken({
      sub: "00000000-0000-0000-0000-000000000004",
      audience: "service_role",
    });
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { detail?: string };
    expect(body.detail?.toLowerCase() ?? "").toMatch(/aud/);
  });

  it("rejects unsigned / tampered tokens (garbage in Bearer)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/probe",
      headers: { authorization: "Bearer not.a.jwt" },
    });
    expect(res.statusCode).toBe(401);
  });
});
