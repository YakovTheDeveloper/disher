import { jwtVerify } from "jose";
import { FastifyRequest, FastifyReply } from "fastify";

const JWT_SECRET = new TextEncoder().encode(
  process.env.TRIPLIT_JWT_SECRET ?? "secret"
);

/**
 * Extract userId from Authorization: Bearer <token> header.
 * Returns userId string or sends 401 and returns null.
 */
export async function extractUserId(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "No token provided" });
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub) {
      reply.status(401).send({ error: "Invalid token: no sub claim" });
      return null;
    }
    return payload.sub;
  } catch {
    reply.status(401).send({ error: "Invalid or expired token" });
    return null;
  }
}
