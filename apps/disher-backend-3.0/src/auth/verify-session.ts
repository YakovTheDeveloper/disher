// Better-auth session verifier. Sole auth path for protected routes; called
// from the `requireUser` onRequest hook (auth/require-user.ts) — headers only, no
// body, which is what lets it run that early.

import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./server.js";

export interface SessionUser {
  userId: string;
  /** better-auth `user.role`; null when unset. */
  role: string | null;
}

/**
 * Resolve the request's session cookie against the better-auth session store.
 * Returns `{userId, role}` on success, or sends 401 and returns null. Exactly
 * ONE getSession call — callers that need the role (requireAdmin) reuse this
 * result rather than looking it up again.
 */
export async function verifyUserSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.raw.headers),
  });

  if (!session?.user) {
    reply.status(401).send({ error: "Invalid or expired session" });
    return null;
  }

  const role = (session.user as { role?: string | null }).role ?? null;
  return { userId: session.user.id, role };
}
