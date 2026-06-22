import type { CSSProperties } from 'react';
import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
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
   * Publish ModalShell's fixed `mono` field/chip tokens (`--field-*` / `--chip-*`)
   * onto the whole popup via `data-modal-fields='mono'`, so a drawer's surface
   * wash + its inner pills/chips/fields share the app-wide monochrome tone
   * (instead of a bespoke per-drawer palette). Carries ONLY the tokens — never the
   * ModalShell `.wrapper` ambient (which would drag the modal's orbs / backdrop-filter /
   * wash onto the popup). See ModalShell.module.scss `[data-modal-fields]`.
   */
  modalFields?: boolean;
  /**
   * Top/bottom scroll-fade hints on the scroll area (the sticky white→transparent
   * gradients that dissolve content at the edges to signal "more above/below").
   * Defaults to `true`. Pass `false` for short form-style drawers whose own footer
   * already marks the end — there the bottom fade washes the last row into the
   * surface and reads as a render glitch rather than an affordance.
   */
  scrollHints?: boolean;
  /**
   * Optional food photo (public path, e.g. `/catalog-food/4185.webp`). When set,
   * the side-drawer edge-handle shows a blurred vertical crop of the photo as an
   * ambient colour texture instead of the variant wash (the grip pill + hairline
   * ride above it). Catalog products carry one (`findCatalogProduct(id)?.image`);
   * user products / dishes don't, so they keep the plain wash. No-op on bottom
   * drawers (no edge handle).
   */
  image?: string;
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
  modalFields,
  scrollHints = true,
  image,
}: Props) => {
  const { t } = useTranslation();
  // Side/width are decided at `drawerStore.show(..., { side })` call time and
  // delivered through DrawerManager → DrawerSideContext, so the drawer content
  // component itself never has to know or forward them.
  const { side, width } = useDrawerSide();
  const isSide = side === 'left' || side === 'right';

  // The edge swipe-handle (side drawers) + the optional popup-wide field tone
  // carry ModalShell's single fixed `mono` tone (the «great unification»,
  // 2026-06-19). We publish ONLY the field tokens via `data-modal-fields='mono'`
  // — never the ModalShell `.wrapper` ambient (that would drag the modal's
  // backdrop-filter / wash onto the popup). The handle's gradient + grip read
  // `--field-*`. See ModalShell.module.scss `[data-modal-fields]`.
  const modalShellVariant = 'mono';

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
      data-modal-fields={modalFields ? modalShellVariant : undefined}
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
          className={clsx(
            styles.edgeHandle,
            styles[`edgeHandle_${side}`],
            image != null && styles.edgeHandleImage,
          )}
          data-modal-fields={modalShellVariant}
          aria-hidden="true"
        >
          {/* Idea 1: a clear vertical crop of the food photo fills the grip
              strip (object-fit: cover); the grip pill + hairline ride above it
              via z-index in the .scss. No image → the variant wash shows. */}
          {image != null && (
            <img className={styles.edgeImage} src={image} alt="" decoding="async" />
          )}
        </div>
      )}
      <div className={styles.panel}>
        {!hideTopChrome && (
          <div
            className={clsx(
              styles.dragHandle,
              showVisibleTitle && subtitle != null && styles.dragHandleStacked,
            )}
          >
            {onBack ? (
              <button
                type="button"
                className={clsx(
                  styles.topLeft,
                  styles.actionHeaderButton,
                  styles.actionHeaderButton_back,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                aria-label={backLabel ?? t('overlay.drawer.back', 'Назад')}
              >
                <ArrowLeftIcon width={22} height={22} />
              </button>
            ) : (
              <Drawer.Close
                className={clsx(styles.topLeft, styles.actionHeaderButton, styles.actionHeaderButton_back)}
                onClick={(e) => e.stopPropagation()}
              >
                <CrossIcon />
              </Drawer.Close>
            )}
            {showVisibleTitle &&
              (subtitle != null ? (
                <div className={styles.titleStack}>
                  <Drawer.Title className={styles.titleCenter}>
                    {title}
                  </Drawer.Title>
                  <p className={styles.titleSubtitle}>{subtitle}</p>
                </div>
              ) : (
                <Drawer.Title className={styles.titleCenter}>
                  {title}
                </Drawer.Title>
              ))}
            <div className={clsx(styles.actionHeaderButton, styles.topRight)}>{topRight}</div>
          </div>
        )}
        <Drawer.Content
          id="drawer-content-scrollable"
          className={clsx(styles.scrollableContent, !scrollHints && styles.noScrollHints)}
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
