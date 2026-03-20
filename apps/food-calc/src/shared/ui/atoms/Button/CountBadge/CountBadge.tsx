import clsx from 'clsx';
import styles from './CountBadge.module.scss';

type Props = {
  count: number;
  size?: 'default' | 'sm';
};

export const CountBadge = ({ count, size = 'default' }: Props) => {
  return <div className={clsx(styles.container, size === 'sm' && styles.sm)}>{count}</div>;
};
