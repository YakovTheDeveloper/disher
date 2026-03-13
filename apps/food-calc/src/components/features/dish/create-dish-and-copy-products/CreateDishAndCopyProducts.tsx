import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { domainStore } from '@/store/store';
import toaster from '@/infrastructure/toaster/toaster';
import styles from './CreateDishAndCopyProducts.module.scss';
import { isEmpty } from 'lodash';
import { FoodContentProductInstance } from '@/domain/shared/foodContent/foodContent';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { LabeledCheckbox } from '@/components/ui/LabeledCheckbox';

type Props = {
  children?: React.ReactNode;
  items: {
    id: string;
    contentProduct: FoodContentProductInstance;
  }[];

  onFinish?: (dishId: string, selectedProductIds: string[]) => void;
  onClose: () => void;
};

const CreateDishAndCopyProducts = observer(({ children, items, onFinish, onClose }: Props) => {
  const editableListRef = useRef<EditableListRef>(null);
  const [step, setStep] = useState<'getDishName' | 'fixProducts'>('getDishName');
  const swapProductsToDishCheckboxInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('getDishName');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const confirmCreateDish = () => {
    const nameInput = document.getElementById('dish-name-input') as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      toaster.error('Введите название блюда');
      return;
    }

    const selectedIds = editableListRef.current?.getResultedItemsIds();

    if (!selectedIds || isEmpty(selectedIds)) {
      toaster.error('Выберите хотя бы 1 продукт');
      return;
    }

    const finalContent = items
      .filter(({ id }) => selectedIds.asSet.has(id))
      .map(({ contentProduct }) => contentProduct);

    const dishId = domainStore.dishStore.createDishWithProductsContent(name, finalContent);

    toaster.success(`Блюдо "${name}" создано`);

    if (onFinish) {
      onFinish(dishId, selectedIds.asArray);
    }

    resetState();
    onClose();
  };

  const onCreateDishAndCopyFinish = (dishId: string, selectedProductIds: string[]) => {
    if (swapProductsToDishCheckboxInputRef.current?.checked) {
      schedule.swapProductsToDish(selectedProductIds, dishId);
    }
    closeDishCreateModal();
  };

  return (
    <>
      <BaseOverlayContentLayout
        header={
          <div>
            <h2>Как назовете блюдо?</h2>
            <TextBehind text="Блюдо">
              <TextInput id="dish-name-input" maxLength={255} />
            </TextBehind>
          </div>
        }
        content={
          <>
            <h2>Корректный список?</h2>
            <EditableList
              ref={editableListRef}
              items={items}
              renderItem={(item) => item.contentProduct.name}
            />
          </>
        }
        supFooter={
          <LabeledCheckbox
            ref={swapProductsToDishCheckboxInputRef}
            label="Заменить выбранные продукты на новое блюдо"
          />
        }
        footer={
          <>
            <button className={styles.createNewDishFormButton} onClick={handleClose}>
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

export default CreateDishAndCopyProducts;
