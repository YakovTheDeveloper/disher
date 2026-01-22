import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { Drawer as DrawerLib } from 'vaul';
import { AnimatePresence, motion } from 'framer-motion';
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
  const bottomKey = (bottom as any)?.type?.motionKey ?? 'default';
  const [isFooterHidden, setIsFooterHidden] = useState(false);

  useEffect(() => {
    const scrollableDiv = scrollRef.current;
    if (scrollableDiv) {
      const handleFocus = () => {
        const activeElement = document.activeElement;
        const isInputFocused = Boolean(
          activeElement &&
            (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
            scrollableDiv.contains(activeElement)
        );
        setIsFooterHidden(isInputFocused);
      };

      scrollableDiv.addEventListener('focusin', handleFocus);
      scrollableDiv.addEventListener('focusout', () => setTimeout(handleFocus, 0));

      return () => {
        scrollableDiv.removeEventListener('focusin', handleFocus);
        scrollableDiv.removeEventListener('focusout', () => setTimeout(handleFocus, 0));
      };
    }
  }, []);

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

      <div id="drawer-content-scrollable" className={clsx([styles.scrollableContent])}>
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
          className={styles.supHeader}
        >
          {bottom}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {tabs && !isFooterHidden && (
          <motion.footer
            key="footer"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx([styles.footer])}
          >
            {tabs}
          </motion.footer>
        )}
      </AnimatePresence>
    </DrawerLib.Content>
  );
};

export default observer(DrawerLayout);
