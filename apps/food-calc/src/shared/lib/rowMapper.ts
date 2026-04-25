// PowerSync row maps Postgres snake_case → SQLite camelCase friction.
// Entity-level types use camelCase; this maps a single row.

export function snakeToCamel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in row) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = row[key];
  }
  return out;
}
