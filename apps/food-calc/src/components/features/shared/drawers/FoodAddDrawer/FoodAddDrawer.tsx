import { useState } from 'react';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { FormCreateEntityWithName } from '@/components/features/shared/forms/FormCreateEntityWithName';
import { Tabs } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { DrawerProps } from '@/types/common/drawer.v2';

type EntityType = 'product' | 'dish';

const tabs: Tab[] = [
  { value: 'product', label: 'Продукт', alternativeLabel: 'Продукт' },
  { value: 'dish', label: 'Блюдо', alternativeLabel: 'Блюдо' },
];

interface FoodAddDrawerProps extends DrawerProps {
  defaultTab?: EntityType;
}

const FoodAddDrawer = ({
  onClose,
  defaultTab = 'product',
}: FoodAddDrawerProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EntityType>(defaultTab);
  const handleCreate = async (name: string) => {
    if (activeTab === 'product') {
      const id = await createProduct({ name });
      navigate(`${RouterLinks.UserProduct}/${id}`);
    } else {
      const id = await createDish(name);
      navigate(`${RouterLinks.DishBuilder}/${id}`);
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

export default FoodAddDrawer;
