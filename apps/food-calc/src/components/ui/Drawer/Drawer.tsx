import { domainStore } from '@/store/store';
import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';
import { observer } from 'mobx-react';

type DrawerProps = {
  children: React.ReactNode;
};

export function Drawer({ children }: DrawerProps) {
  // useLockBodyScroll(open);

  const drawerStore = domainStore.globalUiStore.drawerStore;

  return (
    <DrawerLib.Root
      open={drawerStore.isOpen}
      onClose={drawerStore.close}
      fixed={true}
      direction="bottom"
      dismissible={true}
      closeThreshold={0.5}
      repositionInputs={false}
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
