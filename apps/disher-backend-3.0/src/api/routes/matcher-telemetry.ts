import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { logTelemetryEvent, type TelemetryEvent } from "../telemetry-log.js";

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validate(raw: unknown): TelemetryEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;

  if (!isString(b.requestId) || !b.requestId) return null;
  if (!isString(b.userId)) return null;
  if (b.action !== "commit" && b.action !== "abandon") return null;

  const numericFields = [
    "itemsTotal",
    "itemsCommitted",
    "itemsDeleted",
    "itemsWithEditedFood",
    "itemsWithEditedTime",
    "itemsWithEditedQty",
    "llmLatencyMs",
    "matcherLatencyMs",
    "reviewDurationMs",
  ] as const;
  for (const f of numericFields) {
    if (!isFiniteNumber(b[f])) return null;
  }

  if (!Array.isArray(b.corrections)) return null;
  const corrections: TelemetryEvent["corrections"] = [];
  for (const c of b.corrections) {
    if (!c || typeof c !== "object") return null;
    const cc = c as Record<string, unknown>;
    if (!isString(cc.originalName) || !isString(cc.matcherChoice)) return null;
    if (cc.userChoice !== null && !isString(cc.userChoice)) return null;
    if (
      cc.correctionType !== "accepted-top1" &&
      cc.correctionType !== "switched-ambiguous" &&
      cc.correctionType !== "manual-search" &&
      cc.correctionType !== "deleted"
    ) {
      return null;
    }
    corrections.push({
      originalName: cc.originalName,
      matcherChoice: cc.matcherChoice,
      userChoice: cc.userChoice as string | null,
      correctionType: cc.correctionType,
    });
  }

  return {
    requestId: b.requestId,
    userId: b.userId,
    action: b.action,
    itemsTotal: b.itemsTotal as number,
    itemsCommitted: b.itemsCommitted as number,
    itemsDeleted: b.itemsDeleted as number,
    itemsWithEditedFood: b.itemsWithEditedFood as number,
    itemsWithEditedTime: b.itemsWithEditedTime as number,
    itemsWithEditedQty: b.itemsWithEditedQty as number,
    corrections,
    llmLatencyMs: b.llmLatencyMs as number,
    matcherLatencyMs: b.matcherLatencyMs as number,
    reviewDurationMs: b.reviewDurationMs as number,
  };
}

// Per-IP rate limit. This endpoint is unauthenticated (sendBeacon can't carry a
// bearer) and writes to disk per request, so cap how fast a single client can
// append. trustProxy (buildApp) makes req.ip the real client behind Caddy.
const TELEMETRY_RATE_LIMIT = parseInt(
  process.env.TELEMETRY_RATE_LIMIT ?? "60",
  10
);
const TELEMETRY_WINDOW_MS = 60 * 60 * 1000;
const telemetryRate = new Map<string, { count: number; resetAt: number }>();

function allowTelemetry(ip: string): boolean {
  const now = Date.now();
  const entry = telemetryRate.get(ip);
  if (!entry || now > entry.resetAt) {
    telemetryRate.set(ip, { count: 1, resetAt: now + TELEMETRY_WINDOW_MS });
    return true;
  }
  if (entry.count >= TELEMETRY_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Mirrors validate() above, no stricter — the two guard the same wire shape and
// this one exists so the spec can describe it (validate() stays: it is also
// what BUILDS the typed event). The one thing the schema must not do is get
// ahead of validate() and reject a beacon the handler would have taken: this
// endpoint is fired by navigator.sendBeacon on page-hide, so nobody is left to
// read the 400.
const TELEMETRY_BODY_SCHEMA = Type.Object(
  {
    requestId: Type.String(),
    userId: Type.String(),
    action: Type.Union([Type.Literal("commit"), Type.Literal("abandon")]),
    itemsTotal: Type.Number(),
    itemsCommitted: Type.Number(),
    itemsDeleted: Type.Number(),
    itemsWithEditedFood: Type.Number(),
    itemsWithEditedTime: Type.Number(),
    itemsWithEditedQty: Type.Number(),
    llmLatencyMs: Type.Number(),
    matcherLatencyMs: Type.Number(),
    reviewDurationMs: Type.Number(),
    corrections: Type.Array(
      Type.Object(
        {
          originalName: Type.String(),
          matcherChoice: Type.String(),
          userChoice: Type.Union([Type.String(), Type.Null()]),
          correctionType: Type.Union([
            Type.Literal("accepted-top1"),
            Type.Literal("switched-ambiguous"),
            Type.Literal("manual-search"),
            Type.Literal("deleted"),
          ]),
        },
        { additionalProperties: false, title: "MatcherCorrection" },
      ),
    ),
  },
  { additionalProperties: false, title: "MatcherTelemetryEvent" },
);

export async function matcherTelemetryRoutes(app: FastifyInstance) {
  app.post(
    "/",
    {
      schema: {
        operationId: "logMatcherTelemetry",
        tags: ["telemetry"],
        description:
          "Anonymous matcher-quality beacon. The ONE route exempt from the trusted-origin guard — sendBeacon carries neither Origin nor credentials. Carries no session and mutates no user data.",
        body: TELEMETRY_BODY_SCHEMA,
      },
    },
    async (req, reply) => {
      if (!allowTelemetry(req.ip)) {
        return reply.status(429).send({ error: "telemetry rate limit exceeded" });
      }
      const event = validate(req.body);
      if (!event) {
        return reply.status(400).send({ error: "invalid telemetry payload" });
      }
      logTelemetryEvent(event);
      return reply.status(204).send();
    },
  );
}
