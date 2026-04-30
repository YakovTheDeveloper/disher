import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useDesignVariants } from '@/shared/lib/useDesignVariants';
import { shouldShowDvBar } from '@/app/ui/DesignVariantsBar';

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

const DV_VARIANTS: Variant[] = ['default', 'spring2', 'spring4', 'spring5'];

export const ModalShell = ({ children, className, variant: variantProp = 'spring' }: Props) => {
  const showDv = shouldShowDvBar();
  const { index: dvIndex } = useDesignVariants('ModalShell', DV_VARIANTS.length);
  const variant: Variant = showDv ? DV_VARIANTS[dvIndex] : variantProp;

  const isSpring = isSpringVariant(variant);
  const isGradient = variant === 'gradient1' || variant === 'gradient2' || variant === 'gradient3';
  const variantClass = isSpring ? SPRING_CLASSES[variant] : isGradient ? s.wrapperGradient : '';

  return (
    <div className={`${s.wrapper} ${variantClass} ${className ?? ''}`}>
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

const ModalShellBody = ({ children }: Props) => <div className={s.body}>{children}</div>;
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => <div className={s.atomsBody}>{children}</div>;
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

const ModalShellTitle = ({ children }: { children: ReactNode }) => (
  <h2 className={s.title}>{children}</h2>
);
ModalShellTitle.displayName = 'ModalShell.Title';

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
ModalShell.ActionButtons = ModalShellActionButtons;
