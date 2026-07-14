import type { FastifyReply, FastifyRequest } from "fastify";
import { getAdminUserIds } from "./admin-ids.js";
import { verifyUserSession } from "./verify-session.js";

// Server-side admin guard — the ONLY real gate (the client-side gate is UX,
// AuthGate on the frontend is a no-op for security). Self-applied as a
// preHandler on every admin route. Trusts nothing from the request body.
//
// Admin = role === 'admin' (DB, set by the admin plugin) OR userId ∈
// ADMIN_USER_IDS (env bootstrap allowlist). Both branches are required: an
// env-admin keeps role='user' in the DB. The env is parsed lazily on every call
// (getAdminUserIds re-reads process.env) so it's testable without a restart.
//
// 401 = no/invalid session (verifyUserSession already sent it). 403 = a valid
// user who isn't an admin. Errors go out as plain `{error}` bodies (not thrown
// AppError) so bare-Fastify contract tests without the global error handler see
// the right status.

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const verified = await verifyUserSession(req, reply);
  if (!verified) return; // 401 already sent

  const isAdmin =
    verified.role === "admin" || getAdminUserIds().includes(verified.userId);
  if (!isAdmin) {
    reply.code(403).send({ error: "Forbidden" });
    return;
  }

  req.userId = verified.userId;
}
