// Split out of ModalShell.tsx so that file stays component-only (a stray const
// export breaks React Fast Refresh → full reload).
//
// After the «great unification» (2026-06-19) ModalShell carries a SINGLE fixed
// monochrome tone — no longer a switchable design-variant. The array is kept (one
// entry) so the `data-modal-fields` / `[data-dv-v]` machinery and existing imports
// keep working; ModalShell no longer registers with the DesignVariantsBar.
export const MODAL_SHELL_VARIANTS = ['mono'] as const;

export type ModalShellVariant = (typeof MODAL_SHELL_VARIANTS)[number];
