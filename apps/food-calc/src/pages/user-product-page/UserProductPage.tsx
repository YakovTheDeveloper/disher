import { observer } from 'mobx-react-lite';
import Textarea from '@/components/ui/Textarea/Textarea';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { useMemo } from 'react';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { Label } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent/shared/Label';
import { HeaderInputName } from '@/components/features/builders/food/shared/components/HeaderInputName';

const UserProductPage = () => {
  const { id } = useParams<'id'>();
  const userFood = id ? domainStore.foodStore.getEntity(id) : undefined;
  if (!userFood) return;

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(userFood);

  const onNutrientChange = (value: number, nutrientId: string) =>
    userFood.changeNutrientValue(nutrientId, value);

  const getValue = (nutrientId: string) => {
    return userFood.nutrientsMap.get(nutrientId)?.quantity || 0;
  };

  return (
    <Screen
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      header={<HeaderInputName entity={userFood} />}
    >
      <Spacer variant="screen-header-offset" />
      <label>
        {/* <p>Описание</p> */}
        <Textarea
          value={userFood?.description || ''}
          onChange={(val) => userFood?.changeDescription(val || undefined)}
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

export default observer(UserProductPage);
