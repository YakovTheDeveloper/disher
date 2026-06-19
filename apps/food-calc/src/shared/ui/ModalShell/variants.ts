// Split out of ModalShell.tsx so that file stays component-only (a stray const
// export breaks React Fast Refresh → full reload). The design-variant tone for
// the whole app reads off `useDesignVariant('ModalShell', MODAL_SHELL_VARIANTS)`.
export const MODAL_SHELL_VARIANTS = [
  // Calm keepers:
  'lavender-cream-top',
  'peach-lilac-top',
  'dove-sage-top',
  'rose-amber-top',
  // Soft (gentle morning-light vibe):
  'morning-lavender-top',
] as const;

export type ModalShellVariant = (typeof MODAL_SHELL_VARIANTS)[number];
