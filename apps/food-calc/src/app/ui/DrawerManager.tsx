import { useMemo } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useDrawers } from '@/shared/ui/drawer-store';
import overlayStyles from '@/shared/ui/Drawer/Drawer.module.scss';

const DrawerManager = () => {
  const { instances, close, finishClose } = useDrawers();
  const container = useMemo(
    () => (typeof document !== 'undefined' ? document.getElementById('drawer-root') : null),
    [],
  );

  if (instances.length === 0) return null;

  return (
    <>
      {instances.map(({ id, Component, props, phase }) => (
        <Drawer.Root
          key={id}
          open={phase === 'open'}
          // `trap-focus` сохраняет focus management для a11y, но отключает
          // body scroll-lock (position: fixed на html/body). На iOS Safari
          // scroll-lock форсит full-document reflow при первом open и
          // блокирует main thread → 1s cold-start lag, см. vaul#318/#622.
          modal="trap-focus"
          onOpenChange={(open) => {
            if (!open) close(id);
          }}
          onOpenChangeComplete={(open) => {
            if (!open) finishClose(id);
          }}
        >
          <Drawer.Portal container={container}>
            <Drawer.Backdrop className={overlayStyles.overlay} />
            <Drawer.Viewport>
              <Component {...props} onClose={(result: unknown) => close(id, result)} />
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      ))}
    </>
  );
};

export default DrawerManager;
