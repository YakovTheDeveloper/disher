/** Compact storage format in Triplit JSON fields */
export type StoredPortion = { l: string; g: number };

/** Application-level portion with readable property names */
export type Portion = { label: string; grams: number };

/** Convert stored → app */
export function fromStored(p: StoredPortion): Portion {
  return { label: p.l, grams: p.g };
}

/** Convert app → stored */
export function toStored(p: Portion): StoredPortion {
  return { l: p.label, g: p.grams };
}
