// Better-auth bearer-token verifier. Sole bearer auth path for protected
// routes; called from `requireUser` preHandler hook (auth/require-user.ts).

import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "./server.js";

/**
 * Verify the `Authorization: Bearer <token>` header against the better-auth
 * session store. Returns the user UUID on success, or sends 401 and returns
 * null. The bearer plugin in auth/server.ts converts the token into a session
 * lookup transparently.
 */
export async function verifyUserBearer(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<string | null> {
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

  return session.user.id;
}
