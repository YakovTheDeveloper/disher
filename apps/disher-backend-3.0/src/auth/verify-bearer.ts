// Better-auth bearer-token verifier. Drop-in replacement for the legacy
// jose/JWKS verifier in src/api/auth.ts — same signature, same return shape,
// new backend.
//
// Lives here ahead of B4 (the route-level swap) so that B2 backup tests can
// exercise the real auth chain (mock the import in src/api/auth.js → this
// function). When B4 lands, src/api/auth.ts becomes a thin re-export of this
// and the test mocks disappear.

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
