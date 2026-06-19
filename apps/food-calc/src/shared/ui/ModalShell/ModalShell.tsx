import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalHeader } from '@/shared/ui/ModalHeader';
// MODAL_SHELL_VARIANTS + ModalShellVariant live in ./variants so this module
// stays component-only (a stray const export breaks React Fast Refresh).
import { MODAL_SHELL_VARIANTS } from './variants';

// ── ModalShell variant — the app-wide tone «law-giver» ───────────────────────
// The ModalShell variant is no longer a modal-local override: it is the app's
// single palette source. App.tsx registers this same anchor and publishes the
// live variant on `body[data-modal-fields]`, so the variant's field/card/chip/
// list tokens (ModalShell.module.scss → field-chip-palette + card-palette)
// cascade across EVERY page and through Base UI portals. The old `data-surface`
// warm/lavender axis dissolved into this (see tds/modalshell-lawgiver-2026-06-13).
//
// The ModalShell wrapper still carries its own `[data-dv='ModalShell']` for the
// modal-only ambient (wash + orbs); same store key → same variant → it always
// matches the page. The first entry is the production default (`useDesignVariant`
// fallback). The legacy `variant` prop is still ACCEPTED for source
// compatibility but no longer drives styling.
//
// 2026-06-13 — converged on the TOP-CLUSTER aesthetic: every variant is a
// two/three-hue transition with orbs in the upper region (bottom clean, like
// HomePage HomeAmbient). The earlier base/near-white/single-hue forks were
// dropped entirely from both the bar AND the SCSS palette maps (the store
// self-heals a stale localStorage variant → variants[0], so deletion is safe).
// Set = 4 calm keepers + 6 vivid. Palettes + geometry: ModalShell.module.scss.
// `variant` is vestigial: ~19 call sites still pass variant="spring2"/"spring4"
// for source compatibility, but ModalShell ignores it (the tone comes from the
// global useDesignVariant('ModalShell') store). Typed as a bare string so
// curating MODAL_SHELL_VARIANTS above doesn't break those legacy callers.
type Props = { children: ReactNode; className?: string; variant?: string };

export const ModalShell = ({ children, className }: Props) => {
  const { anchor } = useDesignVariant('ModalShell', MODAL_SHELL_VARIANTS);

  return (
    <div className={`${s.wrapper} ${className ?? ''}`} {...anchor}>
      <div className={s.springOrbs} aria-hidden>
        <span className={`${s.orb} ${s.orb1}`} />
        <span className={`${s.orb} ${s.orb2}`} />
        <span className={`${s.orb} ${s.orb3}`} />
        <span className={`${s.orb} ${s.orb4}`} />
        <span className={`${s.orb} ${s.orb5}`} />
      </div>
      {children}
    </div>
  );
};

const ModalShellSpacer = () => <div className={s.spacer} />;
ModalShellSpacer.displayName = 'ModalShell.Spacer';

/** `flush` drops the default top padding — for bodies whose first child
 *  brings its own surface/spacing (e.g. the details-step plate). */
const ModalShellBody = ({ children, flush }: { children: ReactNode; flush?: boolean }) => (
  <div className={`${s.body} ${flush ? s.bodyFlush : ''}`}>{children}</div>
);
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => <div className={s.atomsBody}>{children}</div>;
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

// The canonical Heading primitive carries the typography; ModalShell.Title
// adds the modal-tier layout (top offset, flex slot for a leading icon).
const ModalShellTitle = ({ children }: { children: ReactNode }) => (
  <Heading size="modal" as="h2" className={s.title}>
    {children}
  </Heading>
);
ModalShellTitle.displayName = 'ModalShell.Title';

// The Text primitive carries the typography (variant="hint"); ModalShell.Hint
// adds only the modal-tier layout — a small gap tucked under the Title.
const ModalShellHint = ({ children }: { children: ReactNode }) => (
  <Text variant="hint" className={s.hint}>
    {children}
  </Text>
);
ModalShellHint.displayName = 'ModalShell.Hint';

type ActionButtonsProps = {
  /** Primary Confirm — обязателен, когда footer рендерится. */
  right: ReactNode;
  /** Опциональный контекстный слот (НЕ «Назад»). Пуст → right на всю ширину. */
  left?: ReactNode;
  debugId?: string;
};

const ModalShellActionButtons = ({ left, right, debugId }: ActionButtonsProps) => {
  const ref = useKeyboardStick<HTMLDivElement>({ debugId });

  return (
    <div ref={ref} className={s.actionButtons}>
      {left != null && <div className={s.actionButtonsSlotPrev}>{left}</div>}
      <div className={s.actionButtonsSlotNext}>{right}</div>
    </div>
  );
};
ModalShellActionButtons.displayName = 'ModalShell.ActionButtons';

ModalShell.Spacer = ModalShellSpacer;
ModalShell.Body = ModalShellBody;
ModalShell.AtomsBody = ModalShellAtomsBody;
ModalShell.Title = ModalShellTitle;
ModalShell.Hint = ModalShellHint;
// Header pieces live under the ModalShell namespace so there is one entry
// point. `Header` — back + title; `StepHeader` — back + title + breadcrumbs.
ModalShell.Header = ModalHeader;
ModalShell.StepHeader = ModalStepHeader;
ModalShell.ActionButtons = ModalShellActionButtons;
