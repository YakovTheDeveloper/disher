import type { ReactNode } from 'react';
import { useDesignVariantsStore } from '@/shared/model/designVariantsStore';
import { MODAL_SHELL_VARIANTS } from './ModalShell';

// Publishes the live ModalShell design-variant as a lightweight
// `data-modal-fields` attribute on a `display: contents` wrapper, so modal
// content that is NOT wrapped in <ModalShell> — the bare SearchFood search step
// of a ModalByLabel flow — still inherits the variant's `--field-*` / `--chip-*`
// palette and stays in colour with the time/quantity/details steps that follow.
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
// Read-only by design: it subscribes to the SAME `'ModalShell'` store entry the
// wrapper registers, but does NOT register itself — no DesignBar churn, no extra
// IntersectionObserver. The fallback covers the first paint before any
// ModalShell sibling has registered.
export const ModalVariantFields = ({ children }: { children: ReactNode }) => {
  const variant =
    useDesignVariantsStore((s) => s.entries['ModalShell']?.variant) ?? MODAL_SHELL_VARIANTS[0];

  return (
    <div data-modal-fields={variant} style={{ display: 'contents' }}>
      {children}
    </div>
  );
};
