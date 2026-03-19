import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCard } from '@/entities/nutrient/ui/NutrientCard';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { useNutrientCard } from '@/entities/nutrient/ui/NutrientCard/useNutrientCard';
import styles from './ChangeProductNutrientValue.module.scss';

interface Props {
  content: Nutrient;
  getValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
}

const ChangeProductNutrientValue = ({ content, getValue, onChange }: Props) => {
  const { value, norm, unitRu } = useNutrientCard({ content, getValue });
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <NutrientCard content={content} getValue={getValue} showValues={false}>
      <div className={styles.inputRow} onClick={() => inputRef.current?.focus()}>
        <NumberInput
          ref={inputRef}
          value={value}
          onChange={(val) => onChange(val, content.id)}
          className={styles.input}
        />
        <span className={styles.norm}>
          / {norm} {unitRu}
        </span>
      </div>
    </NutrientCard>
  );
};

export default observer(ChangeProductNutrientValue);
