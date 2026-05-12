// Token helpers for the schedule_food `details` field. `details` is a plain
// comma-separated string; the chip UI is layered on top of it via these.
//
// `\b` word-boundary regex with the `u` flag is unreliable on Cyrillic in
// V8/JSC (tc39/ecma262#1020) — we split on commas instead, which is the
// natural separator anyway.

const SEPARATOR_RE = /,\s*/u;

/** Lowercase (Russian-aware), NFC-normalised, trimmed. Empty input → ''. */
export function normalizeTag(s: string): string {
  return s.trim().toLocaleLowerCase('ru').normalize('NFC');
}

/** Split a `details` string into normalised, deduped tokens. */
export function tokenize(details: string): string[] {
  if (!details) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of details.split(SEPARATOR_RE)) {
    const t = normalizeTag(raw);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Join an array of (already normalised) tokens into a `details` string. */
export function joinTokens(tokens: readonly string[]): string {
  return tokens.join(', ');
}

/** Toggle a tag in/out of a `details` string. Idempotent. */
export function toggleTag(details: string, tag: string): string {
  const t = normalizeTag(tag);
  if (!t) return details;
  const tokens = tokenize(details);
  const idx = tokens.indexOf(t);
  return joinTokens(idx >= 0 ? tokens.filter((_, i) => i !== idx) : [...tokens, t]);
}

/** True if the (normalised) tag is present in `details`. */
export function hasTag(details: string, tag: string): boolean {
  const t = normalizeTag(tag);
  if (!t) return false;
  return tokenize(details).includes(t);
}

/** Tags present in `details` but absent from `known` (already-normalised set). */
export function extractCustomTokens(details: string, known: ReadonlySet<string>): string[] {
  return tokenize(details).filter((t) => !known.has(t));
}
