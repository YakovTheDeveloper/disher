// The design-variants dev bar is a developer tool ONLY. Gate strictly on the
// build mode: `import.meta.env.DEV` is a compile-time constant, so in a
// production build this folds to `false` and Vite tree-shakes the whole
// DesignVariantsBar out of the bundle. No `?dv` URL escape hatch — the bar must
// be unreachable in prod by any means (the user-facing bug report lives in the
// settings drawer, `features/feedback`).
export function shouldShowDvBar(): boolean {
  return import.meta.env.DEV;
}
