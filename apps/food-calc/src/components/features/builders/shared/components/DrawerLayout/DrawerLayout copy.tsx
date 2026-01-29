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
  background: React.ReactNode;
};

const DrawerLayout = ({
  children,
  label,
  tabs,
  bottom,
  subHeader,
  topRight,
  className,
  background,
  footer2,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomKey = (bottom as any)?.type?.motionKey ?? 'default';
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    let lastHeight = window.visualViewport.height;
    document.documentElement.style.setProperty('--viewport-height', `${lastHeight}px`);

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport.height;
      setCurrentHeight(currentHeight);
      document.documentElement.style.setProperty('--viewport-height', `${currentHeight}px`);
      const isKeyboardOut = currentHeight < lastHeight - 150;
      const isKeyboardIn = currentHeight > lastHeight + 50;

      if (isKeyboardOut && !keyboardVisible) {
        setKeyboardVisible(true);
        console.log('true with height', currentHeight);
      } else if (isKeyboardIn && keyboardVisible) {
        setKeyboardVisible(false);
      }

      lastHeight = currentHeight;
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, [keyboardVisible]);

  return (
    <>
      <div className={styles.description}>
        <p className={styles.time}>12:00</p>
        <p className={styles.weight}>200 г.</p>
        {/* <p className={styles.foodName}>Курица гриль в соевом соусе</p> */}
        <p className={styles.foodName}>{currentHeight}</p>
      </div>
      <DrawerLib.Content
        className={clsx([styles.content, className, { [styles.keyboardVisible]: keyboardVisible }])}
        id="drawer-content"
      >
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

        {/* {subHeader && <header className={styles.subHeader}>{subHeader}</header>} */}

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
            className={styles.footer}
          >
            {bottom}
          </motion.div>
        </AnimatePresence>

        {background && <div className={clsx([styles.background])}>{background}</div>}

        {/* {footer2 && <div className={clsx([styles.footer])}>{footer2}</div>} */}
        {/* {tabs && <footer className={clsx([styles.footer2])}>{tabs}</footer>} */}
      </DrawerLib.Content>
    </>
  );
};

export default observer(DrawerLayout);
