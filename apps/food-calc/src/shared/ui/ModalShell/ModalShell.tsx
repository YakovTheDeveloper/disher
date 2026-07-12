import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import s from './ModalShell.module.scss';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useScrollEdges } from '@/shared/ui/hooks/useScrollEdges';
import { useCollapsingHeader } from '@/shared/ui/hooks/useCollapsingHeader';
import {
  ScrollEdgesProvider,
  useScrollEdgesContext,
  HeaderCollapseProvider,
  useHeaderCollapse,
} from '@/shared/ui/hooks/scrollEdgesContext';

// Слот-сиблинг для фикс-бара actions ВНЕ скролл-тела. Нужен, потому что `.body`
// несёт fade-маску (scroll-edge-fade), а `mask` клипает ВЕСЬ свой субдерево —
// включая `position: fixed` CTA, если тот лежит внутри `.body`: его низ таял бы в
// нижней полосе фейда. Бар портируется в этот слот на уровне `.wrapper` — вне
// маски. Позиция не меняется: containing-block фикс-бара = `.wrapper` (заведён его
// `backdrop-filter`), а не `.body`, поэтому bottom:0 остаётся у низа модалки.
const FooterSlotContext = createContext<HTMLElement | null>(null);
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalHeader } from '@/shared/ui/ModalHeader';

// ── ModalShell tone — a single fixed monochrome ──────────────────────────────
// After the «great unification» (2026-06-19) ModalShell is no longer a switchable
// design-variant: it carries one fixed `mono` tone. The field/card/chip/list
// tokens (ModalShell.module.scss → field-chip-palette + card-palette) are published
// UNCONDITIONALLY on `:root`, so they cascade across EVERY page and through Base UI
// portals — no attribute, no JS (the single-position `data-modal-fields` gate was
// removed 2026-06-22). This replaced the old `data-surface` warm/lavender axis AND
// the earlier multi-variant law-giver.
//
// The wrapper's own ambient (wash + desaturated orbs) is baked into `.wrapper`
// directly (dev-форк `data-dv='ModalShell'` снят 2026-06-22 — был single-variant).
// The legacy `variant` prop is still ACCEPTED for source compatibility (~19 call
// sites pass variant="spring2"/etc.) but is fully ignored.
type Props = {
  children: ReactNode;
  className?: string;
  variant?: string;
  /**
   * Как заголовок (ModalShell.Header/StepHeader) реагирует на скролл тела:
   *   - `'pin'` — прилеплен на полном размере (legacy; здесь opt-out).
   *   - `'collapse'` (деф.) — прилеплен, но органично УЖИМАЕТСЯ по мере скролла вниз
   *     (iOS large-title / M3 LargeTopAppBar): заголовок и стрелка «назад» плавно
   *     уменьшаются, при скролле вверх раскрываются обратно (enterAlways). Стрелка
   *     остаётся на месте — закрытие не теряется. Работает с ТЕКУЩЕЙ композицией
   *     (header соседом над `ModalShell.Body`), консументу ничего перекладывать не надо.
   * (Уезжающий заголовок, `sticky={false}`, задаётся на самом ModalShell.Header —
   * там header кладут ВНУТРЬ Body; здесь это pinned-режимы, что координирует шелл.)
   */
  headerScroll?: 'pin' | 'collapse';
};

export const ModalShell = ({ children, className, headerScroll = 'collapse' }: Props) => {
  // Один useScrollEdges на весь шелл, роздан вниз через контекст: тело (.body)
  // берёт refs+moreBelow (нижний fade), хедер — scrolled (верхний divider-шов).
  // Хук поднят СЮДА, потому что хедер — сосед-выше скроллера и иначе не увидел бы
  // `scrolled`, рождённый сентинелом внутри .body (см. scrollEdgesContext).
  const edges = useScrollEdges();
  // Collapse: прогресс `--header-collapse` пишется на .wrapper (общий предок хедера
  // и тела) из onScroll тела. Хук инертен вне 'collapse' (early-return). Хедер и тело
  // — сиблинги, поэтому раздаём onScroll/режим через HeaderCollapseProvider.
  const collapse = headerScroll === 'collapse';
  const { targetRef: collapseRef, onScroll: onCollapseScroll } =
    useCollapsingHeader(collapse);
  // Узел слота для фикс-бара actions (см. FooterSlotContext). Через state, а не ref,
  // чтобы портал-консументы пере-отрендерились, когда узел смонтируется.
  const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);
  return (
    <ScrollEdgesProvider value={edges}>
      <HeaderCollapseProvider value={{ collapse, onScroll: onCollapseScroll }}>
      <FooterSlotContext.Provider value={footerSlot}>
        <div ref={collapseRef} className={`${s.wrapper} ${className ?? ''}`}>
          <div className={s.springOrbs} aria-hidden>
            <span className={`${s.orb} ${s.orb1}`} />
            <span className={`${s.orb} ${s.orb2}`} />
            <span className={`${s.orb} ${s.orb3}`} />
            <span className={`${s.orb} ${s.orb4}`} />
            <span className={`${s.orb} ${s.orb5}`} />
          </div>
          {children}
          {/* Сиблинг .body: сюда портируется фикс-бар actions, минуя fade-маску тела. */}
          <div ref={setFooterSlot} />
        </div>
      </FooterSlotContext.Provider>
      </HeaderCollapseProvider>
    </ScrollEdgesProvider>
  );
};

const ModalShellSpacer = () => <div className={s.spacer} />;
ModalShellSpacer.displayName = 'ModalShell.Spacer';

// Общий скролл-контейнер тела модалки. Тот же JS-механизм (useScrollEdges), что в
// DrawerLayout, — единый на оба шелла, чтобы аффордансы не расходились и работали
// во всех браузерах. Обе кромки: ВЕРХНИЙ сентинел (первый ребёнок) питает
// divider-шов под хедером (`scrolled` → data-scrolled на ModalHeader/.stepHeader),
// НИЖНИЙ (последний ребёнок) — fade-растворение (`data-more-below` включает маску
// только при переполнении). Состояние приходит из контекста ModalShell, а не из
// собственного хука, — иначе хедер-сосед не увидел бы `scrolled`.
const FadeScroller = ({ className, children }: { className: string; children: ReactNode }) => {
  // Деструктурируем как DrawerLayout — прямое ref-биндинг, а не member-access на
  // объекте (react-hooks/refs). Вне ModalShell (edges null) refs undefined:
  // сентинелы рендерятся как осиротевшие 1px-пробы, безвредно и не наблюдаются.
  const { topSentinelRef, bottomSentinelRef, moreBelow } = useScrollEdgesContext() ?? {};
  // Collapse: тело — источник scrollTop для сворачивания заголовка. onScroll
  // undefined вне 'collapse' → обычный неслушающий скроллер.
  const { onScroll } = useHeaderCollapse();
  return (
    <div className={className} data-more-below={moreBelow ? '' : undefined} onScroll={onScroll}>
      <div ref={topSentinelRef} className={s.scrollSentinelTop} aria-hidden="true" />
      {children}
      <div ref={bottomSentinelRef} className={s.scrollSentinel} aria-hidden="true" />
    </div>
  );
};

/** `flush` drops the default top padding — for bodies whose first child
 *  brings its own surface/spacing (e.g. the details-step plate).
 *  The side inset is owned SOLELY by ModalShell's `.wrapper`
 *  (--sys-inset-modal-fullscreen); the body carries no horizontal padding. */
const ModalShellBody = ({
  children,
  flush,
}: {
  children: ReactNode;
  flush?: boolean;
}) => (
  <FadeScroller className={`${s.body} ${flush ? s.bodyFlush : ''}`}>{children}</FadeScroller>
);
ModalShellBody.displayName = 'ModalShell.Body';

const ModalShellAtomsBody = ({ children }: Props) => (
  <FadeScroller className={s.atomsBody}>{children}</FadeScroller>
);
ModalShellAtomsBody.displayName = 'ModalShell.AtomsBody';

// The canonical Heading primitive carries the typography; ModalShell.Title
// adds the modal-tier layout (top offset, flex slot for a leading icon).
const ModalShellTitle = ({ children }: { children: ReactNode }) => (
  <Heading role="headline" as="h2" className={s.title}>
    {children}
  </Heading>
);
ModalShellTitle.displayName = 'ModalShell.Title';

// The Text primitive carries the typography (role="caption"); ModalShell.Hint
// adds only the modal-tier layout — a small gap tucked under the Title.
const ModalShellHint = ({ children }: { children: ReactNode }) => (
  <Text role="caption" className={s.hint}>
    {children}
  </Text>
);
ModalShellHint.displayName = 'ModalShell.Hint';

type ActionButtonsProps = {
  /** Primary Confirm — обязателен, когда footer рендерится. */
  right: ReactNode;
  /** Опциональный контекстный слот (НЕ «Назад»). Пуст → right на всю ширину. */
  left?: ReactNode;
  debugId?: string;
  /**
   * Два архетипа размещения actions (различие ЖИВЁТ в shell, не hand-roll в
   * каждой модалке):
   *   'keyboard-stick' (деф.) — полноэкранная модалка: бар `position: fixed`
   *      у низа вьюпорта, поднимается НАД экранной клавиатурой (useKeyboardStick).
   *      Требует `ModalShell.Spacer` в конце body (резерв прокрутки под фикс-бар).
   *   'flow' — модалка/панель, живущая ВНУТРИ дровера со своим скроллом: бар
   *      просто в КОНЦЕ потока (терминальный), без fixed и без keyboard-stick.
   *      Владеет своим терминальным зазором + hairline-разделителем + safe-area.
   */
  placement?: 'keyboard-stick' | 'flow';
};

const ModalShellActionButtons = ({
  left,
  right,
  debugId,
  placement = 'keyboard-stick',
}: ActionButtonsProps) => {
  const stick = placement === 'keyboard-stick';
  // 'flow' не цепляет visualViewport — бар статичен в потоке дровера.
  const ref = useKeyboardStick<HTMLDivElement>({ debugId, enabled: stick });
  const footerSlot = useContext(FooterSlotContext);

  const bar = (
    <div ref={ref} className={clsx(s.actionButtons, !stick && s.actionButtonsFlow)}>
      {left != null && <div className={s.actionButtonsSlotPrev}>{left}</div>}
      <div className={s.actionButtonsSlotNext}>{right}</div>
    </div>
  );

  // Keyboard-stick бар = position:fixed внутри .body → его клипала бы fade-маска
  // тела. Портируем в слот-сиблинг вне маски (позиция та же — containing-block =
  // .wrapper). 'flow'-бар в потоке дровера, маски не касается → рендерим на месте.
  // Fallback на месте, если слот ещё не смонтирован (первый тик) или его нет.
  return stick && footerSlot ? createPortal(bar, footerSlot) : bar;
};
ModalShellActionButtons.displayName = 'ModalShell.ActionButtons';

ModalShell.Spacer = ModalShellSpacer;
ModalShell.Body = ModalShellBody;
ModalShell.AtomsBody = ModalShellAtomsBody;
ModalShell.Title = ModalShellTitle;
ModalShell.Hint = ModalShellHint;
// Header pieces live under the ModalShell namespace so there is one entry
// point. `Header` — back + title; `StepHeader` — back + title + breadcrumbs.
ModalShell.Header = ModalHeader;
ModalShell.StepHeader = ModalStepHeader;
ModalShell.ActionButtons = ModalShellActionButtons;
