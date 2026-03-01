import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { DishFoodAdd } from '@/components/features/builders/DishBuilder/components/drawer/DishFoodAdd';

const DishDraftPage = () => {
  return (
    <DishFoodAdd
      dishStore={domainStore.dishStore}
      foodStore={domainStore.foodStore}
      dishChildItem={domainStore.dishStore.itemDraft}
    />
  );
};

export default observer(DishDraftPage);
