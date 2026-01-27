import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { useRef } from 'react';
import clsx from 'clsx';
import { Drawer as DrawerLib } from 'vaul';
import { AnimatePresence, motion } from 'framer-motion';
import CrossIcon from '@/assets/icons/cross.svg';
import { emitter } from '@/infrastructure/emitter/emitter';
import { useKeyboardDetection } from './useKeyboardDetection';

type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs?: React.ReactNode;
  subHeader?: React.ReactNode;
  topRight?: React.ReactNode;
  bottom?: React.ReactNode;
  header?: React.ReactNode;
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
  header,
  topRight,
  className,
  background,
  footer2,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomKey = (bottom as any)?.type?.motionKey ?? 'default';

  // Use best practice keyboard detection hook
  const { keyboardVisible, keyboardHeight, currentHeight } = useKeyboardDetection();

  return (
    <>
      <DrawerLib.Content
        className={clsx([styles.content, className, { [styles.keyboardVisible]: keyboardVisible }])}
        id="drawer-content"
      >
        <DrawerLib.Handle className={styles.dragHandle}>
          <div className={styles.handleBar}></div>
          {/* <span style={{ fontSize: '30px', marginLeft: '4px', color: 'white' }}>
            {keyboardVisible ? '⌨️ ON' : '⌨️ OFF'}
          </span> */}
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
        <header className={styles.header}>{header}</header>
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
        {/* Debug: Show keyboard metrics */}

        {background && <div className={clsx([styles.background])}>{background}</div>}

        {/* {footer2 && <div className={clsx([styles.footer])}>{footer2}</div>} */}
        {/* {tabs && <footer className={clsx([styles.footer2])}>{tabs}</footer>} */}
      </DrawerLib.Content>
    </>
  );
};

export default observer(DrawerLayout);

// <div
//   className={styles.debug}
//   style={{
//     position: 'absolute',
//     top: '50%',
//     transform: 'translateY(-50%)',
//     right: '60px',
//     fontSize: '12px',
//     color: '#666',
//     whiteSpace: 'nowrap',
//   }}
// >
//   {/* {window.isSecureContext ? 'Secure' : 'Insecure'} */}
//   {/* {'virtualKeyboard' in navigator ? 'virtualKeyboard' : 'no virtualKeyboard'} */}
//   KB: {keyboardHeight}px | H: {currentHeight}px Свойство:{' '}
//   {document.documentElement.style['keyboard-height']}
// </div>
