import { observer } from 'mobx-react-lite';
import styles from './CopyFoodToDaySchedule.module.scss';
import { EditableListRef, EditableList } from '@/components/features/manage-list/EditableList';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { useRef, useState } from 'react';
import {
  FoodContentProductInstance,
  FoodContentDishInstance,
} from '@/domain/shared/foodContent/foodContent';
import { useFoodScheduleStore } from '@/app/stores/helpers';
import { ScheduleSelection } from '@/components/features/ScheduleSelection/ScheduleSelection';

export type FoodInput = {
  id: string;
  time?: string;
  contentProduct: FoodContentProductInstance | null;
  contentDish?: FoodContentDishInstance | null;
};

type Props = {
  onClose: VoidFunction;
  items: FoodInput[];
};

const CopyFoodToDaySchedule = ({ items, onClose }: Props) => {
  const editableListRef = useRef<EditableListRef>(null);
  const [step, setStep] = useState<'date' | 'edit'>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const foodScheduleStore = useFoodScheduleStore();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('edit');
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('date');
    } else {
      onClose();
    }
  };

  const handleFinish = () => {
    if (!selectedDate) return;

    const schedule = foodScheduleStore.getOrCreateLocal(selectedDate);
    const itemsData = items.map((item) => ({
      time: item.time || '12:00',
      contentProduct: item.contentProduct
        ? {
            variant: 'product' as const,
            foodId: item.contentProduct.foodId,
            quantity: item.contentProduct.quantity,
          }
        : null,
      contentDish: item.contentDish
        ? {
            variant: 'dish' as const,
            dishId: item.contentDish.dishId,
            quantity: item.contentDish.quantity,
          }
        : null,
    }));

    schedule.foods.addBulkEachWithNewId(itemsData);
    onClose();
  };

  return (
    <BaseOverlayContentLayout
      header={
        <TextBehind text={step === 'date' ? 'Выберите дату' : 'Копировать в расписание'}>
          <div />
        </TextBehind>
      }
      content={
        step === 'date' ? (
          <ScheduleSelection onSelect={handleDateSelect} />
        ) : (
          <EditableList
            ref={editableListRef}
            items={items}
            renderItem={(item) => item.contentProduct?.name || item.contentDish?.name}
          />
        )
      }
      footer={
        <>
          <button className={styles.createNewDishFormButton} onClick={handleBack}>
            Назад
          </button>
          {step === 'edit' && (
            <button className={styles.createNewDishFormButton} onClick={handleFinish}>
              Скопировать
            </button>
          )}
        </>
      }
    />
  );
};

export default observer(CopyFoodToDaySchedule);
