import { useDrawers } from '@/shared/ui/drawer-store';
import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';

type DrawerProps = {
  children: React.ReactNode;
};

export function Drawer({ children }: DrawerProps) {
  const { isOpen, closeLast } = useDrawers();

  const handleClose = () => {
    if (isOpen) {
      closeLast();
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

export default Drawer;
