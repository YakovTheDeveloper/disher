import { observer } from 'mobx-react-lite';
import styles from './ScheduleEventsEdit.module.scss';
import {
  useSchedule,
  useSelectedEventItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
type Props = {
  defaultTab: string;
  close: () => void;
};

const ScheduleEventsEdit = ({ defaultTab, close }: Props) => {
  const schedule = useSchedule();
  const child = useSelectedEventItem();

  return <div className={styles.container}>ScheduleEventsEdit</div>;
};

export default observer(ScheduleEventsEdit);
