import type { CSSProperties } from 'react';
import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import CrossIcon from '@/shared/assets/icons/cross.svg';
import { useDrawerSide } from './drawerSide';

type Props = {
  children: React.ReactNode;
  topRight?: React.ReactNode;
  /** Pinned, non-scrolling content below the scroll area — always visible. */
  footer?: React.ReactNode;
  className?: string;
  a11yLabel?: string;
};

const DrawerLayout = ({ children, topRight, footer, className, a11yLabel }: Props) => {
  const { t } = useTranslation();
  // Side/width are decided at `drawerStore.show(..., { side })` call time and
  // delivered through DrawerManager → DrawerSideContext, so the drawer content
  // component itself never has to know or forward them.
  const { side, width } = useDrawerSide();
  const isSide = side === 'left' || side === 'right';

  const style = width
    ? ({ '--side-drawer-width': width } as CSSProperties)
    : undefined;

  return (
    <Drawer.Popup
      className={clsx(styles.content, styles[`content_${side}`], className)}
      style={style}
      id="drawer-content"
    >
      <Drawer.Title className={styles.srOnly}>
        {a11yLabel ?? t('overlay.drawer.defaultA11yLabel', 'Панель')}
      </Drawer.Title>
      {/*
        Edge swipe-handle — side drawers only. It's a plain sibling of
        Drawer.Content (no `data-base-ui-swipe-ignore`, not inside
        `data-drawer-content`), so Base UI's viewport keeps swipe-to-close
        attached here. The scrollable body opts out via the attribute below,
        so a horizontal drag on the content no longer closes the drawer —
        only this grip + the top chrome bar do (iOS edge-swipe consensus).
        Decorative: closing is also available via the labelled Close button.
      */}
      {isSide && (
        <div
          className={clsx(styles.edgeHandle, styles[`edgeHandle_${side}`])}
          aria-hidden="true"
        />
      )}
      <div className={styles.panel}>
        <div className={styles.dragHandle}>
          <Drawer.Close
            className={clsx(styles.topLeft, styles.actionHeaderButton, styles.actionHeaderButton_back)}
            onClick={(e) => e.stopPropagation()}
          >
            <CrossIcon />
          </Drawer.Close>
          <div className={clsx(styles.actionHeaderButton, styles.topRight)}>{topRight}</div>
        </div>
        <Drawer.Content
          id="drawer-content-scrollable"
          className={styles.scrollableContent}
          // Touch swipe-to-close opts out of the scrollable body. For mouse/pen
          // Base UI already exempts `[data-drawer-content]`; for touch the only
          // hook is this attribute. Bottom drawers keep the default (swipe axis
          // == scroll axis, handled by Base UI's scroll-edge detection).
          data-base-ui-swipe-ignore={isSide ? '' : undefined}
        >
          {children}
        </Drawer.Content>
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </Drawer.Popup>
  );
};

export default DrawerLayout;
