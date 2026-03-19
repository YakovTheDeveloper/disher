import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { NutrientCard } from '@/entities/nutrient/ui/NutrientCard';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import styles from './NutrientNormCard.module.scss';

interface Props {
  content: Nutrient;
  getNormValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
  readOnly?: boolean;
}

const NutrientNormCard = ({ content, getNormValue, onChange, readOnly }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={styles.wrapper}
      onClick={() => !readOnly && inputRef.current?.focus()}
      style={readOnly ? { cursor: 'default' } : undefined}
    >
      <NutrientCard
        content={content}
        getValue={() => 0}
        showValues={false}
        showProgress={false}
        showPercent={false}
      >
        {readOnly ? (
          <span className={styles.input}>{getNormValue(content.id)}</span>
        ) : (
          <NumberInput
            ref={inputRef}
            value={getNormValue(content.id)}
            onChange={(value) => onChange(value, content.id)}
            className={styles.input}
          />
        )}
        <span className={styles.unit}>{content.unitRu}</span>
      </NutrientCard>
    </div>
  );
};

export default observer(NutrientNormCard);
