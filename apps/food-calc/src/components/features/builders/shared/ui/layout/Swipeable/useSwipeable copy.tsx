import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UseSwipeableProps = {
  pageNames?: string[];
  defaultIndex?: number;
  onIndexChange?: (index: number, total: number) => void;
  enableHashSync?: boolean;
  total: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export const useSwipeable = ({
  pageNames,
  defaultIndex = 0,
  onIndexChange,
  enableHashSync = true,
  total,
}: UseSwipeableProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialResized = useRef(false);

  const getInitialIndex = useCallback(() => {
    if (enableHashSync && pageNames) {
      const hashValue = location.hash.substring(1);
      if (hashValue) {
        const index = pageNames.indexOf(hashValue);
        if (index !== -1) {
          return clamp(index, 0, total - 1);
        }
      }
    }
    return clamp(defaultIndex, 0, total - 1);
  }, [defaultIndex, enableHashSync, location.hash, pageNames, total]);

  const [selectedIndex, setSelectedIndex] = useState(getInitialIndex());

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: getInitialIndex(),
    loop: false,
    duration: 45,
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    // watchDrag: true,
    watchResize: true,
    watchSlides: true,
    watchDrag: (emblaApi, event) => {
      // Если палец движется больше по вертикали, чем по горизонтали,
      // Embla не будет перехватывать событие
      return true;
    },
  });

  useEffect(() => {
    if (!emblaApi) return;

    // Additional re-init when the container size changes,
    // especially useful for drawers/modals where initial size might be 0
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          emblaApi.reInit();
          // Ensure we start from the correct index after resize (only for initial resize)
          if (!initialResized.current) {
            const initialIndex = getInitialIndex();
            emblaApi.scrollTo(initialIndex, false);
            initialResized.current = true;
          }
        }
      }
    });

    const viewportNode = emblaApi.rootNode();
    if (viewportNode) {
      resizeObserver.observe(viewportNode);
    }

    // Fallback: search for stable visibility
    const timeout = setTimeout(() => {
      emblaApi.reInit();
      // Ensure we start from the correct index after timeout (only if not already handled by resize)
      if (!initialResized.current) {
        const initialIndex = getInitialIndex();
        emblaApi.scrollTo(initialIndex, false);
        initialResized.current = true;
      }
    }, 500);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
    };
  }, [emblaApi, getInitialIndex]);

  const onSelect = useCallback(
    (emblaApi: EmblaCarouselType) => {
      const nextIndex = emblaApi.selectedScrollSnap();
      setSelectedIndex(nextIndex);
      onIndexChange?.(nextIndex, total);
    },
    [onIndexChange, total]
  );

  useEffect(() => {
    if (!emblaApi || !pageNames) return;

    const handleSettle = (api: EmblaCarouselType) => {
      const index = api.selectedScrollSnap();
      const hash = pageNames[index];
      if (enableHashSync && hash && location.hash !== `#${hash}`) {
        navigate(`${location.pathname}${location.search}#${hash}`, { replace: true });
      }
    };
    emblaApi.on('settle', handleSettle);

    return () => {
      emblaApi.off('settle', handleSettle);
    };
  }, [emblaApi, pageNames, location, navigate, enableHashSync]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const goToPage = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  return {
    emblaRef,
    containerRef,
    selectedIndex,
    goToPage,
  };
};
