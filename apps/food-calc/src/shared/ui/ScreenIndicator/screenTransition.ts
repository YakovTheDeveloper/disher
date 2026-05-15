import { flushSync } from 'react-dom';

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

// Сохранён ради обратной совместимости с DishBuilderPage. В HomePage
// больше не используется: tiles анимируются только opacity-transition'ом.
// Живёт в отдельном файле, а не в ScreenIndicator.tsx — иначе non-component
// value-экспорт ломает Fast Refresh всего модуля.
export const runTileMigration = (
  prevIdx: number,
  idx: number,
  commit: () => void,
): void => {
  const startVT = (document as DocWithVT).startViewTransition;
  if (idx === prevIdx || typeof startVT !== 'function') {
    commit();
    return;
  }
  startVT.call(document, () => {
    flushSync(commit);
  });
};
