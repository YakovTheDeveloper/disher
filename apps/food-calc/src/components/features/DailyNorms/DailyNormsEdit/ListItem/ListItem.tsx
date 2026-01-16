import { observer } from 'mobx-react-lite';
import styles from './ListItem.module.scss';
import { useRef } from 'react';
import { Instance } from 'mobx-state-tree';
import { DailyNormItem, UserDailyNorm } from '@/domain/dailyNorm/DailyNorm.model';
import { Nutrient } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';

type Props = {
  nutrient: Nutrient;
  dailyNorm: Instance<typeof UserDailyNorm>;
  variant: 'view' | 'modify';
};

const ListItem = ({ nutrient, variant, dailyNorm }: Props) => {
  const item = dailyNorm.nutrientIdToDailyNormItem.get(nutrient.id);
  if (!item) return null;

  const prev = useRef<number | null>(null);

  const handleNutrientChange = (nutrient: Nutrient, value: string) => {
    prev.current = null;
    if (value === '') {
      // Keep it empty instead of forcing 0
      dailyNorm.changeNutrientValue(nutrient.id, null);
      return;
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      dailyNorm.changeNutrientValue(nutrient.id, numericValue);
    }
  };

  const onFocus = (nutrient: Nutrient) => {
    prev.current = item?.quantity || null;
    dailyNorm.changeNutrientValue(nutrient.id, null);
  };

  const onBlur = () => {
    if (!prev.current) return;
    dailyNorm.changeNutrientValue(nutrient.id, prev.current);
  };

  return (
    <div key={nutrient.id} className={styles.row}>
      <label className={styles.label} htmlFor={nutrient.name}>
        {nutrient.displayNameRu}
      </label>

      <div className={styles.inputWrapper}>
        {variant === 'modify' ? (
          <>
            <input
              onFocus={() => onFocus(nutrient)}
              onBlur={onBlur}
              id={nutrient.name}
              type="number"
              inputMode="decimal"
              className={styles.input}
              value={item?.quantity ?? ''}
              onChange={(e) => handleNutrientChange(nutrient, e.target.value)}
            />
            <span className={styles.unit}>{nutrient.unitRu}</span>
          </>
        ) : (
          <span className={styles.textValue}>
            {item?.quantity ?? '—'} {nutrient.unitRu}
          </span>
        )}
      </div>
    </div>
  );
};

export default observer(ListItem);
