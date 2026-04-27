import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import styles from './FoodSearchEmpty.module.scss';

type Props = {
  query: string;
  onCreateProduct?: () => void;
  onCreateDish?: () => void;
};

export const FoodSearchEmpty = ({ query, onCreateProduct, onCreateDish }: Props) => {
  const ref = useKeyboardStick<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.root}>
      <p className={styles.message}>
        По запросу <em>«{query}»</em> ничего нет
      </p>
      <div className={styles.actions}>
        {onCreateDish && (
          <button className={styles.card} onClick={onCreateDish}>
            <span className={styles.cardTitle}>{query}</span>
            <span className={styles.cardLabel}>
              Добавить <span className={styles.cardMono}>блюдо</span>
            </span>
            <span className={styles.cardHint}>состоит из продуктов</span>
          </button>
        )}
        {onCreateProduct && (
          <button className={styles.cardPrimary} onClick={onCreateProduct}>
            <span className={styles.cardTitle}>{query}</span>
            <span className={styles.cardLabel}>
              Добавить <span className={styles.cardMono}>продукт</span>
            </span>
            <span className={styles.cardHint}>составляющая часть блюд</span>
          </button>
        )}
      </div>
    </div>
  );
};
