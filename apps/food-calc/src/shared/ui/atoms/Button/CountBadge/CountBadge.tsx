import styles from './CountBadge.module.scss';

type Props = {
  count: number;
};

export const CountBadge = ({ count }: Props) => {
  return <div className={styles.container}>{count}</div>;
};
