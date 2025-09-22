import { observer } from 'mobx-react-lite';
import { useState, useRef } from 'react';
import styles from './ReversableDeletionButton.module.scss';

type Props = {
  children: React.ReactNode;
  onDelete: () => void; // action to perform after delay
  delay?: number; // optional delay in ms (default 3000)
};

const ReversableDeletionButton = ({ children, onDelete, delay = 3000 }: Props) => {
  const [pending, setPending] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (!pending) {
      // Start deletion countdown
      setPending(true);
      timerRef.current = setTimeout(() => {
        onDelete();
        setPending(false);
      }, delay);
    } else {
      // Cancel deletion
      if (timerRef.current) clearTimeout(timerRef.current);
      setPending(false);
    }
  };

  return (
    <button
      className={styles.container}
      onClick={handleClick}
      style={{
        backgroundColor: pending ? '#ffcccc' : '#ff5555', // visual feedback
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
      disabled={false} // optionally disable during countdown
    >
      {pending ? 'Отменить' : children}
    </button>
  );
};

export default observer(ReversableDeletionButton);
