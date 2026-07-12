import { createContext, useContext, type UIEvent } from 'react';
import type { useScrollEdges } from './useScrollEdges';

// Один экземпляр useScrollEdges на весь ModalShell, роздан вниз по дереву. Нужен,
// потому что в модалке верхний divider-шов и скролл-тело живут в РАЗНЫХ ветках:
// хедер (ModalHeader/ModalStepHeader) — сосед-выше скроллера, а `scrolled`
// рождается из сентинела ВНУТРИ .body. Сиблинг не прочитал бы состояние соседа,
// поэтому хук поднят в корень ModalShell, а оба ребёнка тянут из контекста: тело —
// refs+moreBelow (нижний fade), хедер — scrolled (верхний шов). Так дровер и
// модалка питаются от одного JS-механизма (useScrollEdges), без CSS scroll-state
// (Chrome-only — молчит на iOS Safari, а это PWA).
type ScrollEdges = ReturnType<typeof useScrollEdges>;

const ScrollEdgesContext = createContext<ScrollEdges | null>(null);

export const ScrollEdgesProvider = ScrollEdgesContext.Provider;

/** Null вне ModalShell (напр. standalone ModalHeader) — консумент деградирует
 *  без edge-аффордансов (шов/fade просто не появляются). */
export const useScrollEdgesContext = () => useContext(ScrollEdgesContext);

// ─── Collapsing-header координация (ModalShell) ──────────────────────────────
// В модалке заголовок (ModalHeader) и скроллер (ModalShell.Body) — СИБЛИНГИ под
// .wrapper, поэтому collapse не собрать на одном узле: onScroll нужен телу, а прогресс
// (`--header-collapse` на .wrapper) читает заголовок. Шелл поднимает useCollapsingHeader
// в корень и раздаёт через этот контекст: тело берёт `onScroll`, заголовок — `collapse`
// (класс + гашение шва). Тот же приём, что и с useScrollEdges выше.
export type HeaderCollapse = {
  /** collapse-режим активен → заголовок ужимается по мере скролла. */
  collapse: boolean;
  /** Хендлер скролл-тела, пишущий прогресс. Undefined вне collapse. */
  onScroll?: (e: UIEvent<HTMLElement>) => void;
};

const HeaderCollapseContext = createContext<HeaderCollapse>({ collapse: false });

export const HeaderCollapseProvider = HeaderCollapseContext.Provider;

/** Вне ModalShell — `{ collapse: false }` (заголовок ведёт себя как pinned). */
export const useHeaderCollapse = () => useContext(HeaderCollapseContext);
