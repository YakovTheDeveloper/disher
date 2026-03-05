import { domainStore } from '@/store/store';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';
import { observer } from 'mobx-react';
import { useEffect } from 'react';

type DrawerProps = {
  children: React.ReactNode;
};

export function Drawer({ children }: DrawerProps) {
  // useLockBodyScroll(open);

  const drawerStoreV2 = domainStore.globalUiStore.drawerStore;

  // Check both V2 and V3 stores for open state
  const isOpenV2 = drawerStoreV2.isOpen;
  const isOpenV3 = drawerStoreV3.isDrawerOpen;
  const isOpen = isOpenV2 || isOpenV3;

  // useEffect(() => {
  //   drawerStoreV2.syncFromUrl();

  //   const handlePopState = () => {
  //     drawerStoreV2.syncFromUrl();
  //   };

  //   window.addEventListener('popstate', handlePopState);
  //   return () => window.removeEventListener('popstate', handlePopState);
  // }, []);

  const handleClose = () => {
    // Close from V2 store
    if (isOpenV2) {
      drawerStoreV2.close();
    }
    // Close from V3 store (close last instance)
    if (isOpenV3) {
      drawerStoreV3.closeLast();
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
