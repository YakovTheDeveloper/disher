import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useProduct,
  useProductPortions,
  useProductNutrients,
  setProductNutrient,
  updateProduct,
  addProductPortion,
  updateProductPortion,
  removeProductPortion,
} from '@/entities/product';
import { Nutrients } from '@/entities/nutrient/ui/NutrientGroup';
import { NutrientCard } from '@/entities/nutrient/ui/NutrientCard';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import ChangeProductNutrientValue from '@/components/features/product/change-product-nutrient-value/ChangeProductNutrientValue';
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
import s from './ProductPage.module.scss';

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const { result: food } = useProduct(id);
  const { results: portionsRaw } = useProductPortions(id);
  const { results: nutrientsRaw } = useProductNutrients(id);
  const [quantity, setQuantity] = useState(100);
  const filter = useFilterNutrients();

  if (!food) return null;

  const isUserCreated = food.userId !== '__system__';

  const nutrientValueMap = new Map<string, number>();
  for (const n of nutrientsRaw ?? []) {
    nutrientValueMap.set(n.nutrientId, n.quantity);
  }

  const getNutrientValue = (nutrientId: string) => nutrientValueMap.get(nutrientId) ?? 0;
  const getScaledValue = (nutrientId: string) => getNutrientValue(nutrientId) * (quantity / 100);

  const portions = (portionsRaw ?? []).map((p) => ({
    label: p.label,
    amount: p.amount,
    unit: p.unit,
    grams: p.grams,
  }));

  const renderCard = (nutrientData: Nutrient) => {
    if (isUserCreated) {
      return (
        <ChangeProductNutrientValue
          content={nutrientData}
          getValue={getNutrientValue}
          onChange={(value, nutrientId) => setProductNutrient(food.id, nutrientId, value)}
        />
      );
    }

    return (
      <FilterNutrientCardWrapper
        isHidden={filter.isHidden(nutrientData.id)}
        filterMode={filter.filterMode}
        onToggle={() => filter.toggleHidden(nutrientData.id)}
      >
        <NutrientCard
          content={nutrientData}
          getValue={getScaledValue}
          showValues={filter.showValues}
          showProgress={filter.showProgress}
        />
      </FilterNutrientCardWrapper>
    );
  };

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      bottomRight={
        !isUserCreated ? (
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
      <ChangeName
        entity={{
          name: food.name,
          changeName: (name) => updateProduct(food.id, { name }),
        }}
      />

      <Spacer variant="screen-header-offset" />

      <Ornament text="состав" />

      <TextBehind text="Количество" variant="elegant" position="middle-center">
        <div className={s.quantityInputWrapper}>
          <NumberInput
            value={isUserCreated ? 100 : quantity}
            disabled={isUserCreated}
            min={0}
            variant="underline"
            onChange={(val) => setQuantity(val)}
            bottom="грамм"
          />
        </div>
      </TextBehind>

      {isUserCreated && (
        <label>
          <Textarea
            value={food.description || ''}
            onChange={(val) => updateProduct(food.id, { description: val || '' })}
          />
        </label>
      )}

      <Nutrients renderCard={renderCard} />

      <Ornament text="дневная норма" />

      <OpenDailyNorms />

      <Ornament text="порции" />

      <FoodPortionsManager
        portions={portions}
        onAdd={(p) => addProductPortion(food.id, p)}
        onUpdate={(label, updates) => {
          const portion = portionsRaw?.find((p) => p.label === label);
          if (portion) updateProductPortion(portion.id, updates);
        }}
        onRemove={(label) => {
          const portion = portionsRaw?.find((p) => p.label === label);
          if (portion) removeProductPortion(portion.id);
        }}
      />
    </Screen>
  );
};

export default ProductPage;
