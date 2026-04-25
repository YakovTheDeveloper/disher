import styles from './ItemsList.module.scss';
import { useRef } from 'react';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  offsetTop?: boolean;
  count?: number;
  backgroundImage?: string;
  emptyContent?: React.ReactNode;
};

const PLACEHOLDER_LINES = 6;

const EmptyLines = ({ content }: { content?: React.ReactNode }) => {
  return (
    <div className={clsx(styles.emptyState, styles.empty_v0)}>
      {content ?? <p className={styles.emptyMessage}>список пуст</p>}
      {Array.from({ length: PLACEHOLDER_LINES }, (_, i) => (
        <div
          key={i}
          className={styles.emptyLine}
          style={{ '--line-i': i } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

const ItemsList = ({ children, offsetTop, count, backgroundImage, emptyContent }: Props) => {
  const listRef = useRef<HTMLUListElement | null>(null);
  const isEmpty = count !== undefined && count === 0;

  return (
    <ul ref={listRef} className={clsx([styles.container, offsetTop && styles.offsetTop])}>
      {isEmpty ? <EmptyLines content={emptyContent} /> : children}
      {isEmpty && backgroundImage && (
        <img src={backgroundImage} className={styles.backgroundImage} alt="" />
      )}
      <div className={styles.offsetBottom}></div>
    </ul>
  );
};

export default ItemsList;
