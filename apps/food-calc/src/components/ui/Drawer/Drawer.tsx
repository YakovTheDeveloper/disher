import styles from './Drawer.module.scss';
import { observer } from 'mobx-react-lite';
import { Drawer as DrawerLib } from 'vaul';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return (
    <DrawerLib.Root
      open={open}
      onOpenChange={onOpenChange}
      fixed={true}
      direction="bottom"
      closeThreshold={0.1}
      handleOnly
    >
      <DrawerLib.Portal>
        <DrawerLib.Overlay className={styles.overlay} />

        <DrawerLib.Content className={styles.content}>
          <DrawerLib.Handle className={styles.dragHandle}>
            <div className={styles.handleBar}></div>
          </DrawerLib.Handle>
          <div className={styles.scrollable}>{children}</div>
        </DrawerLib.Content>
      </DrawerLib.Portal>
    </DrawerLib.Root>
  );
}

export default Drawer;
