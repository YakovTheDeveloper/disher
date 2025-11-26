export function transformIds(value: any, seen = new WeakSet()): any {
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(v => transformIds(v, seen));
  }

  // only plain objects, skip Fastify/tRPC/Prisma internals
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }

  const out: any = {};

  for (const key of Object.keys(value)) {
    const v = value[key];

    // match: id, userId, postId, commentId, parentId, categoryId ...
    const isIdField = key === "id" || key.endsWith("Id");

    if (isIdField && typeof v === "number") {
      out[key] = String(v);
    } else {
      out[key] = transformIds(v, seen);
    }
  }

  return out;
}
