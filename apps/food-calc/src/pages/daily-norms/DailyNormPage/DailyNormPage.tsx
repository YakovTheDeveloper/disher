import { Screen } from '@/shared/ui/Screen';
import { Spacer } from '@/shared/ui/atoms/Spacer';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { useParams } from 'react-router';
import { useDailyNorm, updateDailyNorm } from '@/entities/daily-norm';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { ChangeName } from '@/features/shared/change-name';
import { Ornament } from '@/shared/ui/Ornament';
import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import normsImg from '@/shared/assets/decarative/norms.png';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCard } from '@/entities/nutrient/ui/NutrientCard';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import Nutrients from '@/entities/nutrient/ui/NutrientGroup/Nutrients';

interface NutrientNormCardProps {
  content: Nutrient;
  getNormValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
  readOnly?: boolean;
}

const NutrientNormCard = observer(({ content, getNormValue, onChange, readOnly }: NutrientNormCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className={styles.normCardWrapper}
      onClick={() => !readOnly && inputRef.current?.focus()}
      style={readOnly ? { cursor: 'default' } : undefined}
    >
      <NutrientCard content={content} getValue={() => 0} showValues={false} showProgress={false} showPercent={false}>
        {readOnly ? (
          <span className={styles.normInput}>{getNormValue(content.id)}</span>
        ) : (
          <NumberInput
            ref={inputRef}
            value={getNormValue(content.id)}
            onChange={(value) => onChange(value, content.id)}
            className={styles.normInput}
          />
        )}
        <span className={styles.normUnit}>{content.unitRu}</span>
      </NutrientCard>
    </div>
  );
});
import styles from './DailyNormPage.module.scss';

type Props = {};

const DailyNormPage = ({}: Props) => {
  const { id } = useParams<'id'>();
  const { result: dailyNorm } = useDailyNorm(id);

  const createdByUser = dailyNorm?.userId !== '__system__';
  const dailyNormsView = createdByUser ? 'modify' : 'view';

  if (!dailyNorm) {
    console.error('Daily norm not found for id:', id);
    return null;
  }

  const entityForChangeName = {
    name: dailyNorm.name,
    changeName: (name: string) => updateDailyNorm(dailyNorm.id, { name }),
  };

  const readOnly = dailyNormsView === 'view';
  const dn = dailyNorm as any;

  const getNormValue = (id: string) => dn.nutrientIdToDailyNormItem?.get(id)?.quantity ?? 0;

  const handleChange = (value: number, nutrientId: string) => {
    dn.changeNutrientValue?.(nutrientId, value);
  };

  const renderCard = (nutrient: Nutrient) => (
    <NutrientNormCard
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
      <ChangeName entity={entityForChangeName} canRename={createdByUser} />
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

export default DailyNormPage;
