import useEmblaCarousel from 'embla-carousel-react';
import { EmblaCarouselType } from 'embla-carousel';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UseSwipeableProps = {
  pageNames?: string[];
  defaultIndex?: number;
  onIndexChange?: (index: number, total: number) => void;
  enableHashSync?: boolean;
  total: number;
};

export const useSwipeable = ({
  pageNames,
  defaultIndex = 0,
  onIndexChange,
  enableHashSync = true,
  total,
}: UseSwipeableProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Храним индексы видимых слайдов для ленивой загрузки
  const [slidesInView, setSlidesInView] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: defaultIndex, // Индекс установим один раз при инициализации
    loop: false,
    duration: 30, // Чуть ускорим анимацию для отзывчивости
    dragFree: false,
    containScroll: 'trimSnaps',
    watchResize: true,
    watchSlides: true,
    watchDrag: true,
  });

  // 1. Определение видимых слайдов (для оптимизации рендера контента)
  const updateSlidesInView = useCallback((api: EmblaCarouselType) => {
    setSlidesInView((prev) => {
      const inView = api.slidesInView();
      // Чтобы избежать лишних ререндеров, сравниваем массивы
      if (JSON.stringify(prev) === JSON.stringify(inView)) return prev;
      return inView;
    });
  }, []);

  // 2. Обработка смены слайда
  const onSelect = useCallback(
    (api: EmblaCarouselType) => {
      const index = api.selectedScrollSnap();
      setSelectedIndex(index);
      onIndexChange?.(index, total);
    },
    [onIndexChange, total]
  );

  // 3. Синхронизация с Hash (только после остановки карусели)
  const syncHash = useCallback(
    (api: EmblaCarouselType) => {
      if (!enableHashSync || !pageNames) return;

      const index = api.selectedScrollSnap();
      const hash = pageNames[index];
      const currentHash = location.hash.replace('#', '');

      if (hash && hash !== currentHash) {
        // replace: true критичен, чтобы не забивать историю назад/вперед
        navigate(`#${hash}`, { replace: true });
      }
    },
    [enableHashSync, pageNames, location.hash, navigate]
  );

  useEffect(() => {
    if (!emblaApi) return;

    // Инициализация начальной позиции из Hash
    if (enableHashSync && pageNames) {
      const hashValue = location.hash.substring(1);
      const index = pageNames.indexOf(hashValue);
      if (index !== -1) emblaApi.scrollTo(index, true); // true - мгновенно без анимации
    }

    emblaApi.on('select', onSelect);
    emblaApi.on('slidesInView', updateSlidesInView);
    emblaApi.on('settle', syncHash); // Hash обновляем только когда всё затихло

    // Вызываем сразу для начального состояния
    updateSlidesInView(emblaApi);
    onSelect(emblaApi);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('slidesInView', updateSlidesInView);
      emblaApi.off('settle', syncHash);
    };
  }, [emblaApi, onSelect, updateSlidesInView, syncHash, enableHashSync, pageNames]);

  const goToPage = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  return {
    emblaRef,
    selectedIndex,
    slidesInView, // Используйте это для ленивого рендера контента слайдов
    goToPage,
  };
};
