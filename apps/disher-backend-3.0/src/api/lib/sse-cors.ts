import type { ServerResponse } from "http";

// SSE handlers write to reply.raw directly, bypassing Fastify's reply pipeline.
// @fastify/cors sets Access-Control-* via reply.header(), which is only
// flushed when reply.send() runs — so for raw-socket streams those headers
// never reach the wire and the browser kills the response with a CORS error.
//
// Mirror what @fastify/cors with `origin: true, credentials: true` would emit:
// echo the request Origin (wildcards are forbidden with credentials), allow
// credentials, and Vary on Origin so caches don't mix responses across origins.
// We call setHeader BEFORE writeHead so the values merge into the response.
export function applySSECorsHeaders(
  raw: ServerResponse,
  origin: string | string[] | undefined,
): void {
  const value = Array.isArray(origin) ? origin[0] : origin;
  if (!value) return;
  if (raw.headersSent) return;
  raw.setHeader("Access-Control-Allow-Origin", value);
  raw.setHeader("Access-Control-Allow-Credentials", "true");
  raw.setHeader("Vary", "Origin");
}
