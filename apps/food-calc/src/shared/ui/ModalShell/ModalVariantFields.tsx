import type { ReactNode } from 'react';

// Publishes ModalShell's fixed `mono` tone as a lightweight `data-modal-fields`
// attribute on a `display: contents` wrapper, so modal content that is NOT
// wrapped in <ModalShell> — the bare SearchFood search step of a ModalByLabel
// flow — still inherits the `--field-*` / `--chip-*` palette and stays in colour
// with the time/quantity/details steps that follow.
//
// Why a separate attribute (not `[data-dv='ModalShell']`): the ambient block
// (`[data-dv='ModalShell']`) also sets `backdrop-filter`, which establishes a
// containing block for `position: fixed` descendants and would break the modal's
// fullscreen expansion. `[data-modal-fields]` carries ONLY the field/chip tokens
// (see ModalShell.module.scss).
//
// `display: contents` keeps the box tree byte-identical (SearchFood stays the
// effective child of ModalByLabel's `.content`), so layout is untouched.
//
// Since the «great unification» (2026-06-19) the tone is a single fixed `mono` —
// this just mirrors `body[data-modal-fields]` locally for portal-free subtrees.
export const ModalVariantFields = ({ children }: { children: ReactNode }) => {
  return (
    <div data-modal-fields="mono" style={{ display: 'contents' }}>
      {children}
    </div>
  );
};
