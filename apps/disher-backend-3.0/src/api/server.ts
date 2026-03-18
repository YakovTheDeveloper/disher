import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { analyticsRoutes } from "./routes/analytics.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:4173"],
});

// Routes
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(analyticsRoutes, { prefix: "/api/analytics" });

const HOST = process.env.HOST ?? "localhost";
const PORT = Number(process.env.PORT ?? 3100);

app.listen({ host: HOST, port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`API server running on http://${HOST}:${PORT}`);
});
