import { memo } from 'react';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import styles from './AnalysesTopBar.module.scss';

type Props = {
  /** 0 = hypotheses slide, 1 = analyses slide. */
  activeSlide: number;
  onSelectSlide: (index: number) => void;
};

const TABS = ['Гипотезы', 'Разборы'] as const;

// Sticky header for AnalysesPage — a back arrow plus a two-tab switcher that
// doubles as the slide indicator. Tapping a tab drives the Swipeable.
const AnalysesTopBar = ({ activeSlide, onSelectSlide }: Props) => {
  return (
    <div className={styles.bar}>
      {/* Назад на главную — зеркало входа (cover снизу): AnalysesPage съезжает
          вниз, HomePage возвращается из scale .94. PUSH на '/' (не navigate(-1)):
          popstate-back React не анимирует, push — да. Общий BackButton. */}
      <BackButton to="/" type="cover-back" ariaLabel="На главную" />
      <div className={styles.tabs} role="tablist">
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={activeSlide === i}
            className={activeSlide === i ? styles.tabActive : styles.tab}
            onClick={() => onSelectSlide(i)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(AnalysesTopBar);
