import styles from './DurationField.module.scss';
import clsx from 'clsx';
import { useLocalObservable } from 'mobx-react-lite';
// TODO: migrate to Triplit — ContentEdit.Time was removed
// import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';

type Props = {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  className?: string;
};

const DurationField = ({ value, onChange, className }: Props) => {
  const timeState = useLocalObservable(() => ({
    localTime: value,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      onChange(newTime);
    },
  }));

  void onChange;

  return (
    <div className={clsx(styles.container, className)}>
      {/* TODO: migrate to Triplit — ContentEdit.Time was removed */}
      <div>{timeState.localTime}</div>
    </div>
  );
};

export default DurationField;
