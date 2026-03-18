import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { BaseDrawerProps } from '@/shared/ui';
import styles from './AddToDayScheduleDrawer.module.scss';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import clsx from 'clsx';
// import CheckIcon from '@/assets/icons/tick.svg';

interface Props extends BaseDrawerProps<string> {
  title: string;
}

const AddToDayScheduleDrawer = observer(({ onClose, title }: Props) => {
  const today = format(startOfToday(), 'dd-MM-yyyy');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    onClose(selectedDate);
  };

  return (
    <DrawerLayout className={styles.container}>
      <div className={styles.title}>
        Добавить <span className={styles.itemName}>{title}</span> в{' '}
        <span className={styles.date}>{selectedDate}</span>
      </div>
      <ScheduleSelection onSelect={handleSelect} selectedDate={selectedDate} />
      <div className={styles.footer}>
        <button type="button" className={clsx([styles.confirmButton])} onClick={handleConfirm}>
          {/* <CheckIcon /> */}
        </button>
      </div>
    </DrawerLayout>
  );
});

export default AddToDayScheduleDrawer;
