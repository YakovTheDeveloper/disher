import { jwtVerify } from "jose";
import { FastifyRequest, FastifyReply } from "fastify";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "secret"
);

/**
 * Extract userId from Authorization: Bearer <token> header.
 * Returns userId string or sends 401 and returns null.
 */
export async function extractUserId(
  req: FastifyRequest,
  reply: FastifyReply,
  silent?: boolean
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    if (!silent) reply.status(401).send({ error: "No token provided" });
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) {
      if (!silent) reply.status(401).send({ error: "Invalid token: no sub claim" });
      return null;
    }
    return payload.sub;
  } catch {
    if (!silent) reply.status(401).send({ error: "Invalid or expired token" });
    return null;
  }
}
