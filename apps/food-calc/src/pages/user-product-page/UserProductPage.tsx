import { observer } from 'mobx-react-lite';
import EditableText from '@/components/ui/EditableText/EditableText';
import Textarea from '@/components/ui/Textarea/Textarea';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { useMemo } from 'react';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';

const UserProductPage = () => {
  const { id } = useParams<'id'>();
  const userFood = id ? domainStore.foodStore.getUserFoodById(id) : undefined;
  if (!userFood) return;

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(userFood);

  const onNutrientChange = (value: number, nutrientId: string) =>
    userFood.changeNutrientValue(nutrientId, value);

  const getValue = (nutrientId: string) => {
    return userFood.nutrientsMap.get(nutrientId)?.quantity;
  };

  return (
    <Screen
      title={<ScreenLabel variant="screenHeader">Продукт</ScreenLabel>}
      // header={(scrollYProgress: MotionValue<number>) => (
      //   <Navigation scrollYProgress={scrollYProgress}></Navigation>
      // )}
    >
      <Spacer variant="screen-header-offset" />
      <label>
        <p>Имя</p>
        <EditableText value={userFood?.name || ''} onChange={(val) => userFood?.changeName(val)} />
      </label>
      <label>
        <p>Описание</p>
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
