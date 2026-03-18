import { observer } from 'mobx-react-lite';
import styles from './ModalPhysicalActivityPulse.module.scss';
import { emitter } from '@/infrastructure/emitter/emitter';
// TODO: migrate to Triplit — ExercisePulse module was removed
// import { ExercisePulse } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/ActivityContent/ExercisePulse';
type Props = {
  children: React.ReactNode;
};

const ModalPhysicalActivityPulse = ({}: Props) => {
  const onFinish = (currentCount: string) => {
    // TODO: migrate to Triplit — EXERCISE_RESULT event was removed
    emitter.emit('HIGHLIGHT_ITEM', { id: currentCount });
  };

  return (
    <div className={styles.ModalPhysicalActivityPulse}>
      {/* TODO: migrate to Triplit — ExercisePulse was removed */}
      {/* <ExercisePulse onFinish={onFinish} /> */}
      <p>ExercisePulse placeholder (onFinish: {typeof onFinish})</p>
    </div>
  );
};

export default observer(ModalPhysicalActivityPulse);
