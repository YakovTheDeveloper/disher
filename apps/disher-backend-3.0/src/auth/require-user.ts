import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyUserSession } from "./verify-session.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

// Hook phase is `onRequest`, and it is load-bearing — see the note in
// api/buildApp.ts. Two reasons, both of which need the guard AHEAD of both the
// body parser and Ajv:
//   • as a preHandler it sat BEHIND schema validation, so an anonymous caller
//     with a malformed body got a 400 quoting our schema instead of a 401;
//   • it made every unauthenticated request parse up to `bodyLimit` first.
// @fastify/auth argues the same point: use onRequest/preParsing for auth that
// does not need the body. This one only reads headers (verify-session.ts), so
// it qualifies.
export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const verified = await verifyUserSession(req, reply);
  if (!verified) return;
  req.userId = verified.userId;
}

export function registerUserIdDecorator(app: FastifyInstance) {
  if (!app.hasRequestDecorator("userId")) {
    app.decorateRequest("userId", "");
  }
}
