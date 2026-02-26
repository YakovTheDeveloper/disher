import React from 'react';
import SearchIcon from '@/assets/icons/lupa.svg';
import clsx from 'clsx';
import styles from './SearchInput.module.scss';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
  size?: 'small' | 'medium' | 'large';
};

const SearchInput = React.forwardRef<HTMLInputElement, Props>(
  ({ className = '', wrapperClassName = '', size = 'small', ...inputProps }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      inputProps.onFocus?.(e);
    };

    return (
      <label className={clsx(styles.searchWrapper, styles[size], wrapperClassName)}>
        <div className={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          type="search"
          id="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={clsx(styles.searchInput, className)}
          placeholder="Поиск"
          ref={ref}
          {...inputProps}
          onFocus={handleFocus}
        />
      </label>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
