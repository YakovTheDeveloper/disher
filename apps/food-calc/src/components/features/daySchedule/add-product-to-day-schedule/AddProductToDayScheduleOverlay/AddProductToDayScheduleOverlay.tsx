import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { BaseDrawerProps } from '@/store/GlobalUiStore/DrawerStoreV3/types';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { useFoodStore, useFoodScheduleStore } from '@/app/stores/helpers';
import styles from './AddProductToDayScheduleOverlay.module.scss';

interface Props extends BaseDrawerProps {
  productId: string;
}

const AddProductToDayScheduleOverlay = observer(({ productId, onClose }: Props) => {
  const foodStore = useFoodStore();
  const foodScheduleStore = useFoodScheduleStore();
  const product = foodStore.getById(productId);
  
  const today = format(startOfToday(), 'dd-MM-yyyy');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (product) {
      let schedule = foodScheduleStore.getLocal(selectedDate);

      if (!schedule) {
        foodScheduleStore.addLocal({ id: selectedDate });
        schedule = foodScheduleStore.getLocal(selectedDate);
      }

      if (schedule) {
        const currentTime = new Date().toTimeString().slice(0, 5);
        schedule.foods.addChildWithLocalData({
          time: currentTime,
          contentProduct: { foodId: product.id, variant: 'product' as const, quantity: 100 },
        });
      }

      console.log('Added product to schedule:', selectedDate, product.name);
    }
    onClose();
  };

  return (
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
  );
});

export default AddProductToDayScheduleOverlay;
