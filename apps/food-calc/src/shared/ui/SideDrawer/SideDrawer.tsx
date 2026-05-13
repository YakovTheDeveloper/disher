import type { CSSProperties, ReactNode } from 'react';
import { Drawer as DrawerLib } from 'vaul';
import clsx from 'clsx';
import CrossIcon from '@/shared/assets/icons/cross.svg';
import styles from './SideDrawer.module.scss';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Optional action button rendered between title and close. */
  headerAction?: ReactNode;
  children: ReactNode;
  /** Side the drawer slides in from. Default 'left'. */
  direction?: 'left' | 'right';
  /** CSS length, e.g. 'min(85vw, 360px)'. */
  width?: string;
  className?: string;
};

export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  headerAction,
  children,
  direction = 'left',
  width,
  className,
}: Props) {
  const portalTarget =
    typeof document !== 'undefined' ? document.getElementById('drawer-root') : null;

  const style = { '--side-drawer-width': width ?? 'min(85vw, 360px)' } as CSSProperties;

  return (
    <DrawerLib.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
      dismissible
      repositionInputs={false}
      container={portalTarget}
    >
      <DrawerLib.Portal>
        <DrawerLib.Overlay className={styles.overlay} />
        <DrawerLib.Content
          className={clsx(styles.content, styles[`content_${direction}`], className)}
          style={style}
        >
          <DrawerLib.Handle
            className={clsx(styles.handle, styles[`handle_${direction}`])}
          />
          <header className={styles.header}>
            <DrawerLib.Title className={title != null ? styles.title : styles.srOnly}>
              {title ?? 'Панель'}
            </DrawerLib.Title>
            {description != null && (
              <DrawerLib.Description className={styles.srOnly}>
                {description}
              </DrawerLib.Description>
            )}
            {headerAction != null && (
              <div className={styles.headerAction}>{headerAction}</div>
            )}
            <DrawerLib.Close className={styles.close} aria-label="Закрыть">
              <CrossIcon />
            </DrawerLib.Close>
          </header>
          <div className={styles.body}>{children}</div>
        </DrawerLib.Content>
      </DrawerLib.Portal>
    </DrawerLib.Root>
  );
}

export default SideDrawer;
