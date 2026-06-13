import { memo } from 'react';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import styles from './AnalysesTopBar.module.scss';

// Sticky header for AnalysesPage — just a back arrow to HomePage. The tabs
// (Гипотезы / Разборы) were removed 2026-06-13: /analyses is a single screen
// (the long-analyses list) and hypotheses moved into the shared HypothesesDrawer.
const AnalysesTopBar = () => {
  return (
    <div className={styles.bar}>
      {/* Назад на главную — зеркало входа (cover снизу): AnalysesPage съезжает
          вниз, HomePage возвращается из scale .94. PUSH на '/' (не navigate(-1)):
          popstate-back React не анимирует, push — да. Общий BackButton. */}
      <div className={styles.barTop}>
        <BackButton to="/" type="cover-back" ariaLabel="На главную" />
      </div>
    </div>
  );
};

export default memo(AnalysesTopBar);
