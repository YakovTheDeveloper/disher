import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { Instance } from 'mobx-state-tree';
import { ScheduleFoodsItem } from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { domainStore } from '@/store/store';
import toaster from '@/infrastructure/toaster/toaster';
import styles from './CreateDishFromProductList.module.scss';
import { FoodContentProductInstance } from '@/domain/shared/foodContent/foodContent';

type InputModel = { contentProduct: FoodContentProductInstance };

type Props = {
  children?: React.ReactNode;
  items: InputModel[];
  onFinish?: (dishId: string) => void;
};

const CreateDishFromProductList = observer(({ children, items, onFinish }: Props) => {
  const editableListRef = useRef<EditableListRef<Instance<typeof ScheduleFoodsItem>>>(null);

  const confirmCreateDish = () => {
    const nameInput = document.getElementById('search') as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      toaster.error('Введите название блюда');
      return;
    }

    const payload = editableListRef.current?.getItems().map((item) => item.contentProduct);
    const dishId = domainStore.dishStore.createDishWithProductsContent(name, payload);

    if (onFinish) {
      onFinish(dishId);
    }

    toaster.success(`Блюдо "${name}" создано`);
    close();
  };

  return (
    <>
      <BaseOverlayContentLayout
        header={
          <TextBehind text="Блюдо">
            <TextInput id="search" maxLength={255} />
          </TextBehind>
        }
        content={
          <EditableList
            ref={editableListRef}
            items={items}
            renderItem={(item) => item.content?.name}
          />
        }
        supFooter={children}
        footer={
          <>
            <button className={styles.createNewDishFormButton} onClick={close}>
              Назад
            </button>
            <button className={styles.createNewDishFormButton} onClick={confirmCreateDish}>
              Создать блюдо
            </button>
          </>
        }
      />
    </>
  );
});

export default CreateDishFromProductList;
