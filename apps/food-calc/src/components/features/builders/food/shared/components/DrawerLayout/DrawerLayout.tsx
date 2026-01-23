import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { useRef, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Drawer as DrawerLib } from 'vaul';
import { AnimatePresence, motion } from 'framer-motion';
import CrossIcon from '@/assets/icons/cross.svg';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs?: React.ReactNode;
  subHeader?: React.ReactNode;
  topRight?: React.ReactNode;
  bottom?: React.ReactNode;
  footer2?: React.ReactNode;
  className?: string;
};

const DrawerLayout = ({
  children,
  label,
  tabs,
  bottom,
  subHeader,
  topRight,
  className,
  footer2,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomKey = (bottom as any)?.type?.motionKey ?? 'default';

  return (
    <DrawerLib.Content className={clsx([styles.content, className])} id="drawer-content">
      <DrawerLib.Handle className={styles.dragHandle}>
        <div className={styles.handleBar}></div>
        <DrawerLib.Close
          className={clsx([
            styles.topLeft,
            styles.actionHeaderButton,
            styles.actionHeaderButton_back,
          ])}
        >
          <CrossIcon />
        </DrawerLib.Close>
        <div ref={topRightRef} className={clsx([styles.actionHeaderButton, styles.topRight])}>
          {topRight}
        </div>
      </DrawerLib.Handle>

      {subHeader && <header className={styles.subHeader}>{subHeader}</header>}

      <div
        ref={scrollRef}
        id="drawer-content-scrollable"
        className={clsx([styles.scrollableContent])}
      >
        {children}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div
          ref={scrollRef}
          key={bottomKey}
          initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
          /* Использование более мягкой пружины для "органического" ощущения */
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 25,
            mass: 0.5, // делает анимацию легче и быстрее
          }}
          className={styles.bottom}
        >
          {bottom}
        </motion.div>
      </AnimatePresence>

      {tabs && <footer className={clsx([styles.footer])}>{tabs}</footer>}

      {footer2 && <div className={clsx([styles.footer2])}>{footer2}</div>}
    </DrawerLib.Content>
  );
};

export default observer(DrawerLayout);
