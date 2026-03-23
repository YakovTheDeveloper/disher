import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
});

// Static content (MD articles)
await app.register(fastifyStatic, {
  root: path.join(__dirname, "../../../content"),
  prefix: "/content/",
});

// List available nutrient articles: GET /articles/nutrients → JSON array of { folder, nutrientId, nutrientName }
app.get("/articles/nutrients", async (_req, reply) => {
  const fs = await import("fs/promises");
  const nutrientsDir = path.join(__dirname, "../../../content/nutrients");
  try {
    const entries = await fs.readdir(nutrientsDir, { withFileTypes: true });
    const articles = entries
      .filter((e) => e.isDirectory())
      .map((e) => {
        const [nutrientId, ...rest] = e.name.split("_");
        return { folder: e.name, nutrientId, nutrientName: rest.join("_") };
      });
    return reply.send(articles);
  } catch {
    return reply.send([]);
  }
});

// Single nutrient article: GET /articles/nutrients/:folder → /content/nutrients/{folder}/index.md
app.get<{ Params: { folder: string } }>(
  "/articles/nutrients/:folder",
  async (req, reply) => {
    return reply.sendFile(`nutrients/${req.params.folder}/index.md`);
  }
);

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
