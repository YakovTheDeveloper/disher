import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { FormCreateEntityWithName } from '@/components/features/forms/FormCreateEntityWithName';
import { domainStore } from '@/store/store';

type Props = {
  close: () => void;
};

const DishAddDrawer = ({ close }: Props) => {
  const onFinish = (name: string) => {
    domainStore.interactionsService.modalInteractions.createDish(name);
  };

  return (
    <DrawerLayout>
      <FormCreateEntityWithName
        title="Создать новое блюдо"
        buttonText="Создать"
        onFinish={onFinish}
      />
    </DrawerLayout>
  );
};

export default observer(DishAddDrawer);
