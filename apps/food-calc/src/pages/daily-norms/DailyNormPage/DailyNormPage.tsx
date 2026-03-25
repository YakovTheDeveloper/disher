import { Screen } from '@/shared/ui/Screen';
import { Spacer } from '@/shared/ui/atoms/Spacer';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { useParams } from 'react-router';
import { useDailyNorm, updateDailyNorm, setDailyNormNutrient } from '@/entities/daily-norm';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { ChangeName } from '@/features/shared/change-name';
import { Ornament } from '@/shared/ui/Ornament';
import { useRef } from 'react';
import NutrientCardV3 from '@/entities/nutrient/ui/NutrientCard/NutrientCardV3';
import NutrientInput from '@/entities/nutrient/ui/NutrientCard/NutrientInput';
import normsImg from '@/shared/assets/decarative/norms.png';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import type { DailyNormItems } from '@/entities/daily-norm';
import Nutrients from '@/entities/nutrient/ui/NutrientGroup/Nutrients';
import styles from './DailyNormPage.module.scss';

const DailyNormPage = () => {
  const { id } = useParams<'id'>();
  const { result: dailyNorm } = useDailyNorm(id);

  const createdByUser = dailyNorm?.userId !== '__system__';
  const readOnly = !createdByUser;

  if (!dailyNorm) {
    console.error('Daily norm not found for id:', id);
    return null;
  }

  const items = (dailyNorm.items ?? {}) as DailyNormItems;
  const handleChangeName = (name: string) => updateDailyNorm(dailyNorm.id, { name });

  const getNormValue = (nutrientId: string) => items[nutrientId] ?? 0;

  const handleChange = (value: number, nutrientId: string) => {
    setDailyNormNutrient(dailyNorm.id, nutrientId, value || null);
  };

  const renderCard = (nutrient: Nutrient) => (
    <NormCard
      content={nutrient}
      getNormValue={getNormValue}
      onChange={handleChange}
      readOnly={readOnly}
    />
  );

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Норма</ScreenLabel>}
    >
      <img src={normsImg} className={styles.backgroundImage} alt="" />
      <ChangeName name={dailyNorm.name} onChangeName={handleChangeName} canRename={createdByUser} />
      <Spacer variant="screen-header-offset" />
      <Ornament text="описание дневной нормы"></Ornament>
      <label>
        <Textarea
          disabled={!createdByUser}
          value={dailyNorm?.description || ''}
          onChange={(val) => updateDailyNorm(dailyNorm.id, { description: val || '' })}
        />
      </label>
      <Ornament text="нутриенты"></Ornament>
      <section className={styles.dailyNormNutrients}>
        <Nutrients renderCard={renderCard} />
      </section>
    </Screen>
  );
};

interface NormCardProps {
  content: Nutrient;
  getNormValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
  readOnly: boolean;
}

const NormCard = ({ content, getNormValue, onChange, readOnly }: NormCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const normValue = getNormValue(content.id);

  if (readOnly) {
    return (
      <NutrientCardV3 content={content} showValue={false}>
        <span>{normValue} {content.unitRu}</span>
      </NutrientCardV3>
    );
  }

  return (
    <NutrientCardV3
      content={content}
      showValue={false}
      onClick={() => inputRef.current?.focus()}
    >
      <NutrientInput
        ref={inputRef}
        value={normValue}
        onChange={(value) => onChange(value, content.id)}
        unit={content.unitRu}
      />
    </NutrientCardV3>
  );
};

export default DailyNormPage;
