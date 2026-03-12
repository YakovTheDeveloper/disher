import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { NutrientCard } from '@/components/entities/nutrient/NutrientCard';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import styles from './NutrientNormCard.module.scss';

interface Props {
  content: Nutrient;
  getNormValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
}

const NutrientNormCard = ({ content, getNormValue, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper} onClick={() => inputRef.current?.focus()}>
      <NutrientCard
        content={content}
        getValue={() => 0}
        showValues={false}
        showProgress={false}
        showPercent={false}
      >
        <div className={styles.inputRow}>
          <NumberInput
            ref={inputRef}
            value={getNormValue(content.id)}
            onChange={(value) => onChange(value, content.id)}
            className={styles.input}
          />
          <span className={styles.unit}>{content.unitRu}</span>
        </div>
      </NutrientCard>
    </div>
  );
};

export default observer(NutrientNormCard);
