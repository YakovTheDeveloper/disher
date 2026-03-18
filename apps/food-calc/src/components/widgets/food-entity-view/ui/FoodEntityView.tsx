import { FC, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FoodEntityViewable, NutrientEditable } from '../types';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { NutrientCard } from '@/components/entities/nutrient/NutrientCard';
import ChangeProductNutrientValue from '@/components/features/product/change-product-nutrient-value/ChangeProductNutrientValue';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { Ornament } from '@/components/ui/Ornament';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { OpenDailyNorms } from '@/components/features/dailyNorms/OpenDailyNorms';
import { FoodPortionsManager } from '@/components/features/food/food-portions-manager';
import { ChangeName } from '@/components/features/shared/change-name';
import {
  useFilterNutrients,
  FilterNutrientsPanel,
  FilterNutrientCardWrapper,
} from '@/components/features/nutrients/filter-nutrients';
import { FilterButton } from '@/components/ui/atoms/Button';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import bagImage from '@/assets/decarative/bag.png';
import s from './FoodEntityView.module.scss';

type Props = {
  entity: FoodEntityViewable;
  /** Original MST node for TotalNutrientsStore (requires onPatch) */
  mstEntity: any;
  /** If provided, enables inline nutrient editing */
  nutrientEditable?: NutrientEditable;
  /** Screen title label */
  title?: string;
  /** Custom quantity input CSS class */
  quantityInputClassName?: string;
};

const FoodEntityView: FC<Props> = observer(
  ({ entity, mstEntity, nutrientEditable, title = 'Продукт', quantityInputClassName: _quantityInputClassName }) => {
    const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
    const [quantity, setQuantity] = useState(100);
    const filter = useFilterNutrients();
    nutrientStore.setEntity(mstEntity);

    const isEditable = entity.isEditable;
    const hasNutrientEdit = !!nutrientEditable;

    const getValue = (nutrientId: string) =>
      nutrientEditable ? nutrientEditable.getNutrientValue(nutrientId) : 0;

    const getScaledValue = (nutrientId: string) => getValue(nutrientId) * (quantity / 100);

    const onNutrientChange = (value: number, nutrientId: string) =>
      nutrientEditable?.changeNutrientValue(nutrientId, value);

    const renderCard = (nutrientData: Nutrient) => {
      const card = hasNutrientEdit ? (
        <ChangeProductNutrientValue
          content={nutrientData}
          getValue={getValue}
          onChange={onNutrientChange}
        />
      ) : (
        <NutrientCard
          content={nutrientData}
          getValue={getScaledValue}
          showValues={filter.showValues}
          showProgress={filter.showProgress}
        />
      );

      if (!hasNutrientEdit) {
        return (
          <FilterNutrientCardWrapper
            isHidden={filter.isHidden(nutrientData.id)}
            filterMode={filter.filterMode}
            onToggle={() => filter.toggleHidden(nutrientData.id)}
          >
            {card}
          </FilterNutrientCardWrapper>
        );
      }

      return card;
    };

    return (
      <Screen
        offsetTop
        title={<ScreenLabel variant="screenHeader">{title}</ScreenLabel>}
        bottomRight={
          !hasNutrientEdit ? (
            <FilterButton onClick={filter.toggleFilterMode} isActive={filter.filterMode} />
          ) : undefined
        }
        actions={
          filter.filterMode ? (
            <FilterNutrientsPanel
              showProgress={filter.showProgress}
              showValues={filter.showValues}
              onToggleProgress={filter.toggleShowProgress}
              onToggleValues={filter.toggleShowValues}
              onToggleFilterMode={filter.toggleFilterMode}
            />
          ) : (
            <div></div>
          )
        }
      >
        <img src={bagImage} className={s.backgroundImage} alt="" />
        <ChangeName entity={entity} />

        <Spacer variant="screen-header-offset" />

        <Ornament text="состав" />

        <TextBehind text="Количество" variant="elegant" position="middle-center">
          <div className={s.quantityInputWrapper}>
            <NumberInput
              value={hasNutrientEdit ? 100 : quantity}
              disabled={hasNutrientEdit}
              min={0}
              variant="underline"
              onChange={(val) => setQuantity(val)}
              bottom="грамм"
            />
          </div>
        </TextBehind>

        {isEditable && (
          <label>
            <Textarea
              value={entity.description || ''}
              onChange={(val) => entity.changeDescription(val || undefined)}
            />
          </label>
        )}

        <Nutrients renderCard={renderCard} store={nutrientStore} />

        <Ornament text="дневная норма" />

        <OpenDailyNorms />

        <Ornament text="порции" />

        <FoodPortionsManager
          portions={entity.portions}
          onAdd={(p) => entity.addPortion(p)}
          onUpdate={(label, updates) => entity.updatePortion(label, updates)}
          onRemove={(label) => entity.removePortion(label)}
        />
      </Screen>
    );
  }
);

export default FoodEntityView;
