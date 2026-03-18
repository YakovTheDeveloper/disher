import { useParams } from 'react-router';
import { useDishItems } from '@/entities/dish';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';

const DishFoodPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  if (!id) {
    return <div>Блюдо не найдено</div>;
  }

  const { results: dishItems } = useDishItems(id);
  const child = dishItems?.find((item) => item.id === childId) ?? null;

  if (!child) {
    return <div>Блюдо не найдено</div>;
  }

  return <DishFoodAdd dishId={id} dishChildItem={child} onCommit={() => {}} />;
};

export default DishFoodPage;
