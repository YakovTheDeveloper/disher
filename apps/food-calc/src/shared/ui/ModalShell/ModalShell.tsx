import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalHeader } from '@/shared/ui/ModalHeader';

// ── ModalShell ambient background — DesignBar-driven ─────────────────────────
// ModalShell publishes ONE `useDesignVariant('ModalShell', …)` anchor on its
// wrapper; the DesignVariantsBar flips the background + orb palette globally for
// EVERY mounted modal at once. The first entry is the production fallback (no
// pick yet) — see `useDesignVariant`. Palettes live in ModalShell.module.scss
// (`$modal-shell-variants`).
//
// History: the background used to be a static per-page `variant` prop
// (spring2 на Dish/Product, spring4 на HomePage-контексте) — выбиралось «по
// дисциплине» (memory feedback_modal_spring_variant_convention). The prop is
// still ACCEPTED for source compatibility but no longer drives styling — the
// anchor wins. Once a winner is chosen in the bar, bake it in and drop the prop.
export const MODAL_SHELL_VARIANTS = [
  'spring2',
  'spring4',
  'blue-white',
  'cream-white',
  'rose-white',
  'sage-white',
  'pure-white',
  'lavender-cream',
  'mint-sky',
  'peach-rose',
  'blush-sky',
  'honey',
  'sunrise',
] as const;

export type ModalShellVariant = (typeof MODAL_SHELL_VARIANTS)[number];
type Props = { children: ReactNode; className?: string; variant?: ModalShellVariant };

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
  const ref = useKeyboardStick<HTMLDivElement>(debugId);

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
