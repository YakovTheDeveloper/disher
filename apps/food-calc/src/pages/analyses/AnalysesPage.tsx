import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import HypothesesSlide from './ui/HypothesesSlide';
import AnalysesSlide from './ui/AnalysesSlide';
import AnalysesTopBar from './ui/AnalysesTopBar';
import styles from './AnalysesPage.module.scss';

// Default to slide 1 — the long-analyses list. The long-analyses entry points
// (AnalysisKindDrawer «по неделям» + HomePage top-right link) navigate with no
// state and land here. The HomePage «Гипотезы» button passes `state.slide = 0`
// to land on the hypotheses slide directly (it's the view-first screen now).
const DEFAULT_SLIDE = 1;

// /analyses — two swipeable slides: hypotheses (CRUD) + long analyses. The
// bottom-bar CTA switches per slide because each slide owns its own Screen.
const AnalysesPage = () => {
  const location = useLocation();
  const initialSlide =
    (location.state as { slide?: number } | null)?.slide ?? DEFAULT_SLIDE;
  const [slide, setSlide] = useState(initialSlide);
  const swipeRef = useRef<SwipeableRef>(null);

  const goToSlide = useCallback((index: number) => {
    swipeRef.current?.goToPage(index);
    setSlide(index);
  }, []);

  const handleIndexChange = useCallback((index: number) => {
    setSlide(index);
  }, []);

  // One top-bar config, rendered as the sticky header of both slides — its
  // active tab tracks the global slide index.
  const topBar = useMemo(
    () => <AnalysesTopBar activeSlide={slide} onSelectSlide={goToSlide} />,
    [slide, goToSlide],
  );

  return (
    <div className={styles.ambient}>
      <div className={styles.swipeArea}>
        <Swipeable
          ref={swipeRef}
          defaultSlide={initialSlide}
          hasDots={false}
          onIndexChange={handleIndexChange}
        >
          <HypothesesSlide topBar={topBar} />
          <AnalysesSlide topBar={topBar} />
        </Swipeable>
      </div>
    </div>
  );
};

export default memo(AnalysesPage);
