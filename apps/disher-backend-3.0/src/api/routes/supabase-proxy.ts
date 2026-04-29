import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Readable } from "stream";

// Transparent passthrough proxy to Supabase REST/Auth/Storage/Functions.
//
// Why this exists: iOS 18 WebKit Bug #284946 poisons the HTTP/2 connection
// pool to <ref>.supabase.co (8 of 9 parallel fetch requests stall 14-30s
// after visibilitychange). Routing iPhone -> our Node origin -> Supabase
// over HTTP/1.1 (Node default) sidesteps the bug entirely because Node's
// http(s) server does not advertise h2 in ALPN.
//
// Realtime (WSS) is NOT proxied here — supabase-js connects directly to
// wss://<ref>.supabase.co/realtime/v1, on a separate transport unaffected
// by #284946.

const SUPABASE_URL = process.env.SUPABASE_URL;

// Hop-by-hop headers from RFC 7230 + the few that the runtime owns.
// We must strip these before forwarding in either direction.
const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

function buildUpstreamHeaders(req: FastifyRequest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    const key = k.toLowerCase();
    if (HOP_BY_HOP.has(key)) continue;
    if (key === "cookie") continue;
    out[key] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  return out;
}

async function proxyToSupabase(
  req: FastifyRequest,
  reply: FastifyReply,
  upstreamPath: string,
) {
  if (!SUPABASE_URL) {
    return reply.status(500).send({ error: "SUPABASE_URL not configured" });
  }

  const queryIdx = req.raw.url?.indexOf("?") ?? -1;
  const queryStr = queryIdx >= 0 ? req.raw.url!.slice(queryIdx) : "";
  const url = SUPABASE_URL.replace(/\/$/, "") + upstreamPath + queryStr;

  const method = req.method.toUpperCase();
  const headers = buildUpstreamHeaders(req);

  const init: RequestInit & { duplex?: string } = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = req.body as BodyInit | undefined;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    req.log.error({ err, url }, "supabase-proxy upstream fetch failed");
    return reply.status(502).send({ error: "Bad gateway" });
  }

  reply.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    reply.header(key, value);
  });

  if (!upstream.body) {
    return reply.send();
  }
  return reply.send(Readable.fromWeb(upstream.body as never));
}

export async function supabaseProxyRoutes(app: FastifyInstance) {
  // Treat every body as an opaque Buffer — Supabase REST cares about exact
  // bytes (PostgREST is strict about JSON shape) and we don't need to parse
  // anything ourselves. We must remove Fastify's built-in JSON/text parsers
  // first, otherwise application/json bodies get parsed into objects and
  // we end up forwarding "[object Object]" upstream.
  app.removeContentTypeParser(["application/json", "text/plain"]);
  app.addContentTypeParser(
    "*",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  app.all("/*", async (req, reply) => {
    const params = req.params as { "*"?: string };
    const tail = params["*"] ?? "";
    const upstreamPath = "/" + tail;
    return proxyToSupabase(req, reply, upstreamPath);
  });
}
