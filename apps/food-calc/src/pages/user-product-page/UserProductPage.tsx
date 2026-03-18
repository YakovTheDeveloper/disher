import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { useParams } from 'react-router-dom';
import { useProduct, updateProduct, setProductNutrient } from '@/entities/product';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { useMemo } from 'react';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { HeaderInputName } from '@/components/features/builders/shared/components/HeaderInputName';
import { Label } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/shared/Label';

const UserProductPage = () => {
  const { id } = useParams<'id'>();
  const { result: userFood } = useProduct(id);

  if (!userFood) return null;

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(userFood);

  const onNutrientChange = (value: number, nutrientId: string) =>
    setProductNutrient(userFood.id, nutrientId, value);

  const getValue = (nutrientId: string) => {
    // TODO: use useProductNutrients hook for reactive nutrient values
    return 0;
  };

  return (
    <Screen
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      header={<HeaderInputName entity={userFood} />}
    >
      <Spacer variant="screen-header-offset" />
      <label>
        <Textarea
          value={userFood?.description || ''}
          onChange={(val) => updateProduct(userFood.id, { description: val || '' })}
        />
      </label>
      <Nutrients
        asControlledForm
        store={nutrientStore}
        onChange={onNutrientChange}
        getValue={getValue}
      ></Nutrients>
    </Screen>
  );
};

export default UserProductPage;
