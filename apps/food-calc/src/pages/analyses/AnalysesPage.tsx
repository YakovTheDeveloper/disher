import { memo } from 'react';
import AnalysesSlide from './ui/AnalysesSlide';
import AnalysesTopBar from './ui/AnalysesTopBar';
import styles from './AnalysesPage.module.scss';

// /analyses — a single screen: the long-analyses list. Hypotheses are no longer
// a sibling slide; they live in the shared HypothesesDrawer opened from the
// bottom-bar «Гипотезы» button (same surface as HomePage). The former two-tab
// Swipeable + AnalysesTopBar tabs were dropped 2026-06-13.
const AnalysesPage = () => {
  return (
    <div className={styles.ambient}>
      {/* HomeTopBar — page-level floating bar (absolute over `.ambient`), как на
          Dish/Home. В `Screen.stickyTop` его absolute-shell схлопывался и уезжал
          под `.headerOverlap` (z-index:1). `.swipeArea` резервирует высоту бара
          паддингом, чтобы лист стартовал под ним. */}
      <AnalysesTopBar />
      <div className={styles.swipeArea}>
        <AnalysesSlide />
      </div>
    </div>
  );
};

export default memo(AnalysesPage);
