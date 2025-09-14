import { useState, useRef, ReactNode, TouchEvent } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './Swipeable.module.scss';
import { Pages } from '@/components/blocks/builders/food/shared/ui/layout/Swipeable/Pages';

type Props = {
  children: ReactNode[]; // multiple pages
};

const Swipeable = ({ children }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startX.current !== null) {
      const deltaX = e.touches[0].clientX - startX.current;
      setOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (startX.current !== null && startTime.current !== null) {
      const deltaX = offset;
      const elapsed = Date.now() - startTime.current;
      const width = containerRef.current?.offsetWidth || 1;

      const isFast = elapsed < 250 && Math.abs(deltaX) > 125; // fast flick
      const isFar = Math.abs(deltaX) > width / 2; // long drag

      if ((isFast || isFar) && deltaX > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if ((isFast || isFar) && deltaX < 0 && currentIndex < children.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }

    setOffset(0);
    startX.current = null;
    startTime.current = null;
  };

  const goToPage = (index: number) => {
    setCurrentIndex(index);
  };

  const minDragToMoveScreen = 300;
  const width = containerRef.current?.offsetWidth || 1;

  const aimScreenPosition = (-currentIndex * 100) / children.length;

  const getLinearOffset = () => {
    let effectiveOffset = 0;

    if (offset < 0)
      effectiveOffset =
        Math.abs(offset) > minDragToMoveScreen
          ? offset - Math.sign(offset) * minDragToMoveScreen
          : 0;

    return (effectiveOffset / width) * 100;
  };

  const transformStyle = `translateX(${aimScreenPosition + getLinearOffset()}%)`;

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={styles.swipeWrapper}
          style={{
            transform: transformStyle,
            transition: offset === 0 ? 'transform 0.3s ease' : 'none',
            display: 'flex',
            width: `${children.length * 100}%`,
          }}
        >
          <Pages>{children}</Pages>
        </div>
      </div>

      {/* Tracker Dots */}
      <div className={styles.dots}>
        {children.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
            onClick={() => goToPage(i)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default observer(Swipeable);
