import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Drawer } from '@base-ui/react/drawer';
import { useDrawers } from '@/shared/ui/drawer-store';
import { DrawerSideProvider, DrawerSnapProvider } from '@/shared/ui/DrawerLayout';
import type { ResolvedDrawerOptions } from '@/shared/ui/overlay-types';
import overlayStyles from '@/shared/ui/Drawer/Drawer.module.scss';

type DrawerInstanceProps = {
  id: string;
  Component: React.ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
  phase: string;
  options: ResolvedDrawerOptions;
  container: HTMLElement | null;
  close: (id: string, result?: unknown) => void;
  finishClose: (id: string) => void;
};

const DrawerInstance = ({
  id,
  Component,
  props,
  phase,
  options,
  container,
  close,
  finishClose,
}: DrawerInstanceProps) => {
  // Two-phase sheets are a BOTTOM-only affordance (side drawers have no
  // vertical snap axis). Base UI defaults the opening point to the first entry
  // when `defaultSnapPoint` is omitted; we pass it explicitly so the resolved
  // options stay the single source of truth.
  const snapPoints =
    options.side === 'bottom' && options.snapPoints?.length ? options.snapPoints : undefined;
  const defaultSnapPoint = snapPoints ? options.defaultSnapPoint ?? snapPoints[0] : undefined;

  // Живая активная фаза: Base UI onSnapPointChange НЕ стреляет на инициализации,
  // поэтому стартуем с defaultSnapPoint. `atTopSnap` гейтит внутренний скролл
  // тела (см. DrawerSnapContext) — на нижней фазе скролл выключен, чтобы драг по
  // контенту разворачивал лист, а не листал.
  const [activeSnap, setActiveSnap] = useState<number | string | null | undefined>(defaultSnapPoint);
  const atTopSnap = snapPoints ? activeSnap === snapPoints[snapPoints.length - 1] : true;

  // Тап по grab-handle разворачивает/сворачивает лист. Контролируем `snapPoint`
  // (Base UI поддерживает controlled snap): drag по-прежнему пишет фазу через
  // onSnapPointChange, а тап — императивно ставит верхнюю/базовую точку.
  const toggleSnap = useCallback(() => {
    if (!snapPoints) return;
    setActiveSnap((prev) =>
      prev === snapPoints[snapPoints.length - 1] ? snapPoints[0] : snapPoints[snapPoints.length - 1],
    );
  }, [snapPoints]);

  return (
    <Drawer.Root
      open={phase === 'open'}
      snapPoints={snapPoints}
      snapPoint={activeSnap}
      onSnapPointChange={(value) => setActiveSnap(value)}
      // `trap-focus` сохраняет focus management для a11y, но отключает
      // body scroll-lock (position: fixed на html/body). На iOS Safari
      // scroll-lock форсит full-document reflow при первом open и
      // блокирует main thread → 1s cold-start lag, см. vaul#318/#622.
      // `trapFocus: false` (ItemActionsDrawer) снимает и focus-trap → medal
      // `<label htmlFor>` может делегировать фокус edit-инпуту вне портала.
      modal={options.trapFocus === false ? false : 'trap-focus'}
      // Swipe-to-dismiss direction follows the anchor edge: bottom drawers
      // swipe down, side drawers swipe toward their own edge.
      swipeDirection={options.side === 'bottom' ? 'down' : options.side}
      onOpenChange={(open) => {
        if (!open) close(id);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) finishClose(id);
      }}
    >
      <Drawer.Portal container={container}>
        {/* `interactiveBehind` → click-through backdrop (pointer-events:none):
            страница под дровером принимает жесты (hero-обложка под
            WallpaperDrawer — pan/zoom). Скрим при этом не убран, а ослаблен втрое
            (.clickThrough) — снятие pointer-events, не прозрачность, и есть
            несущая половина click-through. */}
        <Drawer.Backdrop
          className={clsx(
            overlayStyles.overlay,
            options.interactiveBehind && overlayStyles.clickThrough,
          )}
        />
        <Drawer.Viewport className={overlayStyles.viewport}>
          <DrawerSideProvider value={options}>
            <DrawerSnapProvider
              value={{ atTopSnap, canExpand: !!snapPoints, toggleSnap: snapPoints ? toggleSnap : undefined }}
            >
              <Component {...props} onClose={(result: unknown) => close(id, result)} />
            </DrawerSnapProvider>
          </DrawerSideProvider>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const DrawerManager = () => {
  const { instances, close, finishClose } = useDrawers();
  const container = useMemo(
    () => (typeof document !== 'undefined' ? document.getElementById('drawer-root') : null),
    [],
  );

  if (instances.length === 0) return null;

  return (
    <>
      {instances.map(({ id, Component, props, phase, options }) => (
        <DrawerInstance
          key={id}
          id={id}
          Component={Component as React.ComponentType<Record<string, unknown>>}
          props={props as Record<string, unknown>}
          phase={phase}
          options={options}
          container={container}
          close={close}
          finishClose={finishClose}
        />
      ))}
    </>
  );
};

export default DrawerManager;
