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
   * Chromeless-but-closable mode: drop the drag-handle row (so the body starts
   * flush at the very top and the consumer can put its OWN construction there —
   * e.g. ScheduleNavigator's «Навигация / Активные дни» tab row), yet keep the
   * Close cross floating `position: absolute` in the top-left corner over the
   * content instead of reserving a flex row for it. Unlike `hideTopChrome` (which
   * removes the cross entirely), the cross stays — just detached from layout flow.
   * There's no visible title / topRight / onBack in this mode; pass `a11yLabel`
   * for the sr-only accessible name. If the consumer's top content is left-
   * aligned, center it (or inset it) so it doesn't sit under the corner cross.
   */
  floatingClose?: boolean;
  /**
   * Custom header content for the chrome row's CENTER slot (compound-slot
   * pattern — shadcn/Radix `DrawerHeader`, Ant `title` node). Use when the
   * built-in `title`/`subtitle` can't express your header (e.g. a segmented
   * control / search row). DrawerLayout keeps owning the row geometry: the
   * leading Close cross (or `onBack`) stays absolute-left, `topRight` stays
   * absolute-right, and your node sits in a SYMMETRIC center band — equal
   * `--sys-inset-panel + --sys-size-control` gutters on BOTH sides. That
   * symmetry is what keeps the content geometrically centered on the row despite
   * the left-only cross, so it never slides under it. The row grows for taller
   * content but keeps the min chrome height, so a short header still looks like
   * the default drawer. Takes precedence over `title`/`subtitle` (ignored); pass
   * `a11yLabel` for the sr-only accessible name. For content that is NOT
   * header-shaped and wants the full width edge-to-edge, use `floatingClose`.
   */
  header?: React.ReactNode;
  /**
   * Top/bottom scroll-fade hints on the scroll area (the sticky white→transparent
   * gradients that dissolve content at the edges to signal "more above/below").
   * Defaults to `true`. Pass `false` for short form-style drawers whose own footer
   * already marks the end — there the bottom fade washes the last row into the
   * surface and reads as a render glitch rather than an affordance.
   */
  scrollHints?: boolean;
  /**
   * Side-padding (`padding-inline`) on the scroll area. Deduped into the layout so
   * consumers stop repeating `padding-inline: var(--sys-inset-sheet)` in every
   * `.body`. Canon evolved (2026-07-03): «surface owns bg + side inset + the
   * title→content top gap; content owns only the bottom padding».
   *
   * Default (prop omitted) is SIDE-AWARE — bottom drawers inset the body by
   * `--drawer-inset` (= `sheet` 24, so the body lines up with the leading Close
   * cross by construction) AND get the unified 12px title→content top gap; side
   * drawers stay full-bleed (0). Pass `'none'` to opt a bottom drawer OUT of the
   * side inset (full-bleed, e.g. ScheduleNavigator's edge-to-edge tab panels);
   * `'panel'` (12) / `'sheet'` (24) to force an explicit inset (side drawers that
   * want a body inset pass `'panel'`).
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
  floatingClose,
  header,
  scrollHints = true,
  contentInset,
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
  // `header` (custom center node) takes precedence over the built-in title path.
  const showVisibleTitle =
    title != null && !hideTopChrome && !floatingClose && header == null;

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
        {/*
          floatingClose — chromeless layout: no drag-handle row, but the Close
          cross floats absolutely in the top-left corner over the body. Resolves
          against `.panel` (side drawers, position: relative) / `.content`
          (bottom drawers, where `.panel` is display:contents) — both give the
          top-left of the visible panel. Rendered before Drawer.Content so it
          sits above the scroll body via z-index.
        */}
        {floatingClose && (
          <Drawer.Close
            onClick={(e) => e.stopPropagation()}
            render={
              <IconButton
                className={styles.floatingClose}
                aria-label={t('overlay.drawer.close', 'Закрыть')}
                icon={<CrossIcon width={16} height={16} />}
              />
            }
          />
        )}
        {!hideTopChrome && !floatingClose && (
          <div
            className={clsx(
              styles.dragHandle,
              showVisibleTitle && subtitle != null && styles.dragHandleStacked,
              header != null && styles.dragHandleHeader,
              // Заголовок ВСЕХ дроверов (нижних И боковых) центрируется по chrome-ряду
              // (просьба 2026-07-10). В боковом дровере ряд живёт внутри `.panel`
              // (edge-handle — отдельный flex-сосед), поэтому центр приходится на
              // видимую белую панель, кромка-хэндл исключена по построению. Бывший
              // left-align боковых (.dragHandleSideTitle, a7637b4b) снят; длинные
              // подписи теперь переносятся на 2 строки, а не жмутся у креста.
            )}
          >
            {/*
              Крест/стрелка/урна — ОДИН примитив IconButton (neutral/danger),
              одна сетка (.chromeSlot, --sys-size-control=44 тап-арея). Видимый
              глиф намеренно мельче тап-ареи (16) — «тихость» несёт размер+тонкий
              штрих (form), а не заниженный контраст; хит-арея остаётся 44 (touch
              floor). Оптическая кромка глифа держится на линии тела за счёт
              лево-джастификации в коробке (.chromeSlot.topLeft), независимо от 16.
            */}
            {onBack ? (
              <IconButton
                className={clsx(styles.chromeSlot, styles.topLeft)}
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                aria-label={backLabel ?? t('overlay.drawer.back', 'Назад')}
                icon={<ArrowLeftIcon width={16} height={16} />}
              />
            ) : (
              <Drawer.Close
                onClick={(e) => e.stopPropagation()}
                render={
                  <IconButton
                    className={clsx(styles.chromeSlot, styles.topLeft)}
                    aria-label={t('overlay.drawer.close', 'Закрыть')}
                    icon={<CrossIcon width={16} height={16} />}
                  />
                }
              />
            )}
            {/*
              Custom header center slot. Symmetric gutters (.headerSlot padding)
              keep the node truly centered on the row despite the absolute
              cross (left) / topRight (right). Exactly one Drawer.Title still
              exists — the sr-only one above (showVisibleTitle is false here).
            */}
            {header != null && <div className={styles.headerSlot}>{header}</div>}
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
            contentInset === 'none' && styles.contentInsetNone,
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
