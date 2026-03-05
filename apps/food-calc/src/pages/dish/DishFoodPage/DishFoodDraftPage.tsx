import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';
import { useParams } from 'react-router';

const DishFoodDraftPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <DishFoodAdd
      dishId={id}
      dishStore={domainStore.dishStore}
      dishChildItem={domainStore.dishStore.itemDraft}
    />
  );
};

export default observer(DishFoodDraftPage);
