import styles from './Drawer.module.scss';
import { Drawer as DrawerLib } from 'vaul';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  // useLockBodyScroll(open);

  return (
    <DrawerLib.Root
      open={open}
      onOpenChange={onOpenChange}
      fixed={true}
      direction="bottom"
      // dismissible={false}
      closeThreshold={0.5}
      repositionInputs={false}
      handleOnly
    >
      <DrawerLib.Portal>
        <DrawerLib.Overlay className={styles.overlay} />
        {children}
      </DrawerLib.Portal>
    </DrawerLib.Root>
  );
}

export default Drawer;
