import styles from './CreateFoodPanel.module.scss';
import { useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  onCreateProduct: () => void;
  onCreateDish: () => void;
};

const CreateFoodPanel = ({ onCreateDish, onCreateProduct }: Props) => {
  const [selected, setSelected] = useState<'dish' | 'product' | null>(null);

  const handleSelect = (type: 'dish' | 'product') => {
    if (selected) return;
    setSelected(type);
  };

  return (
    <div className={styles.panel}>
      <motion.button
        className={styles.card}
        onClick={() => handleSelect('dish')}
        animate={
          selected === 'dish'
            ? { scale: 1.08, opacity: 0 }
            : selected === 'product'
              ? { opacity: 0 }
              : { scale: 1, opacity: 1 }
        }
        transition={
          selected === 'dish'
            ? { type: 'spring', stiffness: 300, damping: 25 }
            : { duration: 0.25, ease: 'easeOut' }
        }
        onAnimationComplete={() => {
          if (selected === 'dish') onCreateDish();
        }}
      >
        <span className={styles.cardLabel}>
          Создать <span className={styles.cardMono}>блюдо</span>
        </span>
        <span className={styles.cardHint}>состоит из продуктов</span>
      </motion.button>
      <motion.button
        className={styles.cardPrimary}
        onClick={() => handleSelect('product')}
        animate={
          selected === 'product'
            ? { scale: 1.08, opacity: 0 }
            : selected === 'dish'
              ? { opacity: 0 }
              : { scale: 1, opacity: 1 }
        }
        transition={
          selected === 'product'
            ? { type: 'spring', stiffness: 300, damping: 25 }
            : { duration: 0.25, ease: 'easeOut' }
        }
        onAnimationComplete={() => {
          if (selected === 'product') onCreateProduct();
        }}
      >
        <span className={styles.cardLabel}>
          Создать <span className={styles.cardMono}>продукт</span>
        </span>
        <span className={styles.cardHint}>составляющая часть блюд</span>
      </motion.button>
    </div>
  );
};

export default CreateFoodPanel;
