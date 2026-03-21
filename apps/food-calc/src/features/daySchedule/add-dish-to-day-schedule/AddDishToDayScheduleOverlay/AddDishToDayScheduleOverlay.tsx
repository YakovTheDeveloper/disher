import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { BaseOverlayContentLayout } from '@/shared/ui/layout/overlay/BaseOverlayContentLayout';
import { ScheduleSelection } from '@/features/ScheduleSelection';
import { useDish } from '@/entities/dish';
import { addScheduleFood } from '@/entities/schedule-food';
import styles from './AddDishToDayScheduleOverlay.module.scss';

interface Props extends BaseDrawerProps {
  dishId: string;
}

const AddDishToDayScheduleOverlay = ({ dishId, onClose }: Props) => {
  const { result: dish } = useDish(dishId);

  const today = format(startOfToday(), 'dd-MM-yyyy');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = async () => {
    if (dish) {
      const currentTime = new Date().toTimeString().slice(0, 5);
      await addScheduleFood({
        date: selectedDate,
        time: currentTime,
        type: 'dish',
        dishId: dish.id,
        quantity: 100,
      });
    }
    onClose();
  };

  return (
    <DrawerLayout>
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
    </DrawerLayout>
  );
};

export default AddDishToDayScheduleOverlay;
