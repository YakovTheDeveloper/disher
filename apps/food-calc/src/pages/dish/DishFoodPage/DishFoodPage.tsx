import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { useParams } from 'react-router';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';

const DishFoodPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  if (!id) {
    return <div>Блюдо не найдено</div>;
  }

  const child = domainStore.dishStore.getEntity(id)?.getChildById(childId || '') || null;

  if (!child) {
    return <div>Блюдо не найдено</div>;
  }

  return (
    <DishFoodAdd
      dishStore={domainStore.dishStore}
      foodStore={domainStore.foodStore}
      dishChildItem={child}
    />
  );
};

export default observer(DishFoodPage);
