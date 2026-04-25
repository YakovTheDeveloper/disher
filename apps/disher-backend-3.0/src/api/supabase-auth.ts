import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.warn(
    "[supabase-auth] SUPABASE_URL not set — analytics endpoints will reject all requests"
  );
}

const JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

const ISSUER = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : undefined;

/**
 * Verify a Supabase JWT (anonymous or permanent) from Authorization: Bearer …
 * Returns the user UUID (`sub` claim) on success, or sends 401 and returns null.
 * Both anon and permanent users are valid — they differ only by `is_anonymous`.
 */
export async function verifySupabaseUser(
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
      issuer: ISSUER,
      audience: "authenticated",
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
