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
        containScroll: false,
        duration,
        watchResize: false,
        axis: 'x',
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

    // 'settle' fires AFTER animation ends — no re-render mid-drag
    useEffect(() => {
      if (!emblaApi) return;
      const onSettle = () => {
        const newIndex = emblaApi.selectedScrollSnap();
        if (newIndex !== indexRef.current) {
          indexRef.current = newIndex;
          onIndexChange?.(newIndex, children.length);
          updateDots(newIndex);
        }
      };
      // Also update on select for dots responsiveness, but without React state
      const onSelect = () => {
        updateDots(emblaApi.selectedScrollSnap());
      };
      emblaApi.on('settle', onSettle);
      emblaApi.on('select', onSelect);
      return () => {
        emblaApi.off('settle', onSettle);
        emblaApi.off('select', onSelect);
      };
    }, [emblaApi, onIndexChange, children.length, updateDots]);

    useImperativeHandle(ref, () => ({
      goToPage: (index: number) => emblaApi?.scrollTo(index),
    }));

    useEffect(() => {
      if (emblaApi && defaultSlide > 0) {
        emblaApi.scrollTo(defaultSlide, true);
      }
    }, [emblaApi, defaultSlide]);

    // Embla measures slide width once at mount with watchResize:false.
    // If the container hasn't reached its final size yet (route transition,
    // late-loading top panel), slides end up under-sized. Re-measure after
    // the first paint when layout is settled.
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
              <div key={index} className={styles.emblaSlide}>
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
