import { observer } from 'mobx-react-lite';
import styles from './DrawerLayout.module.scss';
import { emitter } from '@/infrastructure/emitter/emitter';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { throttle } from 'lodash';
import { Drawer as DrawerLib } from 'vaul';

type Props = {
  children: React.ReactNode;
  label: React.ReactNode;
  tabs: React.ReactNode;
  subHeader?: React.ReactNode;
  bottom?: React.ReactNode;
};
const SCROLL_DELTA = 10; // px
const THROTTLE_MS = 50;

const DrawerLayout = ({ children, label, tabs, bottom, subHeader }: Props) => {
  const [headerShow, setHeaderShow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerVisible = useRef(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const show = () => setHeaderShow(true);
    const hide = () => setHeaderShow(false);

    emitter.on('HEADER_SHOW', show);
    emitter.on('HEADER_FORCE_SHOW', show);
    emitter.on('HEADER_HIDE', hide);

    return () => {
      emitter.off('HEADER_SHOW', show);
      emitter.off('HEADER_FORCE_SHOW', show);
      emitter.off('HEADER_HIDE', hide);
    };
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const overlayHeight = window.innerHeight - viewportHeight;
      document.documentElement.style.setProperty('--overlay-height', `${overlayHeight}px`);
    };

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight); // на случай старых браузеров
    updateHeight();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const handleScroll = useMemo(
    () =>
      throttle((event: React.UIEvent<HTMLDivElement>) => {
        if (scrollRef.current?.scrollTop < 50) {
          emitter.emit('HEADER_SHOW');

          return;
        }

        const y = event.currentTarget?.scrollTop;
        const diff = y - lastScrollY.current;

        // Всегда показываем хедер вверху
        if (y === 0) {
          if (!headerVisible.current) {
            headerVisible.current = true;
            emitter.emit('HEADER_FORCE_SHOW');
          }
          lastScrollY.current = 0;
          return;
        }

        // игнорим микро-скролл
        if (Math.abs(diff) < SCROLL_DELTA) return;

        if (diff > 0 && headerVisible.current) {
          headerVisible.current = false;
          emitter.emit('HEADER_HIDE');
        }

        if (diff < 0 && !headerVisible.current) {
          headerVisible.current = true;
          emitter.emit('HEADER_SHOW');
        }

        lastScrollY.current = y;
      }, THROTTLE_MS),
    []
  );

  return (
    <DrawerLib.Content className={styles.content} id="drawer-content">
      <DrawerLib.Handle className={styles.dragHandle}>
        <div className={styles.handleBar}></div>
        <button className={styles.closeButton}>x</button>
      </DrawerLib.Handle>

      <div className={styles.title}>{label}</div>
      <header className={clsx([styles.header, !headerShow && styles.hide])}>{tabs}</header>
      {subHeader && <header className={styles.subHeader}>{subHeader}</header>}

      <div
        onScroll={handleScroll}
        ref={scrollRef}
        id="drawer-content-scrollable"
        className={clsx([styles.container])}
      >
        {children}
      </div>

      {bottom && <div className={styles.supHeader}>{bottom}</div>}
    </DrawerLib.Content>
  );
};

export default observer(DrawerLayout);
