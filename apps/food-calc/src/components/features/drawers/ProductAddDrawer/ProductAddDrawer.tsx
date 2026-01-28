import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { FormCreateEntityWithName } from '@/components/features/forms/FormCreateEntityWithName';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { ModalInteractionsInstance } from '@/store/interactions/modalInteractions/ModalInteractions';

type Props = {
  close: () => void;
  modalInteractionsStore?: ModalInteractionsInstance;
};

type EntityType = 'product' | 'dish';

const tabs = [
  { value: 'product' as EntityType, label: 'Продукт', alternativeLabel: 'Продукт' },
  { value: 'dish' as EntityType, label: 'Блюдо', alternativeLabel: 'Блюдо' },
] as const;

const ProductAddDrawer = ({
  modalInteractionsStore = domainStore.interactionsService.modalInteractions,
}: Props) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EntityType>('product');

  const handleCreate = (name: string) => {
    if (activeTab === 'product') {
      const id = modalInteractionsStore.createProduct(name);
      navigate(`${RouterLinks.UserProduct}/${id}`);
    } else {
      modalInteractionsStore.createDish(name);
      navigate(`${RouterLinks.DishBuilder}`);
    }
  };

  const title = activeTab === 'product' ? 'Создать новый продукт' : 'Создать новое блюдо';

  return (
    <DrawerLayout>
      <Tabs
        tabs={tabs}
        current={activeTab}
        setTab={(tab) => setActiveTab(tab as EntityType)}
        variant="foodCreate"
      />
      <FormCreateEntityWithName title={title} buttonText="Создать" onFinish={handleCreate} />
    </DrawerLayout>
  );
};

export default observer(ProductAddDrawer);
