import type { CSSProperties } from 'react';
import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import { useDrawerSide } from './drawerSide';

type Props = {
  children: React.ReactNode;
  /**
   * Centered header title — sits between the Close cross and the topRight slot,
   * on the same row. When the chrome row is visible, the title IS the single
   * `Drawer.Title` (the dialog's `<h2>` AND its accessible name — see precedence
   * on `a11yLabel`), styled with the canonical drawer-heading tokens (Source
   * Serif italic, `--heading-size-drawer`). Pass a plain string for canonical
   * styling, or a custom node if you need a bespoke heading. Body headings
   * inside the drawer should be `<h3>`+ to keep the document outline correct.
   */
  title?: React.ReactNode;
  topRight?: React.ReactNode;
  /** Pinned, non-scrolling content below the scroll area — always visible. */
  footer?: React.ReactNode;
  className?: string;
  /**
   * Screen-reader accessible name for the drawer. Used ONLY when there is no
   * visible title to serve as the heading (no `title`, or `hideTopChrome`) —
   * a visible title always wins as the accessible name so it never diverges
   * from what's on screen (WCAG 2.5.3). Falls back to a default if neither set.
   */
  a11yLabel?: string;
  /**
   * Hide the 40px top drag-handle row (with the Close cross + topRight slot).
   * Closing is still available via edge-swipe handle (side drawers) and
   * backdrop click. Used by NutrientsDrawer where the row eats vertical space
   * the content needs.
   */
  hideTopChrome?: boolean;
};

const DrawerLayout = ({
  children,
  title,
  topRight,
  footer,
  className,
  a11yLabel,
  hideTopChrome,
}: Props) => {
  const { t } = useTranslation();
  // Side/width are decided at `drawerStore.show(..., { side })` call time and
  // delivered through DrawerManager → DrawerSideContext, so the drawer content
  // component itself never has to know or forward them.
  const { side, width } = useDrawerSide();
  const isSide = side === 'left' || side === 'right';

  // The visible header title doubles as the single `Drawer.Title` (one <h2> =
  // accessible name + visible heading) when the chrome row is on screen.
  const showVisibleTitle = title != null && !hideTopChrome;

  const style = width
    ? ({ '--side-drawer-width': width } as CSSProperties)
    : undefined;

  return (
    <Drawer.Popup
      className={clsx(styles.content, styles[`content_${side}`], className)}
      style={style}
      id="drawer-content"
    >
      {/*
        Exactly ONE Drawer.Title per drawer (Base UI wires aria-labelledby to
        it and renders it as <h2>). When a visible title shows in the chrome row
        it IS that Title (rendered below, in `.dragHandle`) — so the accessible
        name equals the on-screen label and there's no duplicate <h2>. Only when
        there's no visible title (title-less, or hideTopChrome) do we emit a
        sr-only Title carrying a11yLabel.
      */}
      {!showVisibleTitle && (
        <Drawer.Title className={styles.srOnly}>
          {a11yLabel ??
            (typeof title === 'string' ? title : undefined) ??
            t('overlay.drawer.defaultA11yLabel', 'Панель')}
        </Drawer.Title>
      )}
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
        {!hideTopChrome && (
          <div className={styles.dragHandle}>
            <Drawer.Close
              className={clsx(styles.topLeft, styles.actionHeaderButton, styles.actionHeaderButton_back)}
              onClick={(e) => e.stopPropagation()}
            >
              <CrossIcon />
            </Drawer.Close>
            {showVisibleTitle && (
              <Drawer.Title className={styles.titleCenter}>{title}</Drawer.Title>
            )}
            <div className={clsx(styles.actionHeaderButton, styles.topRight)}>{topRight}</div>
          </div>
        )}
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
