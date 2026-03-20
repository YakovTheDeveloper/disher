import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import styles from './SwipeableCSS.module.scss';

export type SwipeableCSSRef = {
  goToPage: (index: number) => void;
};

type Props = {
  children: React.ReactNode[];
  onIndexChange?: (index: number, total: number) => void;
  hasDots?: boolean;
  defaultSlide?: number;
};

const SwipeableCSS = forwardRef<SwipeableCSSRef, Props>(
  ({ children, onIndexChange, hasDots = false, defaultSlide = 0 }, ref) => {
    const [activeIndex, setActiveIndex] = useState(defaultSlide);
    const viewportRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    const goToPage = useCallback(
      (index: number) => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        isScrollingRef.current = true;
        viewport.scrollTo({ left: index * viewport.clientWidth, behavior: 'smooth' });
      },
      []
    );

    useImperativeHandle(ref, () => ({ goToPage }));

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport || defaultSlide === 0) return;
      // instant scroll to default slide on mount
      viewport.scrollTo({ left: defaultSlide * viewport.clientWidth, behavior: 'instant' });
    }, []);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      let scrollTimer: ReturnType<typeof setTimeout>;

      const handleScroll = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
          if (index !== activeIndex) {
            setActiveIndex(index);
            onIndexChange?.(index, children.length);
          }
          isScrollingRef.current = false;
        }, 50);
      };

      viewport.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        viewport.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimer);
      };
    }, [activeIndex, onIndexChange, children.length]);

    return (
      <div className={styles.container}>
        <div className={styles.viewport} ref={viewportRef}>
          {children.map((slide, index) => (
            <div key={index} className={styles.slide}>
              <div className={styles.slideContent}>{slide}</div>
            </div>
          ))}
        </div>

        {hasDots && (
          <div className={styles.dotsContainer}>
            {children.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
                onClick={() => goToPage(idx)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

SwipeableCSS.displayName = 'SwipeableCSS';

export default SwipeableCSS;
