import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { shouldShowDvBar } from '@/app/ui/DesignVariantsBar';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';

type Variant =
  | 'default'
  | 'spring'
  | 'spring2'
  | 'spring4'
  | 'spring5'
  | 'gradient1'
  | 'gradient2'
  | 'gradient3';
type Props = { children: ReactNode; className?: string; variant?: Variant };

const GRADIENT_SOURCES: Record<
  'gradient1' | 'gradient2' | 'gradient3',
  { avif: string; webp: string; fallback: string }
> = {
  gradient1: { avif: '/bg/1.avif', webp: '/bg/1.webp', fallback: '/bg/1.png' },
  gradient2: { avif: '/bg/2.avif', webp: '/bg/2.webp', fallback: '/bg/2.jpg' },
  gradient3: { avif: '/bg/3.png', webp: '/bg/3.png', fallback: '/bg/3.png' },
};

type SpringVariant = 'spring' | 'spring2' | 'spring4' | 'spring5';

const SPRING_CLASSES: Record<SpringVariant, string> = {
  spring: s.wrapperSpring,
  spring2: s.wrapperSpring2,
  spring4: s.wrapperSpring4,
  spring5: s.wrapperSpring5,
};

const isSpringVariant = (v: Variant): v is SpringVariant => v in SPRING_CLASSES;

const DV_VARIANTS = ['default', 'spring2', 'spring4', 'spring5'] as const;

export const ModalShell = ({ children, className, variant: variantProp = 'spring' }: Props) => {
  const showDv = shouldShowDvBar();
  const { variant: dvVariant, anchor: dvAnchor } = useDesignVariant('ModalShell', DV_VARIANTS);
  const variant: Variant = showDv ? dvVariant : variantProp;

  const isSpring = isSpringVariant(variant);
  const isGradient = variant === 'gradient1' || variant === 'gradient2' || variant === 'gradient3';
  const variantClass = isSpring ? SPRING_CLASSES[variant] : isGradient ? s.wrapperGradient : '';

  return (
    <div {...dvAnchor} className={`${s.wrapper} ${variantClass} ${className ?? ''}`}>
      {isSpring && (
        <div className={s.springOrbs} aria-hidden>
          <span className={`${s.orb} ${s.orb1}`} />
          <span className={`${s.orb} ${s.orb2}`} />
          <span className={`${s.orb} ${s.orb3}`} />
          <span className={`${s.orb} ${s.orb4}`} />
          <span className={`${s.orb} ${s.orb5}`} />
        </div>
      )}
      {isGradient && (
        <>
          <picture className={s.gradientImage} aria-hidden>
            <source srcSet={GRADIENT_SOURCES[variant].avif} type="image/avif" />
            <source srcSet={GRADIENT_SOURCES[variant].webp} type="image/webp" />
            <img src={GRADIENT_SOURCES[variant].fallback} alt="" />
          </picture>
          <div className={s.gradientScrim} aria-hidden />
        </>
      )}
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
  left?: ReactNode;
  right?: ReactNode;
  debugId?: string;
};

const ModalShellActionButtons = ({ left, right, debugId }: ActionButtonsProps) => {
  const ref = useKeyboardStick<HTMLDivElement>(debugId);

  return (
    <div ref={ref} className={s.actionButtons}>
      <div className={s.actionButtonsSlotPrev}>{left}</div>
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
// Multi-step header (back button + breadcrumbs). Lives under the ModalShell
// namespace so there is one entry point for modal header pieces.
ModalShell.StepHeader = ModalStepHeader;
ModalShell.ActionButtons = ModalShellActionButtons;
