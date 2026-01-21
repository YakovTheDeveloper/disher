import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmationDeleteEvents.module.scss';
import { SelectedEventItemProvider } from '@/components/features/builders/food/ScheduleBuilder/context';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleProvider';
type Props = {
  children?: React.ReactNode;
};

const ModalConfirmationDeleteEvents = ({ children }: Props) => {
  const schedule = useSchedule();

  // return (
  //   <>
  //     <Swipeable>
  //       <ContentEdit.Time item={currentChild} onFinish={goNext} />
  //       <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={searchState} />
  //       <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
  //     </Swipeable>
  //   </>
  // );

  return (
    <div className={styles.container}>
      <SelectedEventItemProvider></SelectedEventItemProvider>
    </div>
  );
};

export default observer(ModalConfirmationDeleteEvents);
