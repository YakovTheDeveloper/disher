import { observer } from 'mobx-react-lite';
import styles from './ModalConfirmationDeleteEvents.module.scss';
import {
  SelectedEventItemProvider,
  useSchedule,
} from '@/components/features/builders/ScheduleBuilder/context';
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
