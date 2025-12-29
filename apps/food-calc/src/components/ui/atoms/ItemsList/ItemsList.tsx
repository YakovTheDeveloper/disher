import { observer } from 'mobx-react-lite';
import styles from './ItemsList.module.scss';
import { useEffect, useRef } from 'react';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  children: React.ReactNode;
};

const ItemsList = ({ children }: Props) => {
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !listRef.current) return;

      if (!listRef.current.contains(target)) {
        console.log(target);
        emitter.emit('outsideClick', target);
      }
    };

    document.addEventListener('mouseup', handleOutside);
    document.addEventListener('touchend', handleOutside);

    return () => {
      document.removeEventListener('mouseup', handleOutside);
      document.removeEventListener('touchend', handleOutside);
    };
  }, []);

  return (
    <ul ref={listRef} className={styles.container}>
      {children}
    </ul>
  );
};

export default observer(ItemsList);
