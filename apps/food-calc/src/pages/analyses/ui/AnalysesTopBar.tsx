import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.back}
        onClick={() => navigate('/')}
        aria-label="На главную"
      >
        ‹
      </button>
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
