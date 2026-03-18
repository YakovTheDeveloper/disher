import { useParams } from 'react-router';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';

const DishFoodDraftPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  // TODO: wire up dish item draft state (previously from domainStore.dishStore.getDraft())
  // For now, the DishFoodAdd component handles the draft internally
  const handleCommit = () => {
    // Draft commit is now handled via Triplit mutations
    // addDishItem({ dishId: id, foodId: draft.foodId, quantity: draft.quantity });
  };

  return (
    <DishFoodAdd
      dishId={id}
      dishChildItem={null as any}
      onCommit={handleCommit}
    />
  );
};

export default DishFoodDraftPage;
