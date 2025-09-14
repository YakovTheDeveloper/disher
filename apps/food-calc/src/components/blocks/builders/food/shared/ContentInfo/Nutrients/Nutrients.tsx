import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './Nutrients.module.scss';
import { FoodModelStore } from '@/store/models/food/foodStore';
import {
  defaultDailyNorms,
  nutrientGroups,
  nutrientNames,
} from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants';

// Groups of nutrients
const groups: Record<string, number[]> = {
  Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
  Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
  Каротиноиды: [34, 35],
};

const getRoundedPercent = (percentage: number, quantity, norm) => {
  if (!quantity || !norm) return null;

  if (percentage < 1) {
    return percentage.toFixed(2);
  } else if (percentage < 10) {
    return percentage.toFixed(1);
  } else {
    return Math.round(percentage);
  }
};

type Props = {
  getFood: () => FoodModelStore;
  getCurrentFood: () => { quantity: number; id: number }[];
};

const Nutrients = ({ getCurrentFood, getFood }: Props) => {
  const foodModel = getFood();
  const currentFood = getCurrentFood();

  const totals = () => {
    const acc: Record<number, number> = {};
    currentFood.forEach(({ id }) => {
      const nutrients = foodModel.data.get(id.toString())?.nutrients || [];
      nutrients.forEach(({ nutrientId, quantity }: { nutrientId: number; quantity: number }) => {
        acc[nutrientId] = (acc[nutrientId] || 0) + quantity;
      });
    });
    return acc;
  };

  const sums = totals();

  return (
    <div className={styles.container}>
      {nutrientGroups.map(({ content, displayName: groupName }) => (
        <div key={groupName} className={styles.group}>
          <h3 className={styles.groupTitle}>{groupName}</h3>
          <div className={styles.groupContent}>
            {content.map(({ id, unitRu, displayNameRu }) => {
              if (!sums[id]) return null;

              const name = displayNameRu;
              const norm = defaultDailyNorms[id];
              const value = sums[id];
              const percent = Math.min(100, (value / norm) * 100);

              const unit = unitRu;
              const percentNormalized = getRoundedPercent(percent, value, norm);

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={styles.card}
                >
                  <div className={styles.header}>
                    <span className={styles.name}>{name}</span>
                    <span className={styles.value}>
                      {unit}
                      {value.toFixed(1)} / {norm}
                    </span>
                    <span className={styles.percent}>{percentNormalized}</span>
                  </div>
                  <div className={styles.progressWrapper}>
                    <div className={styles.progress} style={{ width: `${percent}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default observer(Nutrients);
