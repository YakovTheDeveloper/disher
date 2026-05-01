import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyUserBearer } from "./verify-bearer.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  const userId = await verifyUserBearer(req, reply);
  if (!userId) return;
  req.userId = userId;
}

export function registerUserIdDecorator(app: FastifyInstance) {
  if (!app.hasRequestDecorator("userId")) {
    app.decorateRequest("userId", "");
  }
}
