import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import styles from './SwipeableV2.module.scss';

export type SwipeableRef = {
  goToPage: (index: number) => void;
};

type Props = {
  children: React.ReactNode[];
  onIndexChange?: (index: number, total: number) => void;
  hasDots?: boolean;
};

const SwipeableV2 = forwardRef<SwipeableRef, Props>(
  ({ children, onIndexChange, hasDots = false }, ref) => {
    const [selectedSlideModal, setSelectedSlideModal] = useState(0);
    const [emblaRefModal, emblaApi] = useEmblaCarousel(
      {
        loop: false,
        dragFree: false,
        containScroll: 'trimSnaps',
        duration: 30,
        watchResize: true,
        axis: 'x',
      },
      []
    );

    const handleModalSlideChange = useCallback(() => {
      if (!emblaApi) return;
      const newSlideIndex = emblaApi.selectedScrollSnap();
      setSelectedSlideModal(newSlideIndex);
      onIndexChange?.(newSlideIndex, children.length);
    }, [emblaApi, selectedSlideModal, onIndexChange, children.length]);

    React.useEffect(() => {
      if (!emblaApi) return;
      emblaApi.on('select', handleModalSlideChange);
      return () => {
        emblaApi.off('select', handleModalSlideChange);
      };
    }, [emblaApi, handleModalSlideChange]);

    useImperativeHandle(ref, () => ({
      goToPage: (index: number) => emblaApi?.scrollTo(index),
    }));

    return (
      <div className={styles.carouselWrapper} data-carousel-container>
        <div className={styles.emblaViewport} ref={emblaRefModal}>
          <div className={styles.emblaContainer}>
            {children.map((slide, index) => (
              <div key={index} className={styles.emblaSlide}>
                <div className={styles.slideContent}>{slide}</div>
              </div>
            ))}
          </div>
        </div>

        {hasDots && (
          <div className={styles.dotsContainer}>
            {children.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.dot} ${idx === selectedSlideModal ? styles.dotActive : ''}`}
                onClick={() => emblaApi?.scrollTo(idx)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

SwipeableV2.displayName = 'SwipeableV2';

export default SwipeableV2;
