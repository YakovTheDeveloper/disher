// Mounts better-auth's HTTP handler on Fastify v5 at /api/auth/*.
//
// Why a child scope: better-auth reads the request body itself (via Node's
// IncomingMessage stream). If Fastify's default JSON content-type-parser
// runs first, the stream is already drained and signup/signin hang forever
// on a pending request. We register inside `fastify.register((scope) => ...)`
// and null out the JSON parser only in that scope — backup/analytics/etc
// keep their parsed `request.body` untouched.
//
// Pattern adapted from flaviodelgrosso/fastify-better-auth (MIT). We inline
// ~30 LOC instead of taking an npm dep on a single-maintainer plugin —
// supply-chain risk is not worth saving the copy-paste.

import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./server.js";

function mapHeaders(fastifyHeaders: ReturnType<FastifyReply["getHeaders"]>) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(fastifyHeaders)) {
    if (value !== undefined && value !== null) {
      headers.append(key, value.toString());
    }
  }
  return headers;
}

export const betterAuthPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(async (scope) => {
    const authHandler = toNodeHandler(auth);

    scope.addContentTypeParser(
      "application/json",
      (_req, _payload, done) => {
        done(null, null);
      }
    );

    scope.all("/api/auth/*", async (request, reply) => {
      // The admin() plugin (auth/server.ts) is registered ONLY to surface
      // `role` on the session (verify-bearer reads it) and to seed env-bootstrap
      // admins. Its bundled RPC surface — /api/auth/admin/* (impersonate-user,
      // ban-user, remove-user, set-user-password, set-role, list-users, …) — is
      // OUT of the MVP scope and would enable explicit anti-goals (impersonation,
      // ban) for any admin/env-admin over curl, unaudited and untested. The app
      // uses none of it (no adminClient); all admin HTTP is our own /api/admin
      // routes behind requireAdmin. Fail-closed on the whole subtree so the
      // plugin's role plumbing can't drag its capability surface in with it.
      const pathname = request.url.split("?", 1)[0];
      if (pathname === "/api/auth/admin" || pathname.startsWith("/api/auth/admin/")) {
        return reply.code(404).send({ error: "Not found" });
      }
      reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
      await authHandler(request.raw, reply.raw);
    });
  });
};
