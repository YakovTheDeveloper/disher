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
    return (
      <label className={clsx(styles.searchWrapper, styles[size], wrapperClassName)}>
        <div className={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          type="text"
          className={clsx(styles.searchInput, className)}
          placeholder="Поиск"
          ref={ref}
          {...inputProps}
        />
      </label>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
