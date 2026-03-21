import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { useRef } from 'react';
import clsx from 'clsx';
import { Drawer as DrawerLib } from 'vaul';
import CrossIcon from '@/shared/assets/icons/cross.svg';

type Props = {
  children: React.ReactNode;
  topRight?: React.ReactNode;
  className?: string;
};

const DrawerLayout = ({ children, topRight, className }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <DrawerLib.Content className={clsx([styles.content, className])} id="drawer-content">
        <DrawerLib.Handle className={styles.dragHandle}>
          <div className={styles.handleBar}></div>
          <DrawerLib.Close
            className={clsx([
              styles.topLeft,
              styles.actionHeaderButton,
              styles.actionHeaderButton_back,
            ])}
            onClick={(e) => e.stopPropagation()}
          >
            <CrossIcon />
          </DrawerLib.Close>
          <div ref={topRightRef} className={clsx([styles.actionHeaderButton, styles.topRight])}>
            {topRight}
          </div>
        </DrawerLib.Handle>
        <div
          ref={scrollRef}
          id="drawer-content-scrollable"
          className={clsx([styles.scrollableContent])}
        >
          {children}
        </div>
      </DrawerLib.Content>
    </>
  );
};

export default observer(DrawerLayout);
