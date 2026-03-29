import React, {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react';

import useEmblaCarousel from 'embla-carousel-react';
import styles from './SwipeableV2.module.scss';
import { SwipeableLockContext } from './SwipeableLockContext';
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
};

const SwipeableV2 = forwardRef<SwipeableRef, Props>(
  ({ children, onIndexChange, hasDots = false, image, defaultSlide = 1, className }, ref) => {
    const indexRef = useRef(defaultSlide);
    const dotsRef = useRef<HTMLDivElement>(null);
    const lockCountRef = useRef(0);
    const emblaApiRef = useRef<ReturnType<typeof useEmblaCarousel>[1]>(null);

    const lock = useCallback(() => {
      lockCountRef.current++;
      emblaApiRef.current?.reInit({ watchDrag: false });
    }, []);
    const unlock = useCallback(() => {
      lockCountRef.current = Math.max(0, lockCountRef.current - 1);
      if (lockCountRef.current === 0) {
        emblaApiRef.current?.reInit({ watchDrag: true });
      }
    }, []);

    const [emblaRefModal, emblaApi] = useEmblaCarousel(
      {
        loop: false,
        dragFree: false,
        containScroll: false,
        duration: 0,
        watchResize: false,
        axis: 'x',
      },
      []
    );
    emblaApiRef.current = emblaApi;

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

    return (
      <SwipeableLockContext.Provider value={{ lock, unlock }}>
        <div className={className ? `${styles.carouselWrapper} ${className}` : styles.carouselWrapper} data-carousel-container>
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
                  onClick={() => emblaApi?.scrollTo(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </SwipeableLockContext.Provider>
    );
  }
);

SwipeableV2.displayName = 'SwipeableV2';

export default SwipeableV2;
