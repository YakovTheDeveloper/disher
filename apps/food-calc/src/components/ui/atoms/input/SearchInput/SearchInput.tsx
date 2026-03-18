import React, { useCallback } from 'react';
import SearchIcon from '@/assets/icons/lupa.svg';
import CrossIcon from '@/assets/icons/cross.svg';
import clsx from 'clsx';
import styles from './SearchInput.module.scss';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  wrapperClassName?: string;
  size?: 'small' | 'medium' | 'large';
};

const SearchInput = React.forwardRef<HTMLInputElement, Props>(
  ({ className = '', wrapperClassName = '', size = 'small', value, onChange, ...inputProps }, ref) => {
    const inputValue = value ?? '';
    const hasValue = typeof inputValue === 'string' && inputValue.length > 0;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      inputProps.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      inputProps.onBlur?.(e);
    };

    const handleClear = useCallback(() => {
      const target = ref && typeof ref === 'object' ? ref.current : null;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeInputValueSetter && target) {
        nativeInputValueSetter.call(target, '');
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }, [ref, onChange]);

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
          value={inputValue}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {hasValue && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Очистить поиск"
          >
            <CrossIcon />
          </button>
        )}
      </label>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
