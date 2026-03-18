import { useRef, useState } from 'react';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import toaster from '@/infrastructure/toaster/toaster';
import styles from './CopyProductsToDish.module.scss';
import { isEmpty } from 'lodash';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { SimpleListItem } from '@/components/ui/list-item/SimpleListItem';
import { useDishStore } from '@/app/stores/helpers';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';

type Props = {
  children?: React.ReactNode;
  items: {
    id: string;
    contentProduct: any; // product content with name, foodId, quantity
  }[];

  dishId: string;

  onFinish?: (dishId: string, selectedProductIds: string[]) => void;
  onClose: () => void;
  intent: 'copy-to-existing-dish' | 'create-dish-and-copy';
};

const CopyProductsToDish = ({ dishId, children, items, onFinish, onClose, intent }: Props) => {
  const editableListRef = useRef<EditableListRef>(null);
  const [step, setStep] = useState<'getDish' | 'fixProducts'>('getDish');

  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  const dishStore = useDishStore();

  const resetState = () => {
    setStep('getDish');
    setSelectedDishId(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDishSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    setSelectedDishId(payload.id);
    setStep('fixProducts');
  };

  const confirmCreateDish = () => {
    const nameInput = document.getElementById('search') as HTMLInputElement;
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

    // TODO: migrate to Triplit mutation — create dish with products
    const createdDishId = '';

    toaster.success(`Блюдо "${name}" создано`);

    if (onFinish) {
      onFinish(createdDishId, selectedIds.asArray);
    }

    resetState();
    onClose();
  };

  return (
    <>
      <BaseOverlayContentLayout
        content={
          <>
            <div className={step !== 'getDish' ? styles.hidden : ''}>
              {intent === 'copy-to-existing-dish' && (
                <SearchFood
                  currentDishId={selectedDishId}
                  onFinish={handleDishSelect}
                  mode="dishes-only"
                />
              )}
              {intent === 'create-dish-and-copy' && (
                <TextBehind text="Блюдо">
                  <TextInput id="dish-name-input" maxLength={255} />
                </TextBehind>
              )}
            </div>
            <div className={step !== 'fixProducts' ? styles.hidden : ''}>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => item.contentProduct.name}
              />
            </div>
          </>
        }
        supFooter={children}
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
};

export default CopyProductsToDish;
