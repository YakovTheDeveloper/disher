import React from 'react';
import SearchIcon from '@/assets/icons/lupa.svg';
import clsx from 'clsx';
import styles from './SearchInput.module.scss';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
};

const SearchInput = ({ className = '', wrapperClassName = '', ...inputProps }: Props) => {
  return (
    <label className={clsx(styles.searchWrapper, wrapperClassName)}>
      <div className={styles.searchIcon}>
        <SearchIcon />
      </div>
      <input
        type="text"
        className={clsx(styles.searchInput, className)}
        placeholder="Поиск"
        {...inputProps}
      />
    </label>
  );
};

export default SearchInput;
