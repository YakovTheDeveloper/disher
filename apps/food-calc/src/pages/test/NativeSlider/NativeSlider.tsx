import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import styles from './NativeSlider.module.scss';

export type NativeSliderRef = {
  /** Анимированно проскроллить к слайду `index`. */
  goToPage: (index: number) => void;
};

type Props = {
  children: React.ReactNode[];
  /** Слайд, на котором стоим при первом показе (без вспышки слайда 0). */
  defaultSlide?: number;
  /** Вызывается ПОСЛЕ доводки снапа (`scrollend`), не на каждом кадре. */
  onIndexChange?: (index: number) => void;
};

// Свайп на нативном CSS scroll-snap. Принципиальное отличие от Embla:
// скролл и доводку снапа делает компоновщик браузера, а НЕ JS-цикл
// requestAnimationFrame. На iOS WebKit это «родной» механизм страничного
// свайпа — он не дёргается на доводке (в отличие от Embla, см. issue #890).
//
// Здесь намеренно НЕТ `content-visibility`, `contain: strict`,
// `-webkit-overflow-scrolling` — чистый нативный скролл, чтобы A/B был
// честным: всё, что осталось от прежней реализации, убрано.
const NativeSlider = forwardRef<NativeSliderRef, Props>(
  ({ children, defaultSlide = 0, onIndexChange }, ref) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    // Текущий слайд. Ref, а не state: свайп не должен ре-рендерить дерево.
    const indexRef = useRef(defaultSlide);

    // Встаём на defaultSlide ДО первого paint'а — useLayoutEffect выполняется
    // после layout, но до отрисовки, поэтому вспышки слайда 0 нет.
    useLayoutEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollLeft = defaultSlide * el.clientWidth;
      indexRef.current = defaultSlide;
    }, [defaultSlide]);

    useImperativeHandle(
      ref,
      () => ({
        goToPage: (index: number) => {
          const el = viewportRef.current;
          if (!el) return;
          el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
        },
      }),
      []
    );

    // Индекс пересчитываем только когда скролл УСТОЯЛСЯ (`scrollend`).
    // Во время самого свайпа — ноль React-ре-рендеров.
    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      const handleSettle = () => {
        if (el.clientWidth === 0) return;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        if (index !== indexRef.current) {
          indexRef.current = index;
          onIndexChange?.(index);
        }
      };
      el.addEventListener('scrollend', handleSettle);
      return () => el.removeEventListener('scrollend', handleSettle);
    }, [onIndexChange]);

    // При смене ШИРИНЫ вьюпорта (поворот экрана) scrollLeft начинает
    // указывать между слайдами — пере-привязываемся к текущему индексу.
    // Высота меняется постоянно (адресная строка iOS) — её игнорируем,
    // иначе пере-привязка дёргала бы свайп.
    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      let lastWidth = el.clientWidth;
      const ro = new ResizeObserver(() => {
        const w = el.clientWidth;
        if (w > 0 && w !== lastWidth) {
          lastWidth = w;
          el.scrollLeft = indexRef.current * w;
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    return (
      <div className={styles.viewport} ref={viewportRef}>
        {children.map((child, i) => (
          <div key={i} className={styles.slide}>
            {child}
          </div>
        ))}
      </div>
    );
  }
);

NativeSlider.displayName = 'NativeSlider';

export default NativeSlider;
