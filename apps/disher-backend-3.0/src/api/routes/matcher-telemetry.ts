import { FastifyInstance } from "fastify";
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

export async function matcherTelemetryRoutes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    const event = validate(req.body);
    if (!event) {
      return reply.status(400).send({ error: "invalid telemetry payload" });
    }
    logTelemetryEvent(event);
    return reply.status(204).send();
  });
}
