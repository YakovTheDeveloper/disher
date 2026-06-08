import { useEffect } from 'react';
import { useNavigate, useViewTransitionState } from 'react-router';
import type { NavigateFunction } from 'react-router';

// RR-native view-transition навигация со scoped-раскадровкой (стандарт RR 2026).
//
// `navigate(to, { viewTransition: true })` — React Router сам оборачивает
// навигацию в document.startViewTransition и КОРРЕКТНО дожидается коммита нового
// роута. Никаких ручных startViewTransition / flushSync / requestAnimationFrame —
// они снимали new-снимок до отрисовки нового вида и ломали анимацию.
//
// У RR нет встроенных «типов» перехода, поэтому раскадровку под КОНКРЕТНУЮ
// навигацию выбираем атрибутом `html[data-vt-type]`: ставим перед navigate, CSS
// читает напр. `html[data-vt-type='cover']::view-transition-new(root)`. Без
// поддержки API navigate просто меняет роут (progressive enhancement);
// `prefers-reduced-motion` глушит анимацию в CSS.
//
// Очистка `data-vt-type` — глобальная (см. installViewTransitionCleanup): атрибут
// снимается на `transition.finished` любого VT. Эффект ниже — подстраховка для
// случая, когда VT не запустился (нет API) и триггер ещё смонтирован.

// Текущий URL (origin для back). `state.from` пишем на КАЖДОМ forward-переходе,
// чтобы BackButton на цели вернул точно туда, откуда пришли (а не на голый /).
function currentPath(): string {
  return window.location.pathname + window.location.search;
}

export function useViewTransitionNavigate(
  to: string,
  type: string,
  options?: { state?: unknown },
): () => void {
  const navigate = useNavigate();
  const isTransitioning = useViewTransitionState(to);

  useEffect(() => {
    if (!isTransitioning && document.documentElement.dataset.vtType === type) {
      delete document.documentElement.dataset.vtType;
    }
  }, [isTransitioning, type]);

  return () => {
    document.documentElement.dataset.vtType = type;
    const callerState = (options?.state ?? {}) as Record<string, unknown>;
    navigate(to, { viewTransition: true, state: { from: currentPath(), ...callerState } });
  };
}

// Императивный близнец хука для НЕ-компонентных точек входа (drawer-actions,
// toaster, кнопки в модалках) — там нет хука/компонента, который поставит
// раскадровку. Ставит `data-vt-type` + пушит с origin в `state.from`. Чистку
// атрибута делает installViewTransitionCleanup глобально.
export function pushNavigate(navigate: NavigateFunction, to: string, type: string): void {
  document.documentElement.dataset.vtType = type;
  navigate(to, { viewTransition: true, state: { from: currentPath() } });
}

// `data-vt-type` ставится прямо перед навигацией (хук и pushNavigate). Хук чистит
// его сам, но императивным сайтам чистить некому. Оборачиваем
// document.startViewTransition ОДИН раз: RR зовёт его для каждой
// viewTransition:true-навигации, поэтому снять атрибут на `transition.finished`
// надёжно покрывает оба пути и убирает «протечку» раскадровки на следующий
// переход. Идемпотентно; no-op там, где API нет (без VT атрибут инертен).
type ViewTransitionLike = { finished?: Promise<unknown> };
type StartViewTransition = (callback?: () => void | Promise<void>) => ViewTransitionLike;

export function installViewTransitionCleanup(): void {
  if (typeof document === 'undefined') return;
  const doc = document as unknown as {
    startViewTransition?: StartViewTransition;
    __vtCleanupInstalled?: boolean;
  };
  if (doc.__vtCleanupInstalled || typeof doc.startViewTransition !== 'function') return;
  doc.__vtCleanupInstalled = true;
  const orig = doc.startViewTransition.bind(doc);
  doc.startViewTransition = (callback) => {
    const transition = orig(callback);
    void transition?.finished?.finally(() => {
      delete document.documentElement.dataset.vtType;
    });
    return transition;
  };
}
