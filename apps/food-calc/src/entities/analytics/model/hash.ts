interface FoodSnapshot {
  time: string;
  name: string;
  quantity: number;
  type: string;
}

interface EventSnapshot {
  time: string;
  text: string;
}

export async function computeInputHash(
  foods: FoodSnapshot[],
  events?: EventSnapshot[]
): Promise<string> {
  const canonical = JSON.stringify({
    foods: foods
      .map((f) => ({ time: f.time, name: f.name, quantity: f.quantity, type: f.type }))
      .sort(
        (a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name)
      ),
    events: (events ?? [])
      .map((e) => ({ time: e.time, text: e.text }))
      .sort((a, b) => a.time.localeCompare(b.time)),
  });

  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
