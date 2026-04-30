import { FastifyInstance } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, "../../../data/diag-logs");

type DiagPayload = {
  // Free-form session id from the client (random per boot). Used as filename
  // prefix so multiple dumps from the same session group together.
  sessionId?: string;
  // Either the raw text dump (formatDiagDump output) or a JSON entries array.
  text?: string;
  entries?: Array<{ t: number; ts: string; msg: string; data?: unknown }>;
  // Optional metadata from the client.
  ua?: string;
  pwa?: string;
  online?: boolean;
};

export async function diagLogsRoutes(app: FastifyInstance) {
  app.post<{ Body: DiagPayload }>("/", async (req, reply) => {
    const { sessionId, text, entries, ua, pwa, online } = req.body ?? {};

    if (!text && !entries) {
      return reply.status(400).send({ error: "text or entries required" });
    }

    await fs.mkdir(LOGS_DIR, { recursive: true });

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-");
    const sid = (sessionId ?? "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "anon";
    const filename = `${ts}_${sid}.log`;

    const header = [
      `# diag dump`,
      `received: ${now.toISOString()}`,
      `sessionId: ${sid}`,
      `ua: ${ua ?? req.headers["user-agent"] ?? "unknown"}`,
      `pwa: ${pwa ?? "n/a"}`,
      `online: ${online ?? "n/a"}`,
      `entries: ${entries?.length ?? "n/a"}`,
      `---`,
    ].join("\n");

    let body: string;
    if (typeof text === "string" && text.length > 0) {
      body = text;
    } else if (Array.isArray(entries)) {
      body = entries
        .map((e) => {
          const dataStr = e.data === undefined ? "" : " " + JSON.stringify(e.data);
          return `+${String(e.t).padStart(5, " ")}ms ${e.msg}${dataStr}`;
        })
        .join("\n");
    } else {
      body = "";
    }

    await fs.writeFile(path.join(LOGS_DIR, filename), header + "\n" + body, "utf-8");

    // Print last 8 lines to backend stdout so they show in dev terminal in real time.
    const tail = body.split("\n").slice(-8).join("\n");
    console.log(`[diag-logs] ${filename}\n${tail}\n`);

    return { ok: true, filename };
  });
}
