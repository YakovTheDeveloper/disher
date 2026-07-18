import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { requireUser } from "../../auth/require-user.js";
import { getBalance, listLedger } from "../../billing/wallet.js";
import { PRICES_KOP, rubFromKop } from "../../billing/prices.js";

// Read-only wallet endpoints for the client (balance pill + ProfileDrawer
// BalanceSection). All require a bearer; the wallet is auto-created (welcome
// grant) on first read via getBalance/listLedger → ensureWallet.

export async function billingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireUser);

  app.get(
    "/balance",
    {
      schema: {
        operationId: "getBalance",
        tags: ["billing"],
        description: "Current wallet balance. Creates the wallet (welcome grant) on first read.",
        security: [{ cookieSession: [] }],
      },
    },
    async (req, reply) => {
      const balanceKop = await getBalance(req.userId);
      return reply.send({ balanceKop, balanceRub: rubFromKop(balanceKop) });
    },
  );

  app.get<{ Querystring: { limit?: string } }>(
    "/balance/ledger",
    {
      schema: {
        operationId: "listLedger",
        tags: ["billing"],
        description: "Wallet ledger entries, newest first.",
        security: [{ cookieSession: [] }],
        // A querystring member is always a string on the wire; the handler
        // parses and defaults it (coerceTypes is off — see buildApp).
        querystring: Type.Object({ limit: Type.Optional(Type.String()) }),
      },
    },
    async (req, reply) => {
      const limit = Number(req.query.limit) || 50;
      const items = await listLedger(req.userId, limit);
      return reply.send({ items });
    },
  );

  // Flat per-feature prices (kopecks). Single source of truth lives server-side;
  // the client reads this to render "−N ₽" labels without hardcoding numbers.
  app.get(
    "/billing/prices",
    {
      schema: {
        operationId: "getPrices",
        tags: ["billing"],
        description: "Flat per-feature prices in kopecks — the client renders «−N ₽» from these.",
        security: [{ cookieSession: [] }],
      },
    },
    async (_req, reply) => {
      return reply.send(PRICES_KOP);
    },
  );
}
