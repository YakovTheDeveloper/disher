import styles from './SearchButton.module.scss';
import clsx from 'clsx';

type Props = {
  onClick: VoidFunction;
  children?: string;
  as?: 'button' | 'label';
  htmlFor?: string;
  prominent?: boolean;
};

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
    <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SearchButton = ({ onClick, children, as = 'button', htmlFor, prominent }: Props) => {
  const Tag = as;

  return (
    <Tag
      onClick={onClick}
      htmlFor={htmlFor}
      className={clsx(
        styles.container,
        styles.v0,
        prominent && styles.prominent,
        children && styles.withText,
      )}
    >
      <span className={styles.icon}>
        <SearchIcon />
      </span>
      {children && <span className={styles.text}>{children}</span>}
    </Tag>
  );
};
