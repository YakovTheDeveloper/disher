import clsx from 'clsx';
import {
  WriteFoodButton,
  type UseWriteFoodFlowResult,
} from '@/features/food/food-free-text-parse';
import styles from './AddFoodActionBar.module.scss';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export interface AddFoodActionBarProps {
  writeFoodFlow: UseWriteFoodFlowResult;
  writeFoodInputId: string;
  writeFoodLabel?: string;
  searchHtmlFor: string;
  searchLabel?: string;
  className?: string;
}

export const AddFoodActionBar = ({
  writeFoodFlow,
  writeFoodInputId,
  writeFoodLabel = 'Опишите, что вы ели...',
  searchHtmlFor,
  searchLabel = 'Еда',
  className,
}: AddFoodActionBarProps) => {
  return (
    <div className={clsx(styles.searchBar, className)}>
      <WriteFoodButton
        flow={writeFoodFlow}
        inputId={writeFoodInputId}
        label={writeFoodLabel}
        className={styles.searchBarWrite}
      />
      <span className={styles.searchBarSeparator}>~</span>
      <label htmlFor={searchHtmlFor} className={styles.searchBarSearch}>
        <span className={styles.searchBarSearchIcon}>
          <SearchIcon />
        </span>
        <p>{searchLabel}</p>
      </label>
    </div>
  );
};

export default AddFoodActionBar;
