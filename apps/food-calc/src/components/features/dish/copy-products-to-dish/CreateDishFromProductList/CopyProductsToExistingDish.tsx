import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { FoodContentProductInstance } from '@/domain/shared/foodContent/foodContent';
import styles from './CopyProductsToExistingDish.module.scss';
import { useRef } from 'react';

type Props = {
  items: {
    id: string;
    contentProduct: FoodContentProductInstance;
  }[];

  onFinish?: (dishId: string, selectedProductIds: string[]) => void;
  onClose: () => void;
};

const CopyProductsToExistingDish = observer(({ items, onFinish, onClose }: Props) => {
  const editableListRef = useRef<EditableListRef>(null);
  const [step, setStep] = useState<'selectDish' | 'fixProducts'>('selectDish');

  const handleDishSelect = () => {
    setStep('fixProducts');
  };

  const handleConfirm = () => {
    const selectedIds = editableListRef.current?.getResultedItemsIds();

    if (!selectedIds || selectedIds.asArray.length === 0) {
      return;
    }

    if (onFinish) {
      onFinish('', selectedIds.asArray);
    }

    setStep('selectDish');
    onClose();
  };

  const handleBack = () => {
    setStep('selectDish');
  };

  const handleClose = () => {
    setStep('selectDish');
    onClose();
  };

  return (
    <>
      <BaseOverlayContentLayout
        content={
          <>
            <SearchFood
              onFinish={handleDishSelect}
              mode="dishes-only"
              className={step !== 'selectDish' ? styles.hidden : ''}
            />
            <div className={step !== 'fixProducts' ? styles.hidden : ''}>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => item.contentProduct.name}
              />
            </div>
          </>
        }
        footer={
          <>
            <button
              className={styles.createNewDishFormButton}
              onClick={step === 'selectDish' ? handleClose : handleBack}
            >
              Назад
            </button>
            <button
              className={styles.createNewDishFormButton}
              onClick={handleConfirm}
              disabled={step !== 'fixProducts'}
            >
              Выбрать
            </button>
          </>
        }
      />
    </>
  );
});

export default CopyProductsToExistingDish;
