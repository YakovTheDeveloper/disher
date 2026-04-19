import { useDish, useDishItemsWithProducts } from '@/entities/dish';
import styles from './ContextBar.module.scss';

export interface DishContextBarProps {
  dishId: string;
}

export const DishContextBar = ({ dishId }: DishContextBarProps) => {
  const dish = useDish(dishId);
  const items = useDishItemsWithProducts(dishId);

  return (
    <div className={styles.bar}>
      <div className={styles.headingRow}>
        <span className={styles.heading}>{dish?.name ?? 'Блюдо'}</span>
        {items.length === 0 && <span className={styles.muted}>Пусто</span>}
      </div>
      {items.length > 0 && (
        <div className={styles.chipRow}>
          {items.map((item) => (
            <div key={item.id} className={styles.chip}>
              <span className={styles.chipName}>
                {item.product?.name ?? '—'}
              </span>
              <span className={styles.chipQty}>{item.quantity}г</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DishContextBar;
