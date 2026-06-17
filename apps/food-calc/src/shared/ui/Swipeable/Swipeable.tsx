import React, { useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';

import useEmblaCarousel from 'embla-carousel-react';
import styles from './Swipeable.module.scss';
export type SwipeableRef = {
  goToPage: (index: number) => void;
};

type Props = {
  children: React.ReactNode[];
  onIndexChange?: (index: number, total: number) => void;
  hasDots?: boolean;
  image?: React.ReactNode;
  defaultSlide?: number;
  className?: string;
  /** Embla scroll duration. 0 = instant snap, ~25 = smooth swipe. */
  duration?: number;
};

const Swipeable = forwardRef<SwipeableRef, Props>(
  (
    {
      children,
      onIndexChange,
      hasDots = false,
      image,
      defaultSlide = 1,
      className,
      duration = 0,
    },
    ref
  ) => {
    const indexRef = useRef(defaultSlide);
    const dotsRef = useRef<HTMLDivElement>(null);

    const [emblaRefModal, emblaApi] = useEmblaCarousel(
      {
        loop: false,
        dragFree: false,
        // #5 — `'trimSnaps'` (Embla default) обрезает snap'ы по краям, чтобы
        // нельзя было перетащить контейнер в пустоту за первым/последним
        // слайдом. `false` давал over-drag с видимым пустым местом.
        containScroll: 'trimSnaps',
        duration,
        // #6 — `true`: Embla переснимает ширину слайда при ресайзе вьюпорта.
        // На iOS вьюпорт меняется постоянно (адресная строка Safari,
        // клавиатура, поворот); с `false` мерки устаревали → свайп доезжал
        // не до края. Мерка на маунте по-прежнему форсится rAF-reInit'ом ниже.
        watchResize: true,
        axis: 'x',
        // First paint = defaultSlide. Без startIndex Embla mount'ится на 0
        // и юзер видит slide 0 ~16ms перед тем как rAF effect ниже
        // прыгнет на defaultSlide (mount-flicker).
        startIndex: defaultSlide,
      },
      []
    );

    // Update dots via DOM directly — zero React re-renders
    const updateDots = useCallback((index: number) => {
      if (!dotsRef.current) return;
      const dots = dotsRef.current.children;
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle(styles.dotActive, i === index);
      }
    }, []);

    // Подписываемся на ОБА события — 'select' (target snap выбран) и
    // 'settle' (анимация завершена). `indexRef` дедупит вызовы:
    // `onIndexChange` стрельнет максимум один раз per реальная смена snap.
    //
    // Почему оба, а не только 'settle' (как было): при click → scrollTo,
    // если юзер прерывает анимацию свайпом, оригинальный 'settle' для
    // target'а scrollTo НЕ fires. `indexRef` остаётся stale, и финальный
    // 'settle' для drag-snap'а сравнивается с устаревшим значением →
    // `onIndexChange` не вызывается → state в parent рассинхронится с
    // Embla ("title События на экране Приемы пищи").
    //
    // 'select' fires при каждом изменении target snap'а (вкл. cancelled
    // scrollTo), поэтому indexRef обновляется вовремя.
    useEffect(() => {
      if (!emblaApi) return;
      const handleSnapChange = () => {
        const newIndex = emblaApi.selectedScrollSnap();
        if (newIndex !== indexRef.current) {
          indexRef.current = newIndex;
          onIndexChange?.(newIndex, children.length);
          updateDots(newIndex);
        }
      };
      emblaApi.on('select', handleSnapChange);
      emblaApi.on('settle', handleSnapChange);
      return () => {
        emblaApi.off('select', handleSnapChange);
        emblaApi.off('settle', handleSnapChange);
      };
    }, [emblaApi, onIndexChange, children.length, updateDots]);

    useImperativeHandle(ref, () => ({
      goToPage: (index: number) => emblaApi?.scrollTo(index),
    }));

    // `watchResize` ловит ПОЗДНИЕ ресайзы, но не первый кадр: при маунте
    // контейнер может ещё не достичь финального размера (route transition,
    // late-loading top panel) → слайды under-sized. Принудительно
    // переснимаем после первого paint'а, когда layout устоялся, и тогда же
    // прыгаем на defaultSlide — отдельного scrollTo до reInit'а не нужно,
    // мерки там всё равно ещё кривые.
    useEffect(() => {
      if (!emblaApi) return;
      const id = requestAnimationFrame(() => {
        emblaApi.reInit();
        if (defaultSlide > 0) {
          emblaApi.scrollTo(defaultSlide, true);
        }
      });
      return () => cancelAnimationFrame(id);
    }, [emblaApi, defaultSlide]);

    return (
      <div
        className={className ? `${styles.carouselWrapper} ${className}` : styles.carouselWrapper}
        data-carousel-container
      >
        <div className={styles.emblaViewport} ref={emblaRefModal}>
          <div className={styles.emblaContainer}>
            {image && (
              <div
                className={styles.background}
                style={{
                  width: `${children.length * 200}%`,
                }}
              >
                {image}
              </div>
            )}
            {children.map((slide, index) => (
              <div key={index} className={styles.emblaSlide} data-embla-slide="">
                <div className={styles.slideContent}>{slide}</div>
              </div>
            ))}
          </div>
        </div>

        {hasDots && (
          <div className={styles.dotsContainer} ref={dotsRef}>
            {children.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === defaultSlide ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

Swipeable.displayName = 'Swipeable';

export default Swipeable;
