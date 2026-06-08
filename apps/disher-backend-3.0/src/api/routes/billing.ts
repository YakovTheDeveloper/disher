import type { FastifyInstance } from "fastify";
import { requireUser } from "../../auth/require-user.js";
import { getBalance, listLedger } from "../../billing/wallet.js";
import { PRICES_KOP, rubFromKop } from "../../billing/prices.js";

// Read-only wallet endpoints for the client (balance pill + ProfileDrawer
// BalanceSection). All require a bearer; the wallet is auto-created (welcome
// grant) on first read via getBalance/listLedger → ensureWallet.

export async function billingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);

  app.get("/balance", async (req, reply) => {
    const balanceKop = await getBalance(req.userId);
    return reply.send({ balanceKop, balanceRub: rubFromKop(balanceKop) });
  });

  app.get<{ Querystring: { limit?: string } }>(
    "/balance/ledger",
    async (req, reply) => {
      const limit = Number(req.query.limit) || 50;
      const items = await listLedger(req.userId, limit);
      return reply.send({ items });
    },
  );

  // Flat per-feature prices (kopecks). Single source of truth lives server-side;
  // the client reads this to render "−N ₽" labels without hardcoding numbers.
  app.get("/billing/prices", async (_req, reply) => {
    return reply.send(PRICES_KOP);
  });
}
