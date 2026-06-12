import { memo } from 'react';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import { NavTile } from '@/shared/ui/NavTile';
import styles from './AnalysesTopBar.module.scss';

type Props = {
  /** 0 = hypotheses slide, 1 = analyses slide. */
  activeSlide: number;
  onSelectSlide: (index: number) => void;
};

const TABS = ['Гипотезы', 'Разборы'] as const;

// Sticky header for AnalysesPage — a back arrow above a row of HomePage-style
// NavTiles (the ScreenIndicator idiom). Two tiles, left-aligned, each ~1/3 of
// the width (the empty third mirrors HomePage's 3-tile grid). Tapping a tile
// drives the Swipeable; the active tile lifts (white paper + shadow).
const AnalysesTopBar = ({ activeSlide, onSelectSlide }: Props) => {
  return (
    <div className={styles.bar}>
      {/* Назад на главную — зеркало входа (cover снизу): AnalysesPage съезжает
          вниз, HomePage возвращается из scale .94. PUSH на '/' (не navigate(-1)):
          popstate-back React не анимирует, push — да. Общий BackButton. */}
      <div className={styles.barTop}>
        <BackButton to="/" type="cover-back" ariaLabel="На главную" />
      </div>
      <div className={styles.tiles} role="tablist">
        {TABS.map((label, i) => (
          <NavTile
            key={label}
            className={styles.tile}
            label={label}
            active={activeSlide === i}
            role="tab"
            aria-selected={activeSlide === i}
            onClick={() => onSelectSlide(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(AnalysesTopBar);
