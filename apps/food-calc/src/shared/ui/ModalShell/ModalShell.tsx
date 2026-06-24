import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalHeader } from '@/shared/ui/ModalHeader';

// ── ModalShell tone — a single fixed monochrome ──────────────────────────────
// After the «great unification» (2026-06-19) ModalShell is no longer a switchable
// design-variant: it carries one fixed `mono` tone. The field/card/chip/list
// tokens (ModalShell.module.scss → field-chip-palette + card-palette) are published
// UNCONDITIONALLY on `:root`, so they cascade across EVERY page and through Base UI
// portals — no attribute, no JS (the single-position `data-modal-fields` gate was
// removed 2026-06-22). This replaced the old `data-surface` warm/lavender axis AND
// the earlier multi-variant law-giver.
//
// The wrapper's own ambient (wash + desaturated orbs) is baked into `.wrapper`
// directly (dev-форк `data-dv='ModalShell'` снят 2026-06-22 — был single-variant).
// The legacy `variant` prop is still ACCEPTED for source compatibility (~19 call
// sites pass variant="spring2"/etc.) but is fully ignored.
type Props = { children: ReactNode; className?: string; variant?: string };

export const ModalShell = ({ children, className }: Props) => {
  return (
    <div className={`${s.wrapper} ${className ?? ''}`}>
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
 *  brings its own surface/spacing (e.g. the details-step plate).
 *  `inset` bumps the side padding from the default --space-1 (4px, reads as
 *  «no padding») to the semantic --sys-inset-md — used by the entity-edit
 *  modals (Hypothesis / Dish / Product rename). */
const ModalShellBody = ({
  children,
  flush,
  inset,
}: {
  children: ReactNode;
  flush?: boolean;
  inset?: boolean;
}) => (
  <div className={`${s.body} ${flush ? s.bodyFlush : ''} ${inset ? s.bodyInset : ''}`}>
    {children}
  </div>
);
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => <div className={s.atomsBody}>{children}</div>;
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

// The canonical Heading primitive carries the typography; ModalShell.Title
// adds the modal-tier layout (top offset, flex slot for a leading icon).
const ModalShellTitle = ({ children }: { children: ReactNode }) => (
  <Heading role="headline" as="h2" className={s.title}>
    {children}
  </Heading>
);
ModalShellTitle.displayName = 'ModalShell.Title';

// The Text primitive carries the typography (role="caption"); ModalShell.Hint
// adds only the modal-tier layout — a small gap tucked under the Title.
const ModalShellHint = ({ children }: { children: ReactNode }) => (
  <Text role="caption" className={s.hint}>
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
