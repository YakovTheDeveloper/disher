import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';

type Props = { children: ReactNode; className?: string };

export const ModalShell = ({ children, className }: Props) => (
  <div className={`${s.wrapper} ${className ?? ''}`}>{children}</div>
);

const ModalShellSpacer = () => <div className={s.spacer} />;
ModalShellSpacer.displayName = 'ModalShell.Spacer';

const ModalShellBody = ({ children }: Props) => (
  <div className={s.body}>
    <div className={s.inner}>{children}</div>
  </div>
);
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => <div className={s.atomsBody}>{children}</div>;
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

const ModalShellTitle = ({ children }: { children: ReactNode }) => (
  <h2 className={s.title}>{children}</h2>
);
ModalShellTitle.displayName = 'ModalShell.Title';

ModalShell.Spacer = ModalShellSpacer;
ModalShell.Body = ModalShellBody;
ModalShell.AtomsBody = ModalShellAtomsBody;
ModalShell.Title = ModalShellTitle;
