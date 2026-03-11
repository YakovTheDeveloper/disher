import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { BaseDrawerProps } from '@/store/GlobalUiStore/DrawerStoreV3/types';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { useDishStore, useFoodScheduleStore } from '@/app/stores/helpers';
import styles from './AddDishToDayScheduleOverlay.module.scss';

interface Props extends BaseDrawerProps {
  dishId: string;
}

const AddDishToDayScheduleOverlay = observer(({ dishId, onClose }: Props) => {
  const dishStore = useDishStore();
  const foodScheduleStore = useFoodScheduleStore();
  const dish = dishStore.getById(dishId);

  const today = format(startOfToday(), 'dd-MM-yyyy');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (dish) {
      let schedule = foodScheduleStore.getLocal(selectedDate);

      if (!schedule) {
        foodScheduleStore.addLocal({ id: selectedDate });
        schedule = foodScheduleStore.getLocal(selectedDate);
      }

      if (schedule) {
        const currentTime = new Date().toTimeString().slice(0, 5);
        schedule.foods.addChildWithLocalData({
          time: currentTime,
          contentDish: { dishId: dish.id, variant: 'dish' as const, quantity: 100 },
        });
      }

      console.log('Added dish to schedule:', selectedDate, dish.name);
    }
    onClose();
  };

  return (
    <BaseOverlayContentLayout
      header={
        <div className={styles.title}>
          Добавить <span className={styles.itemName}>{dish?.name || 'блюдо'}</span> в{' '}
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

export default AddDishToDayScheduleOverlay;
