import type { CSSProperties } from 'react';
import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { IconButton } from '@/shared/ui/atoms/Button';
import { useDrawerSide } from './drawerSide';

type Props = {
  children: React.ReactNode;
  /**
   * Centered header title — sits between the Close cross and the topRight slot,
   * on the same row. When the chrome row is visible, the title IS the single
   * `Drawer.Title` (the dialog's `<h2>` AND its accessible name — see precedence
   * on `a11yLabel`), styled with the canonical drawer-heading tokens (Source
   * Serif italic, `--sys-heading-size-drawer`). Pass a plain string for canonical
   * styling, or a custom node if you need a bespoke heading. Body headings
   * inside the drawer should be `<h3>`+ to keep the document outline correct.
   */
  title?: React.ReactNode;
  /**
   * Optional caption rendered directly beneath the centered `title`, inside the
   * same chrome row (e.g. the account email under «Аккаунт»). Only shown when a
   * visible title is present — it's a subtitle of that heading, never standalone.
   * Styled as a small secondary caption; keep it short (it wraps/breaks).
   */
  subtitle?: React.ReactNode;
  topRight?: React.ReactNode;
  /**
   * When provided, the top-left chrome button becomes a back arrow that calls
   * this instead of closing the drawer (Drawer.Close). Use for in-drawer
   * sub-screens (e.g. a two-state drawer): the leading control is contextual —
   * back on a sub-screen, close at the root — so a back arrow and a close cross
   * never sit side by side (no mis-tap). Closing from the sub-screen stays
   * available via swipe-down / backdrop.
   */
  onBack?: () => void;
  /** Accessible label for the back button (defaults to a generic «Назад»). */
  backLabel?: string;
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
  /**
   * Top/bottom scroll-fade hints on the scroll area (the sticky white→transparent
   * gradients that dissolve content at the edges to signal "more above/below").
   * Defaults to `true`. Pass `false` for short form-style drawers whose own footer
   * already marks the end — there the bottom fade washes the last row into the
   * surface and reads as a render glitch rather than an affordance.
   */
  scrollHints?: boolean;
  /**
   * Optional side-padding (`padding-inline`) on the scroll area, deduping the
   * one boilerplate ~80% of drawers repeat. Canon stays «content owns padding» —
   * this hangs ONLY the horizontal inset token (`panel` = 12, `sheet` = 24);
   * vertical padding still belongs to the drawer body. Default `'none'` is the
   * back-compat no-op (full-bleed drawers untouched).
   */
  contentInset?: 'panel' | 'sheet' | 'none';
};

const DrawerLayout = ({
  children,
  title,
  subtitle,
  topRight,
  onBack,
  backLabel,
  footer,
  className,
  a11yLabel,
  hideTopChrome,
  scrollHints = true,
  contentInset = 'none',
}: Props) => {
  const { t } = useTranslation();
  // Side/width are decided at `drawerStore.show(..., { side })` call time and
  // delivered through DrawerManager → DrawerSideContext, so the drawer content
  // component itself never has to know or forward them.
  const { side, width } = useDrawerSide();
  const isSide = side === 'left' || side === 'right';

  // The edge swipe-handle (side drawers) reads ModalShell's single fixed `mono`
  // field tokens (`--sys-field-*`) for its gradient + grip. Those tokens are now
  // published unconditionally on `:root` (ModalShell.module.scss), so the handle
  // — and every drawer surface — inherits them without any local republisher; the
  // old `data-modal-fields='mono'` attribute (a no-op single-position gate) was
  // removed 2026-06-22.

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
          <div
            className={clsx(
              styles.dragHandle,
              showVisibleTitle && subtitle != null && styles.dragHandleStacked,
            )}
          >
            {/*
              Крест/стрелка/урна — ОДИН примитив IconButton (neutral/danger),
              одна сетка (.chromeSlot, --sys-size-control тап-арея, глиф 24).
              Раньше крест шёл сырым SVG в Drawer.Close + `_back {opacity:0.2}` —
              два разных механизма. «Тихость» теперь несёт neutral-тон, не opacity.
            */}
            {onBack ? (
              <IconButton
                tone="neutral"
                className={clsx(styles.chromeSlot, styles.topLeft)}
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                aria-label={backLabel ?? t('overlay.drawer.back', 'Назад')}
                icon={<ArrowLeftIcon width={24} height={24} />}
              />
            ) : (
              <Drawer.Close
                onClick={(e) => e.stopPropagation()}
                render={
                  <IconButton
                    tone="neutral"
                    className={clsx(styles.chromeSlot, styles.topLeft)}
                    aria-label={t('overlay.drawer.close', 'Закрыть')}
                    icon={<CrossIcon width={24} height={24} />}
                  />
                }
              />
            )}
            {showVisibleTitle &&
              (subtitle != null ? (
                <div className={styles.titleStack}>
                  <Drawer.Title
                    className={styles.titleCenter}
                    render={<Heading role="headline" as="h2">{title}</Heading>}
                  >
                    {title}
                  </Drawer.Title>
                  <Text as="p" role="caption" className={styles.titleSubtitle}>
                    {subtitle}
                  </Text>
                </div>
              ) : (
                <Drawer.Title
                  className={styles.titleCenter}
                  render={<Heading role="headline" as="h2">{title}</Heading>}
                >
                  {title}
                </Drawer.Title>
              ))}
            <div className={clsx(styles.chromeSlot, styles.chromeSlotWrap, styles.topRight)}>{topRight}</div>
          </div>
        )}
        <Drawer.Content
          id="drawer-content-scrollable"
          className={clsx(
            styles.scrollableContent,
            !scrollHints && styles.noScrollHints,
            contentInset === 'panel' && styles.contentInsetPanel,
            contentInset === 'sheet' && styles.contentInsetSheet,
          )}
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
