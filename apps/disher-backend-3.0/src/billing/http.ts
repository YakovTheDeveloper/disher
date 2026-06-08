import { randomUUID } from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { InsufficientBalanceError } from "./errors.js";
import { charge } from "./wallet.js";
import type { Feature } from "./prices.js";

// HTTP-layer glue between the wallet and the route handlers.

/**
 * Per-attempt idempotency key. Honours a client-sent `X-Request-Id` (so a network
 * retry of the same logical request doesn't double-charge) and otherwise mints one.
 */
export function resolveRequestId(req: FastifyRequest): string {
  const h = req.headers["x-request-id"];
  if (typeof h === "string" && h.trim()) return h.trim().slice(0, 100);
  return randomUUID();
}

/** The 402 body shape every paid route returns when the wallet can't cover the price. */
export type InsufficientBalanceBody = {
  error: "insufficient_balance";
  needKop: number;
  haveKop: number;
};

/**
 * Debit `feature` from the authenticated user. Returns true on success.
 * On insufficient balance, sends `402 { error:'insufficient_balance', needKop, haveKop }`
 * and returns false — the caller MUST stop and start no work (and, for SSE routes,
 * must not have touched the raw socket yet). Any other error propagates.
 */
export async function chargeOr402(
  req: FastifyRequest,
  reply: FastifyReply,
  feature: Feature,
  requestId: string,
): Promise<boolean> {
  try {
    await charge(req.userId, feature, requestId);
    return true;
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      const body: InsufficientBalanceBody = {
        error: "insufficient_balance",
        needKop: err.needKop,
        haveKop: err.haveKop,
      };
      reply.status(402).send(body);
      return false;
    }
    throw err;
  }
}
