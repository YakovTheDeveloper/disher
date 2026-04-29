import { useState } from 'react';
import clsx from 'clsx';
import { WriteFoodButton, type UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
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
  const [isWritePressed, setIsWritePressed] = useState(false);
  const [isSearchPressed, setIsSearchPressed] = useState(false);

  return (
    <div className={clsx(styles.searchBar, className)}>
      <div
        className={clsx(styles.searchBarWrite, { [styles.searchBarWriteActive]: isWritePressed })}
        onMouseDown={() => setIsWritePressed(true)}
        onMouseUp={() => setIsWritePressed(false)}
        onMouseLeave={() => setIsWritePressed(false)}
        onTouchStart={() => setIsWritePressed(true)}
        onTouchEnd={() => setIsWritePressed(false)}
      >
        <WriteFoodButton
          flow={writeFoodFlow}
          inputId={writeFoodInputId}
          label={writeFoodLabel}
          className={styles.searchBarWriteButton}
        />
      </div>
      <span className={styles.searchBarSeparator}>~</span>
      <label
        htmlFor={searchHtmlFor}
        className={clsx(styles.searchBarSearch, {
          [styles.searchBarSearchActive]: isSearchPressed,
        })}
        onMouseDown={() => setIsSearchPressed(true)}
        onMouseUp={() => setIsSearchPressed(false)}
        onMouseLeave={() => setIsSearchPressed(false)}
        onTouchStart={() => setIsSearchPressed(true)}
        onTouchEnd={() => setIsSearchPressed(false)}
      >
        <span className={styles.searchBarSearchIcon}>
          <SearchIcon />
        </span>
        <p>{searchLabel}</p>
      </label>
    </div>
  );
};

export default AddFoodActionBar;
