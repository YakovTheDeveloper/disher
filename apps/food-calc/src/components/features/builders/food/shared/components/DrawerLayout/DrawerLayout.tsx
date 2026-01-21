import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { useRef } from 'react';
import clsx from 'clsx';
import { Drawer as DrawerLib } from 'vaul';
import ArrowLeftIcon from '@/assets/icons/arrowLeftLong.svg';

type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs?: React.ReactNode;
  subHeader?: React.ReactNode;
  topRight?: React.ReactNode;
  bottom?: React.ReactNode;
  className?: string;
};

const DrawerLayout = ({ children, label, tabs, bottom, subHeader, topRight, className }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <DrawerLib.Content className={clsx([styles.content, className])} id="drawer-content">
      <DrawerLib.Handle className={styles.dragHandle}>
        <div className={styles.title}>{label}</div>

        <div className={styles.handleBar}></div>
        <DrawerLib.Close
          className={clsx([
            styles.topLeft,
            styles.actionHeaderButton,
            styles.actionHeaderButton_back,
          ])}
        >
          <ArrowLeftIcon />
        </DrawerLib.Close>
        <div className={clsx([styles.actionHeaderButton, styles.topRight])}>{topRight}</div>
      </DrawerLib.Handle>

      {subHeader && <header className={styles.subHeader}>{subHeader}</header>}

      <div
        ref={scrollRef}
        id="drawer-content-scrollable"
        className={clsx([styles.scrollableContent])}
      >
        {children}
      </div>

      {tabs && <footer className={clsx([styles.footer])}>{tabs}</footer>}

      {bottom && <div className={styles.supHeader}>{bottom}</div>}
    </DrawerLib.Content>
  );
};

export default observer(DrawerLayout);
