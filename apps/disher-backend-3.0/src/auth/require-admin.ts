import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyUserSession } from "./verify-session.js";

// Server-side admin guard — the ONLY real gate (the client-side gate is UX,
// AuthGate on the frontend is a no-op for security). Self-applied as a
// onRequest hook on every admin route (ahead of the body parser and of Ajv —
// see api/buildApp.ts). Trusts nothing from the request body.
//
// Admin = `users.role === 'admin'`, one source of truth. (Two others existed
// while the better-auth admin() plugin was mounted — an env CSV in the plugin
// config and the same CSV re-read here. The first admin is seeded at boot with
// role='admin' written straight to the DB, see seed-admin.ts, so the env path
// bought nothing but a third answer to "who is admin".)
//
// 401 = no/invalid session (verifyUserSession already sent it). 403 = a valid
// user who isn't an admin. Errors go out as plain `{error}` bodies (not thrown
// AppError) so bare-Fastify contract tests without the global error handler see
// the right status.

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const verified = await verifyUserSession(req, reply);
  if (!verified) return; // 401 already sent

  if (verified.role !== "admin") {
    reply.code(403).send({ error: "Forbidden" });
    return;
  }

  req.userId = verified.userId;
}
