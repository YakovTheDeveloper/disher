import type { FastifyReply, FastifyRequest } from "fastify";
import { isTrustedOrigin } from "./origins.js";

// CSRF: the intentional layer for every mutating route OUTSIDE /api/auth/*.
//
// better-auth runs its own origin check, but only on its own routes. Everything
// else (PUT /api/backup, POST /api/analyze, /api/admin/*/topup, billing) sits on
// requireUser → getSession(cookie) with no origin check at all. Until now three
// ACCIDENTS covered them: SameSite=Lax, the CORS preflight, and the JSON content
// type. All three are defense-in-depth, not primary (OWASP CSRF cheat sheet says
// so outright), and any of them can be lifted by an unrelated future edit —
// widen CORS, accept form-encoded, and the hole opens silently.
//
// A missing Origin on a state-changing request is BLOCKED, not waved through:
// every browser sends it on POST/PUT/DELETE, so an absent one is either a
// non-browser client (we have none — the SPA is the only caller) or an attacker
// betting we fail open.
//
// `async` is load-bearing, not cosmetic: Fastify passes `done` as the third
// argument to every hook and continues the chain either when `done` is called or
// when the returned promise settles. A sync hook that returns undefined and
// never calls `done` hangs the request forever — and it hangs SILENTLY, because
// the reject paths still answer (reply.send bypasses the chain), so only the
// requests that should have been ALLOWED time out. Keep this async.
export async function requireTrustedOrigin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return;
  }
  if (!isTrustedOrigin(req.headers.origin)) {
    reply.code(403).send({ error: "Untrusted origin" });
  }
}
