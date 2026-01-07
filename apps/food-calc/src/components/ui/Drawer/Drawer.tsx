import { emitter } from '@/infrastructure/emitter/emitter';
import styles from './Drawer.module.scss';
import { observer } from 'mobx-react-lite';
import { Drawer as DrawerLib } from 'vaul';
import { useEffect, useMemo, useRef } from 'react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

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
