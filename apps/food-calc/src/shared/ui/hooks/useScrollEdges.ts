import { useCallback, useRef, useState } from 'react';

/**
 * Единый детектор краёв прокрутки для shell'ов (DrawerLayout / ModalShell).
 *
 * ОДИН механизм на все edge-аффордансы: и верхний divider-шов (заголовок ↔ тело),
 * и нижний fade-растворение, и нижний divider читают его состояние — поэтому они
 * не расходятся («то есть шов, то нет; то работает fade, то не работает»).
 *
 * Реализация — `IntersectionObserver` на двух zero-space сентинелах (первый/
 * последний ребёнок скролл-тела). Работает во ВСЕХ браузерах (Chrome, Safari
 * любой версии, Firefox), в отличие от CSS scroll-timeline / @container
 * scroll-state (Chrome-only), из-за которых аффордансы молчали на iOS Safari —
 * а это PWA на iOS. Тот же приём уже проверен в `useScrollBottomIndicator`.
 *
 * Шелл кладёт сентинелы внутрь скроллера и связывает состояние с атрибутами:
 *   - `data-scrolled`   ← `scrolled`  (тело прокручено вниз от верха) → верхний шов
 *   - `data-more-below` ← `moreBelow` (ниже видимой области есть контент) → нижний fade
 *
 * Оба сентинела опциональны: рендери только нужный край (модалке хватает нижнего),
 * root вычисляется от общего родителя-скроллера, отдельный ref на него не нужен —
 * это работает и с Base UI `Drawer.Content`, которому ref не прокинуть.
 */
export function useScrollEdges() {
  const [scrolled, setScrolled] = useState(false);
  const [moreBelow, setMoreBelow] = useState(false);
  // Сентинелы — CALLBACK-refs, а не RefObject: observer переподключается КАЖДЫЙ раз,
  // когда узел монтируется/размонтируется. Это принципиально для консументов, где
  // скролл-тело remount'ится под тем же useScrollEdges (SearchFood с `key={sessionKey}`
  // внутри непере-mount'ящегося ModalShell): при RefObject + `[]`-effect observer
  // навсегда висел на СТАРОМ, уже отсоединённом сентинеле, тот «не пересекается» →
  // scrolled залипал в true → divider-шов горел по умолчанию. Callback-ref чинит это
  // в корне (attach ровно на живой узел), заодно снимая гонку «effect до mount».
  const topObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomObserverRef = useRef<IntersectionObserver | null>(null);

  // Оба сентинела — прямые дети скроллера, поэтому его берём как observer-root.
  // Graceful degradation: нет IntersectionObserver (jsdom-тесты, SSR, древние
  // движки) → просто без edge-аффордансов. Fade/шов — чистый прогресс-энхансмент.
  const topSentinelRef = useCallback((node: HTMLDivElement | null) => {
    topObserverRef.current?.disconnect();
    topObserverRef.current = null;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const root = node.parentElement;
    if (!root) return;
    const o = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    o.observe(node);
    topObserverRef.current = o;
  }, []);

  const bottomSentinelRef = useCallback((node: HTMLDivElement | null) => {
    bottomObserverRef.current?.disconnect();
    bottomObserverRef.current = null;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const root = node.parentElement;
    if (!root) return;
    const o = new IntersectionObserver(
      ([entry]) => setMoreBelow(!entry.isIntersecting),
      // 24px pre-trigger: fade гаснет чуть раньше, чем последний ряд упрётся в
      // кромку, — без «щелчка» на самом последнем пикселе прокрутки.
      { root, threshold: 0, rootMargin: '0px 0px 24px 0px' },
    );
    o.observe(node);
    bottomObserverRef.current = o;
  }, []);

  return { topSentinelRef, bottomSentinelRef, scrolled, moreBelow };
}
