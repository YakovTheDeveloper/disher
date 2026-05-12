import styles from './CreateFoodPanel.module.scss';
import { useState } from 'react';
import { motion } from 'motion/react';

type Choice = 'dish' | 'product' | 'analysis';

type Props = {
  onCreateProduct: () => void;
  onCreateDish: () => void;
  onOpenAnalysis?: () => void;
  analysisStatus?: 'none' | 'fresh' | 'stale';
};

const CreateFoodPanel = ({
  onCreateDish,
  onCreateProduct,
  onOpenAnalysis,
  analysisStatus,
}: Props) => {
  const [selected, setSelected] = useState<Choice | null>(null);

  const handleSelect = (type: Choice) => {
    if (selected) return;
    setSelected(type);
  };

  const animateFor = (self: Choice) => {
    if (selected === self) return { scale: 1.08, opacity: 0 };
    if (selected) return { opacity: 0 };
    return { scale: 1, opacity: 1 };
  };

  const transitionFor = (self: Choice) =>
    selected === self
      ? { type: 'spring' as const, stiffness: 300, damping: 25 }
      : { duration: 0.25, ease: 'easeOut' as const };

  return (
    <div className={styles.panel}>
      <motion.button
        className={styles.card}
        onClick={() => handleSelect('dish')}
        animate={animateFor('dish')}
        transition={transitionFor('dish')}
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
        animate={animateFor('product')}
        transition={transitionFor('product')}
        onAnimationComplete={() => {
          if (selected === 'product') onCreateProduct();
        }}
      >
        <span className={styles.cardLabel}>
          Создать <span className={styles.cardMono}>продукт</span>
        </span>
        <span className={styles.cardHint}>составляющая часть блюд</span>
      </motion.button>
      {onOpenAnalysis && (
        <motion.button
          className={styles.card}
          onClick={() => handleSelect('analysis')}
          animate={animateFor('analysis')}
          transition={transitionFor('analysis')}
          onAnimationComplete={() => {
            if (selected === 'analysis') onOpenAnalysis();
          }}
        >
          <span className={styles.cardLabel}>
            Открыть <span className={styles.cardMono}>анализ</span>
            {analysisStatus && analysisStatus !== 'none' && (
              <span
                className={
                  analysisStatus === 'fresh' ? styles.dotFresh : styles.dotStale
                }
              />
            )}
          </span>
          <span className={styles.cardHint}>сводка по дню</span>
        </motion.button>
      )}
    </div>
  );
};

export default CreateFoodPanel;
