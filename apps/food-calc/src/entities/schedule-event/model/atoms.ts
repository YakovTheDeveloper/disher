// Canonical atom types — matches scheduleEvents.atoms in LiveStore schema

export interface ScaleAtom { kind: "scale"; value: number; label?: string }

export type Atom = ScaleAtom;

export const isScaleAtom = (a: Atom): a is ScaleAtom => a.kind === "scale";

export function isValidAtom(atom: unknown): atom is Atom {
  if (!atom || typeof atom !== "object" || !("kind" in atom)) return false;
  const a = atom as Record<string, unknown>;
  switch (a.kind) {
    // value >= 0: ноль осмыслен («боли нет» / нижний край шкалы). Polarity (0 боли
    // = хорошо) — не наша забота, храним magnitude. Ослаблено 2026-07-15 под
    // free-text-оценку («0 из 10»).
    case "scale": return typeof a.value === "number" && a.value >= 0 && a.value <= 10;
    default: return false;
  }
}
