import { useCallback, useEffect, useRef } from 'react';

// Сколько пикселей прокрутки ВНИЗ сворачивают заголовок до конца. ~высота одного
// ряда — заголовок ужимается за первый «экранный шаг», дальше держится сжатым.
const COLLAPSE_DISTANCE = 72;

/**
 * quick-return (enterAlways) collapsing-header — Material CoordinatorLayout
 * `enterAlways`, НЕ iOS large-title. Разница принципиальная: iOS large-title —
 * position-anchored (сворачивается за первые N px и ДЕРЖИТСЯ мелким до самого
 * верха, скролл вверх в середине его не раскрывает). Здесь — enterAlways: копится
 * ДЕЛЬТА скролла, поэтому скролл ВВЕРХ в ЛЮБОЙ точке пропорционально раскрывает
 * (место возвращается при развороте жеста), а касание самого верха форсит полный
 * раскрыт.
 *
 * Ведёт CSS-переменную `--header-collapse` (0 = раскрыт … 1 = сжат) на `targetRef`
 * из `onScroll` скролл-контейнера. Прогресс пишется через ref ВНУТРИ rAF-кадра, НЕ
 * через React-state — без ре-рендера на каждый кадр скролла. Потребители анимируют
 * ТОЛЬКО `transform` (масштаб заголовка/глифа) — composite, 0 reflow; height/padding
 * НЕ трогают (решение 2026-07-12: плавность важнее возврата места — transform места
 * телу не отдаёт, это косметическое «оседание»). Сама величина рваная (rAF квантует,
 * аккумулятор скачет на смене направления), поэтому потребители НАМЕРЕННО демпфируют её
 * коротким CSS-`transition: 120ms` — на composite-свойстве идёт на компоситоре, почти
 * бесплатно (снятие 2026-07-12 дало сырое дёрганье, вернули).
 *
 * На JS (а не CSS scroll-timeline / `scroll()`), чтобы работать на iOS Safari < 26 —
 * та же доктрина, что у fade/шва (useScrollEdges): CSS scroll-driven путь молчит на
 * СТАРОМ WebKit, а это PWA на iOS. (Safari 26.4 везёт threaded scroll-driven
 * animations off-main-thread — кандидат на @supports-ветку, отдельным заходом.)
 *
 * Заголовок при этом ОСТАЁТСЯ прилепленным (pinned-ряд/overlay) — он не уезжает, а
 * ужимается, поэтому крест/стрелка «назад» никогда не теряются.
 */
export function useCollapsingHeader<T extends HTMLElement = HTMLDivElement>(
  enabled: boolean,
) {
  const targetRef = useRef<T | null>(null);
  // Накопленный офсет сворачивания, зажатый в [0, COLLAPSE_DISTANCE]. Именно
  // накопление (а не сырой scrollTop) даёт enterAlways: раскрытие на скролл ВВЕРХ
  // в любой точке контента, а не только у самого верха.
  const offsetRef = useRef(0);
  const lastTopRef = useRef(0);
  const rafRef = useRef(0);
  // Последнее ЗАПИСАННОЕ (округлённое) значение — чтобы не дёргать setProperty, когда
  // прогресс не изменился: сатурирован на 1 (листаешь длинный список ужатой шапкой)
  // или на 0 (у верха). -1 = «ещё не писали», первый кадр всегда проходит.
  const lastWrittenRef = useRef(-1);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      if (!enabled) return;
      const top = e.currentTarget.scrollTop;
      const delta = top - lastTopRef.current;
      lastTopRef.current = top;
      // У самого верха — всегда полностью раскрыт (возврат к origin = origin вид).
      let next = top <= 0 ? 0 : offsetRef.current + delta;
      if (next < 0) next = 0;
      else if (next > COLLAPSE_DISTANCE) next = COLLAPSE_DISTANCE;
      offsetRef.current = next;
      // Коалесцируем несколько scroll-событий в один кадр — пишем var раз за rAF.
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        // Округляем до 3 знаков: чистит бесконечные 0.3333… в devtools И схлопывает
        // соседние микрокадры в одно значение → сторож ниже чаще срабатывает. 0.001
        // прогресса = субпиксель, за гранью восприятия.
        const progress =
          Math.round((offsetRef.current / COLLAPSE_DISTANCE) * 1000) / 1000;
        if (progress === lastWrittenRef.current) return;
        lastWrittenRef.current = progress;
        targetRef.current?.style.setProperty('--header-collapse', String(progress));
      });
    },
    [enabled],
  );

  // Отменяем повисший кадр на размонтировании. И при выключении режима — сбрасываем
  // накопление + переменную в 0, иначе полоса «застрянет» ужатой, если consumer
  // когда-нибудь снимет `enabled` в рантайме (сейчас режим статичен per-mount, но
  // без этого сброса будущий динамический headerScroll оставил бы stale-collapse).
  useEffect(() => {
    if (enabled) return;
    offsetRef.current = 0;
    lastTopRef.current = 0;
    lastWrittenRef.current = 0;
    targetRef.current?.style.setProperty('--header-collapse', '0');
  }, [enabled]);
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { targetRef, onScroll };
}
