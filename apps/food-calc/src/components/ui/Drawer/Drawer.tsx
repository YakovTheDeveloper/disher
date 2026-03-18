import { drawerStore } from '@/shared/ui/drawer-store';
import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';
import { observer } from 'mobx-react';

type DrawerProps = {
  children: React.ReactNode;
};

export function Drawer({ children }: DrawerProps) {
  const isOpen = drawerStore.isDrawerOpen;

  const handleClose = () => {
    if (isOpen) {
      drawerStore.closeLast();
    }
  };

  return (
    <DrawerLib.Root
      open={isOpen}
      onClose={handleClose}
      direction="bottom"
      dismissible={true}
      closeThreshold={0.5}
      repositionInputs={false}
      container={document.getElementById('drawer-root')}
    >
      <DrawerLib.Portal>
        {children}
        <DrawerLib.Overlay
          className={styles.overlay}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            handleClose();
            e.stopPropagation();
          }}
        />
      </DrawerLib.Portal>
    </DrawerLib.Root>
  );
}

export default observer(Drawer);
