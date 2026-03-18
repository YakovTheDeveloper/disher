import styles from './CopyFoodToDaySchedule.module.scss';
import { EditableListRef, EditableList } from '@/components/features/manage-list/EditableList';
import { BaseOverlayContentLayout } from '@/components/ui/layout/overlay/BaseOverlayContentLayout';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { useRef, useState } from 'react';
import { addScheduleFood } from '@/entities/schedule-food';
import { ScheduleSelection } from '@/components/features/ScheduleSelection/ScheduleSelection';

export type FoodInput = {
  id: string;
  time?: string;
  contentProduct: { foodId: string; quantity: number; name?: string } | null;
  contentDish?: { dishId: string; quantity: number; name?: string } | null;
};

type Props = {
  onClose: VoidFunction;
  items: FoodInput[];
};

const CopyFoodToDaySchedule = ({ items, onClose }: Props) => {
  const editableListRef = useRef<EditableListRef>(null);
  const [step, setStep] = useState<'date' | 'edit'>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const handleFinish = async () => {
    if (!selectedDate) return;

    await Promise.all(
      items.map((item) =>
        addScheduleFood({
          date: selectedDate,
          time: item.time || '12:00',
          type: item.contentProduct ? 'food' : 'dish',
          foodId: item.contentProduct?.foodId ?? null,
          dishId: item.contentDish?.dishId ?? null,
          quantity: item.contentProduct?.quantity ?? item.contentDish?.quantity ?? 100,
        })
      )
    );
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

export default CopyFoodToDaySchedule;
