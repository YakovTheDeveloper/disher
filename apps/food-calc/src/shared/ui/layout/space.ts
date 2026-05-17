// Spacing scale shared by the layout primitives (Box / Stack / Inline).
// Values are *steps*, not pixels — each maps to a `--space-*` token in
// tokens.scss. Restricting props to this union is what keeps layout on the
// system: you cannot type a gap or padding that bypasses the scale.

/** A step on the `--space-*` token scale. `0` means no space. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

/** Resolve a `Space` step to a CSS value, or `undefined` when unset. */
export const spaceVar = (step?: Space): string | undefined => {
  if (step == null) return undefined;
  return step === 0 ? '0' : `var(--space-${step})`;
};
