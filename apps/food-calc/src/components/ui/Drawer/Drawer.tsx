import { domainStore } from '@/store/store';
import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';
import { observer } from 'mobx-react';
import { useEffect } from 'react';

type DrawerProps = {
  children: React.ReactNode;
};

export function Drawer({ children }: DrawerProps) {
  // useLockBodyScroll(open);

  const drawerStore = domainStore.globalUiStore.drawerStore;

  useEffect(() => {
    drawerStore.syncFromUrl();

    const handlePopState = () => {
      drawerStore.syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <DrawerLib.Root
      open={drawerStore.isOpen}
      onClose={drawerStore.close}
      fixed={true}
      direction="bottom"
      dismissible={true}
      closeThreshold={0.5}
      repositionInputs={true}
      handleOnly
    >
      <DrawerLib.Portal container={document.getElementById('drawer-root')}>
        <DrawerLib.Overlay className={styles.overlay} />
        {children}
      </DrawerLib.Portal>
    </DrawerLib.Root>
  );
}

export default observer(Drawer);
