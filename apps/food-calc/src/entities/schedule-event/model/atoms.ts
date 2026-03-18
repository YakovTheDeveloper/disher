// Canonical atom types — matches scheduleEvents.atoms in Triplit schema

export interface ScaleAtom { kind: "scale"; value: number; label?: string }
export interface TimeAtom { kind: "time"; start?: number; end?: number; durationMin?: number }
export interface NumberAtom { kind: "number"; value: number; unit?: string; label?: string }
export interface TagAtom { kind: "tag"; value: string }
export interface RelationAtom { kind: "relation"; value: string }
export interface FlagAtom { kind: "flag"; value: string }
export interface BodyPoint { x: number; y: number; side: "front" | "back" }
export interface BodyAtom { kind: "body"; points: BodyPoint[]; label?: string }

export type Atom =
  | ScaleAtom
  | TimeAtom
  | NumberAtom
  | TagAtom
  | RelationAtom
  | FlagAtom
  | BodyAtom;

// ─── Type guards ───

export const isScaleAtom = (a: Atom): a is ScaleAtom => a.kind === "scale";
export const isTimeAtom = (a: Atom): a is TimeAtom => a.kind === "time";
export const isNumberAtom = (a: Atom): a is NumberAtom => a.kind === "number";
export const isTagAtom = (a: Atom): a is TagAtom => a.kind === "tag";
export const isRelationAtom = (a: Atom): a is RelationAtom => a.kind === "relation";
export const isFlagAtom = (a: Atom): a is FlagAtom => a.kind === "flag";
export const isBodyAtom = (a: Atom): a is BodyAtom => a.kind === "body";

export function isValidAtom(atom: unknown): atom is Atom {
  if (!atom || typeof atom !== "object" || !("kind" in atom)) return false;
  const a = atom as Record<string, unknown>;
  switch (a.kind) {
    case "scale": return typeof a.value === "number" && a.value >= 1 && a.value <= 10;
    case "time": return typeof a.start === "number" || typeof a.end === "number" || typeof a.durationMin === "number";
    case "number": return typeof a.value === "number";
    case "tag": return typeof a.value === "string" && (a.value as string).length > 0;
    case "relation": return typeof a.value === "string" && (a.value as string).length > 0;
    case "flag": return typeof a.value === "string" && (a.value as string).length > 0;
    case "body": return Array.isArray(a.points) && (a.points as unknown[]).length > 0;
    default: return false;
  }
}
