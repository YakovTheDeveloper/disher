import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { FormCreateEntityWithName } from '@/components/features/shared/forms/FormCreateEntityWithName';
import { Tabs } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { ModalInteractionsInstance } from '@/store/interactions/modalInteractions/ModalInteractions';
import { DrawerProps } from '@/types/common/drawer.v2';

type EntityType = 'product' | 'dish';

const tabs: Tab[] = [
  { value: 'product', label: 'Продукт', alternativeLabel: 'Продукт' },
  { value: 'dish', label: 'Блюдо', alternativeLabel: 'Блюдо' },
];

interface FoodAddDrawerProps extends DrawerProps {
  modalInteractionsStore?: ModalInteractionsInstance;
  defaultTab?: EntityType;
}

const FoodAddDrawer = ({
  onClose,
  defaultTab = 'product',
  modalInteractionsStore = domainStore.interactionsService.modalInteractions,
}: FoodAddDrawerProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EntityType>(defaultTab);
  const handleCreate = (name: string) => {
    if (activeTab === 'product') {
      const id = modalInteractionsStore.createProduct(name);
      navigate(`${RouterLinks.UserProduct}/${id}`);
    } else {
      modalInteractionsStore.createDish(name);
      navigate(`${RouterLinks.DishBuilder}`);
    }
    onClose();
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

export default observer(FoodAddDrawer);
