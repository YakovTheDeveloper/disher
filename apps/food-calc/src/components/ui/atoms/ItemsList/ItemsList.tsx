import { observer } from 'mobx-react-lite';
import styles from './ItemsList.module.scss';
import { useRef } from 'react';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  offsetTop?: boolean;
};

const ItemsList = ({ children, offsetTop }: Props) => {
  const listRef = useRef<HTMLUListElement | null>(null);

  return (
    <ul ref={listRef} className={clsx([styles.container, offsetTop && styles.offsetTop])}>
      {children}
      <div className={styles.offsetBottom}></div>
    </ul>
  );
};

export default observer(ItemsList);
