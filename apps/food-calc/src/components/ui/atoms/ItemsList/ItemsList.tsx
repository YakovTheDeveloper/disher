import { observer } from 'mobx-react-lite';
import styles from './ItemsList.module.scss';
import { useEffect, useRef } from 'react';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  children: React.ReactNode;
};

const ItemsList = ({ children }: Props) => {
  const listRef = useRef<HTMLUListElement | null>(null);

  return (
    <ul ref={listRef} className={styles.container}>
      <div className={styles.offsetBottom}></div>
      {children}
      <div className={styles.offsetBottom}></div>
    </ul>
  );
};

export default observer(ItemsList);
