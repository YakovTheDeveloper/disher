import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';
import { useKeyboardStickV2 } from '@/shared/ui/hooks/useKeyboardStickV2';

type Props = { children: ReactNode; className?: string; variant?: 'default' | 'spring' };

export const ModalShell = ({ children, className, variant = 'spring' }: Props) => (
  <div className={`${s.wrapper} ${variant === 'spring' ? s.wrapperSpring : ''} ${className ?? ''}`}>
    {variant === 'spring' && (
      <div className={s.springOrbs} aria-hidden>
        <span className={`${s.orb} ${s.orb1}`} />
        <span className={`${s.orb} ${s.orb2}`} />
        <span className={`${s.orb} ${s.orb3}`} />
        <span className={`${s.orb} ${s.orb4}`} />
        <span className={`${s.orb} ${s.orb5}`} />
      </div>
    )}
    {children}
  </div>
);

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
  const ref = useKeyboardStickV2<HTMLDivElement>(debugId);

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
