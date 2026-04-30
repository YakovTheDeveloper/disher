import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';

type Variant = 'default' | 'spring' | 'gradient1' | 'gradient2';
type Props = { children: ReactNode; className?: string; variant?: Variant };

const GRADIENT_SOURCES: Record<'gradient1' | 'gradient2', { avif: string; webp: string; fallback: string }> = {
  gradient1: { avif: '/bg/1.avif', webp: '/bg/1.webp', fallback: '/bg/1.png' },
  gradient2: { avif: '/bg/2.avif', webp: '/bg/2.webp', fallback: '/bg/2.jpg' },
};

export const ModalShell = ({ children, className, variant = 'spring' }: Props) => {
  const isGradient = variant === 'gradient1' || variant === 'gradient2';
  const variantClass =
    variant === 'spring'
      ? s.wrapperSpring
      : isGradient
      ? s.wrapperGradient
      : '';

  return (
    <div className={`${s.wrapper} ${variantClass} ${className ?? ''}`}>
      {variant === 'spring' && (
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
