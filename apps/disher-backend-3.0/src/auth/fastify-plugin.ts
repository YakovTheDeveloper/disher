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
      reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
      await authHandler(request.raw, reply.raw);
    });
  });
};
