import { type CSSProperties, useEffect, useRef } from 'react';
import styles from './DrawerLayout.module.scss';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useTranslation } from 'react-i18next';
import { useScrollEdges } from '@/shared/ui/hooks/useScrollEdges';
import { useCollapsingHeader } from '@/shared/ui/hooks/useCollapsingHeader';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { IconButton } from '@/shared/ui/atoms/Button';
import { useDrawerSide, useDrawerSnap } from './drawerSide';

/**
 * Форма шапки дровера — дискриминированный союз, делающий нелегальные комбинации
 * НЕВЫРАЗИМЫМИ (в этом весь смысл: не дисциплина, а тип). Заголовок/подзаголовок
 * канонических веток — строго `string` (типо-ярус кладёт сам DrawerLayout через
 * примитивы Heading/Text; произвольный JSX туда протащить нельзя — это и был бы
 * дрейф). Свободный узел живёт ТОЛЬКО за дверью `custom`, честно названной.
 *
 *  - `compact` — средний рунг заголовка (Heading role="title", ~17px) + опц. тихий
 *    subtitle. Дом связки «имя + контекст» (эталон ProductDrawer/QuickView). Дефолт-
 *    форма шапки: дровер обычно НЕ большой новый этап, а контекстная панель.
 *  - `prominent` — каноничный крупный headline (28px), БЕЗ subtitle (тип запрещает).
 *    Опт-ин для дроверов-«новых этапов» (хаб «Открытия», «Перейти»).
 *  - `custom` — произвольный центр-узел (сегмент-контрол / месяц-пейджер), когда
 *    строковые ветки не выражают шапку. Требует `a11yLabel` — sr-only имя диалога
 *    (у узла нет строкового заголовка, который стал бы accessible name). Заменяет
 *    прежний свободный `header`-узел.
 */
export type DrawerHeaderSpec =
  | { kind: 'compact'; title: string; subtitle?: string }
  | { kind: 'prominent'; title: string }
  | { kind: 'custom'; node: React.ReactNode; a11yLabel: string };

type Props = {
  children: React.ReactNode;
  /**
   * Шапка дровера — ОДНА форма-объект (дискриминированный `DrawerHeaderSpec`),
   * заменившая прежние `title` + `titleSize` + `subtitle` + свободный `header`-узел.
   * Когда chrome-ряд виден, строковый заголовок веток `compact`/`prominent` И ЕСТЬ
   * единственный `Drawer.Title` (h2 = видимый заголовок И accessible name). Ветка
   * `custom` кладёт произвольный узел в центр и несёт собственный `a11yLabel`.
   * Опусти проп целиком для дроверов без видимой шапки (`hideTopChrome` /
   * `floatingClose`) — тогда sr-only имя берётся из `a11yLabel`. Заголовки тела
   * держи `<h3>`+, чтобы не ломать document outline.
   */
  header?: DrawerHeaderSpec;
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
   * backdrop click.
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
   * Bottom scroll-fade hint on the scroll area — the `mask-image` dissolve that
   * fades the last rows into transparency to signal "more below" (see
   * `scroll-edge-fade` mixin; driven by `useScrollEdges` → `data-more-below`).
   * Defaults to `true`. There is NO top fade: the top edge carries a fading
   * divider seam instead (`.dragHandle::after`, `data-scrolled`), and this prop
   * gates ONLY the bottom fade — the top seam always shows on scroll regardless.
   * Pass `false` for short form-style drawers whose own footer already marks the
   * end — there the bottom fade washes the last row into the surface and reads as
   * a render glitch rather than an affordance.
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
  /**
   * Убирает верхний padding скролл-области (`--drawer-content-pad-top` → 0) —
   * когда consumer сам владеет зазором «шапка → тело» и каноничный отступ
   * layout'а задваивал бы его.
   */
  flushBodyPaddingTop?: boolean;
  /**
   * How the chrome header row reacts to body scroll (default `'collapse'`):
   *   - `'pin'` — stays PINNED at full size (legacy behaviour; opt out here).
   *   - `'collapse'` (default) — stays pinned but SHRINKS organically as you scroll down
   *     (iOS large-title / Material 3 LargeTopAppBar): the title + leading/trailing
   *     glyphs scale down and the bar slims, freeing vertical space, then re-expand
   *     as you scroll back up (enterAlways — see `useCollapsingHeader`). The Close
   *     cross / `onBack` arrow stay put, so closing is never lost. Best default for
   *     content-first drawers where a full title bar eats room the body wants.
   *   - `'scroll'` — the whole row SCROLLS AWAY with the content; the leading
   *     control DETACHES and floats in the top-left corner (like `floatingClose`),
   *     so closing survives. The title / `topRight` ride up out of view.
   * Ignored under `hideTopChrome` / `floatingClose` (no chrome row to drive).
   */
  headerScroll?: 'pin' | 'collapse' | 'scroll';
  /**
   * Убрать видимую хват-пилюлю (grab-handle) у нижнего snap-дровера. По умолчанию
   * она рисуется у ЛЮБОГО bottom-дровера с ≥2 snap-фазами как аффорданс «лист
   * тянется» + клавиатурный путь ко второй фазе. Opt-out для витрин, где пилюля
   * читается как визуальный шум (NutrientShowcaseDrawer «Пищевая ценность»);
   * свайп-драг листа при этом остаётся — снимается только декоративная пилюля.
   */
  hideGrabHandle?: boolean;
};

const DrawerLayout = ({
  children,
  header,
  topRight,
  onBack,
  backLabel,
  footer,
  className,
  a11yLabel,
  hideTopChrome,
  floatingClose,
  scrollHints = true,
  contentInset,
  flushBodyPaddingTop,
  headerScroll = 'collapse',
  hideGrabHandle = false,
}: Props) => {
  const { t } = useTranslation();
  // Side/width are decided at `drawerStore.show(..., { side })` call time and
  // delivered through DrawerManager → DrawerSideContext, so the drawer content
  // component itself never has to know or forward them.
  const { side, width, snapPoints } = useDrawerSide();
  const isSide = side === 'left' || side === 'right';
  // Snap sheets compose their transform from Base UI's snap-offset + swipe vars
  // (see `.content_bottom.contentSnap` in the scss) instead of the single-phase
  // upward-clamped swipe transform — Base UI already damps snap overdrag itself.
  const isSnap = side === 'bottom' && !!snapPoints?.length;
  // На НЕверхней snap-фазе гасим внутренний скролл тела: тогда драг по контенту
  // Base UI трактует как свайп листа (свайп пускается только по нескроллящейся
  // цели) → лист разворачивается в верхнюю фазу «сразу как человек начал листать»,
  // а не листает контент под сгибом. На верхней фазе скролл включается.
  const { atTopSnap, canExpand, toggleSnap } = useDrawerSnap();
  const lockBodyScroll = isSnap && !atTopSnap;
  // Grab-handle рисуем автоматически у ЛЮБОГО нижнего дровера с ≥2 snap-фазами —
  // видимый аффорданс «лист тянется» + клавиатурный/скринридерный путь ко второй
  // фазе (drag доступен не всем; NN/g/M3: не полагаться только на жест).
  const showGrabHandle = side === 'bottom' && canExpand && !hideGrabHandle;

  // ─── Единый детектор краёв прокрутки (верхний шов + нижний fade) ───────────
  // ОДИН механизм (useScrollEdges, IntersectionObserver на двух сентинелах)
  // питает и верхний divider-шов (`.dragHandle[data-scrolled]`), и нижний
  // fade-растворение (`.scrollableContent[data-more-below]`). Раньше это были
  // ДВА независимых пути: JS-обсервер для шва + CSS scroll-timeline/@container
  // scroll-state для fade. CSS-путь — Chrome-only, поэтому на iOS Safari (а это
  // PWA на iOS) fade просто не появлялся. Теперь оба края через один JS-сигнал,
  // работающий во всех браузерах → шов и fade больше не расходятся.
  const { topSentinelRef, bottomSentinelRef, scrolled, moreBelow } = useScrollEdges();

  // ─── Компенсация скрытой полосы snap-листа (самоизмеряющаяся) ─────────────
  // Snap-дровер стоит на НАТУРАЛЬНОЙ высоте контента и сдвинут вниз на snap-
  // offset: нижняя полоса листа (и конец скроллера) висит ПОД кромкой экрана, и
  // последние ряды недостижимы. Компенсировать через `--drawer-snap-point-offset`
  // в CSS НЕЛЬЗЯ: Base UI регистрирует его `inherits: false` (DrawerPopup.js), на
  // скроллере он всегда 0px. Меряем скрытую полосу сами: rect попапа (transform
  // входит в getBoundingClientRect) против innerHeight, и пишем padding-bottom
  // инлайном. Пересчёт: ResizeObserver (догрузка контента меняет высоту листа) +
  // transitionend на попапе (приземление на фазу после свайпа) + смена фазы/resize.
  const popupRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isSnap) return;
    const popup = popupRef.current;
    const scroller = scrollerRef.current;
    if (!popup || !scroller) return;
    const update = () => {
      const hidden = Math.max(
        0,
        Math.round(popup.getBoundingClientRect().bottom - window.innerHeight)
      );
      scroller.style.paddingBottom = `calc(var(--space-4) + ${hidden}px)`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(popup);
    popup.addEventListener('transitionend', update);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      popup.removeEventListener('transitionend', update);
      window.removeEventListener('resize', update);
      scroller.style.paddingBottom = '';
    };
  }, [isSnap, atTopSnap]);

  // The edge swipe-handle (side drawers) reads ModalShell's single fixed `mono`
  // field tokens (`--sys-field-*`) for its gradient + grip. Those tokens are now
  // published unconditionally on `:root` (ModalShell.module.scss), so the handle
  // — and every drawer surface — inherits them without any local republisher; the
  // old `data-modal-fields='mono'` attribute (a no-op single-position gate) was
  // removed 2026-06-22.

  // Разбор формы-шапки (дискриминированный union) в плоские значения, которыми
  // дальше живёт раскладка. Строковый заголовок только у веток title-типа; свободный
  // узел — только у `custom` (бывший `header`-узел). Так «нелегальное невыразимо»
  // держится на входе, а тело layout'а остаётся тем же.
  // Discriminant-проверки идут ПО `header` напрямую (не через промежуточную
  // `headerKind`-константу) — иначе TS не сузит union к ветке и `.title`/`.node`
  // недоступны. `header.kind !== 'custom'` = title-типовые ветки (compact|prominent),
  // у обеих есть строковый `title`.
  const titleText = header && header.kind !== 'custom' ? header.title : undefined;
  const subtitleText = header?.kind === 'compact' ? header.subtitle : undefined;
  const customNode = header?.kind === 'custom' ? header.node : undefined;

  // The visible header title doubles as the single `Drawer.Title` (one <h2> =
  // accessible name + visible heading) when the chrome row is on screen. A `custom`
  // header (free node) takes precedence over the built-in title path (no visible
  // Drawer.Title — it carries its own sr-only a11yLabel instead).
  const showVisibleTitle =
    !!header && header.kind !== 'custom' && !hideTopChrome && !floatingClose;

  // Chrome row exists (title/subtitle/custom header + leading control) unless the
  // consumer opted into a chromeless variant. `'scroll'` moves the row INTO the
  // scroller (scrolls away, leading control floats); `'collapse'` keeps it pinned
  // but shrinks it on scroll; `'pin'` (default) leaves it full-size.
  const hasChromeRow = !hideTopChrome && !floatingClose;
  const scrollAwayHeader = hasChromeRow && headerScroll === 'scroll';
  const collapseHeader = hasChromeRow && headerScroll === 'collapse';

  // Двухэтажный chrome (title + subtitle) на ПРИЛЕПЛЕННОМ ряду: layout сам поднимает
  // зазор «шапка → тело» до section-рунга (класс .stackedTitle на попапе, см. scss) —
  // 4px под тихим subtitle читались слипанием: граница «chrome → контент» оказывалась
  // МЕНЬШЕ внутрителовых section-швов (перевёрнутый ритм). Scroll-away исключён: там
  // ряд живёт ВНУТРИ скроллера, pad-top лёг бы НАД ним, а не под ним.
  const hasSubtitle = showVisibleTitle && subtitleText != null;
  const stackedTitle = hasSubtitle && !scrollAwayHeader;

  // Collapse progress (--header-collapse 0..1) is written on `.panel` from the
  // scroller's onScroll; the pinned chrome row reads it via CSS. Inert unless
  // `'collapse'` (hook early-returns when disabled).
  const { targetRef: collapseRef, onScroll: onCollapseScroll } =
    useCollapsingHeader(collapseHeader);

  // Leading control (Close cross / `onBack` arrow) — ONE factory, so the pinned
  // chrome-row slot and the floating (scroll-away) placement stay identical apart
  // from their class. Облик — холодный глиф + тихая рамка без подложки (ghost
  // bordered); размер тот же, что у замыкающего контрола (40, --drawer-control-size):
  // хедер всегда «кнопка — заголовок — кнопка».
  const renderLeading = (className: string) =>
    onBack ? (
      <IconButton
        className={className}
        tone="ghost"
        bordered
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
        aria-label={backLabel ?? t('overlay.drawer.back', 'Назад')}
        // Размер глифа НЕ хардкодим — его несёт CSS через --sys-icon-size-chrome
        // (см. .chromeCell .leadingGlyph svg): один токен на ВСЕ chrome-глифы.
        icon={<ArrowLeftIcon />}
      />
    ) : (
      <Drawer.Close
        onClick={(e) => e.stopPropagation()}
        render={
          <IconButton
            className={className}
            tone="ghost"
            bordered
            aria-label={t('overlay.drawer.close', 'Закрыть')}
            icon={<CrossIcon />}
          />
        }
      />
    );

  // Заголовок хедера как один Drawer.Title (h2). `prominent` — каноничный крупный
  // headline (28px, «новый этап»); `compact` — средний рунг (Heading role="title",
  // ~17px): имя сущности + опц. subtitle-строка контекста под ним. Типо-ярус несёт
  // примитив Heading, НЕ сырой font-size в scss (гейт typo-encapsulation).
  const titleRender =
    header?.kind === 'prominent' ? (
      <Heading as="h2" role="headline">
        {titleText}
      </Heading>
    ) : (
      <Heading as="h2" role="title">
        {titleText}
      </Heading>
    );

  // Center + trailing cells of the chrome grid (custom `header` / title / subtitle
  // in the CENTER column; `topRight` in the TRAILING column). Shared by both
  // placements — only the leading control differs (in-row cell when pinned,
  // floating when scroll-away), so the center content never forks. Крайние
  // треки грида равны по построению (обе кнопки 40; без topRight — заглушка
  // .chromeSpacer) → центр-колонка на геометрическом центре ряда.
  const headerCenter = (
    <>
      <div className={styles.centerCell}>
        {customNode != null && <div className={styles.headerSlot}>{customNode}</div>}
        {showVisibleTitle &&
          (subtitleText != null ? (
            <div className={styles.titleStack}>
              <Drawer.Title className={styles.titleCenter} render={titleRender}>
                {titleText}
              </Drawer.Title>
              <Text as="p" role="caption" className={styles.titleSubtitle}>
                {subtitleText}
              </Text>
            </div>
          ) : (
            <Drawer.Title className={styles.titleCenter} render={titleRender}>
              {titleText}
            </Drawer.Title>
          ))}
      </div>
      <div className={clsx(styles.chromeCell, styles.chromeCellTrail)}>
        {/*
          Хедер всегда «кнопка — заголовок — кнопка»: когда topRight не задан,
          кладём невидимую заглушку того же размера (40, --drawer-control-size),
          чтобы крайние колонки грида были равны и заголовок сидел ровно по
          центру по построению (фикс-треки вместо прежнего gutter-minmax).
        */}
        {topRight ?? <span className={styles.chromeSpacer} aria-hidden="true" />}
      </div>
    </>
  );

  const style = width ? ({ '--side-drawer-width': width } as CSSProperties) : undefined;

  return (
    <Drawer.Popup
      ref={popupRef}
      className={clsx(styles.content, styles[`content_${side}`], isSnap && styles.contentSnap, stackedTitle && styles.stackedTitle, className)}
      style={style}
      id="drawer-content"
    >
      {/*
        Exactly ONE Drawer.Title per drawer (Base UI wires aria-labelledby to
        it and renders it as <h2>). When a visible title shows in the chrome row
        it IS that Title (rendered below, in `.dragHandle`) — so the accessible
        name equals the on-screen label and there's no duplicate <h2>. Only when
        there's no visible title (custom header, title-less, or hideTopChrome) do
        we emit a sr-only Title. Its name = the custom header's own a11yLabel, else
        the top-level a11yLabel, else a default.
      */}
      {!showVisibleTitle && (
        <Drawer.Title className={styles.srOnly}>
          {(header?.kind === 'custom' ? header.a11yLabel : undefined) ??
            a11yLabel ??
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
        <div className={clsx(styles.edgeHandle, styles[`edgeHandle_${side}`])} aria-hidden="true" />
      )}
      <div className={styles.panel} ref={collapseRef}>
        {/*
          Grab-handle — видимая хват-пилюля по центру верхней кромки нижнего snap-
          дровера. `<button>` (не декор): тап разворачивает/сворачивает лист,
          Enter/Space работают из коробки, aria-expanded отражает фазу. Абсолютом
          поверх chrome-ряда (0 layout-высоты), крест/цель по краям не задевает.
        */}
        {showGrabHandle && (
          <button
            type="button"
            className={styles.grabHandle}
            onClick={toggleSnap}
            aria-label={
              atTopSnap
                ? t('overlay.drawer.collapse', 'Свернуть панель')
                : t('overlay.drawer.expand', 'Развернуть панель')
            }
            aria-expanded={atTopSnap}
          />
        )}
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
                tone="ghost"
                bordered
                aria-label={t('overlay.drawer.close', 'Закрыть')}
                icon={<CrossIcon width={16} height={16} />}
              />
            }
          />
        )}
        {/*
          scrollAwayHeader — non-sticky chrome: the leading control DETACHES and
          floats in the top-left corner (like `floatingClose`), pinned above the
          scroll body, while the title/topRight ride away with the content (row
          rendered inside Drawer.Content below). Closing therefore never scrolls
          out of reach. Rendered before Drawer.Content so it sits above via z-index.
        */}
        {scrollAwayHeader && renderLeading(clsx(styles.floatingClose, styles.floatingCloseChrome))}
        {hasChromeRow && !scrollAwayHeader && (
          <div
            className={clsx(
              styles.dragHandle,
              collapseHeader && styles.dragHandleCollapse,
              hasSubtitle && styles.dragHandleStacked,
              customNode != null && styles.dragHandleHeader
              // Заголовок ВСЕХ дроверов (нижних И боковых) центрируется по chrome-ряду
              // (просьба 2026-07-10). В боковом дровере ряд живёт внутри `.panel`
              // (edge-handle — отдельный flex-сосед), поэтому центр приходится на
              // видимую белую панель, кромка-хэндл исключена по построению. Бывший
              // left-align боковых (.dragHandleSideTitle, a7637b4b) снят; длинные
              // подписи теперь переносятся на 2 строки, а не жмутся у креста.
            )}
            data-scrolled={scrolled ? '' : undefined}
          >
            {/*
              Крест/стрелка — ОДИН примитив IconButton (tone="soft" bordered) в
              ведущей ячейке грида, тот же облик и размер (40), что у замыкающего
              контрола: хедер всегда «кнопка — заголовок — кнопка». Ячейка —
              обычный grid-item (НЕ absolute).
            */}
            <div className={clsx(styles.chromeCell, styles.chromeCellLead)}>
              {renderLeading(styles.leadingGlyph)}
            </div>
            {/*
              Center + trailing cells. Симметричные крайние треки грида
              (minmax(gutter,1fr)) держат центр-контент на геометрическом центре
              ряда независимо от ведущего креста. Exactly one Drawer.Title still
              exists — the sr-only one above (showVisibleTitle is false here).
            */}
            {headerCenter}
          </div>
        )}
        <Drawer.Content
          id="drawer-content-scrollable"
          ref={scrollerRef}
          className={clsx(
            styles.scrollableContent,
            lockBodyScroll && styles.scrollLockedBase,
            contentInset === 'none' && styles.contentInsetNone,
            contentInset === 'panel' && styles.contentInsetPanel,
            contentInset === 'sheet' && styles.contentInsetSheet,
            flushBodyPaddingTop && styles.flushBodyPaddingTop
          )}
          // Collapse-режим: прогресс сворочивания заголовка пишется из scrollTop
          // (enterAlways, useCollapsingHeader). Инертно в 'pin'/'scroll' — хук
          // early-return'ит, когда collapse выключен.
          onScroll={onCollapseScroll}
          // Нижний fade-растворение (scroll-edge-fade mask) включается ТОЛЬКО при
          // переполнении (moreBelow) И когда consumer его не отключил (scrollHints
          // false — короткие формы со своим footer, где fade размывал бы последний
          // ряд и читался как глюк). Верхний шов — `data-scrolled` на .dragHandle.
          data-more-below={scrollHints && moreBelow ? '' : undefined}
          // Touch swipe-to-close opts out of the scrollable body. For mouse/pen
          // Base UI already exempts `[data-drawer-content]`; for touch the only
          // hook is this attribute. Bottom drawers keep the default (swipe axis
          // == scroll axis, handled by Base UI's scroll-edge detection).
          data-base-ui-swipe-ignore={isSide ? '' : undefined}
        >
          {/*
            Верхний сентинел (шов заголовка) — ПЕРВЫЙ ребёнок, поэтому его parent =
            сам скроллер, который useScrollEdges берёт как observer-root. 1px +
            отрицательный margin ⇒ нулевой вклад в поток, не двигает первый ряд.
          */}
          <div ref={topSentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
          {/*
            Non-sticky header lives HERE — inside the scroller, right after the
            top sentinel — so it scrolls away with the body. No leading control
            (it floats above, rendered before Drawer.Content) and no scroll-seam
            (the row leaves rather than shadowing a pinned bar). `.dragHandleScroll`
            neutralises the row's edge insets, which the scroller's own padding
            already supplies.
          */}
          {scrollAwayHeader && (
            <div
              className={clsx(
                styles.dragHandle,
                styles.dragHandleScroll,
                hasSubtitle && styles.dragHandleStacked,
                customNode != null && styles.dragHandleHeader
              )}
            >
              {/*
                Ведущий контрол здесь плавает (.floatingCloseChrome), но его
                колонка должна остаться — заглушка того же размера, чтобы
                крайние auto-треки были равны и заголовок держал центр.
              */}
              <div className={clsx(styles.chromeCell, styles.chromeCellLead)}>
                <span className={styles.chromeSpacer} aria-hidden="true" />
              </div>
              {headerCenter}
            </div>
          )}
          {children}
          {/*
            Нижний сентинел (fade) — ПОСЛЕДНИЙ ребёнок: ушёл из вида ⇒ ниже есть
            контент ⇒ moreBelow. 1px + отрицательный margin ⇒ не добавляет хвост.
          */}
          <div ref={bottomSentinelRef} className={styles.scrollSentinelBottom} aria-hidden="true" />
        </Drawer.Content>
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </Drawer.Popup>
  );
};

export default DrawerLayout;
