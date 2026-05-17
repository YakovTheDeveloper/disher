import { useCallback, useRef, useState } from 'react';
import { NativeSlider, type NativeSliderRef } from './NativeSlider';
import styles from './TestSliderPage.module.scss';

// Тестовая страница `/test` — A/B-стенд для нативного scroll-snap слайдера.
// 3 экрана, на каждом — длинный список (overflow), чтобы проверить:
//   • гладкость горизонтального свайпа на iOS WebKit;
//   • что вложенный вертикальный скролл внутри слайда не конфликтует
//     с горизонтальным пейджингом (диагональные жесты);
//   • что sticky-шапка внутри слайда не дёргается при свайпе.

type Tint = 'warm' | 'mint' | 'lavender';

const SCREENS: { key: string; title: string; tint: Tint }[] = [
  { key: 'lab', title: 'Лаборатория', tint: 'warm' },
  { key: 'food', title: 'Приёмы пищи', tint: 'mint' },
  { key: 'events', title: 'События', tint: 'lavender' },
];

const ROW_COUNT = 40;
const ROWS = Array.from({ length: ROW_COUNT }, (_, i) => i);

const DEFAULT_SLIDE = 1;

type TestScreenProps = {
  title: string;
  tint: Tint;
  index: number;
  total: number;
};

const TestScreen = ({ title, tint, index, total }: TestScreenProps) => (
  <div className={styles.screen} data-tint={tint}>
    <div className={styles.stickyHead}>
      <span className={styles.screenTitle}>{title}</span>
      <span className={styles.screenMeta}>
        экран {index + 1} / {total}
      </span>
    </div>
    <div className={styles.rows}>
      {ROWS.map((r) => (
        <div key={r} className={styles.row}>
          <span className={styles.rowIndex}>{String(r + 1).padStart(2, '0')}</span>
          <span className={styles.rowText}>
            {title} — строка {r + 1}
          </span>
          <span className={styles.rowDot} aria-hidden />
        </div>
      ))}
    </div>
  </div>
);

const TestSliderPage = () => {
  const sliderRef = useRef<NativeSliderRef>(null);
  const [index, setIndex] = useState(DEFAULT_SLIDE);

  const handleIndexChange = useCallback((i: number) => setIndex(i), []);
  const goTo = useCallback((i: number) => sliderRef.current?.goToPage(i), []);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <span className={styles.brand}>native scroll-snap · тест свайпа</span>
        <span className={styles.activeChip}>{SCREENS[index]?.title ?? '—'}</span>
      </div>

      <NativeSlider
        ref={sliderRef}
        defaultSlide={DEFAULT_SLIDE}
        onIndexChange={handleIndexChange}
      >
        {SCREENS.map((s, i) => (
          <TestScreen
            key={s.key}
            title={s.title}
            tint={s.tint}
            index={i}
            total={SCREENS.length}
          />
        ))}
      </NativeSlider>

      <div className={styles.dots} role="tablist" aria-label="Экраны">
        {SCREENS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`К экрану ${i + 1}: ${s.title}`}
            className={i === index ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default TestSliderPage;
