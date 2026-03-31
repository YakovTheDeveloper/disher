import { useState } from 'react';
import { useStore } from '@livestore/react';
import { Screen } from '@/shared/ui/Screen';
import { Spacer } from '@/shared/ui/atoms/Spacer';

import { useParams } from 'react-router';
import {
  useDailyNorm,
  updateDailyNorm,
  setDailyNormNutrient,
  DEFAULT_NORM_ID,
  DEFAULT_NORM,
  SPORTS_NORM_ID,
  SPORTS_NORM,
  BASE_WEIGHT_KG,
} from '@/entities/daily-norm';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { ChangeName } from '@/features/shared/change-name';
import { Ornament } from '@/shared/ui/Ornament';
import NutrientCardV3 from '@/entities/nutrient/ui/NutrientCard/NutrientCardV3';
import NutrientInput from '@/entities/nutrient/ui/NutrientCard/NutrientInput';
import normsImg from '@/shared/assets/decarative/norms.png';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import type { DailyNormItems } from '@/entities/daily-norm';
import Nutrients from '@/entities/nutrient/ui/NutrientGroup/Nutrients';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DailyNormPage.module.scss';

const SYSTEM_NORMS: Record<string, typeof DEFAULT_NORM> = {
  [DEFAULT_NORM_ID]: DEFAULT_NORM,
  [SPORTS_NORM_ID]: SPORTS_NORM,
};

const DailyNormPage = () => {
  const { store } = useStore();
  const { id } = useParams<'id'>();
  const fetchedNorm = useDailyNorm(id);
  const systemNorm = id ? SYSTEM_NORMS[id] : undefined;
  const dailyNorm = systemNorm ? (fetchedNorm ?? systemNorm) : fetchedNorm;

  const createdByUser = dailyNorm?.userId !== '__system__';
  const readOnly = !createdByUser;

  const [weight, setWeight] = useState<number>(() => {
    const saved = localStorage.getItem('dailyNormWeight');
    return saved ? Number(saved) : BASE_WEIGHT_KG;
  });

  const handleWeightChange = (val: number) => {
    const clamped = Math.max(30, Math.min(250, val || BASE_WEIGHT_KG));
    setWeight(clamped);
    localStorage.setItem('dailyNormWeight', String(clamped));
  };

  if (!dailyNorm) {
    console.error('Daily norm not found for id:', id);
    return null;
  }

  const items = (typeof dailyNorm.items === 'string' ? JSON.parse(dailyNorm.items) : dailyNorm.items ?? {}) as DailyNormItems;
  const handleChangeName = (name: string) => safeMutate(() => updateDailyNorm(store, dailyNorm.id, { name }), 'Не удалось переименовать');

  const getNormValue = (nutrientId: string) => {
    const baseValue = items[nutrientId] ?? 0;
    if (!createdByUser && baseValue > 0) {
      return Math.round((baseValue / BASE_WEIGHT_KG) * weight * 100) / 100;
    }
    return baseValue;
  };

  const handleChange = (value: number, nutrientId: string) => {
    safeMutate(() => setDailyNormNutrient(store, dailyNorm.id, nutrientId, value || null, items), 'Не удалось сохранить нутриент');
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
    <Screen title={<ScreenLabel variant="screenHeader">Норма</ScreenLabel>}>
      <div className={styles.content}>
        <ScreenLabel variant="screenHeader">Дневная норма</ScreenLabel>
        <Spacer variant="screen-header-offset" />
        <img src={normsImg} className={styles.backgroundImage} alt="" />
        <Ornament text="название"></Ornament>
        <ChangeName name={dailyNorm.name} onChangeName={handleChangeName} canRename={createdByUser} />
        <Spacer variant="screen-header-offset" />
        {!createdByUser && (
          <>
            <Ornament text="ваш вес"></Ornament>
            <div className={styles.weightInput}>
              <NutrientInput
                value={weight}
                onChange={handleWeightChange}
                unit="кг"
              />
            </div>
            <Spacer variant="screen-header-offset" />
          </>
        )}
        <Ornament text="нутриенты"></Ornament>
        <section className={styles.dailyNormNutrients}>
          <Nutrients renderCard={renderCard} excludeGroups={['aminoAcids']} />
        </section>
      </div>
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
  const normValue = getNormValue(content.id);

  if (readOnly) {
    return (
      <NutrientCardV3 content={content} showValue={false}>
        <span>
          {normValue} {content.unitRu}
        </span>
      </NutrientCardV3>
    );
  }

  return (
    <NutrientCardV3 content={content} showValue={false} asLabel>
      <NutrientInput
        value={normValue}
        onChange={(value) => onChange(value, content.id)}
        unit={content.unitRu}
      />
    </NutrientCardV3>
  );
};

export default DailyNormPage;
