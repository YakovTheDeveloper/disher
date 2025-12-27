import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { useEffect, useRef, useState } from 'react';
import 'swiper/css';
import { observer } from 'mobx-react-lite';
import styles from './Swipeable.module.scss';

type Props = {
  defaultIndex?: number;
  onIndexChange?: (index: number, total: number) => void;
  children: React.ReactNode[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const Swipeable = ({ defaultIndex = 0, onIndexChange, children }: Props) => {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const total = children.length;

  // 🧠 внутреннее состояние
  const [activeIndex, setActiveIndex] = useState(() => clamp(defaultIndex, 0, total - 1));

  // 🔗 sync state → swiper
  useEffect(() => {
    if (!swiperRef.current) return;
    if (swiperRef.current.activeIndex === activeIndex) return;

    swiperRef.current.slideTo(activeIndex);
  }, [activeIndex]);

  return (
    <Swiper
      slidesPerView={1}
      resistanceRatio={0}
      touchReleaseOnEdges
      threshold={10}
      speed={280}
      grabCursor={false}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        swiper.slideTo(activeIndex, 0);
      }}
      onSlideChange={(swiper) => {
        const next = clamp(swiper.activeIndex, 0, total - 1);
        setActiveIndex(next);
        onIndexChange?.(next, total);
      }}
    >
      {children.map((child, i) => (
        <SwiperSlide key={i} className={styles.slide}>
          {child}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default observer(Swipeable);
