import { FC } from 'react';
import clsx from 'clsx';
import { FilterButton } from '@/components/ui/atoms/Button';
import styles from './FilterNutrients.module.scss';

interface Props {
  showProgress: boolean;
  showValues: boolean;
  onToggleProgress: () => void;
  onToggleValues: () => void;
  onToggleFilterMode: () => void;
}

const FilterNutrientsPanel: FC<Props> = ({
  showProgress,
  showValues,
  onToggleProgress,
  onToggleValues,
  onToggleFilterMode,
}) => (
  <div className={styles.actionsPanel}>
    <button
      type="button"
      className={clsx(styles.toggleBtn, !showProgress && styles.toggleBtnOff)}
      onClick={onToggleProgress}
    >
      Шкала
    </button>
    <button
      type="button"
      className={clsx(styles.toggleBtn, !showValues && styles.toggleBtnOff)}
      onClick={onToggleValues}
    >
      Значения
    </button>
    <FilterButton onClick={onToggleFilterMode} isActive />
  </div>
);

export default FilterNutrientsPanel;
