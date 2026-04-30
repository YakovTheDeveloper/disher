// Provider-neutral JWT verification for protected routes. Currently backed
// by Supabase JWKS (see supabase-auth.ts), but call sites (backup.ts,
// analytics.ts) only know about `verifyUser` — Phase 1 of the migration
// plan swaps the implementation underneath without touching routes.

import type { FastifyRequest, FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL;
const AUTH_ISSUER = process.env.AUTH_ISSUER ?? (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : undefined);
const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE ?? "authenticated";
const JWKS_URL = process.env.AUTH_JWKS_URL ?? (SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : undefined);

if (!JWKS_URL) {
  console.warn(
    "[auth] AUTH_JWKS_URL/SUPABASE_URL not set — protected routes will reject all requests"
  );
}

const JWKS = JWKS_URL ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

/**
 * Verify the Authorization: Bearer <jwt> header against the configured JWKS.
 * Returns the user UUID (`sub` claim) on success, or sends 401/500 and
 * returns null. Both anon and permanent users are valid — they differ only
 * by `is_anonymous` (not consumed here).
 */
export async function verifyUser(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> {
  if (!JWKS) {
    reply.status(500).send({ error: "Server auth not configured" });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "No token provided" });
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
    });
    if (!payload.sub) {
      reply.status(401).send({ error: "Invalid token: no sub claim" });
      return null;
    }
    return payload.sub;
  } catch (err) {
    reply.status(401).send({
      error: "Invalid or expired token",
      detail: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
