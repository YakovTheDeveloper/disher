import { observer } from 'mobx-react-lite';
import styles from './ModalPhysicalActivityPulse.module.scss';
import { emitter } from '@/infrastructure/emitter/emitter';
import { ExercisePulse } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/ActivityContent/ExercisePulse';
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
