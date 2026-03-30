import { useState } from 'react';
import { useStore } from '@livestore/react';
import { format, startOfToday } from 'date-fns';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { BaseOverlayContentLayout } from '@/shared/ui/layout/overlay/BaseOverlayContentLayout';
import { ScheduleSelection } from '@/features/ScheduleSelection';
import { useProduct } from '@/entities/product';
import { addScheduleFood } from '@/entities/schedule-food';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './AddProductToDayScheduleOverlay.module.scss';

interface Props extends BaseDrawerProps {
  productId: string;
}

const AddProductToDayScheduleOverlay = ({ productId, onClose }: Props) => {
  const { store } = useStore();
  const product = useProduct(productId);

  const today = format(startOfToday(), 'dd-MM-yyyy');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (product) {
      const currentTime = new Date().toTimeString().slice(0, 5);
      const result = safeMutate(
        () => addScheduleFood(store, { date: selectedDate, time: currentTime, type: 'food', foodId: product.id, dishId: null, quantity: 100 }),
        'Не удалось добавить продукт',
      );
      if (result === undefined) return;
    }
    onClose();
  };

  return (
    <DrawerLayout>
      <BaseOverlayContentLayout
        header={
          <div className={styles.title}>
            Добавить <span className={styles.itemName}>{product?.name || 'продукт'}</span> в{' '}
            <span className={styles.date}>{selectedDate}</span>
          </div>
        }
        content={<ScheduleSelection onSelect={handleSelect} selectedDate={selectedDate} />}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={() => onClose()}>
              Отмена
            </button>
            <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
              Добавить
            </button>
          </div>
        }
      />
    </DrawerLayout>
  );
};

export default AddProductToDayScheduleOverlay;
