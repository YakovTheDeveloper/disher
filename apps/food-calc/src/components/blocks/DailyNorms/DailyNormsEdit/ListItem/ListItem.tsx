import { observer } from 'mobx-react-lite';
import styles from './ListItem.module.scss';
import { Nutrient } from '@/components/blocks/DailyNorms/DailyNormsEdit/DailyNormsEdit';
import { DailyNormsViewModel } from '@/components/blocks/DailyNorms/viewModel/DailyNormsViewModel';
import { useRef } from 'react';

type Props = {
  nutrient: Nutrient;
  store: DailyNormsViewModel;
  variant: 'view' | 'modify';
};

const ListItem = ({ nutrient, store, variant }: Props) => {
  const current = store.current?.items.find((i) => i.nutrientId === nutrient.id);

  const prev = useRef<number | null>(null);

  const handleNutrientChange = (nutrient: Nutrient, value: string) => {
    prev.current = null;
    if (value === '') {
      // Keep it empty instead of forcing 0
      store.updateCurrentNormNutrient(nutrient.id, null);
      return;
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      store.updateCurrentNormNutrient(nutrient.id, numericValue);
    }
  };

  const onFocus = (nutrient: Nutrient) => {
    prev.current = current?.quantity || null;
    store.updateCurrentNormNutrient(nutrient.id, null);
  };

  const onBlur = () => {
    if (!prev.current) return;
    store.updateCurrentNormNutrient(nutrient.id, prev.current);
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
              value={current?.quantity ?? ''}
              onChange={(e) => handleNutrientChange(nutrient, e.target.value)}
            />
            <span className={styles.unit}>{nutrient.unitRu}</span>
          </>
        ) : (
          <span className={styles.textValue}>
            {current?.quantity ?? '—'} {nutrient.unitRu}
          </span>
        )}
      </div>
    </div>
  );
};

export default observer(ListItem);
