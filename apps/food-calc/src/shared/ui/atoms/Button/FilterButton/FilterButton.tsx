import styles from './FilterButton.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import FilterIcon from '@/assets/icons/filter-icon.svg';
import CrossIcon from '@/assets/icons/cross.svg';

type Props = {
  onClick: VoidFunction;
  isActive?: boolean;
  children?: string;
  animate?: () => boolean;
  activeCount?: number;
};

const FilterButton = ({ onClick, isActive = false, activeCount = 0 }: Props) => {
  return (
    <button onClick={onClick} className={clsx([styles.container])}>
      <span className={styles.icon}>
        {isActive ? <CrossIcon /> : <FilterIcon />}
      </span>
      {activeCount > 0 && (
        <span className={styles.badge}>{activeCount}</span>
      )}
    </button>
  );
};

export default observer(FilterButton);