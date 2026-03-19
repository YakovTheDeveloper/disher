import styles from './ListItem.module.scss';
import { useRef } from 'react';
import type { DailyNorm as UserDailyNorm } from '@/entities/daily-norm';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';

type Props = {
  nutrient: Nutrient;
  dailyNorm: UserDailyNorm;
  variant: 'view' | 'modify';
};

const ListItem = ({ nutrient, variant, dailyNorm }: Props) => {
  // TODO: migrate to Triplit — dailyNorm no longer has nutrientIdToDailyNormItem or changeNutrientValue
  const dn = dailyNorm as any;
  const item = dn.nutrientIdToDailyNormItem?.get(nutrient.id);
  if (!item) return null;

  const prev = useRef<number | null>(null);

  const handleNutrientChange = (nutrient: Nutrient, value: string) => {
    prev.current = null;
    if (value === '') {
      dn.changeNutrientValue?.(nutrient.id, null);
      return;
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      dn.changeNutrientValue?.(nutrient.id, numericValue);
    }
  };

  const onFocus = (nutrient: Nutrient) => {
    prev.current = item?.quantity || null;
    dn.changeNutrientValue?.(nutrient.id, null);
  };

  const onBlur = () => {
    if (!prev.current) return;
    dn.changeNutrientValue?.(nutrient.id, prev.current);
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

export default ListItem;
