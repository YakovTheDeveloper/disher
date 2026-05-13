import type { CSSProperties, ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
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
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      modal="trap-focus"
      swipeDirection={direction}
    >
      <Drawer.Portal container={portalTarget}>
        <Drawer.Backdrop className={styles.overlay} />
        <Drawer.Viewport>
          <Drawer.Popup
            className={clsx(styles.content, styles[`content_${direction}`], className)}
            style={style}
          >
            <header className={styles.header}>
              <Drawer.Title className={title != null ? styles.title : styles.srOnly}>
                {title ?? 'Панель'}
              </Drawer.Title>
              {description != null && (
                <Drawer.Description className={styles.srOnly}>{description}</Drawer.Description>
              )}
              {headerAction != null && (
                <div className={styles.headerAction}>{headerAction}</div>
              )}
              <Drawer.Close className={styles.close} aria-label="Закрыть">
                <CrossIcon />
              </Drawer.Close>
            </header>
            <div className={styles.body}>{children}</div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default SideDrawer;
