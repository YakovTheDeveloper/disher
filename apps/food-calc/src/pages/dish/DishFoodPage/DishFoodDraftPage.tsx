import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';
import { useParams } from 'react-router';

const DishFoodDraftPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  const draft = domainStore.dishStore.getDraft();

  const handleCommit = () => {
    domainStore.dishStore.commitDraft(id);
  };

  return (
    <DishFoodAdd
      dishId={id}
      dishChildItem={draft}
      onCommit={handleCommit}
    />
  );
};

export default observer(DishFoodDraftPage);
