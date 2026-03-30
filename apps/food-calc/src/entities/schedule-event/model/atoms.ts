// Canonical atom types — matches scheduleEvents.atoms in Triplit schema

export interface ScaleAtom { kind: "scale"; value: number; label?: string }
export interface TagAtom { kind: "tag"; value: string }
export interface RelationAtom { kind: "relation"; value: string }

export type Atom =
  | ScaleAtom
  | TagAtom
  | RelationAtom;

// ─── Type guards ───

export const isScaleAtom = (a: Atom): a is ScaleAtom => a.kind === "scale";
export const isTagAtom = (a: Atom): a is TagAtom => a.kind === "tag";
export const isRelationAtom = (a: Atom): a is RelationAtom => a.kind === "relation";

export function isValidAtom(atom: unknown): atom is Atom {
  if (!atom || typeof atom !== "object" || !("kind" in atom)) return false;
  const a = atom as Record<string, unknown>;
  switch (a.kind) {
    case "scale": return typeof a.value === "number" && a.value >= 1 && a.value <= 10;
    case "tag": return typeof a.value === "string" && (a.value as string).length > 0;
    case "relation": return typeof a.value === "string" && (a.value as string).length > 0;
    default: return false;
  }
}
