// Better-auth bearer-token verifier. Sole bearer auth path for protected
// routes; called from `requireUser` preHandler hook (auth/require-user.ts).

import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "./server.js";

export interface BearerUser {
  userId: string;
  /** better-auth `user.role` (added by the admin plugin); null when unset. */
  role: string | null;
}

/**
 * Verify the `Authorization: Bearer <token>` header against the better-auth
 * session store. Returns `{userId, role}` on success, or sends 401 and returns
 * null. The bearer plugin in auth/server.ts converts the token into a session
 * lookup transparently. Exactly ONE getSession call — callers that need the
 * role (requireAdmin) reuse this result rather than looking it up again.
 */
export async function verifyUserBearer(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<BearerUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "No token provided" });
    return null;
  }

  const session = await auth.api.getSession({
    headers: new Headers({ authorization: authHeader }),
  });

  if (!session?.user) {
    reply.status(401).send({ error: "Invalid or expired token" });
    return null;
  }

  const role = (session.user as { role?: string | null }).role ?? null;
  return { userId: session.user.id, role };
}
