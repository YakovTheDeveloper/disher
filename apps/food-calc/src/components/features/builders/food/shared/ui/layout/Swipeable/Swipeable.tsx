import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'swiper/css';
import { observer } from 'mobx-react-lite';
import styles from './Swipeable.module.scss';

type Props = {
  pageNames: string[];
  defaultIndex?: number;
  onIndexChange?: (index: number, total: number) => void;
  enableHashSync?: boolean;
  children: React.ReactNode[];
  style?: React.CSSProperties;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const Swipeable = ({
  pageNames,
  defaultIndex = 0,
  onIndexChange,
  enableHashSync = true,
  children,
  style,
}: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const total = children.length;

  if (pageNames.length !== total) {
    throw new Error('pageNames length must match the number of children');
  }

  const getInitialIndex = () => {
    if (enableHashSync) {
      const hashValue = location.hash.substring(1);
      if (hashValue) {
        const index = pageNames.indexOf(hashValue);
        if (index !== -1) {
          return clamp(index, 0, total - 1);
        }
      }
    }
    return clamp(defaultIndex, 0, total - 1);
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);

  useEffect(() => {
    if (!swiperRef.current) return;
    if (swiperRef.current.activeIndex === activeIndex) return;

    swiperRef.current.slideTo(activeIndex);
  }, [activeIndex]);

  return (
    <Swiper
      className={styles.swiper}
      style={style}
      slidesPerView={1}
      resistanceRatio={0}
      touchReleaseOnEdges
      threshold={10}
      speed={280}
      observer
      observeParents
      grabCursor={false}
      autoHeight={false}
      height={undefined}
      wrapperClass={styles.wrapper}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        swiper.slideTo(activeIndex, 0);
      }}
      onSlideChange={(swiper) => {
        const next = clamp(swiper.activeIndex, 0, total - 1);
        setActiveIndex(next);
        if (enableHashSync) {
          navigate(location.pathname + location.search + `#${pageNames[next]}`, {
            replace: true,
          });
        }
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
