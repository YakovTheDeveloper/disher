import type { ReactNode } from 'react';
import s from './ModalShell.module.scss';

type Props = { children: ReactNode };

export const ModalShell = ({ children }: Props) => (
  <div className={s.wrapper}>{children}</div>
);

const ModalShellSpacer = () => <div className={s.spacer} />;
ModalShellSpacer.displayName = 'ModalShell.Spacer';

const ModalShellBody = ({ children }: Props) => (
  <div className={s.body}>{children}</div>
);
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => (
  <div className={s.atomsBody}>{children}</div>
);
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

ModalShell.Spacer = ModalShellSpacer;
ModalShell.Body = ModalShellBody;
ModalShell.AtomsBody = ModalShellAtomsBody;
