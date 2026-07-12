// Client-side fuzzy match of an LLM-canonicalized food name against the USER's
// OWN products — the entities the server-side matcher structurally never sees.
//
// Why this lives on the client: the backend matches only the system catalog
// (embeddings prebuilt from catalog.json — see food-matcher.ts / resolve-names.ts).
// The user's custom products live in Dexie on the device and never reach the
// backend for matching (zero-base: one writer per row, snapshot vault is an
// opaque blob). So a food that IS in the user's list always comes back
// `unresolved`. We recover those here, where the data actually lives.
//
// We mirror the Dice-trigram HALF of the server hybrid (food-matcher.ts) — same
// normalization, same trigram/Dice math, same 0.80 high-confidence bar — so the
// behaviour is calibrated identically. The cosine/embedding half stays
// server-only (no ML model shipped to the client): the LLM has already
// canonicalized the name ("картошечка" → "картофель") before matching, so a
// symmetric trigram compare against the user's (usually canonical) product names
// is enough here.

export interface LocalMatchCandidate {
  id: string;
  name: string;
}

// Structurally a MatchCandidate (parseFreeTextFood) so it drops straight into a
// review row's `manual` field and rides the existing commit path.
export interface LocalMatch {
  id: string;
  name: string;
  score: number;
}

// Mirror of DICE_HIGH_CONFIDENCE in food-matcher.ts: the server trusts a Dice
// top-1 ≥ 0.80 outright (no FP compound confusion above it in the probe set). We
// reuse that bar for auto-accepting a local hit. The row is still shown for
// review and stays editable/dismissable, so a rare false positive is
// recoverable — 0.80 just keeps them rare.
export const LOCAL_MATCH_MIN_DICE = 0.8;

// Mirror of normalizeForEmbedding (food-matcher.ts). Keep in lockstep so a name
// scores the same on both sides.
export function normalizeLocal(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const out = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function diceSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;
  return (2 * overlap) / (a.size + b.size);
}

// Best user-product match for `name`, or null if none clears `minScore`.
// O(candidates) trigram compares per call — fine at user-catalog scale (tens to
// low hundreds of products, a handful of unresolved rows per parse); no index.
export function matchLocalProduct(
  name: string,
  candidates: LocalMatchCandidate[],
  minScore = LOCAL_MATCH_MIN_DICE,
): LocalMatch | null {
  const q = normalizeLocal(name);
  if (!q) return null;
  const qTri = trigrams(q);

  let best: LocalMatch | null = null;
  for (const c of candidates) {
    const score = diceSimilarity(qTri, trigrams(normalizeLocal(c.name)));
    if (score >= minScore && (best === null || score > best.score)) {
      best = { id: c.id, name: c.name, score };
    }
  }
  return best;
}
