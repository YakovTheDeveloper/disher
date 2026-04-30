import { useEffect, useRef, useState } from 'react';
import styles from './Quantity.module.scss';
import { ChangeHighlight } from '@/shared/ui/ChangeHighlight';

type Props = {
  id: string | number;
  onClick: (id: string | number) => void;
  className?: string;
  hide: boolean;
  unit: string;
  content: { quantity: number } | null;
  htmlFor?: string;
};

const DIFF_VISIBLE_MS = 5000;

const Quantity = ({ id, onClick, content, hide, unit = 'г', htmlFor }: Props) => {
  const quantity = content?.quantity ?? null;

  const prevQuantityRef = useRef<number | null>(quantity);
  const [diff, setDiff] = useState<{ from: number; to: number; key: number } | null>(null);
  const diffKeyRef = useRef(0);

  useEffect(() => {
    const prev = prevQuantityRef.current;
    if (prev !== quantity && prev != null && quantity != null) {
      diffKeyRef.current += 1;
      setDiff({ from: prev, to: quantity, key: diffKeyRef.current });
    }
    prevQuantityRef.current = quantity;
  }, [quantity]);

  useEffect(() => {
    if (!diff) return;
    const currentKey = diff.key;
    const timer = window.setTimeout(() => {
      setDiff((d) => (d && d.key === currentKey ? null : d));
    }, DIFF_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [diff]);

  const onClickHandler = () => onClick(id);
  return (
    <label
      htmlFor={htmlFor}
      onClick={onClickHandler}
      className={`${styles.container} ${hide ? styles.hide : ''}`}
    >
      {diff && (
        <span key={diff.key} className={styles.diff} aria-hidden="true">
          {diff.from} → {diff.to}
        </span>
      )}
      <ChangeHighlight
        trigger={quantity}
        contentClassName={styles.valueOnly}
        variant="sweep"
      >
        {quantity}
      </ChangeHighlight>
      {quantity != null && <span className={styles.unit}>{unit}.</span>}
    </label>
  );
};

export default Quantity;
