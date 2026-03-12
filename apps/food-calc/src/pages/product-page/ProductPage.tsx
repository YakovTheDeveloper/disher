import { observer } from 'mobx-react-lite';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { useMemo, useState } from 'react';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { HeaderInputName } from '@/components/features/builders/shared/components/HeaderInputName';
import { NutrientCard } from '@/components/entities/nutrient/NutrientCard';
import ChangeProductNutrientValue from '@/components/features/product/change-product-nutrient-value/ChangeProductNutrientValue';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';
import styles from './ProductPage.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { Typography } from '@/components/ui/atoms/Typography';
import { BrandMark } from '@/components/ui/BrandMark';
import { Ornament } from '@/components/ui/Ornament';
import bagImage from '@/assets/decarative/bag.png';

const ProductPage = () => {
  const { id } = useParams<'id'>();
  const food = id ? domainStore.foodStore.getEntity(id) : undefined;

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  const [quantity, setQuantity] = useState(100);

  if (!food) return null;

  nutrientStore.setEntity(food);

  const isEditable = food.createdByUser;

  const onNutrientChange = (value: number, nutrientId: string) =>
    food.changeNutrientValue(nutrientId, value);

  const getValue = (nutrientId: string) => food.nutrientsMap.get(nutrientId)?.quantity || 0;
  const getScaledValue = (nutrientId: string) => getValue(nutrientId) * (quantity / 100);

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      // header={<HeaderInputName entity={food} asInput={isEditable} />}
    >
      <BrandMark size={40} variant="wave" />
      <Typography variant="elegant">{food.name}</Typography>
      <Spacer variant="screen-header-offset" />
      <img src={bagImage} className={styles.backgroundImage} style={{ opacity: 0.05 }} alt="" />
      <Ornament text="состав" />
      <TextBehind text="Количество" variant="elegant">
        <NumberInput
          className={styles.quantityInput}
          value={isEditable ? 100 : quantity}
          disabled={isEditable}
          min={0}
          variant="underline"
          onChange={(val) => setQuantity(val)}
          bottom="грамм"
        />
      </TextBehind>
      {isEditable && (
        <label>
          <Textarea
            value={food.description || ''}
            onChange={(val) => food.changeDescription(val || undefined)}
          />
        </label>
      )}

      <Nutrients
        renderCard={(nutrientData: Nutrient) =>
          isEditable ? (
            <ChangeProductNutrientValue
              content={nutrientData}
              getValue={getValue}
              onChange={onNutrientChange}
            />
          ) : (
            <NutrientCard content={nutrientData} getValue={getScaledValue} />
          )
        }
        store={nutrientStore}
      />
    </Screen>
  );
};

export default observer(ProductPage);
