import { observer } from 'mobx-react-lite';
import styles from './ModalPhysicalActivityPulse.module.scss';
import { ExercisePulse } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent/ActivityContent/ExercisePulse';
import { emitter } from '@/infrastructure/emitter/emitter';
type Props = {
  children: React.ReactNode;
};

const ModalPhysicalActivityPulse = ({ children }: Props) => {
  const onFinish = (currentCount: string) => {
    emitter.emit('EXERCISE_RESULT', currentCount);
  };

  return (
    <div className={styles.ModalPhysicalActivityPulse}>
      <ExercisePulse onFinish={onFinish} />
    </div>
  );
};

export default observer(ModalPhysicalActivityPulse);
