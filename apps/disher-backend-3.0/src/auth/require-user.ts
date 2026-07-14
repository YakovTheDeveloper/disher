import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyUserSession } from "./verify-session.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

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
